-- Migration: Fix flatmate profiles constraint and add room_shares table
-- Run this in your Supabase SQL Editor for your remote database!

-- 1. Fix the flatmate_profiles user_id constraint
-- Drop the partial index if it exists
DROP INDEX IF EXISTS flatmate_profiles_user_id_unique;

-- Add standard unique constraint (allows multiple NULLs, compatible with ON CONFLICT upsert)
ALTER TABLE flatmate_profiles 
DROP CONSTRAINT IF EXISTS flatmate_profiles_user_id_key;

ALTER TABLE flatmate_profiles 
ADD CONSTRAINT flatmate_profiles_user_id_key UNIQUE (user_id);

-- 2. Create the room_shares table
CREATE TABLE IF NOT EXISTS room_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title_en TEXT NOT NULL,
  title_bn TEXT,
  description_en TEXT,
  description_bn TEXT,
  area TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  rent_bdt INTEGER NOT NULL,
  current_roommates INTEGER DEFAULT 1,
  available_seats INTEGER DEFAULT 1,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'any')) DEFAULT 'any',
  university_restriction TEXT,
  photos TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE room_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS room_shares_select ON room_shares;
DROP POLICY IF EXISTS room_shares_insert ON room_shares;
DROP POLICY IF EXISTS room_shares_update_own ON room_shares;
DROP POLICY IF EXISTS room_shares_delete_own ON room_shares;

-- Create policies
CREATE POLICY "room_shares_select" ON room_shares FOR SELECT USING (is_available = true);
CREATE POLICY "room_shares_insert" ON room_shares FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "room_shares_update_own" ON room_shares FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "room_shares_delete_own" ON room_shares FOR DELETE USING (creator_id = auth.uid());
