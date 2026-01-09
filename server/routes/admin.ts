import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import {
  hotels,
  rooms,
  serviceTypes,
  menuCategories,
  menuItems,
  localRecommendations,
  staffInvitations,
  userRoles,
} from "../db/schema";
import { eq } from "drizzle-orm";

export const adminRoutes = new Hono();

// TODO: Add auth middleware to protect all admin routes

// ============================================================================
// HOTELS
// ============================================================================

adminRoutes.get("/hotels/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.id, id),
    });

    if (!hotel) {
      return c.json({ error: "Hotel not found" }, 404);
    }

    return c.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return c.json({ error: "Failed to fetch hotel" }, 500);
  }
});

adminRoutes.patch("/hotels/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(hotels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hotels.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating hotel:", error);
    return c.json({ error: "Failed to update hotel" }, 500);
  }
});

// ============================================================================
// ROOMS
// ============================================================================

adminRoutes.get("/rooms", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const roomList = await db.query.rooms.findMany({
      where: eq(rooms.hotelId, hotelId),
    });

    return c.json(roomList);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return c.json({ error: "Failed to fetch rooms" }, 500);
  }
});

// Get room by QR code (for guest access)
adminRoutes.get("/rooms/qr/:qrCode", async (c) => {
  const qrCode = c.req.param("qrCode");

  try {
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.qrCode, qrCode),
      with: {
        hotel: true,
      },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    return c.json({
      room: {
        id: room.id,
        hotel_id: room.hotelId,
        room_number: room.roomNumber,
        qr_code: room.qrCode,
        floor: room.floor,
        room_type: room.roomType,
      },
      hotel: room.hotel ? {
        id: room.hotel.id,
        name: room.hotel.name,
        city: room.hotel.city,
        country: room.hotel.country,
        wifi_password: room.hotel.wifiPassword,
        breakfast_hours: room.hotel.breakfastHours,
        checkout_time: room.hotel.checkoutTime,
        whatsapp_number: room.hotel.whatsappNumber,
        accent_color: room.hotel.accentColor,
        tone_of_voice: room.hotel.toneOfVoice,
        logo_url: room.hotel.logoUrl,
        banner_url: room.hotel.bannerUrl,
        language: room.hotel.language,
        timezone: room.hotel.timezone,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching room by QR:", error);
    return c.json({ error: "Failed to fetch room" }, 500);
  }
});

adminRoutes.post("/rooms", async (c) => {
  const data = await c.req.json();

  try {
    const [room] = await db.insert(rooms).values(data).returning();
    return c.json(room, 201);
  } catch (error) {
    console.error("Error creating room:", error);
    return c.json({ error: "Failed to create room" }, 500);
  }
});

adminRoutes.patch("/rooms/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating room:", error);
    return c.json({ error: "Failed to update room" }, 500);
  }
});

adminRoutes.delete("/rooms/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(rooms).where(eq(rooms.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return c.json({ error: "Failed to delete room" }, 500);
  }
});

// Regenerate room PIN
adminRoutes.post("/rooms/:id/regenerate-pin", async (c) => {
  const id = c.req.param("id");

  try {
    // Generate new 4-digit PIN
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();

    const [updated] = await db
      .update(rooms)
      .set({ accessPin: newPin, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Room not found" }, 404);
    }

    return c.json({ pin: updated.accessPin });
  } catch (error) {
    console.error("Error regenerating PIN:", error);
    return c.json({ error: "Failed to regenerate PIN" }, 500);
  }
});

// ============================================================================
// SERVICE TYPES
// ============================================================================

adminRoutes.get("/service-types", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const services = await db.query.serviceTypes.findMany({
      where: eq(serviceTypes.hotelId, hotelId),
      orderBy: (serviceTypes, { asc }) => [asc(serviceTypes.sortOrder)],
    });

    return c.json(services);
  } catch (error) {
    console.error("Error fetching service types:", error);
    return c.json({ error: "Failed to fetch service types" }, 500);
  }
});

adminRoutes.post("/service-types", async (c) => {
  const data = await c.req.json();

  try {
    const [service] = await db.insert(serviceTypes).values(data).returning();
    return c.json(service, 201);
  } catch (error) {
    console.error("Error creating service type:", error);
    return c.json({ error: "Failed to create service type" }, 500);
  }
});

adminRoutes.patch("/service-types/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(serviceTypes)
      .set(updates)
      .where(eq(serviceTypes.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating service type:", error);
    return c.json({ error: "Failed to update service type" }, 500);
  }
});

adminRoutes.delete("/service-types/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(serviceTypes).where(eq(serviceTypes.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting service type:", error);
    return c.json({ error: "Failed to delete service type" }, 500);
  }
});

// ============================================================================
// MENU (Categories & Items)
// ============================================================================

adminRoutes.get("/menu/categories", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const categories = await db.query.menuCategories.findMany({
      where: eq(menuCategories.hotelId, hotelId),
      orderBy: (menuCategories, { asc }) => [asc(menuCategories.sortOrder)],
    });

    return c.json(categories);
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

adminRoutes.get("/menu/items", async (c) => {
  const hotelId = c.req.query("hotelId");
  const categoryId = c.req.query("categoryId");

  try {
    let items;
    if (categoryId) {
      items = await db.query.menuItems.findMany({
        where: eq(menuItems.categoryId, categoryId),
        orderBy: (menuItems, { asc }) => [asc(menuItems.sortOrder)],
      });
    } else if (hotelId) {
      items = await db.query.menuItems.findMany({
        where: eq(menuItems.hotelId, hotelId),
        orderBy: (menuItems, { asc }) => [asc(menuItems.sortOrder)],
      });
    } else {
      return c.json({ error: "hotelId or categoryId is required" }, 400);
    }

    return c.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return c.json({ error: "Failed to fetch items" }, 500);
  }
});

adminRoutes.post("/menu/categories", async (c) => {
  const data = await c.req.json();

  try {
    const [category] = await db.insert(menuCategories).values(data).returning();
    return c.json(category, 201);
  } catch (error) {
    console.error("Error creating menu category:", error);
    return c.json({ error: "Failed to create category" }, 500);
  }
});

adminRoutes.patch("/menu/categories/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(menuCategories)
      .set(updates)
      .where(eq(menuCategories.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating menu category:", error);
    return c.json({ error: "Failed to update category" }, 500);
  }
});

adminRoutes.delete("/menu/categories/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(menuCategories).where(eq(menuCategories.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu category:", error);
    return c.json({ error: "Failed to delete category" }, 500);
  }
});

adminRoutes.post("/menu/items", async (c) => {
  const data = await c.req.json();

  try {
    const [item] = await db.insert(menuItems).values(data).returning();
    return c.json(item, 201);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return c.json({ error: "Failed to create item" }, 500);
  }
});

adminRoutes.patch("/menu/items/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return c.json({ error: "Failed to update item" }, 500);
  }
});

adminRoutes.delete("/menu/items/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return c.json({ error: "Failed to delete item" }, 500);
  }
});

// ============================================================================
// LOCAL RECOMMENDATIONS
// ============================================================================

adminRoutes.get("/recommendations", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const recommendations = await db.query.localRecommendations.findMany({
      where: eq(localRecommendations.hotelId, hotelId),
      orderBy: (localRecommendations, { asc }) => [asc(localRecommendations.sortOrder)],
    });

    return c.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return c.json({ error: "Failed to fetch recommendations" }, 500);
  }
});

adminRoutes.post("/recommendations", async (c) => {
  const data = await c.req.json();

  try {
    const [recommendation] = await db
      .insert(localRecommendations)
      .values(data)
      .returning();
    return c.json(recommendation, 201);
  } catch (error) {
    console.error("Error creating recommendation:", error);
    return c.json({ error: "Failed to create recommendation" }, 500);
  }
});

adminRoutes.patch("/recommendations/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  try {
    const [updated] = await db
      .update(localRecommendations)
      .set(updates)
      .where(eq(localRecommendations.id, id))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error("Error updating recommendation:", error);
    return c.json({ error: "Failed to update recommendation" }, 500);
  }
});

adminRoutes.delete("/recommendations/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(localRecommendations).where(eq(localRecommendations.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    return c.json({ error: "Failed to delete recommendation" }, 500);
  }
});

// ============================================================================
// STAFF INVITATIONS
// ============================================================================

adminRoutes.post("/invitations", async (c) => {
  const { hotelId, email, role, invitedBy } = await c.req.json();

  try {
    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db
      .insert(staffInvitations)
      .values({
        hotelId,
        email,
        role,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();

    // TODO: Send invitation email via Resend

    return c.json(invitation, 201);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return c.json({ error: "Failed to create invitation" }, 500);
  }
});

adminRoutes.get("/invitations", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const invitations = await db.query.staffInvitations.findMany({
      where: eq(staffInvitations.hotelId, hotelId),
    });

    return c.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return c.json({ error: "Failed to fetch invitations" }, 500);
  }
});

adminRoutes.delete("/invitations/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(staffInvitations).where(eq(staffInvitations.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return c.json({ error: "Failed to delete invitation" }, 500);
  }
});

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

// Get staff members for a hotel
adminRoutes.get("/staff", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const staff = await db.query.userRoles.findMany({
      where: eq(userRoles.hotelId, hotelId),
      with: {
        user: true,
      },
    });

    // Transform to expected format (snake_case for frontend)
    return c.json(
      staff.map((s) => ({
        id: s.id,
        user_id: s.userId,
        role: s.role,
        created_at: s.createdAt,
        profile: s.user
          ? {
              email: s.user.email,
              display_name: s.user.name,
              avatar_url: null,
            }
          : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching staff:", error);
    return c.json({ error: "Failed to fetch staff" }, 500);
  }
});

// Delete staff role
adminRoutes.delete("/staff/:roleId", async (c) => {
  const roleId = c.req.param("roleId");

  try {
    await db.delete(userRoles).where(eq(userRoles.id, roleId));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff role:", error);
    return c.json({ error: "Failed to delete staff role" }, 500);
  }
});

// Helper to transform invitation to snake_case
const transformInvitation = (inv: any) => ({
  id: inv.id,
  email: inv.email,
  role: inv.role,
  token: inv.token,
  accepted_at: inv.acceptedAt,
  expires_at: inv.expiresAt,
  created_at: inv.createdAt,
});

// Staff invitations routes (alternative paths used by frontend)
adminRoutes.get("/staff/invitations", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const invitations = await db.query.staffInvitations.findMany({
      where: eq(staffInvitations.hotelId, hotelId),
    });

    return c.json(invitations.map(transformInvitation));
  } catch (error) {
    console.error("Error fetching staff invitations:", error);
    return c.json({ error: "Failed to fetch invitations" }, 500);
  }
});

adminRoutes.post("/staff/invitations", async (c) => {
  const { hotelId, email, role, invitedBy } = await c.req.json();

  try {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invitation] = await db
      .insert(staffInvitations)
      .values({
        hotelId,
        email,
        role,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();

    return c.json(transformInvitation(invitation), 201);
  } catch (error) {
    console.error("Error creating staff invitation:", error);
    return c.json({ error: "Failed to create invitation" }, 500);
  }
});

adminRoutes.delete("/staff/invitations/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(staffInvitations).where(eq(staffInvitations.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff invitation:", error);
    return c.json({ error: "Failed to delete invitation" }, 500);
  }
});
