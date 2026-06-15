// ─── Shipment Routes — now backed by SQLite via repositories ─────────────────
import { Router } from "express";
import { shipmentRepo, trackingRepo } from "../database/repositories.js";
import { getAuth } from "@clerk/express";
import { transitionShipment, getNextStageAfterBooking, getShipmentTimeline, getStageInfo, SHIPMENT_STAGES, } from "../services/stateEngine.js";
export const shipmentRoutes = Router();
// GET /api/shipments
shipmentRoutes.get("/", async (req, res) => {
    const { status, type, search } = req.query;
    const shipments = await shipmentRepo.getAll({ status, type, search });
    res.json({ shipments, count: shipments.length });
});
// GET /api/shipments/stats
shipmentRoutes.get("/stats", async (_req, res) => {
    res.json(await shipmentRepo.getStats());
});
// GET /api/shipments/stages/list — expose all 20 stages to the frontend
shipmentRoutes.get("/stages/list", (_req, res) => {
    const stages = SHIPMENT_STAGES.map((stage, idx) => ({
        id: stage,
        label: stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        index: idx,
        info: getStageInfo(stage),
    }));
    res.json({ stages, total: stages.length });
});
// GET /api/shipments/:id
shipmentRoutes.get("/:id", async (req, res) => {
    const shipment = await shipmentRepo.getById(req.params.id);
    if (!shipment)
        return res.status(404).json({ error: "NOT_FOUND" });
    const tracking = await trackingRepo.getByShipment(req.params.id);
    const stageInfo = getStageInfo(shipment.status);
    res.json({ ...shipment, trackingHistory: tracking, stageInfo });
});
// GET /api/shipments/:id/timeline — visual timeline of all 20 stages
shipmentRoutes.get("/:id/timeline", async (req, res) => {
    const timeline = await getShipmentTimeline(req.params.id);
    if (!timeline)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ timeline });
});
// POST /api/shipments
shipmentRoutes.post("/", async (req, res) => {
    const userId = getAuth(req)?.userId || req.keyData?.owner || "api";
    // Default status to the first stage
    const data = { ...req.body, status: req.body.status || "inquiry_received" };
    const shipment = await shipmentRepo.create(data, userId);
    res.status(201).json(shipment);
});
// PATCH /api/shipments/:id
shipmentRoutes.patch("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const updated = await shipmentRepo.update(req.params.id, req.body, userId);
    if (!updated)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
});
// POST /api/shipments/:id/transition — validated stage transition
shipmentRoutes.post("/:id/transition", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const { target_stage } = req.body;
    if (!target_stage) {
        return res.status(400).json({ error: "target_stage is required" });
    }
    // Auto-detect KYC branching at booking_confirmed
    let resolvedStage = target_stage;
    if (target_stage === "auto_after_booking") {
        const shipment = await shipmentRepo.getById(req.params.id);
        if (!shipment)
            return res.status(404).json({ error: "NOT_FOUND" });
        resolvedStage = await getNextStageAfterBooking(shipment.customer_id);
    }
    const result = await transitionShipment(req.params.id, resolvedStage, userId);
    if (!result.success) {
        return res.status(400).json({ error: result.error, ...result });
    }
    const updated = await shipmentRepo.getById(req.params.id);
    res.json({ ...result, shipment: updated });
});
// PATCH /api/shipments/:id/status (legacy — still works, but prefer /transition)
shipmentRoutes.patch("/:id/status", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const { status } = req.body;
    if (!status)
        return res.status(400).json({ error: "status required" });
    const updated = await shipmentRepo.update(req.params.id, { status }, userId);
    if (!updated)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
});
// DELETE /api/shipments/:id
shipmentRoutes.delete("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const deleted = await shipmentRepo.delete(req.params.id, userId);
    if (!deleted)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ ok: true });
});
// POST /api/shipments/:id/tracking
shipmentRoutes.post("/:id/tracking", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const id = await trackingRepo.addEvent(req.params.id, req.body, userId);
    res.status(201).json({ id });
});
