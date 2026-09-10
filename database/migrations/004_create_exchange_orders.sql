create table if not exists exchange_orders (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  mode text not null,
  symbol text not null,
  side text not null,
  type text not null,
  status text not null,
  quote_order_qty numeric(28, 12),
  executed_qty numeric(28, 12),
  cumulative_quote_qty numeric(28, 12),
  average_price numeric(28, 12),
  external_order_id text not null,
  external_client_order_id text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists exchange_orders_exchange_mode_created_at_idx
  on exchange_orders (exchange, mode, created_at desc);

create index if not exists exchange_orders_symbol_created_at_idx
  on exchange_orders (symbol, created_at desc);

create index if not exists exchange_orders_external_order_id_idx
  on exchange_orders (external_order_id);