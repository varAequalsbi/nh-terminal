import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { database, closeDatabase, verifyDatabaseConnection } from '../server/database/client.js';

const command = process.argv[2] || 'status';
const migrationsDirectory = resolve('server/database/migrations');
const checksum = (source) => createHash('sha256').update(source).digest('hex');

async function migrationFiles(suffix = '.up.sql') {
  return (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(suffix))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureLedger(sql) {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;
}

async function status(sql) {
  const files = await migrationFiles();
  const applied =
    await sql`select version, checksum, applied_at from schema_migrations order by version`;
  const map = new Map(applied.map((row) => [row.version, row]));
  for (const file of files) {
    const version = file.replace('.up.sql', '');
    const source = await readFile(resolve(migrationsDirectory, file), 'utf8');
    const row = map.get(version);
    const state = !row
      ? 'pending'
      : row.checksum === checksum(source)
        ? 'applied'
        : 'CHECKSUM MISMATCH';
    console.log(`${version}: ${state}`);
  }
}

async function migrate(sql) {
  for (const file of await migrationFiles()) {
    const version = file.replace('.up.sql', '');
    const source = await readFile(resolve(migrationsDirectory, file), 'utf8');
    const digest = checksum(source);
    const [existing] = await sql`select checksum from schema_migrations where version = ${version}`;
    if (existing) {
      if (existing.checksum !== digest)
        throw new Error(`Applied migration ${version} has been modified`);
      continue;
    }
    await sql.begin(async (tx) => {
      await tx.unsafe(source);
      await tx`insert into schema_migrations (version, checksum) values (${version}, ${digest})`;
    });
    console.log(`Applied ${version}`);
  }
}

async function rollback(sql) {
  const [last] =
    await sql`select version from schema_migrations order by applied_at desc, version desc limit 1`;
  if (!last) return console.log('No applied migration to roll back');
  const file = resolve(migrationsDirectory, `${last.version}.down.sql`);
  const source = await readFile(file, 'utf8');
  await sql.begin(async (tx) => {
    await tx.unsafe(source);
    await tx`delete from schema_migrations where version = ${last.version}`;
  });
  console.log(`Rolled back ${last.version}`);
}

try {
  const connection = await verifyDatabaseConnection();
  console.log(`Connected to ${connection.database} (PostgreSQL ${connection.version})`);
  const sql = database();
  await sql`select pg_advisory_lock(hashtext('nh_terminal_schema_migrations'))`;
  try {
    await ensureLedger(sql);
    if (command === 'migrate') await migrate(sql);
    else if (command === 'rollback') await rollback(sql);
    else if (command === 'status') await status(sql);
    else throw new Error(`Unknown database command: ${basename(command)}`);
  } finally {
    await sql`select pg_advisory_unlock(hashtext('nh_terminal_schema_migrations'))`;
  }
} catch (error) {
  console.error(`Database command failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
