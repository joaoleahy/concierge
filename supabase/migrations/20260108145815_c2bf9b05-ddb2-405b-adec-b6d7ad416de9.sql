-- Add staff response columns to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS staff_response text,
ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone;

-- Update the status check - now allows: pending, in_progress, completed, declined, modified
-- No constraint needed since we store as text