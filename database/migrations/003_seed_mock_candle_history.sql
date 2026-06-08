-- ============================================================
-- TRADING BOT V1 - MOCK CANDLE HISTORY SEED
-- Local PostgreSQL 18
-- ============================================================

delete from public.candles
where source = 'mock';

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
  now() - ((series.index + 1) * interval '15 minutes'),
  now() - (series.index * interval '15 minutes'),
  104000 + (series.index * 18) + case when series.index % 4 = 0 then -90 else 40 end,
  104000 + (series.index * 18) + 180,
  104000 + (series.index * 18) - 160,
  104000 + (series.index * 18) + case when series.index % 3 = 0 then 75 else -35 end,
  10 + (series.index * 0.45),
  'mock',
  true
from public.symbols s
join public.timeframes tf on tf.code = '15m'
cross join generate_series(39, 0, -1) as series(index)
where s.symbol = 'BTCUSDT';

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
  now() - ((series.index + 1) * interval '1 hour'),
  now() - (series.index * interval '1 hour'),
  103500 + (series.index * 42) + case when series.index % 5 = 0 then -120 else 65 end,
  103500 + (series.index * 42) + 240,
  103500 + (series.index * 42) - 220,
  103500 + (series.index * 42) + case when series.index % 4 = 0 then 110 else -55 end,
  30 + (series.index * 0.9),
  'mock',
  true
from public.symbols s
join public.timeframes tf on tf.code = '1h'
cross join generate_series(39, 0, -1) as series(index)
where s.symbol = 'BTCUSDT';

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
  now() - ((series.index + 1) * interval '15 minutes'),
  now() - (series.index * interval '15 minutes'),
  3800 + (series.index * 2.2) + case when series.index % 4 = 0 then -8 else 4 end,
  3800 + (series.index * 2.2) + 18,
  3800 + (series.index * 2.2) - 16,
  3800 + (series.index * 2.2) + case when series.index % 3 = 0 then 7 else -3 end,
  180 + (series.index * 3.5),
  'mock',
  true
from public.symbols s
join public.timeframes tf on tf.code = '15m'
cross join generate_series(39, 0, -1) as series(index)
where s.symbol = 'ETHUSDT';

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
  now() - ((series.index + 1) * interval '1 hour'),
  now() - (series.index * interval '1 hour'),
  3780 + (series.index * 4.6) + case when series.index % 5 = 0 then -12 else 6 end,
  3780 + (series.index * 4.6) + 25,
  3780 + (series.index * 4.6) - 22,
  3780 + (series.index * 4.6) + case when series.index % 4 = 0 then 10 else -5 end,
  300 + (series.index * 5.2),
  'mock',
  true
from public.symbols s
join public.timeframes tf on tf.code = '1h'
cross join generate_series(39, 0, -1) as series(index)
where s.symbol = 'ETHUSDT';