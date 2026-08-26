# Backend and Infrastructure Publish-Readiness TODO

This checklist covers the server, database, real-time systems, integrations,
security, operations, and deployment work required for a production NH Terminal
release.

## Current development foundation (local prototype)

- [x] Add a local Node HTTP API with a health endpoint and environment-configured port.
- [x] Add local JSON persistence that can later be replaced by a database repository.
- [x] Add a working dummy administrator login endpoint and authenticated frontend session flow.
- [x] Add demo profile, preference, password-change, and logout endpoints for local and Vercel environments.
- [x] Add WIB-aware calendar period, country, impact, and search filtering with source and freshness metadata.
- [x] Add demo forum comment/reply, chat read-state/delivery, and role-aware announcement detail endpoints.
- [x] Add development endpoints for profiles, tiers, signals, market data, calendar, outlook, research, sentiment, forum posts, chat, announcements, courses, and live-session metadata.
- [x] Add local create mutations for signals, forum posts, chat messages, and announcements.
- [x] Add Vercel API routing and frontend SPA routing configuration.
- [ ] Replace simulated/local market values with licensed production provider data.
- [ ] Replace local JSON storage with a managed relational database and migrations.
- [ ] Replace the development token/session model with secure server-managed authentication.

> The completed items above describe development scaffolding only. They do not
> satisfy the production architecture, security, licensing, or operations items below.

## 1. Architecture and environments

- [ ] Choose and document the backend stack, runtime, framework, database, cache, job queue, object storage, and hosting platform.
- [ ] Decide between a modular monolith and separate services; begin with the simplest architecture that meets the traffic and real-time requirements.
- [ ] Create isolated local, development, staging, and production environments.
- [ ] Use separate databases, storage buckets, credentials, API keys, and domains per environment.
- [ ] Add validated environment configuration and fail startup when required values are absent.
- [ ] Store secrets in a managed secrets service, never in Git or frontend bundles.
- [ ] Define API versioning, deprecation, error, pagination, timestamp, and idempotency conventions.
- [ ] Publish an OpenAPI specification and keep it synchronized with implementation.

## 2. Database design and migrations

- [ ] Select a managed relational database such as PostgreSQL.
- [ ] Use UUID/ULID identifiers, UTC timestamps, foreign keys, unique constraints, and appropriate indexes.
- [ ] Create repeatable schema migrations and rollback procedures.
- [ ] Add seed data for roles, reward tiers, configuration, and safe development fixtures.
- [ ] Model users, credentials/identities, sessions, roles, permissions, profiles, broker/IB identifiers, and preferences.
- [ ] Model reward tiers, tier requirements, lot ledger entries, progress snapshots, reward claims, and audit history.
- [ ] Model market instruments, price snapshots/candles, sentiment, market sessions, calendar events, research, and outlooks.
- [ ] Model signals, targets, status history, performance/pips, attachments, authors, publication state, and visibility.
- [ ] Model forum posts, comments, replies, reactions, attachments, views, reports, and moderation actions.
- [ ] Model live sessions, schedules, stream metadata, viewer snapshots, comments, and moderation state.
- [ ] Model conversations, participants, messages, delivery/read receipts, attachments, and per-user unread state.
- [ ] Model announcements, scheduling, expiry, pinning, authors, attachments, and read receipts if required.
- [ ] Model courses, lessons, video assets, access tiers, viewing progress, and completion state.
- [ ] Model notifications, devices/subscriptions, delivery attempts, and read state.
- [ ] Model immutable security/admin audit logs.
- [ ] Establish retention, archival, anonymization, and deletion rules for every data category.

## 3. Authentication and authorization

- [ ] Implement registration, login, logout, session refresh, email verification, password reset, and account recovery.
- [ ] Use secure, HTTP-only, `Secure`, appropriately scoped `SameSite` cookies for browser sessions.
- [ ] Hash passwords with Argon2id or another currently recommended password hashing algorithm.
- [ ] Rotate refresh sessions/tokens and detect reuse.
- [ ] Add session listing and revoke-other-sessions functionality.
- [ ] Add optional or mandatory MFA for administrators and sensitive actions.
- [ ] Define roles such as member, expert, moderator, admin, and super-admin.
- [ ] Define granular permissions rather than relying solely on role names.
- [ ] Enforce authorization and resource ownership on every server operation.
- [ ] Prevent user-controlled fields from assigning roles, tiers, lot totals, verified state, or administrative ownership.
- [ ] Rate-limit login, registration, reset, verification, and recovery endpoints.
- [ ] Record suspicious authentication and authorization events in audit logs.

## 4. User, profile, broker, and rewards

- [ ] Implement profile read/update endpoints with public/private field separation.
- [ ] Integrate the selected broker/IB data source for verified cumulative lots.
- [ ] Define how broker accounts are linked, verified, refreshed, corrected, and disconnected.
- [ ] Store broker credentials/tokens encrypted and follow the provider’s terms.
- [ ] Make the lot ledger append-only or fully auditable.
- [ ] Calculate tier progress server-side using versioned tier rules.
- [ ] Run scheduled reconciliation for lots, tiers, and reward eligibility.
- [ ] Make tier changes and reward claims idempotent and auditable.
- [ ] Add administrative correction flows with mandatory reasons.
- [ ] Implement reward inventory, claim, approval, fulfillment, rejection, and delivery tracking if rewards are real.
- [ ] Add fraud controls for duplicate identities, broker accounts, or manipulated volume.

## 5. Market data and economic calendar integrations

- [ ] Select licensed market-data providers for FX, metals, crypto, indices, and candles.
- [ ] Confirm display, caching, redistribution, attribution, and delayed/real-time licensing rights.
- [ ] Implement provider adapters so one vendor can be replaced without rewriting product logic.
- [ ] Normalize symbols, precision, trading hours, timestamps, and timezones.
- [ ] Ingest and cache quotes/candles without overwhelming provider rate limits.
- [ ] Add stale-data detection, provider health checks, reconnects, and fallback behavior.
- [ ] Select and integrate a licensed economic-calendar provider.
- [ ] Normalize calendar country, currency, impact, previous, forecast, actual, revisions, and source fields.
- [ ] Correctly handle DST, holidays, rescheduled events, cancellations, and revised values.
- [ ] Define and document sentiment calculation inputs and update frequency.
- [ ] Add data-provenance timestamps and provider attribution to API responses.

## 6. Signals service

- [ ] Implement list/detail/history endpoints with cursor pagination and filters.
- [ ] Implement role-protected create, edit, publish, close, cancel, and delete/archive operations.
- [x] Validate instrument fields, BUY/SELL direction, entry, stop loss, targets, and logical price relationships in the demo API.
- [ ] Use a clear signal state machine such as draft, scheduled, published, running, target-hit, stopped, cancelled, and expired.
- [x] Record demo signal status changes in append-only per-signal history arrays.
- [ ] Calculate pip performance consistently by instrument precision and contract rules.
- [ ] Update running signals from trusted market prices.
- [ ] Make publish/close operations idempotent and transaction-safe.
- [ ] Broadcast new signals and status/pip changes through a real-time channel.
- [ ] Define whether AI signals are generated internally or received from an external model/service.
- [ ] Version and audit AI prompts/models/configuration where automated trading analysis is used.
- [ ] Add human review, confidence thresholds, failure handling, and a kill switch for automated publishing.
- [ ] Never present generated signals as guaranteed outcomes; include approved risk disclosures.

## 7. Uploads, media, and content delivery

- [ ] Use private object storage with short-lived signed upload/download URLs where appropriate.
- [ ] Validate MIME type, extension, file signature, dimensions, duration, and size server-side.
- [ ] Scan uploads for malware before making them available.
- [ ] Strip unsafe metadata and generate safe image/video derivatives.
- [ ] Use randomized storage keys rather than user-supplied filenames.
- [ ] Add upload quotas and per-role limits.
- [ ] Process images/videos asynchronously with job retries and dead-letter handling.
- [ ] Deliver public derivatives through a CDN with correct caching headers.
- [ ] Prevent unauthorized access to premium or private media.
- [ ] Implement orphaned-upload cleanup and deletion lifecycle policies.

## 8. Community, chat, and moderation

- [ ] Implement forum post, comment, reply, reaction, view, edit, delete, and report APIs.
- [ ] Define edit windows, soft deletion, archival, and moderator visibility rules.
- [ ] Add spam, flood, duplicate-content, and abuse rate limits.
- [ ] Sanitize user-generated text and reject unsafe markup/URLs.
- [ ] Implement conversation membership and message authorization.
- [ ] Add message send, history, pagination, delivery/read receipt, unread count, and delete behavior.
- [ ] Use WebSockets/SSE for real-time messages, comments, presence, typing, and live viewer counts.
- [ ] Authenticate real-time connections and reauthorize channel subscriptions.
- [ ] Add event sequence IDs and missed-event recovery after reconnect.
- [ ] Define message retention, reporting, blocking, muting, and legal-request procedures.
- [ ] Build moderator queues for reports and content review.
- [ ] Record moderator actions with actor, reason, target, and timestamp.
- [ ] Add automated content checks only with a human appeal/escalation path.

## 9. Live streaming

- [ ] Select a managed streaming provider unless operating video infrastructure is a core competency.
- [ ] Implement role-protected create, schedule, start, end, cancel, and archive operations.
- [ ] Secure ingest credentials and never expose private stream keys to unauthorized clients.
- [ ] Use signed playback URLs/tokens if streams are private or tier-restricted.
- [ ] Receive and verify provider webhooks for stream state and recording completion.
- [ ] Make webhook processing signed, replay-protected, idempotent, and retry-safe.
- [ ] Provide stream health, viewer count, poster, recording, and failure state APIs.
- [ ] Add chat moderation, slow mode, user mute/ban, and emergency stream termination.
- [ ] Define recording retention and consent policies.

## 10. Announcements, education, and notifications

- [ ] Implement announcement drafts, scheduling, publishing, pinning, expiry, editing, and archival.
- [ ] Restrict announcement management to explicit permissions.
- [ ] Implement courses, lessons, tier access, ordering, publication, and progress APIs.
- [ ] Protect premium video playback with short-lived authorization.
- [ ] Store resume positions and completion events idempotently.
- [ ] Build an in-app notification system for signals, replies, messages, streams, announcements, rewards, and security events.
- [ ] Add email and optional push delivery with user preference controls.
- [ ] Use a background queue for notifications and track delivery attempts/failures.
- [ ] Provide unsubscribe and legally required preference-management behavior.

## 11. API quality and resilience

- [ ] Validate every request and response against explicit schemas.
- [ ] Return consistent machine-readable error codes plus safe user-facing messages.
- [ ] Use cursor pagination for large or frequently changing collections.
- [ ] Add idempotency keys to publish, claim, upload-finalize, payment-like, and webhook operations.
- [ ] Use database transactions for multi-record state changes.
- [ ] Add sensible timeouts, retries with jitter, and circuit breakers for external providers.
- [ ] Prevent retry storms and duplicate background jobs.
- [ ] Add request correlation IDs across API, jobs, WebSockets, and provider calls.
- [ ] Add cache invalidation rules and avoid caching user-private responses publicly.
- [ ] Document consistency expectations for live values, unread counts, and viewer counts.

## 12. Security hardening

- [ ] Complete a threat model covering authentication, uploads, community content, admin tools, broker integration, AI publishing, and streaming.
- [ ] Follow the current OWASP ASVS/API Security guidance.
- [ ] Enforce TLS everywhere and redirect HTTP to HTTPS.
- [ ] Configure strict CORS allowlists and reject untrusted origins.
- [ ] Add CSRF protection for cookie-authenticated state-changing requests.
- [ ] Add secure headers: CSP, HSTS, frame restrictions, MIME sniffing protection, and referrer policy.
- [ ] Prevent SQL/NoSQL injection through parameterized queries and safe ORM usage.
- [ ] Prevent XSS by sanitizing rich text and avoiding unsafe HTML rendering.
- [ ] Prevent SSRF in URL ingestion, webhooks, and media fetching.
- [ ] Add layered rate limits by IP, account, endpoint, and resource.
- [ ] Encrypt sensitive data at rest where appropriate and manage key rotation.
- [ ] Mask secrets and personal data from application logs and error reports.
- [ ] Run dependency, secret, container, and static security scans in CI.
- [ ] Perform an independent penetration test before a public financial/trading release.
- [ ] Establish vulnerability disclosure and security incident response processes.

## 13. Privacy, legal, and financial-risk requirements

- [ ] Identify applicable privacy, consumer, communications, and financial-promotion regulations with qualified legal counsel.
- [ ] Publish reviewed Terms of Service, Privacy Policy, Cookie Policy, Community Guidelines, and Risk Disclosure.
- [ ] Obtain explicit acceptance of required agreements and version the accepted documents.
- [ ] Provide consent management for optional analytics/marketing where required.
- [ ] Implement data access, correction, export, and deletion request workflows.
- [ ] Document lawful basis, retention, subprocessors, and cross-border transfers.
- [ ] Avoid unsubstantiated performance claims and clearly label historical/simulated results.
- [ ] Display that trading involves risk and signals are not guarantees.
- [ ] Determine whether identity verification, age restrictions, jurisdiction restrictions, or licensing are required.
- [ ] Keep evidence for consent, disclosures, moderation, and material signal changes.

## 14. Observability and operations

- [ ] Add structured logs with request IDs and environment/service metadata.
- [ ] Add metrics for latency, error rate, saturation, jobs, WebSockets, provider freshness, and business-critical workflows.
- [ ] Add distributed tracing for API-provider-job chains.
- [ ] Integrate error monitoring with source maps and release identifiers.
- [ ] Define service-level indicators/objectives for login, prices, signals, chat, and streaming.
- [ ] Add actionable alerts with owners, thresholds, and escalation paths.
- [ ] Create runbooks for provider outages, stale prices, failed jobs, database issues, compromised credentials, and abusive live sessions.
- [ ] Add public or internal service-status communication procedures.
- [ ] Ensure production support can inspect state without direct unrestricted database access.

## 15. Backups and disaster recovery

- [ ] Enable automated encrypted database backups and point-in-time recovery.
- [ ] Define recovery point and recovery time objectives.
- [ ] Store backups separately from the primary environment/account where feasible.
- [ ] Regularly test restoration rather than assuming backups work.
- [ ] Back up critical configuration and object metadata.
- [ ] Document disaster recovery, regional outage, and provider migration procedures.
- [ ] Test rollback for application and database deployments.

## 16. CI/CD and hosting

- [ ] Containerize or otherwise make backend builds reproducible.
- [ ] Pin runtime and dependency versions and generate locked dependency manifests.
- [ ] Add CI gates for formatting, linting, types, unit/integration tests, migrations, security scans, and build.
- [ ] Use short-lived cloud credentials or workload identity in CI.
- [ ] Deploy automatically to staging and require controlled approval for production.
- [ ] Run migrations using a safe, observable deployment step.
- [ ] Use rolling, blue/green, or canary releases with health checks and automatic rollback.
- [ ] Host the frontend behind a CDN with immutable hashed assets and correct SPA routing.
- [ ] Configure production domains, DNS, TLS certificates, redirects, and canonical URLs.
- [ ] Add a web application firewall and DDoS protections appropriate to expected risk.
- [ ] Configure autoscaling and resource limits based on load testing.
- [ ] Keep infrastructure defined as code and reviewed through pull requests.
- [ ] Verify third-party service quotas, billing alerts, and spend limits.

## 17. Testing and launch validation

- [ ] Add unit tests for permissions, signal state transitions, pip calculations, tier calculations, and validation.
- [ ] Add integration tests against a real test database and storage emulator/service.
- [ ] Add contract tests for market, broker, streaming, email, and other external providers.
- [ ] Add API end-to-end tests for all critical user and admin workflows.
- [ ] Add WebSocket tests for authentication, reconnect, ordering, and missed messages.
- [ ] Add concurrency tests for reactions, unread counts, reward claims, and signal publication.
- [ ] Add load tests for market fan-out, signals, chat, calendar, and live-session spikes.
- [ ] Test backup restoration and disaster recovery in a non-production environment.
- [ ] Seed staging with synthetic—not copied production—data.
- [ ] Complete an operational launch checklist and rollback rehearsal.

## Backend definition of done

- [ ] No production endpoint trusts client-provided identity, role, tier, lot totals, prices, or authorization decisions.
- [ ] All external integrations have licensing approval, timeouts, retries, monitoring, and documented fallback behavior.
- [ ] All sensitive actions are authenticated, authorized, validated, rate-limited, auditable, and tested.
- [ ] Database migrations, backups, restoration, rollback, and incident procedures have been exercised.
- [ ] Staging matches production architecture closely enough to expose deployment issues.
- [ ] Security, privacy, legal, accessibility, performance, and load-testing release gates are complete.
- [ ] Production monitoring, alerting, ownership, support, and incident-response coverage are active before launch.
