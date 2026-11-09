import postgres from 'postgres';
import { databaseConfig } from './config.js';

let client;

export function database() {
  if (client) return client;
  const config = databaseConfig();
  client = postgres(config.url, {
    ssl: config.ssl,
    max: config.max,
    connect_timeout: config.connectTimeout,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false,
    transform: { undefined: null },
  });
  return client;
}

export async function verifyDatabaseConnection() {
  const sql = database();
  const [result] =
    await sql`select current_database() as database, current_setting('server_version') as version`;
  return result;
}

export async function closeDatabase() {
  if (!client) return;
  const active = client;
  client = undefined;
  await active.end({ timeout: 5 });
}
