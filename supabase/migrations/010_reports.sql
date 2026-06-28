-- Migration: Create Reports table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('listing', 'room_share')) NOT NULL,
  target_id UUID NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: In a stricter environment, we'd add a DB trigger to verify the rental_requests record. 
-- For flexibility, we'll enforce this check robustly in the Server Actions (backend).

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist for idempotency
DROP POLICY IF EXISTS reports_student_select ON reports;
DROP POLICY IF EXISTS reports_owner_select ON reports;
DROP POLICY IF EXISTS reports_student_insert ON reports;
DROP POLICY IF EXISTS reports_admin_all ON reports;

-- Create policies

-- Students can see their own reports
CREATE POLICY "reports_student_select" ON reports FOR SELECT USING (reporter_id = auth.uid());

-- Owners can see reports filed against them (optional, maybe we want this hidden until admin decides? Let's hide it from owner for now to prevent retaliation)
-- CREATE POLICY "reports_owner_select" ON reports FOR SELECT USING (owner_id = auth.uid());

-- Students can insert reports
CREATE POLICY "reports_student_insert" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Admins can view and update all reports
CREATE POLICY "reports_admin_all" ON reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
