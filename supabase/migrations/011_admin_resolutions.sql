-- Migration: Add admin_notes to reports
-- Run this in your Supabase SQL Editor

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
