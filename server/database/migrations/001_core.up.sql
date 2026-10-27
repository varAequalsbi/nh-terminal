create table roles (
  id uuid primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table app_configuration (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  email text not null,
  username text,
  status text not null default 'active' check (status in ('pending', 'active', 'suspended', 'deleted')),
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index users_email_unique on users (lower(email)) where deleted_at is null;
create unique index users_username_unique on users (lower(username)) where username is not null and deleted_at is null;

create table user_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  password_hash text not null,
  password_changed_at timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  broker_identifier text,
  country_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  language text not null default 'en',
  timezone text not null default 'Asia/Jakarta' check (timezone = 'Asia/Jakarta'),
  theme text not null default 'dark',
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_hash text,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index sessions_user_active_idx on sessions(user_id, expires_at) where revoked_at is null;

create table reward_tiers (
  id uuid primary key,
  code text not null unique,
  name text not null,
  required_lots numeric(18,4) not null default 0 check (required_lots >= 0),
  sort_order integer not null unique,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table lot_ledger (
  id uuid primary key,
  user_id uuid not null references users(id) on delete restrict,
  quantity numeric(18,4) not null,
  source text not null,
  external_reference text,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(source, external_reference)
);
create index lot_ledger_user_occurred_idx on lot_ledger(user_id, occurred_at desc);

create table instruments (
  id uuid primary key,
  symbol text not null unique,
  asset_class text not null,
  display_name text not null,
  price_precision smallint not null check (price_precision between 0 and 12),
  pip_size numeric(20,10) not null check (pip_size > 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table price_snapshots (
  instrument_id uuid not null references instruments(id) on delete cascade,
  provider text not null,
  bid numeric(20,10),
  ask numeric(20,10),
  price numeric(20,10) not null,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key (instrument_id, provider, observed_at)
);
create index price_snapshots_latest_idx on price_snapshots(instrument_id, observed_at desc);

create table market_candles (
  instrument_id uuid not null references instruments(id) on delete cascade,
  provider text not null,
  timeframe text not null,
  opened_at timestamptz not null,
  open numeric(20,10) not null,
  high numeric(20,10) not null,
  low numeric(20,10) not null,
  close numeric(20,10) not null,
  volume numeric(24,8),
  primary key (instrument_id, provider, timeframe, opened_at),
  check (high >= greatest(open, close, low)),
  check (low <= least(open, close, high))
);

create table signals (
  id uuid primary key,
  author_id uuid not null references users(id) on delete restrict,
  instrument_id uuid not null references instruments(id) on delete restrict,
  source text not null,
  direction text not null check (direction in ('BUY', 'SELL')),
  status text not null check (status in ('draft', 'scheduled', 'published', 'running', 'target-hit', 'stopped', 'cancelled', 'expired', 'completed')),
  visibility text not null default 'members',
  entry numeric(20,10) not null,
  stop_loss numeric(20,10) not null,
  analysis text not null,
  session_name text,
  scheduled_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index signals_feed_idx on signals(status, published_at desc);
create index signals_instrument_idx on signals(instrument_id, created_at desc);

create table signal_targets (
  id uuid primary key,
  signal_id uuid not null references signals(id) on delete cascade,
  position smallint not null check (position > 0),
  price numeric(20,10) not null,
  hit_at timestamptz,
  unique(signal_id, position)
);

create table signal_history (
  id uuid primary key,
  signal_id uuid not null references signals(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  from_status text,
  to_status text not null,
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index signal_history_signal_idx on signal_history(signal_id, created_at);

create table calendar_events (
  id uuid primary key,
  provider text not null,
  provider_event_id text not null,
  title text not null,
  country_code char(2),
  currency char(3),
  impact text not null check (impact in ('low', 'medium', 'high')),
  scheduled_at timestamptz not null,
  previous_value text,
  forecast_value text,
  actual_value text,
  revised_value text,
  status text not null default 'scheduled',
  source_url text,
  received_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);
create index calendar_events_schedule_idx on calendar_events(scheduled_at, impact);

create table market_content (
  id uuid primary key,
  kind text not null check (kind in ('outlook', 'research', 'sentiment')),
  instrument_id uuid references instruments(id) on delete set null,
  title text not null,
  body text not null,
  source text,
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz not null,
  expires_at timestamptz
);
create index market_content_feed_idx on market_content(kind, published_at desc);

create table forum_posts (
  id uuid primary key,
  author_id uuid not null references users(id) on delete restrict,
  title text not null,
  body text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index forum_posts_feed_idx on forum_posts(created_at desc) where deleted_at is null;

create table forum_comments (
  id uuid primary key,
  post_id uuid not null references forum_posts(id) on delete cascade,
  author_id uuid not null references users(id) on delete restrict,
  parent_id uuid references forum_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index forum_comments_thread_idx on forum_comments(post_id, created_at);

create table forum_reactions (
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references forum_posts(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, post_id, reaction)
);

create table conversations (
  id uuid primary key,
  kind text not null default 'direct',
  title text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted_until timestamptz,
  primary key(conversation_id, user_id)
);

create table messages (
  id uuid primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete restrict,
  body text not null,
  client_request_id text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique(sender_id, client_request_id)
);
create index messages_history_idx on messages(conversation_id, created_at desc);

create table message_receipts (
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key(message_id, user_id)
);

create table announcements (
  id uuid primary key,
  author_id uuid not null references users(id) on delete restrict,
  title text not null,
  body text not null,
  status text not null default 'draft',
  pinned boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_feed_idx on announcements(pinned desc, published_at desc) where status = 'published';

create table announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(announcement_id, user_id)
);

create table courses (
  id uuid primary key,
  title text not null,
  description text,
  required_tier_id uuid references reward_tiers(id) on delete set null,
  status text not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key,
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  media_key text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  sort_order integer not null,
  status text not null default 'draft',
  unique(course_id, sort_order)
);

create table lesson_progress (
  user_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);

create table audit_logs (
  id uuid primary key,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  request_id text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_actor_idx on audit_logs(actor_id, created_at desc);
create index audit_logs_target_idx on audit_logs(target_type, target_id, created_at desc);

create table idempotency_keys (
  scope text not null,
  key text not null,
  user_id uuid references users(id) on delete cascade,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key(scope, key)
);
create index idempotency_keys_expiry_idx on idempotency_keys(expires_at);
