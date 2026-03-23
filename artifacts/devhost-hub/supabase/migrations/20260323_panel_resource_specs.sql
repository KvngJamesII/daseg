-- Add resource spec columns to redeem_codes so each code carries plan limits
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS ram_mb      INTEGER        NOT NULL DEFAULT 512;
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS cpu_cores   NUMERIC(4,2)   NOT NULL DEFAULT 0.5;
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS storage_mb  INTEGER        NOT NULL DEFAULT 1024;

-- Add resource spec columns to panels so each panel knows its actual limits
ALTER TABLE panels ADD COLUMN IF NOT EXISTS ram_mb      INTEGER        NOT NULL DEFAULT 512;
ALTER TABLE panels ADD COLUMN IF NOT EXISTS cpu_cores   NUMERIC(4,2)   NOT NULL DEFAULT 0.5;
ALTER TABLE panels ADD COLUMN IF NOT EXISTS storage_mb  INTEGER        NOT NULL DEFAULT 1024;
