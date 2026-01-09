import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

// Import routes
import { authRoutes, customAuthRoutes } from "./routes/auth";
import { servicesRoutes } from "./routes/services";
import { chatRoutes } from "./routes/chat";
import { menuRoutes } from "./routes/menu";
import { adminRoutes } from "./routes/admin";

const app = new Hono();
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: isProduction
      ? [process.env.BETTER_AUTH_URL || ""]
      : ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:5173"],
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

// Serve static files in production
if (isProduction) {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

// Start server with Bun
const port = Number(process.env.PORT) || 3001;

console.log(`🥟 Server running with Bun at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
