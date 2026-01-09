import { Hono } from "hono";
import { db } from "../db";
import { menuCategories, menuItems } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const menuRoutes = new Hono();

// Get all menu categories for a hotel
menuRoutes.get("/categories", async (c) => {
  const hotelId = c.req.query("hotelId");

  if (!hotelId) {
    return c.json({ error: "hotelId is required" }, 400);
  }

  try {
    const categories = await db.query.menuCategories.findMany({
      where: and(
        eq(menuCategories.hotelId, hotelId),
        eq(menuCategories.isActive, true)
      ),
      orderBy: (menuCategories, { asc }) => [asc(menuCategories.sortOrder)],
      with: {
        items: {
          where: eq(menuItems.isAvailable, true),
          orderBy: (menuItems, { asc }) => [asc(menuItems.sortOrder)],
        },
      },
    });

    return c.json(categories);
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return c.json({ error: "Failed to fetch menu" }, 500);
  }
});

// Get menu items for a category
menuRoutes.get("/items", async (c) => {
  const categoryId = c.req.query("categoryId");
  const hotelId = c.req.query("hotelId");

  if (!categoryId && !hotelId) {
    return c.json({ error: "categoryId or hotelId is required" }, 400);
  }

  try {
    const whereClause = categoryId
      ? eq(menuItems.categoryId, categoryId)
      : eq(menuItems.hotelId, hotelId!);

    const items = await db.query.menuItems.findMany({
      where: and(whereClause, eq(menuItems.isAvailable, true)),
      orderBy: (menuItems, { asc }) => [asc(menuItems.sortOrder)],
    });

    return c.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return c.json({ error: "Failed to fetch menu items" }, 500);
  }
});

// Get a single menu item
menuRoutes.get("/items/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
      with: {
        category: true,
      },
    });

    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    return c.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return c.json({ error: "Failed to fetch menu item" }, 500);
  }
});
