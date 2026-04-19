import type { Express } from "express";
import type { Server } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string) {
  console.log(`[server] ${message}`);
}

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

export function serveStatic(app: Express) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const distPath = path.resolve(__dirname, "../client/dist");

  if (fs.existsSync(distPath)) {
    const { default: express } = require("express");
    app.use(express.static(distPath));
  }
}
