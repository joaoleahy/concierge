export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          guest_language: string | null
          hotel_id: string
          id: string
          room_id: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          guest_language?: string | null
          hotel_id: string
          id?: string
          room_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          guest_language?: string | null
          hotel_id?: string
          id?: string
          room_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          accent_color: string | null
          banner_url: string | null
          breakfast_hours: string | null
          checkout_time: string | null
          city: string
          country: string
          created_at: string | null
          id: string
          language: string | null
          logo_url: string | null
          name: string
          timezone: string | null
          tone_of_voice: Database["public"]["Enums"]["tone_of_voice"] | null
          updated_at: string | null
          whatsapp_number: string
          wifi_password: string | null
        }
        Insert: {
          accent_color?: string | null
          banner_url?: string | null
          breakfast_hours?: string | null
          checkout_time?: string | null
          city: string
          country: string
          created_at?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name: string
          timezone?: string | null
          tone_of_voice?: Database["public"]["Enums"]["tone_of_voice"] | null
          updated_at?: string | null
          whatsapp_number: string
          wifi_password?: string | null
        }
        Update: {
          accent_color?: string | null
          banner_url?: string | null
          breakfast_hours?: string | null
          checkout_time?: string | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name?: string
          timezone?: string | null
          tone_of_voice?: Database["public"]["Enums"]["tone_of_voice"] | null
          updated_at?: string | null
          whatsapp_number?: string
          wifi_password?: string | null
        }
        Relationships: []
      }
      itinerary_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          end_time: string | null
          google_maps_url: string | null
          hotel_id: string
          id: string
          location: string | null
          recommendation_id: string | null
          session_id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          google_maps_url?: string | null
          hotel_id: string
          id?: string
          location?: string | null
          recommendation_id?: string | null
          session_id: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          google_maps_url?: string | null
          hotel_id?: string
          id?: string
          location?: string | null
          recommendation_id?: string | null
          session_id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "local_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      local_recommendations: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          description: string | null
          description_pt: string | null
          google_maps_url: string | null
          hotel_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_hidden_gem: boolean | null
          name: string
          name_pt: string | null
          price_range: string | null
          sort_order: number | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          description_pt?: string | null
          google_maps_url?: string | null
          hotel_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_hidden_gem?: boolean | null
          name: string
          name_pt?: string | null
          price_range?: string | null
          sort_order?: number | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          description_pt?: string | null
          google_maps_url?: string | null
          hotel_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_hidden_gem?: boolean | null
          name?: string
          name_pt?: string | null
          price_range?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "local_recommendations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          hotel_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_pt: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hotel_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_pt?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hotel_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_pt?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          description_pt: string | null
          hotel_id: string
          id: string
          image_url: string | null
          is_available: boolean | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          name_pt: string | null
          price: number
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          description_pt?: string | null
          hotel_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          name_pt?: string | null
          price: number
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          description_pt?: string | null
          hotel_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          name_pt?: string | null
          price?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          ip_address: string | null
          room_id: string | null
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          room_id?: string | null
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          room_id?: string | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_attempts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          created_at: string | null
          guest_language: string | null
          hotel_id: string
          id: string
          request_details: Json | null
          request_type: string
          room_id: string | null
          service_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_language?: string | null
          hotel_id: string
          id?: string
          request_details?: Json | null
          request_type: string
          room_id?: string | null
          service_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_language?: string | null
          hotel_id?: string
          id?: string
          request_details?: Json | null
          request_type?: string
          room_id?: string | null
          service_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_logs_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          access_pin: string | null
          created_at: string | null
          floor: number | null
          hotel_id: string
          id: string
          pin_updated_at: string | null
          qr_code: string
          room_number: string
          room_type: string | null
        }
        Insert: {
          access_pin?: string | null
          created_at?: string | null
          floor?: number | null
          hotel_id: string
          id?: string
          pin_updated_at?: string | null
          qr_code: string
          room_number: string
          room_type?: string | null
        }
        Update: {
          access_pin?: string | null
          created_at?: string | null
          floor?: number | null
          hotel_id?: string
          id?: string
          pin_updated_at?: string | null
          qr_code?: string
          room_number?: string
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          details: string | null
          guest_accepted: boolean | null
          guest_language: string | null
          hotel_id: string
          id: string
          request_type: string
          resolution: string | null
          responded_at: string | null
          room_id: string | null
          service_type_id: string | null
          staff_response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: string | null
          guest_accepted?: boolean | null
          guest_language?: string | null
          hotel_id: string
          id?: string
          request_type: string
          resolution?: string | null
          responded_at?: string | null
          room_id?: string | null
          service_type_id?: string | null
          staff_response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: string | null
          guest_accepted?: boolean | null
          guest_language?: string | null
          hotel_id?: string
          id?: string
          request_type?: string
          resolution?: string | null
          responded_at?: string | null
          room_id?: string | null
          service_type_id?: string | null
          staff_response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string | null
          description: string | null
          details_placeholder: string | null
          estimated_response_minutes: number | null
          hotel_id: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          name_pt: string | null
          requires_details: boolean | null
          sort_order: number | null
          whatsapp_template: string
          whatsapp_template_pt: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          details_placeholder?: string | null
          estimated_response_minutes?: number | null
          hotel_id: string
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          name_pt?: string | null
          requires_details?: boolean | null
          sort_order?: number | null
          whatsapp_template: string
          whatsapp_template_pt?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          details_placeholder?: string | null
          estimated_response_minutes?: number | null
          hotel_id?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_pt?: string | null
          requires_details?: boolean | null
          sort_order?: number | null
          whatsapp_template?: string
          whatsapp_template_pt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          hotel_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          hotel_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          hotel_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          hotel_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hotel_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          hotel_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_staff_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _hotel_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hotel_admin: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: boolean
      }
      regenerate_room_pin: { Args: { room_uuid: string }; Returns: string }
      verify_room_pin: {
        Args: { client_ip?: string; provided_pin: string; room_uuid: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      tone_of_voice:
        | "relaxed_resort"
        | "formal_business"
        | "boutique_chic"
        | "family_friendly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      tone_of_voice: [
        "relaxed_resort",
        "formal_business",
        "boutique_chic",
        "family_friendly",
      ],
    },
  },
} as const
