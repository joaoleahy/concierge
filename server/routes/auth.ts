import { Hono } from "hono";
import { auth } from "../lib/auth";
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { rooms, pinAttempts, chatSessions, userRoles, hotels } from "../db/schema";

export const authRoutes = new Hono();

// Better Auth handler - handles all auth routes (/login, /register, /session, etc.)
authRoutes.all("/*", async (c) => {
  return auth.handler(c.req.raw);
});

// Create a separate routes group for custom auth endpoints
export const customAuthRoutes = new Hono();

// Get user's hotel (first hotel they have access to)
customAuthRoutes.get("/user-hotel", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ error: "userId is required" }, 400);
  }

  const roles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  if (roles.length === 0) {
    return c.json(null);
  }

  // Get hotels for these roles
  const hotelIds = roles.map((r) => r.hotelId);
  const hotelsData = await db
    .select()
    .from(hotels)
    .where(inArray(hotels.id, hotelIds));

  const firstRole = roles[0];
  const firstHotel = hotelsData.find((h) => h.id === firstRole.hotelId);

  return c.json({
    hotelId: firstRole.hotelId,
    role: firstRole.role,
    hotel: firstHotel ? {
      id: firstHotel.id,
      name: firstHotel.name,
      city: firstHotel.city,
      country: firstHotel.country,
    } : null,
    allRoles: roles.map((r) => {
      const hotel = hotelsData.find((h) => h.id === r.hotelId);
      return {
        hotel_id: r.hotelId,
        role: r.role,
        hotel: hotel ? {
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
        } : null,
      };
    }),
  });
});

// Get user roles for a specific hotel
customAuthRoutes.get("/roles", async (c) => {
  const userId = c.req.query("userId");
  const hotelId = c.req.query("hotelId");

  if (!userId || !hotelId) {
    return c.json({ error: "userId and hotelId are required" }, 400);
  }

  const roles = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.hotelId, hotelId)));

  const isAdmin = roles.some((r) => r.role === "admin");
  const isStaff = roles.some((r) => r.role === "admin" || r.role === "staff");

  return c.json({ roles, isAdmin, isStaff });
});

// Verify room PIN (guest access)
customAuthRoutes.post("/verify-pin", async (c) => {
  const { roomId, pin } = await c.req.json();

  if (!roomId || !pin) {
    return c.json({ error: "roomId and pin are required" }, 400);
  }

  // Get room
  const room = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (room.length === 0) {
    return c.json({ error: "Room not found" }, 404);
  }

  // Check PIN
  const isValid = room[0].accessPin === pin;

  // Log attempt
  await db.insert(pinAttempts).values({
    roomId,
    ipAddress: c.req.header("x-forwarded-for") || "unknown",
    success: isValid,
  });

  if (!isValid) {
    return c.json({ error: "Invalid PIN" }, 401);
  }

  // Create or update chat session
  const existingSession = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.roomId, roomId))
    .limit(1);

  let sessionId: string;

  if (existingSession.length > 0) {
    sessionId = existingSession[0].id;
    await db
      .update(chatSessions)
      .set({ verifiedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  } else {
    const newSession = await db
      .insert(chatSessions)
      .values({
        roomId,
        hotelId: room[0].hotelId,
        verifiedAt: new Date(),
      })
      .returning();
    sessionId = newSession[0].id;
  }

  return c.json({
    success: true,
    sessionId,
    hotelId: room[0].hotelId,
    roomId: room[0].id,
  });
});
