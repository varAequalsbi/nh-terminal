delete from app_configuration where key in ('platform.timezone', 'signals.risk_disclosure_required');
delete from instruments i
where i.id::text like '30000000-0000-4000-8000-%'
  and not exists (select 1 from price_snapshots p where p.instrument_id = i.id)
  and not exists (select 1 from market_candles c where c.instrument_id = i.id)
  and not exists (select 1 from signals s where s.instrument_id = i.id)
  and not exists (select 1 from market_content m where m.instrument_id = i.id);
delete from reward_tiers t
where t.id::text like '20000000-0000-4000-8000-%'
  and not exists (select 1 from courses c where c.required_tier_id = t.id);
delete from roles r
where r.id::text like '10000000-0000-4000-8000-%'
  and not exists (select 1 from user_roles ur where ur.role_id = r.id);
