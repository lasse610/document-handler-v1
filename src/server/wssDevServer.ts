import { createTRPCContext } from "./api/trpc";
import { appRouter } from "./api/root";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { Server } from "ws";
import express from "express";
import { webhookRouter } from "./webhookHandler";

// create Express app
const app = express();
app.use(express.json());
app.use("/api", webhookRouter);
const server = app.listen(3002, () => {
  console.log("✅ Express Server listening on http://localhost:3002");
});

// WSS Server
const wss = new Server({
  port: 3001,
});
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createTRPCContext,
});

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});
console.log("✅ WebSocket Server listening on ws://localhost:3001");

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
  server.close();
});
