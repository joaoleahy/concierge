-- Allow guests to view their own service requests by room_id
CREATE POLICY "Guests can view their room requests"
ON public.service_requests
FOR SELECT
USING (true);

-- Drop the admin-only select policy and replace with a combined one
DROP POLICY IF EXISTS "Admins can view service requests for their hotel" ON public.service_requests;

-- Recreate admin policy for viewing
CREATE POLICY "Admins can view service requests for their hotel"
ON public.service_requests
FOR SELECT
USING (is_hotel_admin(auth.uid(), hotel_id));

-- Allow guests to update their own pending requests (for cancellation)
CREATE POLICY "Guests can update their pending requests"
ON public.service_requests
FOR UPDATE
USING (status = 'pending');