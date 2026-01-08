-- Add room PIN for guest verification
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS access_pin TEXT DEFAULT LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ DEFAULT now();

-- Add expiration to chat sessions
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add failed attempts tracking for rate limiting
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

-- Enable RLS on pin_attempts
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert attempts (for tracking)
CREATE POLICY "Anyone can log pin attempts" 
  ON public.pin_attempts FOR INSERT
  WITH CHECK (true);

-- Only admins can view attempts (for security monitoring)
CREATE POLICY "Admins can view pin attempts" 
  ON public.pin_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND is_hotel_admin(auth.uid(), r.hotel_id)
    )
  );

-- Create function to regenerate room PINs (for daily rotation)
CREATE OR REPLACE FUNCTION public.regenerate_room_pin(room_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_pin TEXT;
BEGIN
  new_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  UPDATE public.rooms 
  SET access_pin = new_pin, pin_updated_at = now()
  WHERE id = room_uuid;
  
  RETURN new_pin;
END;
$$;

-- Create function to verify room PIN with rate limiting
CREATE OR REPLACE FUNCTION public.verify_room_pin(
  room_uuid UUID, 
  provided_pin TEXT,
  client_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  room_record RECORD;
  recent_failures INT;
  result JSONB;
BEGIN
  -- Check rate limiting (5 failures in 15 minutes = blocked)
  SELECT COUNT(*) INTO recent_failures
  FROM public.pin_attempts
  WHERE room_id = room_uuid
    AND success = false
    AND attempted_at > now() - INTERVAL '15 minutes';
  
  IF recent_failures >= 5 THEN
    -- Log the blocked attempt
    INSERT INTO public.pin_attempts (room_id, ip_address, success)
    VALUES (room_uuid, client_ip, false);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'too_many_attempts',
      'message', 'Muitas tentativas. Aguarde 15 minutos.'
    );
  END IF;
  
  -- Get room info
  SELECT r.*, h.checkout_time, h.name as hotel_name
  INTO room_record
  FROM public.rooms r
  JOIN public.hotels h ON h.id = r.hotel_id
  WHERE r.id = room_uuid;
  
  IF room_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'room_not_found',
      'message', 'Quarto não encontrado.'
    );
  END IF;
  
  -- Verify PIN
  IF room_record.access_pin = provided_pin THEN
    -- Log successful attempt
    INSERT INTO public.pin_attempts (room_id, ip_address, success)
    VALUES (room_uuid, client_ip, true);
    
    RETURN jsonb_build_object(
      'success', true,
      'hotel_id', room_record.hotel_id,
      'room_id', room_record.id,
      'room_number', room_record.room_number,
      'hotel_name', room_record.hotel_name
    );
  ELSE
    -- Log failed attempt
    INSERT INTO public.pin_attempts (room_id, ip_address, success)
    VALUES (room_uuid, client_ip, false);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_pin',
      'message', 'PIN incorreto. Verifique o PIN fornecido no check-in.'
    );
  END IF;
END;
$$;

-- Create staff invitations table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  invited_by UUID NOT NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations for their hotel
CREATE POLICY "Admins can manage invitations" 
  ON public.staff_invitations FOR ALL
  TO authenticated
  USING (is_hotel_admin(auth.uid(), hotel_id));

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token" 
  ON public.staff_invitations FOR SELECT
  USING (true);

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Você precisa estar logado para aceitar o convite.'
    );
  END IF;
  
  -- Get invitation
  SELECT * INTO invitation_record
  FROM public.staff_invitations
  WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > now();
  
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_invitation',
      'message', 'Convite inválido ou expirado.'
    );
  END IF;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, hotel_id, role)
  VALUES (current_user_id, invitation_record.hotel_id, invitation_record.role)
  ON CONFLICT DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.staff_invitations
  SET accepted_at = now()
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'hotel_id', invitation_record.hotel_id,
    'role', invitation_record.role,
    'message', 'Convite aceito com sucesso!'
  );
END;
$$;