-- Migration: Add AI Trust Score to room_shares and listings
-- Run this in your Supabase SQL Editor

-- 1. Add trust score columns to room_shares
ALTER TABLE room_shares 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trust_score_breakdown JSONB DEFAULT NULL;

-- 2. Add trust score breakdown to listings (it already has trust_score)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS trust_score_breakdown JSONB DEFAULT NULL;
