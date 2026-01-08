-- Create service_requests table for internal request handling
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  room_id UUID REFERENCES public.rooms(id),
  service_type_id UUID REFERENCES public.service_types(id),
  request_type TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  guest_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create itinerary_items table for guest trip planning
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT DEFAULT 'activity',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  google_maps_url TEXT,
  recommendation_id UUID REFERENCES public.local_recommendations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Service requests policies
CREATE POLICY "Anyone can create service requests"
  ON public.service_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view service requests for their hotel"
  ON public.service_requests
  FOR SELECT
  USING (is_hotel_admin(auth.uid(), hotel_id));

CREATE POLICY "Admins can update service requests for their hotel"
  ON public.service_requests
  FOR UPDATE
  USING (is_hotel_admin(auth.uid(), hotel_id));

-- Itinerary items policies (guests access via session, no auth needed)
CREATE POLICY "Anyone can create itinerary items"
  ON public.itinerary_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view itinerary items"
  ON public.itinerary_items
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update itinerary items"
  ON public.itinerary_items
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete itinerary items"
  ON public.itinerary_items
  FOR DELETE
  USING (true);

-- Create trigger for updated_at on service_requests
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on itinerary_items
CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for service_requests (admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;