import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeCandles } from '../server/ai/candles.js';
import { decide, trainModel } from '../server/ai/model.js';
import { fetchXauUsdCandles } from '../server/ai/twelve-data.js';

const command = process.argv[2];
const fileIndex = process.argv.indexOf('--file');
const inputFile = fileIndex >= 0 ? process.argv[fileIndex + 1] : null;
const directory = resolve('.local-ai');
const modelPath = resolve(directory, 'xauusd-1h-model.json');
const decisionsPath = resolve(directory, 'xauusd-decisions.jsonl');

async function candles(outputsize) {
  if (fileIndex >= 0 && !inputFile) throw new Error('--file needs a JSON path');
  if (inputFile) {
    const parsed = JSON.parse(await readFile(resolve(inputFile), 'utf8'));
    return normalizeCandles(Array.isArray(parsed) ? parsed : parsed.values);
  }
  return fetchXauUsdCandles({ outputsize });
}

async function saveModel(model) {
  await mkdir(directory, { recursive: true });
  const temporaryPath = `${modelPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(model, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, modelPath);
}

async function logDecision(decision, model) {
  await mkdir(directory, { recursive: true });
  const modelId = createHash('sha256')
    .update(JSON.stringify(model.weights))
    .digest('hex')
    .slice(0, 16);
  const id = `${modelId}:${decision.barAt}`;
  let existing = '';
  try {
    existing = await readFile(decisionsPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing.split('\n').some((line) => line && JSON.parse(line).id === id)) return false;
  await appendFile(
    decisionsPath,
    `${JSON.stringify({ id, recordedAt: new Date().toISOString(), ...decision })}\n`,
    { mode: 0o600 }
  );
  return true;
}

async function runDecision() {
  const model = JSON.parse(await readFile(modelPath, 'utf8'));
  const series = await candles(100);
  const decision = decide(model, series);
  const recorded = await logDecision(decision, model);
  console.log(JSON.stringify({ ...decision, recorded }, null, 2));
}

async function watchDecisions() {
  if (inputFile) throw new Error('watch requires the live provider, not --file');
  if (!process.env.TWELVE_DATA_API_KEY?.trim())
    throw new Error('TWELVE_DATA_API_KEY is required for watch');
  for (;;) {
    try {
      await runDecision();
    } catch (error) {
      console.error(`Private model check failed: ${error.message}`);
    }
    const now = Date.now();
    const next = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000) + 65 * 60 * 1000;
    await new Promise((resolveWait) => setTimeout(resolveWait, next - now));
  }
}

try {
  if (command === 'train') {
    const series = await candles(5000);
    const model = trainModel(series);
    await saveModel(model);
    console.log(
      JSON.stringify(
        {
          model: modelPath,
          closedCandles: series.length,
          training: model.evaluation.training,
          validation: model.evaluation.validation,
          heldOutTest: model.evaluation.test,
        },
        null,
        2
      )
    );
  } else if (command === 'decide') {
    await runDecision();
  } else if (command === 'watch') {
    await watchDecisions();
  } else if (command === 'status') {
    const model = JSON.parse(await readFile(modelPath, 'utf8'));
    let decisions = [];
    try {
      decisions = (await readFile(decisionsPath, 'utf8'))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(JSON.parse);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    console.log(
      JSON.stringify(
        {
          trainedAt: model.trainedAt,
          heldOutTest: model.evaluation.test,
          decisionsRecorded: decisions.length,
          latestDecision: decisions.at(-1) || null,
        },
        null,
        2
      )
    );
  } else {
    throw new Error(
      'Use train, decide, watch, or status; optionally add --file historical-candles.json'
    );
  }
} catch (error) {
  console.error(`AI signal command failed: ${error.message}`);
  process.exitCode = 1;
}
