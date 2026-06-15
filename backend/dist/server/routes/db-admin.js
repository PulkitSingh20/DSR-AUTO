// ─── Database Admin API ───────────────────────────────────────────────────────
// Mounted at /api/db-admin — full CRUD for all tables + audit log viewer
import { Router } from "express";
import mongoose from "mongoose";
import { shipmentRepo, auditRepo } from "../database/repositories.js";
export const dbAdminRoutes = Router();
// ─── Database stats overview ─────────────────────────────────────────────────
dbAdminRoutes.get("/stats", async (_req, res) => {
    const models = ["Shipment", "Customer", "TrackingEvent", "Email", "Document", "Reminder", "AuditLog"];
    const stats = {};
    for (const modelName of models) {
        const Model = mongoose.models[modelName];
        if (Model) {
            stats[modelName.toLowerCase()] = await Model.countDocuments();
        }
    }
    // Latest activity
    const ShipmentModel = mongoose.models.Shipment;
    const AuditLogModel = mongoose.models.AuditLog;
    if (ShipmentModel) {
        stats.latest_shipment = await ShipmentModel.findOne().sort({ created_at: -1 }).select("_id shipper created_at").lean();
    }
    if (AuditLogModel) {
        stats.latest_audit = await AuditLogModel.findOne().sort({ occurred_at: -1 }).lean();
    }
    res.json(stats);
});
// ─── Generic table browser ───────────────────────────────────────────────────
dbAdminRoutes.get("/table/:name", async (req, res) => {
    const { name } = req.params;
    // Map snake_case table names to PascalCase Model names
    const modelMap = {
        "shipments": "Shipment",
        "customers": "Customer",
        "tracking_events": "TrackingEvent",
        "emails": "Email",
        "documents": "Document",
        "reminders": "Reminder",
        "audit_log": "AuditLog",
        "api_keys": "ApiKey",
        "invoices": "Invoice",
        "quotations": "Quotation"
    };
    const modelName = modelMap[name];
    if (!modelName || !mongoose.models[modelName]) {
        return res.status(400).json({ error: "Unknown table" });
    }
    const Model = mongoose.models[modelName];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const query = {};
    if (search && ["Shipment", "Customer", "Email"].includes(modelName)) {
        const s = { $regex: search, $options: "i" };
        if (modelName === "Customer")
            query.name = s;
        else if (modelName === "Email")
            query.subject = s;
        else
            query.shipper = s;
    }
    const rows = await Model.find(query).sort({ _id: -1 }).skip(offset).limit(limit).lean();
    const total = await Model.countDocuments(query);
    const columns = Object.keys(Model.schema.paths).filter(p => !p.startsWith("__"));
    res.json({ rows, total, page, limit, pages: Math.ceil(total / limit), columns });
});
// ─── Edit a single row ───────────────────────────────────────────────────────
dbAdminRoutes.patch("/table/:name/:id", async (req, res) => {
    const { name, id } = req.params;
    const modelMap = {
        "shipments": "Shipment", "customers": "Customer", "tracking_events": "TrackingEvent",
        "emails": "Email", "documents": "Document", "reminders": "Reminder",
        "audit_log": "AuditLog", "api_keys": "ApiKey", "invoices": "Invoice", "quotations": "Quotation"
    };
    const modelName = modelMap[name];
    if (!modelName || !mongoose.models[modelName])
        return res.status(400).json({ error: "Unknown table" });
    if (name === "audit_log")
        return res.status(403).json({ error: "Audit log is read-only" });
    const Model = mongoose.models[modelName];
    const data = req.body;
    delete data._id;
    delete data.created_at;
    await Model.findByIdAndUpdate(id, data);
    res.json({ ok: true, message: `Row ${id} in ${name} updated` });
});
// ─── Delete a row ─────────────────────────────────────────────────────────────
dbAdminRoutes.delete("/table/:name/:id", async (req, res) => {
    const { name, id } = req.params;
    const modelMap = {
        "shipments": "Shipment", "customers": "Customer", "tracking_events": "TrackingEvent",
        "emails": "Email", "documents": "Document", "reminders": "Reminder",
        "audit_log": "AuditLog", "api_keys": "ApiKey", "invoices": "Invoice", "quotations": "Quotation"
    };
    const modelName = modelMap[name];
    if (!modelName || !mongoose.models[modelName])
        return res.status(400).json({ error: "Unknown table" });
    if (name === "audit_log")
        return res.status(403).json({ error: "Audit log is read-only" });
    const Model = mongoose.models[modelName];
    await Model.findByIdAndDelete(id);
    res.json({ ok: true, message: `Row ${id} deleted from ${name}` });
});
// ─── Run raw SQL (Disabled for MongoDB) ─────────────────────────────────
dbAdminRoutes.post("/query", (req, res) => {
    res.status(400).json({ error: "Raw SQL queries are not supported in MongoDB." });
});
// ─── Audit log ───────────────────────────────────────────────────────────────
dbAdminRoutes.get("/audit", async (req, res) => {
    const table = req.query.table;
    const limit = parseInt(req.query.limit) || 100;
    res.json(await auditRepo.getAll(table, limit));
});
// ─── Shipment-specific endpoints (used by existing routes) ───────────────────
dbAdminRoutes.get("/shipments/stats", async (_req, res) => {
    res.json(await shipmentRepo.getStats());
});
