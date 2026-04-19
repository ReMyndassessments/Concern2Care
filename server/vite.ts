import type { Express } from "express";
import type { Server } from "http";

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const { createServer } = await import("vite");

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
}
