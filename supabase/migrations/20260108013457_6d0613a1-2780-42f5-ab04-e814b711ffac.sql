-- Fix itinerary_items RLS policies - restrict to session-based access
-- Since guests aren't authenticated, we'll use localStorage session_id passed through RPC
-- But the edge function already uses service role, so we'll restrict client access

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can create itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Anyone can view itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Anyone can update itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Anyone can delete itinerary items" ON public.itinerary_items;

-- Create restrictive policies - only authenticated admins can view via client
-- Guest operations go through edge functions with service role
CREATE POLICY "Admins can view hotel itineraries" 
  ON public.itinerary_items FOR SELECT
  TO authenticated
  USING (is_hotel_admin(auth.uid(), hotel_id));

CREATE POLICY "Admins can manage hotel itineraries" 
  ON public.itinerary_items FOR ALL
  TO authenticated
  USING (is_hotel_admin(auth.uid(), hotel_id));

-- Fix hotel INSERT policy - restrict to service role only (onboarding via admin)
DROP POLICY IF EXISTS "Admins can insert hotels" ON public.hotels;
CREATE POLICY "Service role or super admin can insert hotels" 
  ON public.hotels FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Only allow if user is already an admin of any hotel (bootstrapped externally)
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix function search_path to include pg_temp for security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _hotel_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_admin(_user_id uuid, _hotel_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;