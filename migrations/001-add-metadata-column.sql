-- TASK-008: Add metadata column to messages table for structured output
-- Run this against the Supabase database before deploying TASK-008
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;
