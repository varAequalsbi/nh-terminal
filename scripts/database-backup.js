import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import postgres from 'postgres';

const command = process.argv[2] || 'rehearse';
if (!['backup', 'rehearse'].includes(command))
  throw new Error('Use: database-backup.js backup|rehearse');
if (process.env.APP_ENV !== 'local') throw new Error('Local backup commands require APP_ENV=local');

const sourceUrl = new URL(process.env.DATABASE_URL || '');
const sourceDatabase = decodeURIComponent(sourceUrl.pathname.slice(1));
if (sourceDatabase !== 'nh_terminal_dev')
  throw new Error('Refusing to back up anything except nh_terminal_dev');

const backupDirectory = resolve(process.env.LOCAL_BACKUP_DIRECTORY || '.backups');
const workspace = resolve('.');
if (!backupDirectory.startsWith(`${workspace}${sep}`) && backupDirectory !== workspace)
  throw new Error('LOCAL_BACKUP_DIRECTORY must be inside this workspace');

const pgBin = process.env.POSTGRES_BIN || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const executable = (name) => join(pgBin, `${name}.exe`);
const timestamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d{3}Z$/, 'Z');
const backupPath = resolve(
  process.argv[3] || join(backupDirectory, `${sourceDatabase}-${timestamp}.dump`)
);
if (!backupPath.startsWith(`${backupDirectory}${sep}`))
  throw new Error('Backup path must stay inside LOCAL_BACKUP_DIRECTORY');

const pgEnvironment = (database) => ({
  ...process.env,
  PGHOST: sourceUrl.hostname,
  PGPORT: sourceUrl.port || '5432',
  PGUSER: decodeURIComponent(sourceUrl.username),
  PGPASSWORD: decodeURIComponent(sourceUrl.password),
  PGDATABASE: database,
});

function runPostgresTool(name, args, database) {
  const result = spawnSync(executable(name), args, {
    env: pgEnvironment(database),
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${name} failed: ${(result.stderr || result.stdout).trim()}`);
}

async function snapshot(sql) {
  const tableRows =
    await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;
  const counts = {};
  for (const { tablename } of tableRows) {
    const [row] = await sql`select count(*)::integer as count from ${sql(tablename)}`;
    counts[tablename] = row.count;
  }
  const migrations = await sql`select version, checksum from schema_migrations order by version`;
  const [credentials] = await sql`
    select count(*)::integer as total,
      count(*) filter (where password_hash like 'scrypt$%')::integer as secure_hashes
    from user_credentials
  `;
  return { counts, migrations, credentials };
}

function compareSnapshots(source, restored) {
  const sourceTables = Object.keys(source.counts);
  const restoredTables = Object.keys(restored.counts);
  if (JSON.stringify(sourceTables) !== JSON.stringify(restoredTables))
    throw new Error('Restored table set does not match the source');
  for (const table of sourceTables) {
    if (source.counts[table] !== restored.counts[table])
      throw new Error(
        `Row-count mismatch for ${table}: ${source.counts[table]} != ${restored.counts[table]}`
      );
  }
  if (JSON.stringify(source.migrations) !== JSON.stringify(restored.migrations))
    throw new Error('Migration ledger mismatch after restore');
  if (
    restored.credentials.total !== restored.credentials.secure_hashes ||
    JSON.stringify(source.credentials) !== JSON.stringify(restored.credentials)
  )
    throw new Error('Credential hash integrity check failed');
}

await mkdir(backupDirectory, { recursive: true });
const source = postgres(sourceUrl.toString(), { prepare: false, max: 1 });
let rehearsalDatabase;
let rehearsalBaselinePath;
let rehearsalTouched = false;

try {
  const sourceSnapshot = await snapshot(source);
  runPostgresTool(
    'pg_dump',
    ['--format=custom', '--compress=9', '--no-owner', '--no-privileges', '--file', backupPath],
    sourceDatabase
  );
  const backupStats = await stat(backupPath);
  if (!backupStats.size) throw new Error('Backup file is empty');
  runPostgresTool('pg_restore', ['--list', backupPath], sourceDatabase);
  const backupSha256 = createHash('sha256')
    .update(await readFile(backupPath))
    .digest('hex');

  if (command === 'backup') {
    console.log(
      JSON.stringify(
        {
          status: 'backup-created',
          database: sourceDatabase,
          file: backupPath,
          bytes: backupStats.size,
          sha256: backupSha256,
          tables: Object.keys(sourceSnapshot.counts).length,
        },
        null,
        2
      )
    );
  } else {
    rehearsalDatabase = process.env.RESTORE_REHEARSAL_DATABASE || 'nh_terminal_test';
    if (rehearsalDatabase === sourceDatabase || !rehearsalDatabase.endsWith('_test'))
      throw new Error('RESTORE_REHEARSAL_DATABASE must be a distinct _test database');
    rehearsalBaselinePath = join(backupDirectory, `.rehearsal-baseline-${timestamp}.dump`);
    runPostgresTool(
      'pg_dump',
      [
        '--format=custom',
        '--compress=9',
        '--no-owner',
        '--no-privileges',
        '--file',
        rehearsalBaselinePath,
      ],
      rehearsalDatabase
    );
    const restoredUrl = new URL(sourceUrl);
    restoredUrl.pathname = `/${rehearsalDatabase}`;
    const restored = postgres(restoredUrl.toString(), { prepare: false, max: 1 });
    let restoredClosed = false;
    let restoredSnapshot;
    try {
      await restored`drop schema public cascade`;
      await restored`create schema public`;
      rehearsalTouched = true;
      await restored.end({ timeout: 5 });
      restoredClosed = true;
      runPostgresTool(
        'pg_restore',
        [
          '--exit-on-error',
          '--no-owner',
          '--no-privileges',
          '--dbname',
          rehearsalDatabase,
          backupPath,
        ],
        rehearsalDatabase
      );
      const verification = postgres(restoredUrl.toString(), { prepare: false, max: 1 });
      try {
        restoredSnapshot = await snapshot(verification);
      } finally {
        await verification.end({ timeout: 5 });
      }
    } finally {
      if (!restoredClosed) await restored.end({ timeout: 5 });
    }
    compareSnapshots(sourceSnapshot, restoredSnapshot);

    const manifest = {
      status: 'restore-verified',
      sourceDatabase,
      backupFile: basename(backupPath),
      bytes: backupStats.size,
      sha256: backupSha256,
      verifiedAt: new Date().toISOString(),
      rehearsalDatabase,
      tableCount: Object.keys(sourceSnapshot.counts).length,
      migrationVersions: sourceSnapshot.migrations.map(({ version }) => version),
      rowCounts: sourceSnapshot.counts,
      credentialHashesVerified: restoredSnapshot.credentials.secure_hashes,
    };
    await writeFile(
      `${backupPath}.verification.json`,
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8'
    );
    console.log(JSON.stringify({ ...manifest, backupFile: backupPath }, null, 2));
  }
} finally {
  await source.end({ timeout: 5 });
  if (rehearsalTouched && rehearsalDatabase && rehearsalBaselinePath) {
    const cleanupUrl = new URL(sourceUrl);
    cleanupUrl.pathname = `/${rehearsalDatabase}`;
    const cleanup = postgres(cleanupUrl.toString(), { prepare: false, max: 1 });
    try {
      await cleanup`drop schema public cascade`;
      await cleanup`create schema public`;
    } finally {
      await cleanup.end({ timeout: 5 });
    }
    runPostgresTool(
      'pg_restore',
      [
        '--exit-on-error',
        '--no-owner',
        '--no-privileges',
        '--dbname',
        rehearsalDatabase,
        rehearsalBaselinePath,
      ],
      rehearsalDatabase
    );
    await unlink(rehearsalBaselinePath);
  }
}
