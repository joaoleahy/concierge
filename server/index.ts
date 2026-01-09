import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import routes
import { authRoutes, customAuthRoutes } from "./routes/auth";
import { servicesRoutes } from "./routes/services";
import { chatRoutes } from "./routes/chat";
import { menuRoutes } from "./routes/menu";
import { adminRoutes } from "./routes/admin";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// API Routes
app.route("/api/auth", authRoutes); // Better Auth routes
app.route("/api/custom-auth", customAuthRoutes); // Custom auth (roles, verify-pin)
app.route("/api/services", servicesRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/menu", menuRoutes);
app.route("/api/admin", adminRoutes);

// Start server
const port = Number(process.env.PORT) || 3001;

console.log(`Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
