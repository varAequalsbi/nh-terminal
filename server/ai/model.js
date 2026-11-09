import { FEATURE_NAMES, HORIZON_BARS, featuresAt, makeSamples } from './candles.js';

const CLASSES = ['SELL', 'NO SIGNAL', 'BUY'];
const softmax = (scores) => {
  const max = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - max));
  const total = exp.reduce((sum, value) => sum + value, 0);
  return exp.map((value) => value / total);
};

function probabilities(model, values) {
  const scaled = values.map((value, index) => (value - model.mean[index]) / model.scale[index]);
  return softmax(
    model.weights.map((row) => row[0] + scaled.reduce((sum, x, i) => sum + x * row[i + 1], 0))
  );
}

function select(probabilitiesByClass, minimumProbability) {
  const best = probabilitiesByClass.indexOf(Math.max(...probabilitiesByClass));
  return best !== 1 && probabilitiesByClass[best] >= minimumProbability ? best : 1;
}

function evaluate(model, samples) {
  let correct = 0;
  let emitted = 0;
  let directionalCorrect = 0;
  const counts = { BUY: 0, SELL: 0, 'NO SIGNAL': 0 };
  for (const sample of samples) {
    const prediction = select(probabilities(model, sample.values), model.minimumProbability);
    counts[CLASSES[prediction]] += 1;
    if (prediction === sample.label) correct += 1;
    if (prediction !== 1) {
      emitted += 1;
      if (prediction === sample.label) directionalCorrect += 1;
    }
  }
  const classCounts = CLASSES.map(
    (_, index) => samples.filter((row) => row.label === index).length
  );
  return {
    samples: samples.length,
    accuracy: correct / samples.length,
    majorityClassAccuracy: Math.max(...classCounts) / samples.length,
    emitted,
    directionalAccuracy: emitted ? directionalCorrect / emitted : null,
    counts,
  };
}

export function trainModel(candles, { minimumProbability = 0.62 } = {}) {
  if (!(minimumProbability > 1 / 3 && minimumProbability < 1))
    throw new Error('minimumProbability must be between 1/3 and 1');
  if (candles.length < 500) throw new Error('At least 500 closed hourly candles are required');
  const samples = makeSamples(candles);
  const validationStart = Math.floor(candles.length * 0.7);
  const testStart = Math.floor(candles.length * 0.85);
  const training = samples.filter((row) => row.labelEndIndex < validationStart);
  const validation = samples.filter(
    (row) => row.index >= validationStart && row.labelEndIndex < testStart
  );
  const testing = samples.filter((row) => row.index >= testStart);
  if (Math.min(training.length, validation.length, testing.length) < 50)
    throw new Error('Too few continuous samples in a chronological split');

  const mean = FEATURE_NAMES.map(
    (_, index) => training.reduce((sum, row) => sum + row.values[index], 0) / training.length
  );
  const scale = FEATURE_NAMES.map((_, index) =>
    Math.max(
      1e-8,
      Math.sqrt(
        training.reduce((sum, row) => sum + (row.values[index] - mean[index]) ** 2, 0) /
          training.length
      )
    )
  );
  const weights = Array.from({ length: 3 }, () => Array(FEATURE_NAMES.length + 1).fill(0));
  const model = {
    version: 1,
    symbol: 'XAUUSD',
    interval: '1h',
    horizonBars: HORIZON_BARS,
    minimumProbability,
    featureNames: FEATURE_NAMES,
    mean,
    scale,
    weights,
    trainedAt: new Date().toISOString(),
    trainingLastBarAt: new Date(candles[validationStart - 1].openedAt).toISOString(),
  };
  const learningRate = 0.06;
  const regularization = 0.002;
  for (let epoch = 0; epoch < 250; epoch += 1) {
    const gradient = weights.map((row) => row.map(() => 0));
    for (const sample of training) {
      const scaled = sample.values.map((value, index) => (value - mean[index]) / scale[index]);
      const prediction = probabilities(model, sample.values);
      for (let cls = 0; cls < 3; cls += 1) {
        const error = prediction[cls] - Number(sample.label === cls);
        gradient[cls][0] += error;
        for (let feature = 0; feature < scaled.length; feature += 1)
          gradient[cls][feature + 1] += error * scaled[feature];
      }
    }
    for (let cls = 0; cls < 3; cls += 1)
      for (let feature = 0; feature < weights[cls].length; feature += 1) {
        const penalty = feature ? regularization * weights[cls][feature] : 0;
        weights[cls][feature] -=
          learningRate * (gradient[cls][feature] / training.length + penalty);
      }
  }
  model.evaluation = {
    training: evaluate(model, training),
    validation: evaluate(model, validation),
    test: evaluate(model, testing),
    split: {
      training: [candles[0].openedAt, candles[validationStart - 1].openedAt].map((x) =>
        new Date(x).toISOString()
      ),
      validation: [candles[validationStart].openedAt, candles[testStart - 1].openedAt].map((x) =>
        new Date(x).toISOString()
      ),
      test: [candles[testStart].openedAt, candles.at(-1).openedAt].map((x) =>
        new Date(x).toISOString()
      ),
    },
  };
  return model;
}

export function decide(model, candles, now = Date.now()) {
  if (
    model.version !== 1 ||
    model.symbol !== 'XAUUSD' ||
    model.interval !== '1h' ||
    JSON.stringify(model.featureNames) !== JSON.stringify(FEATURE_NAMES)
  )
    throw new Error('Unsupported model artifact');
  const last = candles.at(-1);
  if (!last) throw new Error('No closed candles available');
  const ageMs = now - (last.openedAt + 60 * 60 * 1000);
  if (ageMs < 0 || ageMs > 2 * 60 * 60 * 1000)
    return {
      decision: 'NO SIGNAL',
      reason: 'Market data is stale',
      barAt: new Date(last.openedAt).toISOString(),
    };
  const feature = featuresAt(candles, candles.length - 1);
  if (!feature)
    return {
      decision: 'NO SIGNAL',
      reason: 'Insufficient continuous candles',
      barAt: new Date(last.openedAt).toISOString(),
    };
  const scores = probabilities(model, feature.values);
  const selected = select(scores, model.minimumProbability);
  return {
    decision: CLASSES[selected],
    reason: selected === 1 ? 'No directional class passed the threshold' : 'Model threshold passed',
    barAt: new Date(last.openedAt).toISOString(),
    probabilities: Object.fromEntries(CLASSES.map((name, index) => [name, scores[index]])),
    modelTrainedAt: model.trainedAt,
    // Candidate analysis only: no entry, stop, target, or public signal is inferred here.
  };
}
