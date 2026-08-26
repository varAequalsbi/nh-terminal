import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const dbPath = process.env.NH_DB_PATH ? resolve(process.env.NH_DB_PATH) : fileURLToPath(new URL('./data/db.json', import.meta.url));
let writeQueue = Promise.resolve();

export async function readDb() { return JSON.parse(await readFile(dbPath, 'utf8')); }
export async function updateDb(mutator) {
  let result;
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    result = await mutator(db);
    await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
  });
  await writeQueue;
  return result;
}
