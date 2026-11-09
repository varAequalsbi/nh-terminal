# Managed PostgreSQL readiness

## Decision

NH Terminal will use a modular Node.js monolith with a managed PostgreSQL
database. The React application remains separately deployable, while HTTP API
modules share one database and one authorization boundary. PostgreSQL is the
system of record; provider APIs are never queried directly by the browser.

The deployment target is Vercel serverless functions. Database access therefore
uses a small connection pool, does not depend on process memory, and disables
prepared statements for transaction-pool compatibility. A provider offering a
pooled/serverless connection URL is preferred.

Deferred infrastructure is introduced only when a feature requires it:

- Redis-compatible managed cache for rate limits and short-lived shared state.
- Managed queue for provider ingestion, notifications, and media processing.
- S3-compatible object storage for attachments and course media.

## Environment isolation

Use separate PostgreSQL databases and credentials for `development`, `staging`,
and `production`. Preview deployments must use development or disposable branch
databases, never production. Secrets belong in the deployment platform's secret
store and must not use a `VITE_` prefix.

Required server variables:

| Variable                           | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `APP_ENV`                          | `local`, `test`, `development`, `staging`, or `production`    |
| `DATABASE_URL`                     | Local PostgreSQL URL or provider-issued pooled PostgreSQL URL |
| `DATABASE_SSL`                     | `require` for managed environments                            |
| `DATABASE_POOL_MAX`                | Per-instance pool limit; defaults to 5                        |
| `DATABASE_CONNECT_TIMEOUT_SECONDS` | Connection timeout; defaults to 10                            |

## Schema lifecycle

Migrations in `server/database/migrations` are immutable after application.
`npm run db:migrate` takes a PostgreSQL advisory lock, validates checksums, and
applies each pending migration in a transaction. `npm run db:rollback` rolls
back only the latest migration. Reference roles, tiers, and instruments are
idempotently seeded by migration; no account or plaintext password is seeded.

Run against development, then staging:

```powershell
$env:APP_ENV = 'staging'
$env:DATABASE_URL = '<pooled PostgreSQL URL>'
npm run db:status
npm run db:migrate
npm run db:status
```

Before production, create a provider snapshot, run migrations as a separate
deployment step, smoke-test the API, and retain the previous application build.
Do not run migrations concurrently from every serverless function.

## Purchase checklist

The chosen plan must provide:

- a region near the application and primary users (Singapore is appropriate for
  WIB users when available);
- TLS connections and separate least-privilege application/migration users;
- a pooled/serverless connection endpoint;
- automated encrypted backups and point-in-time recovery;
- configurable retention, restore testing, monitoring, and spend limits;
- an upgrade path without changing PostgreSQL semantics.

Do not buy a cloud plan for local development. Provision a staging plan only
after the local relational repositories, secure authentication, authorization
tests, and migration/rollback checks pass. Upgrade to production only after a
successful backup-restore rehearsal in the intended managed environment.

## Local backup and restore rehearsal

Local custom-format backups can be created without purchasing cloud services:

```powershell
npm run db:backup:local
```

Backups are written to the Git-ignored `.backups` directory. Each archive is
validated with `pg_restore --list` and its SHA-256 checksum is printed. Treat
these files as sensitive because they contain application data.

Exercise a full restore with:

```powershell
npm run db:restore:rehearse
```

The rehearsal is deliberately limited to `nh_terminal_dev` as its source and
the distinct `nh_terminal_test` database as its destination. It first backs up
the existing test database, restores development into the test database,
compares all public tables and row counts, checks the migration ledger and
scrypt credential hashes, and then restores the test database to its original
state. A successful run writes a `.verification.json` manifest beside the
backup. Do not point `RESTORE_REHEARSAL_DATABASE` at a database that is not
disposable test infrastructure.

## Current activation gate

PostgreSQL 18 runs locally with separate `nh_terminal_dev` and
`nh_terminal_test` databases. Both API entry points use the shared relational
repository and rotating database-backed HTTP-only sessions. Reuse of a replaced
token revokes its session family and records an audit event. Migrations, safe
local seed, and destructive test reset are exercised against real PostgreSQL.
Local account activation is delivered to Mailpit over SMTP and remains separate
from the still-unselected production email provider.

A local backup/restore rehearsal has passed against the isolated test database,
including archive validation, full table/count comparison, migration-ledger
comparison, and credential-hash checks. This establishes the local procedure
only; it does not prove a managed provider's backup, retention, or point-in-time
recovery behavior.

The application is **not yet authorized for production traffic**. Market and
calendar values remain simulated/local fixtures, cloud environment isolation is
not configured, production email verification/recovery delivery is incomplete, and backup/restore
has not been rehearsed on a managed staging provider. Do not add a production
`DATABASE_URL` until those remaining gates pass.
