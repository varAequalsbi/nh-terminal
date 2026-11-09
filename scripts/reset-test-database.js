import { database, closeDatabase } from '../server/database/client.js';
import { databaseConfig } from '../server/database/config.js';

const config = databaseConfig();
const databaseName = new URL(config.url).pathname.replace(/^\//, '');
if (config.environment !== 'test' || !databaseName.endsWith('_test')) {
  throw new Error('Refusing to reset a database unless APP_ENV=test and its name ends with _test');
}

const sql = database();
try {
  await sql.unsafe('drop schema public cascade; create schema public;');
  console.log(`Reset isolated test database ${databaseName}`);
} finally {
  await closeDatabase();
}
