-- Add estimated response time to service_types (in minutes)
ALTER TABLE public.service_types 
ADD COLUMN IF NOT EXISTS estimated_response_minutes integer DEFAULT 15;

-- Add resolution field to service_requests for tracking final outcome
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS resolution text DEFAULT NULL;

-- Add guest_accepted field for counter-proposal acceptance
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS guest_accepted boolean DEFAULT NULL;

-- Update existing completed requests to have a default resolution
UPDATE public.service_requests 
SET resolution = 'fulfilled' 
WHERE status = 'completed' AND resolution IS NULL;

UPDATE public.service_requests 
SET resolution = 'cancelled_by_guest' 
WHERE status = 'cancelled' AND resolution IS NULL;

UPDATE public.service_requests 
SET resolution = 'declined_by_staff' 
WHERE status = 'declined' AND resolution IS NULL;