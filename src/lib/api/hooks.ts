/**
 * TanStack Query hooks for API calls
 * These replace the Supabase client calls
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  ServiceType,
  ServiceRequest,
  MenuCategory,
  MenuItem,
  LocalRecommendation,
  Hotel,
  Room,
} from "../../../server/db/schema";

// ============================================================================
// SERVICES
// ============================================================================

export function useServiceTypes(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["serviceTypes", hotelId],
    queryFn: () => api.get<ServiceType[]>(`/api/services/types?hotelId=${hotelId}`),
    enabled: !!hotelId,
  });
}

export function useServiceRequests(roomId: string | undefined, hotelId?: string) {
  const queryParam = roomId ? `roomId=${roomId}` : `hotelId=${hotelId}`;
  return useQuery({
    queryKey: ["serviceRequests", roomId || hotelId],
    queryFn: () => api.get<ServiceRequest[]>(`/api/services/requests?${queryParam}`),
    enabled: !!(roomId || hotelId),
    refetchInterval: 30000, // Poll every 30 seconds for updates
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      hotelId: string;
      roomId?: string;
      serviceTypeId?: string;
      requestType: string;
      details?: string;
      guestLanguage?: string;
    }) => api.post<ServiceRequest>("/api/services/requests", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceRequests", variables.roomId] });
    },
  });
}

export function useUpdateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      staffResponse?: string;
      resolution?: string;
    }) => api.patch<ServiceRequest>(`/api/services/requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
    },
  });
}

// ============================================================================
// MENU
// ============================================================================

export function useMenuCategories(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["menuCategories", hotelId],
    queryFn: () => api.get<(MenuCategory & { items: MenuItem[] })[]>(
      `/api/menu/categories?hotelId=${hotelId}`
    ),
    enabled: !!hotelId,
  });
}

export function useMenuItems(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["menuItems", categoryId],
    queryFn: () => api.get<MenuItem[]>(`/api/menu/items?categoryId=${categoryId}`),
    enabled: !!categoryId,
  });
}

// ============================================================================
// HOTEL & ADMIN
// ============================================================================

export function useHotel(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: () => api.get<Hotel>(`/api/admin/hotels/${hotelId}`),
    enabled: !!hotelId,
  });
}

export function useUpdateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Hotel> & { id: string }) =>
      api.patch<Hotel>(`/api/admin/hotels/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hotel", variables.id] });
    },
  });
}

export function useRooms(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: () => api.get<Room[]>(`/api/admin/rooms?hotelId=${hotelId}`),
    enabled: !!hotelId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Room>) => api.post<Room>("/api/admin/rooms", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", variables.hotelId] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Room> & { id: string }) =>
      api.patch<Room>(`/api/admin/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export function useLocalRecommendations(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["recommendations", hotelId],
    queryFn: () =>
      api.get<LocalRecommendation[]>(`/api/admin/recommendations?hotelId=${hotelId}`),
    enabled: !!hotelId,
  });
}

// ============================================================================
// CHAT
// ============================================================================

export function useCreateChatSession() {
  return useMutation({
    mutationFn: (data: { hotelId: string; roomId?: string; guestLanguage?: string }) =>
      api.post<{ id: string }>("/api/chat/session", data),
  });
}

export function useChatHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chatHistory", sessionId],
    queryFn: () =>
      api.get<{ id: string; role: string; content: string; createdAt: string }[]>(
        `/api/chat/history/${sessionId}`
      ),
    enabled: !!sessionId,
  });
}
