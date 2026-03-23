-- Run this in Supabase SQL Editor (after notifications migration)

CREATE TABLE IF NOT EXISTS site_settings (
  id                  text        PRIMARY KEY DEFAULT 'main',
  maintenance_mode    boolean     NOT NULL DEFAULT false,
  maintenance_message text        NOT NULL DEFAULT 'We are performing scheduled maintenance. Please check back shortly.',
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "authenticated_update_settings" ON site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
