-- ============================================================
-- TRADING BOT V1 - DATABASE SCHEMA
-- -- Local PostgreSQL 18
-- ============================================================

-- Extensión para generar UUIDs.
create extension if not exists "pgcrypto";

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. MARKET PROVIDERS
-- Ejemplo: Binance, Coinbase, Kraken, Oanda.
-- ============================================================

create table if not exists public.market_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  type text not null check (
    type in (
      'crypto_exchange',
      'forex_broker',
      'stock_broker',
      'data_provider'
    )
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_market_providers_updated_at
before update on public.market_providers
for each row
execute function public.set_updated_at();

-- ============================================================
-- 2. SYMBOLS
-- Pares o instrumentos: BTCUSDT, ETHUSDT, EURUSD, etc.
-- ============================================================

create table if not exists public.symbols (
  id uuid primary key default gen_random_uuid(),
  market_provider_id uuid not null references public.market_providers(id) on delete cascade,
  market_type text not null check (
    market_type in (
      'crypto',
      'forex',
      'stock',
      'commodity'
    )
  ),
  base_asset text not null,
  quote_asset text not null,
  symbol text not null,
  display_symbol text not null,
  price_precision int not null default 8,
  quantity_precision int not null default 8,
  min_notional numeric(28, 12),
  pip_size numeric(28, 12),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symbols_provider_symbol_unique unique (market_provider_id, symbol)
);

create index if not exists symbols_market_provider_id_idx
on public.symbols (market_provider_id);

create index if not exists symbols_symbol_idx
on public.symbols (symbol);

create trigger set_symbols_updated_at
before update on public.symbols
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. TIMEFRAMES
-- Temporalidades: 5m, 15m, 1h.
-- ============================================================

create table if not exists public.timeframes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  duration_seconds int not null check (duration_seconds > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_timeframes_updated_at
before update on public.timeframes
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. CANDLES
-- Velas OHLCV cerradas.
-- Esta tabla será la que más crecerá.
-- ============================================================

create table if not exists public.candles (
  id uuid primary key default gen_random_uuid(),
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  timeframe_id uuid not null references public.timeframes(id) on delete cascade,
  open_time timestamptz not null,
  close_time timestamptz not null,
  open numeric(28, 12) not null,
  high numeric(28, 12) not null,
  low numeric(28, 12) not null,
  close numeric(28, 12) not null,
  volume numeric(28, 12) not null default 0,
  source text not null default 'binance',
  is_closed boolean not null default true,
  created_at timestamptz not null default now(),
  constraint candles_symbol_timeframe_open_time_unique unique (
    symbol_id,
    timeframe_id,
    open_time
  ),
  constraint candles_price_values_valid check (
    open >= 0
    and high >= 0
    and low >= 0
    and close >= 0
    and high >= low
  )
);

create index if not exists candles_symbol_timeframe_close_time_idx
on public.candles (symbol_id, timeframe_id, close_time desc);

create index if not exists candles_open_time_idx
on public.candles (open_time desc);

-- ============================================================
-- 5. INDICATOR SNAPSHOTS
-- EMA, RSI u otros indicadores calculados por vela.
-- ============================================================

create table if not exists public.indicator_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  timeframe_id uuid not null references public.timeframes(id) on delete cascade,
  candle_id uuid not null references public.candles(id) on delete cascade,
  indicator_code text not null,
  settings jsonb not null default '{}'::jsonb,
  value numeric(28, 12),
  values_json jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint indicator_snapshots_unique unique (
    candle_id,
    indicator_code,
    settings
  )
);

create index if not exists indicator_snapshots_symbol_timeframe_idx
on public.indicator_snapshots (symbol_id, timeframe_id);

create index if not exists indicator_snapshots_indicator_code_idx
on public.indicator_snapshots (indicator_code);

-- ============================================================
-- 6. STRATEGY DEFINITIONS
-- Catálogo de estrategias.
-- ============================================================

create table if not exists public.strategy_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  version text not null default '1.0.0',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_strategy_definitions_updated_at
before update on public.strategy_definitions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 7. STRATEGY INSTANCES
-- Una estrategia aplicada a un símbolo y timeframe.
-- Ejemplo: BTC/USDT - 15m - EMA RSI.
-- ============================================================

create table if not exists public.strategy_instances (
  id uuid primary key default gen_random_uuid(),
  strategy_definition_id uuid not null references public.strategy_definitions(id) on delete cascade,
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  timeframe_id uuid not null references public.timeframes(id) on delete cascade,
  name text not null,
  mode text not null default 'paper' check (
    mode in (
      'backtest',
      'paper',
      'live'
    )
  ),
  status text not null default 'stopped' check (
    status in (
      'running',
      'paused',
      'stopped',
      'error'
    )
  ),
  settings jsonb not null default '{}'::jsonb,
  risk_settings jsonb not null default '{}'::jsonb,
  capital_allocated numeric(28, 12) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_instances_unique unique (
    strategy_definition_id,
    symbol_id,
    timeframe_id,
    mode
  )
);

create index if not exists strategy_instances_symbol_timeframe_idx
on public.strategy_instances (symbol_id, timeframe_id);

create index if not exists strategy_instances_status_idx
on public.strategy_instances (status);

create trigger set_strategy_instances_updated_at
before update on public.strategy_instances
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. SIGNALS
-- Señales generadas por una estrategia.
-- ============================================================

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  strategy_instance_id uuid not null references public.strategy_instances(id) on delete cascade,
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  timeframe_id uuid not null references public.timeframes(id) on delete cascade,
  candle_id uuid references public.candles(id) on delete set null,
  type text not null check (
    type in (
      'buy',
      'sell',
      'close_long',
      'close_short',
      'hold'
    )
  ),
  status text not null default 'generated' check (
    status in (
      'generated',
      'approved',
      'rejected',
      'executed',
      'ignored',
      'expired'
    )
  ),
  price numeric(28, 12),
  reason text,
  indicators_snapshot jsonb not null default '{}'::jsonb,
  spread_percent numeric(28, 12),
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  ignored_reason text
);

create index if not exists signals_strategy_instance_created_at_idx
on public.signals (strategy_instance_id, created_at desc);

create index if not exists signals_symbol_timeframe_created_at_idx
on public.signals (symbol_id, timeframe_id, created_at desc);

create index if not exists signals_status_idx
on public.signals (status);

-- ============================================================
-- 9. PAPER ACCOUNTS
-- Cuenta simulada para paper trading.
-- ============================================================

create table if not exists public.paper_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial_balance numeric(28, 12) not null check (initial_balance >= 0),
  current_balance numeric(28, 12) not null check (current_balance >= 0),
  currency text not null default 'USDT',
  status text not null default 'active' check (
    status in (
      'active',
      'paused',
      'closed'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_paper_accounts_updated_at
before update on public.paper_accounts
for each row
execute function public.set_updated_at();

-- ============================================================
-- 10. POSITIONS
-- Operaciones simuladas abiertas o cerradas.
-- ============================================================

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  paper_account_id uuid not null references public.paper_accounts(id) on delete cascade,
  strategy_instance_id uuid not null references public.strategy_instances(id) on delete cascade,
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  side text not null check (
    side in (
      'long',
      'short'
    )
  ),
  status text not null default 'open' check (
    status in (
      'open',
      'closed',
      'cancelled'
    )
  ),
  entry_price numeric(28, 12) not null check (entry_price >= 0),
  exit_price numeric(28, 12) check (exit_price >= 0),
  quantity numeric(28, 12) not null check (quantity >= 0),
  notional_value numeric(28, 12) not null check (notional_value >= 0),
  stop_loss_price numeric(28, 12) check (stop_loss_price >= 0),
  take_profit_price numeric(28, 12) check (take_profit_price >= 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  gross_pnl numeric(28, 12),
  net_pnl numeric(28, 12),
  fees_paid numeric(28, 12) not null default 0,
  spread_cost numeric(28, 12) not null default 0,
  close_reason text check (
    close_reason is null
    or close_reason in (
      'take_profit',
      'stop_loss',
      'strategy_signal',
      'manual_close',
      'risk_limit',
      'cancelled'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists positions_paper_account_status_idx
on public.positions (paper_account_id, status);

create index if not exists positions_strategy_instance_status_idx
on public.positions (strategy_instance_id, status);

create index if not exists positions_opened_at_idx
on public.positions (opened_at desc);

create trigger set_positions_updated_at
before update on public.positions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 11. ORDERS
-- Órdenes simuladas del paper trading.
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  paper_account_id uuid not null references public.paper_accounts(id) on delete cascade,
  position_id uuid references public.positions(id) on delete set null,
  strategy_instance_id uuid not null references public.strategy_instances(id) on delete cascade,
  symbol_id uuid not null references public.symbols(id) on delete cascade,
  side text not null check (
    side in (
      'buy',
      'sell'
    )
  ),
  type text not null default 'market' check (
    type in (
      'market',
      'limit',
      'stop'
    )
  ),
  status text not null default 'pending' check (
    status in (
      'pending',
      'filled',
      'cancelled',
      'rejected'
    )
  ),
  requested_price numeric(28, 12),
  executed_price numeric(28, 12),
  quantity numeric(28, 12) not null check (quantity >= 0),
  fee numeric(28, 12) not null default 0,
  spread numeric(28, 12) not null default 0,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists orders_position_id_idx
on public.orders (position_id);

create index if not exists orders_strategy_instance_created_at_idx
on public.orders (strategy_instance_id, created_at desc);

create index if not exists orders_status_idx
on public.orders (status);

-- ============================================================
-- 12. EQUITY SNAPSHOTS
-- Historial de balance para calcular drawdown.
-- ============================================================

create table if not exists public.equity_snapshots (
  id uuid primary key default gen_random_uuid(),
  paper_account_id uuid not null references public.paper_accounts(id) on delete cascade,
  strategy_instance_id uuid references public.strategy_instances(id) on delete set null,
  balance numeric(28, 12) not null,
  equity numeric(28, 12) not null,
  open_pnl numeric(28, 12) not null default 0,
  drawdown_percent numeric(28, 12) not null default 0,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists equity_snapshots_account_recorded_at_idx
on public.equity_snapshots (paper_account_id, recorded_at desc);

create index if not exists equity_snapshots_strategy_recorded_at_idx
on public.equity_snapshots (strategy_instance_id, recorded_at desc);

-- ============================================================
-- 13. BOT LOGS
-- Logs internos del sistema.
-- ============================================================

create table if not exists public.bot_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (
    level in (
      'debug',
      'info',
      'warning',
      'error',
      'critical'
    )
  ),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bot_logs_level_created_at_idx
on public.bot_logs (level, created_at desc);

create index if not exists bot_logs_source_created_at_idx
on public.bot_logs (source, created_at desc);

-- ============================================================
-- 14. BOT SETTINGS
-- Configuraciones globales.
-- ============================================================

create table if not exists public.bot_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_bot_settings_updated_at
before update on public.bot_settings
for each row
execute function public.set_updated_at();

-- ============================================================
-- INITIAL SEED DATA
-- Datos iniciales para comenzar.
-- ============================================================

insert into public.market_providers (
  name,
  code,
  type,
  is_active
)
values (
  'Binance',
  'binance',
  'crypto_exchange',
  true
)
on conflict (code) do nothing;

insert into public.timeframes (
  code,
  label,
  duration_seconds,
  is_active
)
values
  ('15m', '15 minutes', 900, true),
  ('1h', '1 hour', 3600, true)
on conflict (code) do nothing;

insert into public.symbols (
  market_provider_id,
  market_type,
  base_asset,
  quote_asset,
  symbol,
  display_symbol,
  price_precision,
  quantity_precision,
  min_notional,
  is_active
)
select
  mp.id,
  'crypto',
  'BTC',
  'USDT',
  'BTCUSDT',
  'BTC/USDT',
  2,
  8,
  10,
  true
from public.market_providers mp
where mp.code = 'binance'
on conflict (market_provider_id, symbol) do nothing;

insert into public.symbols (
  market_provider_id,
  market_type,
  base_asset,
  quote_asset,
  symbol,
  display_symbol,
  price_precision,
  quantity_precision,
  min_notional,
  is_active
)
select
  mp.id,
  'crypto',
  'ETH',
  'USDT',
  'ETHUSDT',
  'ETH/USDT',
  2,
  8,
  10,
  true
from public.market_providers mp
where mp.code = 'binance'
on conflict (market_provider_id, symbol) do nothing;

insert into public.strategy_definitions (
  name,
  code,
  description,
  version,
  is_active
)
values (
  'EMA RSI Crossover',
  'EMA_RSI_CROSSOVER',
  'Strategy based on EMA 9 / EMA 21 crossover with RSI filter.',
  '1.0.0',
  true
)
on conflict (code) do nothing;

insert into public.paper_accounts (
  name,
  initial_balance,
  current_balance,
  currency,
  status
)
select
  'Main Paper Account',
  100,
  100,
  'USDT',
  'active'
where not exists (
  select 1
  from public.paper_accounts
  where name = 'Main Paper Account'
);

insert into public.bot_settings (
  key,
  value,
  description
)
values
  (
    'bot_enabled',
    '{"enabled": false}'::jsonb,
    'Global switch to enable or disable the trading bot.'
  ),
  (
    'default_quote_currency',
    '{"currency": "USDT"}'::jsonb,
    'Default quote currency for paper trading.'
  ),
  (
    'market_data_provider',
    '{"provider": "binance"}'::jsonb,
    'Default market data provider.'
  )
on conflict (key) do nothing;