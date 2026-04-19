import type { Express } from "express";
import type { Server } from "http";

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    return; // Vite not needed in production — Vercel serves the frontend
  }

  // Dynamically import Vite only in development
  const { createServer } = await import("vite");
  const { default: viteConfig } = await import("../vite.config.js");

  const vite = await createServer({
    ...viteConfig,
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
}
