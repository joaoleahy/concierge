import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
  server: {
    preset: "node-server", // For Render deployment
  },
  routers: {
    client: {
      entry: "./app/client.tsx",
    },
    ssr: {
      entry: "./app/ssr.tsx",
    },
  },
});
