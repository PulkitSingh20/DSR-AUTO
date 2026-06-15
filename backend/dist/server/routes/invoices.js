// ─── Invoice Routes ──────────────────────────────────────────────────────────
import { Router } from "express";
import { invoiceRepo } from "../database/repositories.js";
import { getAuth } from "@clerk/express";
export const invoiceRoutes = Router();
// GET /api/invoices
invoiceRoutes.get("/", async (req, res) => {
    const { status, type, search } = req.query;
    const invoices = await invoiceRepo.getAll({ status, type, search });
    res.json({ invoices, count: invoices.length });
});
// GET /api/invoices/stats
invoiceRoutes.get("/stats", async (_req, res) => {
    res.json(await invoiceRepo.getStats());
});
// GET /api/invoices/:id
invoiceRoutes.get("/:id", async (req, res) => {
    const invoice = await invoiceRepo.getById(req.params.id);
    if (!invoice)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(invoice);
});
// GET /api/invoices/shipment/:shipmentId
invoiceRoutes.get("/shipment/:shipmentId", async (req, res) => {
    const invoices = await invoiceRepo.getByShipment(req.params.shipmentId);
    res.json({ invoices });
});
// POST /api/invoices
invoiceRoutes.post("/", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const invoice = await invoiceRepo.create(req.body, userId);
    res.status(201).json(invoice);
});
// PATCH /api/invoices/:id
invoiceRoutes.patch("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const updated = await invoiceRepo.update(req.params.id, req.body, userId);
    if (!updated)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
});
// DELETE /api/invoices/:id
invoiceRoutes.delete("/:id", async (req, res) => {
    const userId = getAuth(req)?.userId || "api";
    const deleted = await invoiceRepo.delete(req.params.id, userId);
    if (!deleted)
        return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ ok: true });
});
