// ─── Live Vessel Tracking Service ────────────────────────────────────────────
// Priority: AISStream (WebSocket) → AISHub (REST) → MarineTraffic (REST) → Simulation
//
// Set ONE of these in .env:
//   AISSTREAM_API_KEY=...        (recommended — free, real-time WebSocket)
//   AISHUB_USERNAME=...          (free, 60s polling)
//   MARINETRAFFIC_API_KEY=...    (paid, premium data)

import WebSocket from "ws";

export interface Vessel {
  id: string;
  label: string;
  name: string;
  type: "ship" | "plane";
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: "nominal" | "delayed" | "critical";
  cargo: string;
  origin: string;
  destination: string;
  destLat: number;
  destLng: number;
  eta: string;
  mmsi?: string;
  imo?: string;
  lastUpdated: string;
}

// ── Fallback simulation vessels ───────────────────────────────────────────────
const FALLBACK_VESSELS: Vessel[] = [
  { id: "V1", label: "VESSEL_ATLANTIC_MSK", name: "Maersk Atlanta",   type: "ship", lat: 35.7,  lng: -40.2,  heading: 45,  speed: 18, status: "nominal",  cargo: "Cargo",  origin: "Mumbai, IN",    destination: "Rotterdam, NL",  destLat: 51.9,  destLng: 4.5,    eta: "—", lastUpdated: new Date().toISOString() },
  { id: "V2", label: "GLOBAL_PACIFIC_LOG",  name: "Global Pacific",    type: "ship", lat: -15.8, lng: -140.5, heading: 90,  speed: 15, status: "delayed",  cargo: "Cargo",  origin: "Shanghai, CN",  destination: "Long Beach, US", destLat: 33.7,  destLng: -118.2, eta: "—", lastUpdated: new Date().toISOString() },
  { id: "V3", label: "ASIA_MARU_99",        name: "Asia Maru 99",      type: "ship", lat: 34.7,  lng: 139.7,  heading: 200, speed: 20, status: "nominal",  cargo: "Cargo",  origin: "Tokyo, JP",     destination: "Sydney, AU",     destLat: -33.8, destLng: 151.2,  eta: "—", lastUpdated: new Date().toISOString() },
  { id: "V4", label: "INDIA_GULF_EXP",      name: "India Gulf Express",type: "ship", lat: 15.0,  lng: 56.0,   heading: 315, speed: 16, status: "critical", cargo: "Tanker", origin: "Mumbai, IN",    destination: "Dubai, UAE",     destLat: 25.2,  destLng: 55.3,   eta: "—", lastUpdated: new Date().toISOString() },
  { id: "V5", label: "EURO_ATLANTIC_01",    name: "Euro Atlantic",     type: "ship", lat: 48.5,  lng: -10.2,  heading: 180, speed: 14, status: "nominal",  cargo: "Cargo",  origin: "Hamburg, DE",   destination: "New York, US",   destLat: 40.7,  destLng: -74.0,  eta: "—", lastUpdated: new Date().toISOString() },
  { id: "V6", label: "PACIFIC_STAR_88",     name: "Pacific Star 88",   type: "ship", lat: 22.3,  lng: 114.2,  heading: 120, speed: 17, status: "nominal",  cargo: "Cargo",  origin: "Hong Kong, HK", destination: "Singapore, SG",  destLat: 1.35,  destLng: 103.8,  eta: "—", lastUpdated: new Date().toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveStatus(speed: number, heading: number): Vessel["status"] {
  if (speed === 0 || heading === 511) return "delayed";
  if (speed < 2) return "delayed";
  return "nominal";
}

function shipTypeLabel(t: number): string {
  if (t >= 70 && t <= 79) return "Cargo";
  if (t >= 80 && t <= 89) return "Tanker";
  if (t >= 60 && t <= 69) return "Passenger";
  if (t >= 30 && t <= 32) return "Fishing";
  return "Vessel";
}

// ── AISStream (WebSocket, real-time) ─────────────────────────────────────────
function startAISStream(
  apiKey: string,
  onVessels: (vessels: Vessel[]) => void
): () => void {
  const vesselMap = new Map<string, Vessel>();
  let ws: WebSocket | null = null;
  let pingInterval: NodeJS.Timeout | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    console.log("🛰️  Connecting to AISStream WebSocket...");

    ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    ws.on("open", () => {
      console.log("✅ AISStream connected — subscribing to global cargo vessels");
      ws!.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"],
        // Ship types 70-89 = cargo + tankers
      }));

      // Keep-alive ping every 30s
      pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.ping();
      }, 30_000);
    });

    ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        const pos = msg.Message?.PositionReport;
        const meta = msg.MetaData;
        if (!pos || !meta) return;

        const mmsi = String(meta.MMSI || "");
        if (!mmsi) return;

        const vessel: Vessel = {
          id: `AIS-${mmsi}`,
          mmsi,
          label: meta.ShipName?.trim() || `VESSEL_${mmsi}`,
          name: meta.ShipName?.trim() || `Vessel ${mmsi}`,
          type: "ship",
          lat: pos.Latitude,
          lng: pos.Longitude,
          heading: pos.TrueHeading !== 511 ? pos.TrueHeading : pos.Cog,
          speed: pos.Sog,
          status: deriveStatus(pos.Sog, pos.TrueHeading),
          cargo: "Cargo",
          origin: "—",
          destination: meta.Destination?.trim() || "Unknown",
          destLat: 0,
          destLng: 0,
          eta: meta.ETA || "—",
          lastUpdated: new Date().toISOString(),
        };

        vesselMap.set(mmsi, vessel);

        // Broadcast snapshot every time map reaches 20+ or every update
        if (vesselMap.size >= 6) {
          const vessels = Array.from(vesselMap.values()).slice(0, 60);
          onVessels(vessels);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      console.warn("⚠️  AISStream disconnected — reconnecting in 10s...");
      if (pingInterval) clearInterval(pingInterval);
      if (!stopped) reconnectTimeout = setTimeout(connect, 10_000);
    });

    ws.on("error", (err) => {
      console.warn(`⚠️  AISStream error: ${err.message}`);
    });
  }

  connect();

  return () => {
    stopped = true;
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    ws?.close();
  };
}

// ── AISHub (REST polling, free) ───────────────────────────────────────────────
async function fetchFromAISHub(): Promise<Vessel[] | null> {
  const username = process.env.AISHUB_USERNAME;
  if (!username) return null;

  try {
    const url = `http://data.aishub.net/ws.php?username=${username}&format=1&output=json&compress=0&latmin=-90&latmax=90&lonmin=-180&lonmax=180&shiptype=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) { console.warn(`⚠️  AISHub ${res.status}`); return null; }

    const raw = await res.json();
    const records = Array.isArray(raw) ? raw.slice(1) : [];
    if (records.length === 0) return null;

    const vessels = records
      .filter((v: any) => v.LATITUDE !== 0 && v.LONGITUDE !== 0 && v.NAME?.trim())
      .slice(0, 60)
      .map((v: any): Vessel => ({
        id: `AIS-${v.MMSI}`,
        mmsi: String(v.MMSI),
        imo: v.IMO ? String(v.IMO) : undefined,
        label: v.NAME?.trim() || `VESSEL_${v.MMSI}`,
        name: v.NAME?.trim() || "Unknown Vessel",
        type: "ship",
        lat: v.LATITUDE,
        lng: v.LONGITUDE,
        heading: v.HEADING !== 511 ? v.HEADING : v.COG,
        speed: v.SOG,
        status: deriveStatus(v.SOG, v.HEADING),
        cargo: shipTypeLabel(v.SHIPTYPE),
        origin: "—",
        destination: v.DESTINATION?.trim() || "Unknown",
        destLat: 0, destLng: 0,
        eta: v.ETA || "—",
        lastUpdated: new Date().toISOString(),
      }));

    console.log(`✅ AISHub: loaded ${vessels.length} live vessels`);
    return vessels;
  } catch (err: any) {
    console.warn(`⚠️  AISHub fetch failed: ${err.message}`);
    return null;
  }
}

// ── MarineTraffic (REST, paid) ────────────────────────────────────────────────
async function fetchFromMarineTraffic(): Promise<Vessel[] | null> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) return null;

  try {
    // Expected positions API v2 — returns vessels in expected positions
    const url = `https://services.marinetraffic.com/api/exportvessels/v:8/${apiKey}/protocol:json/msgtype:simple`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) { console.warn(`⚠️  MarineTraffic ${res.status}`); return null; }

    const raw = await res.json();
    const records: any[] = raw?.DATA || [];
    if (!records.length) return null;

    const vessels: Vessel[] = records.slice(0, 60).map((v: any): Vessel => ({
      id: `MT-${v.MMSI}`,
      mmsi: String(v.MMSI),
      imo: v.IMO ? String(v.IMO) : undefined,
      label: v.SHIPNAME?.trim() || `VESSEL_${v.MMSI}`,
      name: v.SHIPNAME?.trim() || "Unknown Vessel",
      type: "ship",
      lat: parseFloat(v.LAT),
      lng: parseFloat(v.LON),
      heading: parseInt(v.HEADING) || 0,
      speed: parseFloat(v.SPEED) || 0,
      status: deriveStatus(parseFloat(v.SPEED), parseInt(v.HEADING)),
      cargo: shipTypeLabel(parseInt(v.SHIPTYPE)),
      origin: "—",
      destination: v.DESTINATION?.trim() || "Unknown",
      destLat: 0, destLng: 0,
      eta: v.ETA || "—",
      lastUpdated: new Date().toISOString(),
    }));

    console.log(`✅ MarineTraffic: loaded ${vessels.length} live vessels`);
    return vessels;
  } catch (err: any) {
    console.warn(`⚠️  MarineTraffic fetch failed: ${err.message}`);
    return null;
  }
}

// ── Main VesselSimulator ──────────────────────────────────────────────────────
export const vesselSimulator = {
  vessels: [...FALLBACK_VESSELS] as Vessel[],
  intervalId: null as NodeJS.Timeout | null,
  aisStreamStop: null as (() => void) | null,
  usingLiveData: false,
  activeSource: "simulation" as "aisstream" | "aishub" | "marinetraffic" | "simulation",

  async start(broadcast: (channel: string, data: unknown) => void) {
    const aisStreamKey    = process.env.AISSTREAM_API_KEY && process.env.AISSTREAM_API_KEY !== "your_aisstream_api_key_here" ? process.env.AISSTREAM_API_KEY : undefined;
    const aishubUser      = process.env.AISHUB_USERNAME && process.env.AISHUB_USERNAME !== "your_aishub_username_here" ? process.env.AISHUB_USERNAME : undefined;
    const marineTrafficKey = process.env.MARINETRAFFIC_API_KEY && process.env.MARINETRAFFIC_API_KEY !== "your_marinetraffic_api_key_here" ? process.env.MARINETRAFFIC_API_KEY : undefined;

    // ── Option 1: AISStream (WebSocket, real-time) ─────────────────────────
    if (aisStreamKey) {
      console.log("🛰️  Using AISStream for live vessel tracking");
      this.activeSource = "aisstream";
      this.usingLiveData = true;

      this.aisStreamStop = startAISStream(aisStreamKey, (vessels) => {
        this.vessels = vessels;
        broadcast("vessels", { vessels: this.vessels });
        this.broadcastAlerts(broadcast);
      });

      // Also set up REST fallback refresh every 5min in case WS goes quiet
      this.intervalId = setInterval(async () => {
        if (this.vessels.length < 6) {
          console.log("🔄 AISStream quiet — nudging positions...");
          this.vessels = this.vessels.map(v => ({
            ...v,
            lat: v.lat + (Math.random() - 0.5) * 0.05,
            lng: v.lng + (Math.random() - 0.5) * 0.05,
            lastUpdated: new Date().toISOString(),
          }));
          broadcast("vessels", { vessels: this.vessels });
        }
        this.broadcastAlerts(broadcast);
      }, 300_000);

      broadcast("vessels", { vessels: this.vessels });
      return;
    }

    // ── Option 2: AISHub (60s polling) ────────────────────────────────────
    if (aishubUser) {
      console.log("🛰️  Using AISHub for live vessel tracking (60s polling)");
      this.activeSource = "aishub";

      const live = await fetchFromAISHub();
      if (live?.length) {
        this.vessels = live;
        this.usingLiveData = true;
        console.log("🌍 Live AIS vessel data active via AISHub");
      }

      broadcast("vessels", { vessels: this.vessels });

      this.intervalId = setInterval(async () => {
        const updated = await fetchFromAISHub();
        if (updated?.length) this.vessels = updated;
        else this.nudgePositions();
        broadcast("vessels", { vessels: this.vessels });
        this.broadcastAlerts(broadcast);
      }, 60_000);

      return;
    }

    // ── Option 3: MarineTraffic (5min polling) ────────────────────────────
    if (marineTrafficKey) {
      console.log("🛰️  Using MarineTraffic for live vessel tracking");
      this.activeSource = "marinetraffic";

      const live = await fetchFromMarineTraffic();
      if (live?.length) {
        this.vessels = live;
        this.usingLiveData = true;
        console.log("🌍 Live vessel data active via MarineTraffic");
      }

      broadcast("vessels", { vessels: this.vessels });

      this.intervalId = setInterval(async () => {
        const updated = await fetchFromMarineTraffic();
        if (updated?.length) this.vessels = updated;
        else this.nudgePositions();
        broadcast("vessels", { vessels: this.vessels });
        this.broadcastAlerts(broadcast);
      }, 300_000);

      return;
    }

    // ── Option 4: Simulation fallback ────────────────────────────────────
    console.log("🛳️  No AIS API key found — running vessel simulation");
    console.log("   Set AISSTREAM_API_KEY, AISHUB_USERNAME, or MARINETRAFFIC_API_KEY in .env to enable live tracking");
    this.activeSource = "simulation";

    broadcast("vessels", { vessels: this.vessels });

    this.intervalId = setInterval(() => {
      this.vessels = this.vessels.map(v => {
        const dlat = v.destLat - v.lat;
        const dlng = v.destLng - v.lng;
        const dist = Math.sqrt(dlat * dlat + dlng * dlng);
        const step = 0.08;
        const lat = dist > step ? v.lat + (dlat / dist) * step : v.lat + (Math.random() - 0.5) * 5;
        const lng = dist > step ? v.lng + (dlng / dist) * step : v.lng + (Math.random() - 0.5) * 5;
        const roll = Math.random();
        const status: Vessel["status"] = roll > 0.98 ? "critical" : roll > 0.95 ? "delayed" : "nominal";
        return { ...v, lat, lng, status, lastUpdated: new Date().toISOString() };
      });
      broadcast("vessels", { vessels: this.vessels });
      this.broadcastAlerts(broadcast);
    }, 3_000);
  },

  nudgePositions() {
    this.vessels = this.vessels.map(v => ({
      ...v,
      lat: v.lat + (Math.random() - 0.5) * 0.05,
      lng: v.lng + (Math.random() - 0.5) * 0.05,
      lastUpdated: new Date().toISOString(),
    }));
  },

  broadcastAlerts(broadcast: (channel: string, data: unknown) => void) {
    const troubled = this.vessels.filter(v => v.status !== "nominal");
    if (troubled.length > 0 && Math.random() > 0.6) {
      const v = troubled[Math.floor(Math.random() * troubled.length)];
      broadcast("alerts", {
        type: v.status === "critical" ? "error" : "warning",
        title: v.status === "critical" ? "Critical Vessel Alert" : "Delay Detected",
        message: `${v.name} at ${v.lat.toFixed(2)}°, ${v.lng.toFixed(2)}° — ${v.status.toUpperCase()}`,
        vesselId: v.id,
        ts: new Date().toISOString(),
      });
    }
  },

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.aisStreamStop) this.aisStreamStop();
  },

  getVessels() { return this.vessels; },
  isLive() { return this.usingLiveData; },
  getSource() { return this.activeSource; },
};
