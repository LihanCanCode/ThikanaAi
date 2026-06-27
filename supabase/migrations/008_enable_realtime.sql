-- Enable Realtime for Notifications and Flicks
-- This adds the necessary tables to the Supabase Realtime publication so the client receives WebSocket events

BEGIN;
  -- Add notifications table to realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  
  -- Add flatmate_flicks table to realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE flatmate_flicks;
COMMIT;
