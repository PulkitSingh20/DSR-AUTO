import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { shipmentRoutes } from "./routes/shipments.js";
import { trackingRoutes } from "./routes/tracking.js";
import { emailRoutes } from "./routes/email.js";
import { apiKeyRoutes } from "./routes/apikeys.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { dbAdminRoutes } from "./routes/db-admin.js";
import { customerRoutes } from "./routes/customers.js";
import { quotationRoutes } from "./routes/quotations.js";
import { invoiceRoutes } from "./routes/invoices.js";
import { dsrRoutes } from "./routes/dsr.js";
import { requireAuth } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { vesselSimulator } from "./services/vesselSimulator.js";
import { emailMonitor } from "./services/emailMonitor.js";
// Initialize database on startup
import { connectDB } from "./database/mongooseConnection.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;
// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: "/ws" });
// Connected clients map: clientId -> { ws, subscriptions }
const clients = new Map();
export function broadcast(channel, data) {
    const message = JSON.stringify({ channel, data, ts: Date.now() });
    clients.forEach(({ ws, subscriptions }) => {
        if (subscriptions.has(channel) && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}
wss.on("connection", (ws) => {
    const clientId = Math.random().toString(36).slice(2);
    clients.set(clientId, { ws, subscriptions: new Set(["vessels", "alerts"]) });
    ws.send(JSON.stringify({
        channel: "system",
        data: { type: "connected", clientId, message: "ZIP-A-WORLD real-time stream active" },
        ts: Date.now()
    }));
    ws.on("message", (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            const client = clients.get(clientId);
            if (!client)
                return;
            if (msg.type === "subscribe" && msg.channel) {
                client.subscriptions.add(msg.channel);
                ws.send(JSON.stringify({ channel: "system", data: { type: "subscribed", channel: msg.channel }, ts: Date.now() }));
            }
            if (msg.type === "unsubscribe" && msg.channel) {
                client.subscriptions.delete(msg.channel);
            }
            if (msg.type === "ping") {
                ws.send(JSON.stringify({ channel: "system", data: { type: "pong" }, ts: Date.now() }));
            }
        }
        catch {
            // ignore malformed messages
        }
    });
    ws.on("close", () => clients.delete(clientId));
    ws.on("error", () => clients.delete(clientId));
});
// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow any localhost port (dev) or configured FRONTEND_URL
        const allowed = process.env.FRONTEND_URL || "http://localhost:3000";
        if (!origin || origin.startsWith("http://localhost") || origin === allowed) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Rate limiting on all API routes
app.use("/api", rateLimiter);
// Health check (public)
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        wsClients: clients.size,
        version: "1.0.0"
    });
});
// Database status endpoint (used by DatabaseStatus component)
app.get("/api/db-status", (_req, res) => {
    res.json({
        status: "connected",
        version: "SQLite 3 (better-sqlite3)",
        database: "zip-a-world.db"
    });
});
// Public routes
app.use("/api/auth", apiKeyRoutes);
// Protected routes (require valid Clerk session OR API key)
app.use("/api/shipments", requireAuth, shipmentRoutes);
app.use("/api/tracking", requireAuth, trackingRoutes);
app.use("/api/email", requireAuth, emailRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/db-admin", requireAuth, dbAdminRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/quotations", requireAuth, quotationRoutes);
app.use("/api/invoices", requireAuth, invoiceRoutes);
app.use("/api/dsr", requireAuth, dsrRoutes);
// Start background services
vesselSimulator.start(broadcast); // async — fetches AISHub on first run
emailMonitor.start(broadcast);
// Connect to MongoDB
connectDB();
server.listen(PORT, () => {
    console.log(`\n🚀 ZIP-A-WORLD Backend running on port ${PORT}`);
    console.log(`📡 WebSocket ready at ws://localhost:${PORT}/ws`);
    console.log(`🔑 API key validation active`);
    console.log(`📧 Email monitoring service active\n`);
});
export default app;
