create table auth_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);
create index auth_rate_limits_updated_idx on auth_rate_limits(updated_at);

create table password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index password_reset_tokens_user_idx on password_reset_tokens(user_id, expires_at desc);
