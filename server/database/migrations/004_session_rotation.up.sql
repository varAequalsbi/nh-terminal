alter table sessions add column family_id uuid;
alter table sessions add column parent_session_id uuid references sessions(id) on delete set null;
alter table sessions add column replaced_by_session_id uuid references sessions(id) on delete set null;
alter table sessions add column rotated_at timestamptz;
alter table sessions add column reuse_detected_at timestamptz;
alter table sessions add column revocation_reason text;

update sessions set family_id = id where family_id is null;
alter table sessions alter column family_id set not null;

alter table sessions add constraint sessions_revocation_reason_check check (
  revocation_reason is null or revocation_reason in (
    'rotated', 'logout', 'revoked-by-user', 'password-reset',
    'password-change', 'expired', 'reuse-detected'
  )
);

create index sessions_family_idx on sessions(family_id, created_at);
create index sessions_rotated_token_idx on sessions(token_hash, rotated_at) where revocation_reason = 'rotated';
