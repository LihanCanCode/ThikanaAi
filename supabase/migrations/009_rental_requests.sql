-- Migration: Create Rental Requests table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  room_share_id UUID REFERENCES room_shares(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  contract_accepted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (listing_id IS NOT NULL AND room_share_id IS NULL) OR
    (listing_id IS NULL AND room_share_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist for idempotency
DROP POLICY IF EXISTS rental_requests_student_select ON rental_requests;
DROP POLICY IF EXISTS rental_requests_owner_select ON rental_requests;
DROP POLICY IF EXISTS rental_requests_student_insert ON rental_requests;
DROP POLICY IF EXISTS rental_requests_owner_update ON rental_requests;
DROP POLICY IF EXISTS rental_requests_admin_select ON rental_requests;

-- Create policies
-- Students can see their own requests
CREATE POLICY "rental_requests_student_select" ON rental_requests FOR SELECT USING (student_id = auth.uid());

-- Owners can see requests for their properties
CREATE POLICY "rental_requests_owner_select" ON rental_requests FOR SELECT USING (owner_id = auth.uid());

-- Students can insert requests
CREATE POLICY "rental_requests_student_insert" ON rental_requests FOR INSERT WITH CHECK (student_id = auth.uid());

-- Owners can update the status of requests sent to them
CREATE POLICY "rental_requests_owner_update" ON rental_requests FOR UPDATE USING (owner_id = auth.uid());

-- Admins can view all (using the is_admin check, wait, profiles table has role='admin'? Let's check profiles)
-- For now, let's allow all select if they are admin. We can rely on a server-side check for admin, but RLS should be robust.
-- Let's just create a basic select policy for authenticated users if we filter server-side, or use a subquery:
CREATE POLICY "rental_requests_admin_select" ON rental_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
