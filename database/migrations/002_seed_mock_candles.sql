-- ============================================================
-- TRADING BOT V1 - MOCK CANDLES SEED
-- Local PostgreSQL 18
-- ============================================================

insert into public.candles (
  symbol_id,
  timeframe_id,
  open_time,
  close_time,
  open,
  high,
  low,
  close,
  volume,
  source,
  is_closed
)
select
  s.id,
  tf.id,
  now() - interval '15 minutes',
  now(),
  104120.300000000000,
  104420.800000000000,
  103980.100000000000,
  104250.200000000000,
  18.450000000000,
  'mock',
  true
from public.symbols s
cross join public.timeframes tf
where s.symbol = 'BTCUSDT'
  and tf.code = '15m'
on conflict (symbol_id, timeframe_id, open_time) do nothing;

insert into public.candles (
  symbol_id,
  timeframe_id,
  open_time,
  close_time,
  open,
  high,
  low,
  close,
  volume,
  source,
  is_closed
)
select
  s.id,
  tf.id,
  now() - interval '1 hour',
  now(),
  103800.000000000000,
  104300.000000000000,
  103500.000000000000,
  103980.100000000000,
  42.780000000000,
  'mock',
  true
from public.symbols s
cross join public.timeframes tf
where s.symbol = 'BTCUSDT'
  and tf.code = '1h'
on conflict (symbol_id, timeframe_id, open_time) do nothing;

insert into public.candles (
  symbol_id,
  timeframe_id,
  open_time,
  close_time,
  open,
  high,
  low,
  close,
  volume,
  source,
  is_closed
)
select
  s.id,
  tf.id,
  now() - interval '15 minutes',
  now(),
  3820.500000000000,
  3872.100000000000,
  3812.300000000000,
  3860.440000000000,
  250.320000000000,
  'mock',
  true
from public.symbols s
cross join public.timeframes tf
where s.symbol = 'ETHUSDT'
  and tf.code = '15m'
on conflict (symbol_id, timeframe_id, open_time) do nothing;

insert into public.candles (
  symbol_id,
  timeframe_id,
  open_time,
  close_time,
  open,
  high,
  low,
  close,
  volume,
  source,
  is_closed
)
select
  s.id,
  tf.id,
  now() - interval '1 hour',
  now(),
  3805.000000000000,
  3868.000000000000,
  3788.000000000000,
  3842.150000000000,
  520.870000000000,
  'mock',
  true
from public.symbols s
cross join public.timeframes tf
where s.symbol = 'ETHUSDT'
  and tf.code = '1h'
on conflict (symbol_id, timeframe_id, open_time) do nothing;