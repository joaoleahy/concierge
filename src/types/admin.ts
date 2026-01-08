/**
 * Admin-related type definitions for the Hotel Concierge application
 */

// Menu Management Types
export interface MenuCategory {
  id: string;
  hotel_id: string;
  name: string;
  name_pt?: string | null;
  icon?: string | null;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  hotel_id: string;
  category_id: string;
  name: string;
  name_pt?: string | null;
  description?: string | null;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  sort_order: number;
  created_at: string;
}

// Service Types Management
export interface ServiceType {
  id: string;
  hotel_id: string;
  name: string;
  name_pt?: string | null;
  icon: string;
  action_type: "direct" | "whatsapp" | "chat";
  is_active: boolean;
  sort_order: number;
  requires_details: boolean;
  details_placeholder?: string | null;
  whatsapp_template?: string | null;
  whatsapp_template_pt?: string | null;
  created_at: string;
}

export interface ServiceTypeOption {
  id: string;
  service_type_id: string;
  label: string;
  label_pt?: string | null;
  sort_order: number;
}

// Room Management
export interface Room {
  id: string;
  hotel_id: string;
  room_number: string;
  qr_code: string;
  guest_pin?: string | null;
  floor?: string | null;
  room_type?: string | null;
  is_active: boolean;
  created_at: string;
}

// Staff Management
export interface StaffMember {
  id: string;
  hotel_id: string;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  hotel_id: string;
  email: string;
  role: "admin" | "staff";
  token: string;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
}

// Local Recommendations
export interface LocalRecommendation {
  id: string;
  hotel_id: string;
  name: string;
  name_pt?: string | null;
  category: string;
  description: string;
  description_pt?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  image_url?: string | null;
  is_hidden_gem: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Hotel Settings
export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  timezone?: string | null;
  wifi_password?: string | null;
  breakfast_hours?: string | null;
  checkout_time?: string | null;
  whatsapp_number?: string | null;
  tone_of_voice: string;
  logo_url?: string | null;
  created_at: string;
}

// User Roles
export interface UserRole {
  id: string;
  user_id: string;
  hotel_id: string;
  role: "admin" | "staff";
  created_at: string;
}

// Form data types for creating/updating
export type MenuCategoryFormData = Omit<MenuCategory, "id" | "hotel_id" | "created_at" | "sort_order">;
export type MenuItemFormData = Omit<MenuItem, "id" | "hotel_id" | "created_at" | "sort_order">;
export type ServiceTypeFormData = Omit<ServiceType, "id" | "hotel_id" | "created_at" | "sort_order">;
export type RoomFormData = Omit<Room, "id" | "hotel_id" | "created_at" | "qr_code">;
export type RecommendationFormData = Omit<LocalRecommendation, "id" | "hotel_id" | "created_at" | "sort_order">;
