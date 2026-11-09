insert into roles (id, code, name) values
  ('10000000-0000-4000-8000-000000000001', 'member', 'Member'),
  ('10000000-0000-4000-8000-000000000002', 'expert', 'Expert'),
  ('10000000-0000-4000-8000-000000000003', 'moderator', 'Moderator'),
  ('10000000-0000-4000-8000-000000000004', 'admin', 'Administrator'),
  ('10000000-0000-4000-8000-000000000005', 'super-admin', 'Super Administrator')
on conflict (code) do nothing;

insert into reward_tiers (id, code, name, required_lots, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 'inactive', 'INACTIVE', 0, 0),
  ('20000000-0000-4000-8000-000000000002', 'trader', 'TRADER', 1, 1),
  ('20000000-0000-4000-8000-000000000003', 'prime', 'PRIME', 10, 2),
  ('20000000-0000-4000-8000-000000000004', 'elite', 'ELITE', 50, 3),
  ('20000000-0000-4000-8000-000000000005', 'sultan', 'SULTAN', 100, 4)
on conflict (code) do nothing;

insert into instruments (id, symbol, asset_class, display_name, price_precision, pip_size) values
  ('30000000-0000-4000-8000-000000000001', 'XAUUSD', 'metal', 'Gold / U.S. Dollar', 2, 0.01),
  ('30000000-0000-4000-8000-000000000002', 'EURUSD', 'forex', 'Euro / U.S. Dollar', 5, 0.0001),
  ('30000000-0000-4000-8000-000000000003', 'GBPUSD', 'forex', 'British Pound / U.S. Dollar', 5, 0.0001),
  ('30000000-0000-4000-8000-000000000004', 'USDJPY', 'forex', 'U.S. Dollar / Japanese Yen', 3, 0.01),
  ('30000000-0000-4000-8000-000000000005', 'BTCUSD', 'crypto', 'Bitcoin / U.S. Dollar', 2, 0.01)
on conflict (symbol) do nothing;

insert into app_configuration (key, value, description) values
  ('platform.timezone', '"Asia/Jakarta"'::jsonb, 'Locked display timezone for NH Terminal'),
  ('signals.risk_disclosure_required', 'true'::jsonb, 'Require risk disclosure on published signals')
on conflict (key) do nothing;
