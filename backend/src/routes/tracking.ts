import { Router } from "express";
import { vesselSimulator } from "../services/vesselSimulator.js";

export const trackingRoutes = Router();

// GET /api/tracking/vessels — get all live vessel positions
trackingRoutes.get("/vessels", (_req, res) => {
  res.json({
    vessels: vesselSimulator.getVessels(),
    ts: new Date().toISOString(),
    count: vesselSimulator.getVessels().length,
    source: vesselSimulator.isLive() ? vesselSimulator.getSource() : "simulation",
  });
});

// GET /api/tracking/vessels/:id — single vessel
trackingRoutes.get("/vessels/:id", (req, res) => {
  const vessel = vesselSimulator.getVessels().find(v => v.id === req.params.id);
  if (!vessel) return res.status(404).json({ error: "NOT_FOUND", message: "Vessel not found" });
  res.json(vessel);
});

// GET /api/tracking/shipments/:shipmentId — track by shipment ID
trackingRoutes.get("/shipments/:shipmentId", (req, res) => {
  const { shipmentId } = req.params;

  // Find vessel linked to shipment
  const vessel = vesselSimulator.getVessels().find(v => {
    // In production, look up from DB. Here match by rough ID pattern.
    return shipmentId.includes("EID094354") ? v.id === "V1" :
           shipmentId.includes("EID094401") ? v.id === "V2" :
           shipmentId.includes("EID094411") ? v.id === "V4" : false;
  });

  // Build fake route history (last 10 positions)
  const history = Array.from({ length: 10 }, (_, i) => ({
    lat: (vessel?.lat || 20) - i * 0.5,
    lng: (vessel?.lng || 0) + i * 0.5,
    ts: new Date(Date.now() - i * 3600000).toISOString(),
    event: i === 0 ? "Current Position" : i === 5 ? "Passed Waypoint Alpha" : i === 9 ? "Departed Port" : null,
  }));

  res.json({
    shipmentId,
    vessel: vessel || null,
    history,
    trackingActive: !!vessel,
    lastUpdate: new Date().toISOString(),
  });
});

// POST /api/tracking/track — track by BL or container number
trackingRoutes.post("/track", (req, res) => {
  const { blNumber, containerNumber, mawb } = req.body;

  // Simulate external carrier API response
  const result = {
    found: true,
    trackingNumber: blNumber || containerNumber || mawb,
    carrier: "Maersk",
    status: "In Transit",
    location: "North Atlantic Ocean",
    lat: 40 + Math.random() * 10,
    lng: -40 + Math.random() * 10,
    eta: new Date(Date.now() + 5 * 86400000).toISOString(),
    milestones: [
      { event: "Gate Out", location: "Mumbai, IN", ts: new Date(Date.now() - 10 * 86400000).toISOString(), done: true },
      { event: "Vessel Loaded", location: "JNPT Port", ts: new Date(Date.now() - 9 * 86400000).toISOString(), done: true },
      { event: "Departed Origin Port", location: "Mumbai, IN", ts: new Date(Date.now() - 8 * 86400000).toISOString(), done: true },
      { event: "In Transit", location: "Indian Ocean", ts: new Date(Date.now() - 4 * 86400000).toISOString(), done: true },
      { event: "ETA Arrival Destination", location: "Rotterdam, NL", ts: new Date(Date.now() + 5 * 86400000).toISOString(), done: false },
    ],
    ts: new Date().toISOString(),
  };

  res.json(result);
});
