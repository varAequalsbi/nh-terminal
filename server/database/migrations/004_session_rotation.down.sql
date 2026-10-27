drop index if exists sessions_rotated_token_idx;
drop index if exists sessions_family_idx;
alter table sessions drop constraint if exists sessions_revocation_reason_check;
alter table sessions drop column if exists revocation_reason;
alter table sessions drop column if exists reuse_detected_at;
alter table sessions drop column if exists rotated_at;
alter table sessions drop column if exists replaced_by_session_id;
alter table sessions drop column if exists parent_session_id;
alter table sessions drop column if exists family_id;
