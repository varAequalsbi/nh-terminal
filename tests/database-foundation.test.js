import { afterEach, describe, expect, test } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { databaseConfig } from '../server/database/config.js';

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
});

describe('database configuration', () => {
  test('requires a PostgreSQL URL for database commands', () => {
    delete process.env.DATABASE_URL;
    expect(() => databaseConfig()).toThrow('DATABASE_URL is required');
  });

  test('validates environment, URL scheme, SSL, and pool bounds', () => {
    process.env.APP_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://example.invalid/nh_terminal';
    process.env.DATABASE_SSL = 'require';
    process.env.DATABASE_POOL_MAX = '5';
    expect(databaseConfig()).toMatchObject({ environment: 'production', ssl: 'require', max: 5 });

    process.env.DATABASE_POOL_MAX = '200';
    expect(() => databaseConfig()).toThrow('DATABASE_POOL_MAX');
  });
});

describe('versioned schema', () => {
  test('has paired, ordered up/down migrations and the required core tables', async () => {
    const directory = 'server/database/migrations';
    const files = await readdir(directory);
    const up = files.filter((file) => file.endsWith('.up.sql')).sort();
    const down = files.filter((file) => file.endsWith('.down.sql')).sort();
    expect(up.map((file) => file.replace('.up.sql', ''))).toEqual(
      down.map((file) => file.replace('.down.sql', ''))
    );

    const schema = await readFile(`${directory}/001_core.up.sql`, 'utf8');
    for (const table of [
      'users',
      'sessions',
      'roles',
      'signals',
      'signal_history',
      'instruments',
      'market_candles',
      'calendar_events',
      'forum_posts',
      'forum_comments',
      'conversations',
      'messages',
      'announcements',
      'courses',
      'audit_logs',
      'idempotency_keys',
    ]) {
      expect(schema).toContain(`create table ${table}`);
    }
    expect(schema).toContain('timestamptz');
    expect(schema).toContain('references users(id)');
  });
});

describe('local backup safeguards', () => {
  test('limits backup and restore rehearsal to the dedicated local databases', async () => {
    const script = await readFile('scripts/database-backup.js', 'utf8');
    const compactScript = script.replace(/\s+/g, '');
    expect(script).toContain("sourceDatabase !== 'nh_terminal_dev'");
    expect(script).toContain("rehearsalDatabase.endsWith('_test')");
    expect(compactScript).toContain("['--list',backupPath]");
    expect(compactScript).toContain("['--exit-on-error','--no-owner','--no-privileges'");
    expect(script).toContain('drop schema public cascade');
    expect(script).toContain('rehearsalBaselinePath');
  });
});
