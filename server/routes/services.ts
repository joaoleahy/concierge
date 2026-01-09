import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { serviceTypes, serviceRequests } from "../db/schema";
import { eq } from "drizzle-orm";

export const servicesRoutes = new Hono();

// Get service types for a hotel
servicesRoutes.get("/types", async (c) => {
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

// Create a service request
const createRequestSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  requestType: z.string(),
  details: z.string().optional(),
  guestLanguage: z.string().default("en"),
});

servicesRoutes.post("/requests", zValidator("json", createRequestSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const [request] = await db
      .insert(serviceRequests)
      .values({
        hotelId: data.hotelId,
        roomId: data.roomId,
        serviceTypeId: data.serviceTypeId,
        requestType: data.requestType,
        details: data.details,
        guestLanguage: data.guestLanguage,
        status: "pending",
      })
      .returning();

    return c.json(request, 201);
  } catch (error) {
    console.error("Error creating service request:", error);
    return c.json({ error: "Failed to create service request" }, 500);
  }
});

// Get requests for a room (guest view)
servicesRoutes.get("/requests", async (c) => {
  const roomId = c.req.query("roomId");
  const hotelId = c.req.query("hotelId");

  if (!roomId && !hotelId) {
    return c.json({ error: "roomId or hotelId is required" }, 400);
  }

  try {
    const requests = await db.query.serviceRequests.findMany({
      where: roomId
        ? eq(serviceRequests.roomId, roomId)
        : eq(serviceRequests.hotelId, hotelId!),
      orderBy: (serviceRequests, { desc }) => [desc(serviceRequests.createdAt)],
    });

    return c.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return c.json({ error: "Failed to fetch requests" }, 500);
  }
});

// Update request status (staff action)
const updateRequestSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled", "declined", "modified"]),
  staffResponse: z.string().optional(),
  resolution: z.string().optional(),
});

servicesRoutes.patch("/requests/:id", zValidator("json", updateRequestSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  try {
    const [updated] = await db
      .update(serviceRequests)
      .set({
        status: data.status,
        staffResponse: data.staffResponse,
        resolution: data.resolution,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Request not found" }, 404);
    }

    return c.json(updated);
  } catch (error) {
    console.error("Error updating request:", error);
    return c.json({ error: "Failed to update request" }, 500);
  }
});

// SSE endpoint for realtime updates
servicesRoutes.get("/stream", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  // Set SSE headers
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  // TODO: Implement proper SSE with database polling or pub/sub
  return c.body("data: {\"type\": \"connected\"}\n\n");
});
