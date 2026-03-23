-- Run this once in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = broadcast to all
  title       text        NOT NULL,
  message     text        NOT NULL DEFAULT '',
  type        text        NOT NULL DEFAULT 'info',   -- 'info' | 'warning' | 'success'
  is_global   boolean     NOT NULL DEFAULT false,
  read_by     text[]      NOT NULL DEFAULT '{}',     -- array of user UUIDs who have read
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own targeted notifications + global broadcasts
CREATE POLICY "users_view_notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_global = true
  );

-- Authenticated users can update read_by (to mark as read)
CREATE POLICY "users_update_read_by" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
    OR is_global = true
  );

-- Allow authenticated users to insert (admin will be the one calling)
CREATE POLICY "authenticated_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime on this table (run in Supabase dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
