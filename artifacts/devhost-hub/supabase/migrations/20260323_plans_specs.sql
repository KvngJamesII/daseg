-- Add resource spec columns to plans table
alter table public.plans
  add column if not exists ram_mb      integer  not null default 512,
  add column if not exists cpu_cores   numeric  not null default 0.5,
  add column if not exists storage_mb  integer  not null default 1024;

-- Upsert canonical plan data
insert into public.plans
  (name, price, panels_count, duration_days, description, is_active, is_popular, sort_order, ram_mb, cpu_cores, storage_mb, features)
values
  ('Starter',  140000, 1, 30, 'Run a small bot or script',          true,  false, 1,  512,  0.5, 1024,  array['Node.js & Python support','Auto-restart on crash','Web file manager','Console & live logs','24/7 uptime monitoring']),
  ('Basic',    250000, 1, 30, 'Discord bots & simple APIs',         true,  true,  2,  1024, 1.0, 2048,  array['Everything in Starter','Double the RAM (1 GB)','2× CPU performance','2 GB file storage','Priority activation']),
  ('Standard', 420000, 1, 30, 'Multi-feature apps & scrapers',      true,  false, 3,  1536, 1.5, 3072,  array['Everything in Basic','1.5 GB RAM','1.5 CPU cores','3 GB file storage','Higher restart tolerance']),
  ('Pro',      650000, 1, 30, 'Heavy workloads & ML scripts',       true,  false, 4,  2048, 2.0, 4096,  array['Everything in Standard','Max 2 GB RAM','2 full CPU cores','4 GB storage','Highest restart limit'])
on conflict (name) do update set
  price        = excluded.price,
  panels_count = excluded.panels_count,
  duration_days= excluded.duration_days,
  description  = excluded.description,
  is_active    = excluded.is_active,
  is_popular   = excluded.is_popular,
  sort_order   = excluded.sort_order,
  ram_mb       = excluded.ram_mb,
  cpu_cores    = excluded.cpu_cores,
  storage_mb   = excluded.storage_mb,
  features     = excluded.features,
  updated_at   = now();
