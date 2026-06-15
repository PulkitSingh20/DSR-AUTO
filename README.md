# ZIP-A-WORLD — Logistics Intelligence Platform

Real-time global shipment monitoring, live vessel tracking on a 3D globe, email automation, and API-key-secured backend.

## Quick Start

```bash
npm install
cp .env.example .env      # defaults work for local dev
npm run dev:all           # frontend :3000 + backend :4000
```

## Architecture

```
server/
  index.ts              WebSocket server + Express app
  middleware/
    auth.ts             API key validation on every protected route
    rateLimiter.ts      120 req/min per key (in-memory)
  routes/
    shipments.ts        CRUD REST API for shipments
    tracking.ts         Live vessel + BL/container tracking
    email.ts            Send, monitor, templates (delivery + open tracking)
    apikeys.ts          Generate / revoke / list API keys (admin)
    analytics.ts        KPI overview, volume, carrier performance
  services/
    apiKeyStore.ts      Key store (swap for Redis/DB in production)
    shipmentStore.ts    Shipment store (swap for PostgreSQL in production)
    vesselSimulator.ts  Realistic vessel movement engine (swap for AISStream)
    emailMonitor.ts     Email queue + simulated delivery/open tracking

src/
  hooks/
    useWebSocket.ts     Auto-reconnect WebSocket hook (channels: vessels, alerts, etc.)
    useDrag.ts          Smooth inertia drag + touch + wheel for kanban pipeline
  services/
    api.ts              Typed fetch client for all backend endpoints
  components/           All React UI components (unchanged structure)
```

## API Endpoints (all require X-Api-Key header)

```
GET  /health

# Shipments
GET    /api/shipments          ?status= ?type= ?search= ?limit= ?offset=
GET    /api/shipments/stats
GET    /api/shipments/:id
POST   /api/shipments
PATCH  /api/shipments/:id
PATCH  /api/shipments/:id/status
DELETE /api/shipments/:id

# Live Tracking
GET  /api/tracking/vessels
GET  /api/tracking/vessels/:id
GET  /api/tracking/shipments/:shipmentId
POST /api/tracking/track          { blNumber?, containerNumber?, mawb? }

# Email
GET  /api/email/history
GET  /api/email/stats
GET  /api/email/templates
POST /api/email/send             { to, subject, body, shipmentId?, type? }
POST /api/email/send-bulk        { recipients[], template, shipmentId? }

# Analytics
GET  /api/analytics/overview
GET  /api/analytics/shipment-volume
GET  /api/analytics/performance
GET  /api/analytics/cargo-distribution
GET  /api/analytics/pipeline-summary

# API Key Management (admin key required)
GET    /api/auth/verify
GET    /api/auth/usage
GET    /api/auth/keys
POST   /api/auth/keys            { name, owner, permissions[], expiresInDays? }
DELETE /api/auth/keys/:id
```

## WebSocket Channels

Connect: `ws://localhost:4000/ws`

Subscribe: `{ "type": "subscribe", "channel": "vessels" }`

| Channel | Data |
|---|---|
| vessels | `{ vessels: Vessel[] }` every 3 seconds |
| alerts | `{ type, title, message, vesselId, ts }` |
| shipment_update | `{ type: created/updated/status_change/deleted, shipment }` |
| email_update | `{ emailId, status, to, openedAt? }` |

## Default Keys

| Key | Permissions |
|---|---|
| `zaw_live_default_master_key_2024` | All operations |
| `zaw_admin_9x82hf_secret` | Admin + key management |

Change both before deploying to production.

## Production Swap Guide

| Service | Dev | Production |
|---|---|---|
| Shipment DB | In-memory | PostgreSQL + Prisma |
| Key store | In-memory | Redis |
| Email | Simulated | SendGrid/Mailgun/SMTP |
| Vessel positions | Simulator | AISStream.io / MarineTraffic |
| Carrier tracking | Mock milestones | Maersk / DHL / FedEx APIs |
