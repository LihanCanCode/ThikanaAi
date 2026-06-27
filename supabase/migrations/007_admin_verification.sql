-- Migration: 007_admin_verification.sql
-- Run this in your Supabase SQL Editor to support manual admin verification

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_front_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none'; -- 'none', 'pending', 'verified', 'rejected'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_reject_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Example: To set yourself as an admin, run:
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
