-- Create enums for tone of voice and service types
CREATE TYPE public.tone_of_voice AS ENUM ('relaxed_resort', 'formal_business', 'boutique_chic', 'family_friendly');
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Hotels table
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  wifi_password TEXT,
  breakfast_hours TEXT,
  checkout_time TEXT DEFAULT '12:00',
  whatsapp_number TEXT NOT NULL,
  accent_color TEXT DEFAULT '#1e3a5f',
  tone_of_voice public.tone_of_voice DEFAULT 'relaxed_resort',
  logo_url TEXT,
  banner_url TEXT,
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms table (linked to hotels, each has unique QR identifier)
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  floor INTEGER,
  room_type TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

-- Menu categories (Breakfast, Lunch, Drinks, etc.)
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_pt TEXT,
  description TEXT,
  icon TEXT DEFAULT 'utensils',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items with prices
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_pt TEXT,
  description TEXT,
  description_pt TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service types for quick actions
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_pt TEXT,
  description TEXT,
  icon TEXT NOT NULL,
  whatsapp_template TEXT NOT NULL,
  whatsapp_template_pt TEXT,
  requires_details BOOLEAN DEFAULT false,
  details_placeholder TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Request logs for analytics
CREATE TABLE public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  request_details JSONB,
  guest_language TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Local recommendations (curated hidden gems)
CREATE TABLE public.local_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_pt TEXT,
  description TEXT,
  description_pt TEXT,
  category TEXT NOT NULL,
  address TEXT,
  google_maps_url TEXT,
  image_url TEXT,
  price_range TEXT,
  is_hidden_gem BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat sessions for AI concierge
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  guest_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table for admin access (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hotel_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _hotel_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
      AND role = _role
  )
$$;

-- Function to check if user is admin of any hotel
CREATE OR REPLACE FUNCTION public.is_hotel_admin(_user_id UUID, _hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for hotels (public read, admin write)
CREATE POLICY "Hotels are publicly readable" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Admins can update their hotel" ON public.hotels FOR UPDATE TO authenticated USING (public.is_hotel_admin(auth.uid(), id));
CREATE POLICY "Admins can insert hotels" ON public.hotels FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for rooms (public read via QR, admin write)
CREATE POLICY "Rooms are publicly readable" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for menu_categories
CREATE POLICY "Menu categories are publicly readable" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu categories" ON public.menu_categories FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for menu_items
CREATE POLICY "Menu items are publicly readable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for service_types
CREATE POLICY "Service types are publicly readable" ON public.service_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage service types" ON public.service_types FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for request_logs (public insert for guests, admin read)
CREATE POLICY "Anyone can log requests" ON public.request_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view request logs" ON public.request_logs FOR SELECT TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for local_recommendations
CREATE POLICY "Recommendations are publicly readable" ON public.local_recommendations FOR SELECT USING (true);
CREATE POLICY "Admins can manage recommendations" ON public.local_recommendations FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- RLS Policies for chat_sessions (public create/read for guests)
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their chat sessions" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can update chat sessions" ON public.chat_sessions FOR UPDATE USING (true);

-- RLS Policies for chat_messages
CREATE POLICY "Anyone can create chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles for their hotel" ON public.user_roles FOR ALL TO authenticated USING (public.is_hotel_admin(auth.uid(), hotel_id));

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();