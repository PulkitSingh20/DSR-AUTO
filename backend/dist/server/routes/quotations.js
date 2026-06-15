// ─── Quotation Routes ────────────────────────────────────────────────────────
import { Router } from "express";
import { quotationRepo } from "../database/repositories.js";
import { getAuth } from "@clerk/express";
export const quotationRoutes = Router();
// GET /api/quotations
quotationRoutes.get("/", async (req, res) => {
    const { status, customer_id } = req.query;
    const quotations = await quotationRepo.getAll({ status, customerId: customer_id });
    res.json({ quotations, count: quotations.length });
});
// GET /api/quotations/:id
quotationRoutes.get("/:id", async (req, res) => {
    const quotation = await quotationRepo.getById(req.params.id);
    if (!quotation)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(quotation);
});
// GET /api/quotations/shipment/:shipmentId
quotationRoutes.get("/shipment/:shipmentId", async (req, res) => {
    const quotations = await quotationRepo.getByShipment(req.params.shipmentId);
    res.json({ quotations });
});
// POST /api/quotations
quotationRoutes.post("/", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const quotation = await quotationRepo.create(req.body, userId);
    res.status(201).json(quotation);
});
// PATCH /api/quotations/:id
quotationRoutes.patch("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const updated = await quotationRepo.update(req.params.id, req.body, userId);
    if (!updated)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
});
// DELETE /api/quotations/:id
quotationRoutes.delete("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const deleted = await quotationRepo.delete(req.params.id, userId);
    if (!deleted)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ ok: true });
});
