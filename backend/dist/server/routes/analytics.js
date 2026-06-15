import { Router } from "express";
import { shipmentRepo } from "../database/repositories.js";
import { emailMonitor } from "../services/emailMonitor.js";
import { vesselSimulator } from "../services/vesselSimulator.js";
export const analyticsRoutes = Router();
// GET /api/analytics/overview
analyticsRoutes.get("/overview", async (_req, res) => {
    const shipmentStats = await shipmentRepo.getStats();
    const emailStats = emailMonitor.getStats();
    const vessels = vesselSimulator.getVessels();
    res.json({
        shipments: shipmentStats,
        email: emailStats,
        vessels: {
            total: vessels.length,
            nominal: vessels.filter(v => v.status === "nominal").length,
            delayed: vessels.filter(v => v.status === "delayed").length,
            critical: vessels.filter(v => v.status === "critical").length,
        },
        efficiency: 94.2,
        activeNodes: 1284,
        systemThroughput: "4.8k ops/sec",
        ts: new Date().toISOString(),
    });
});
// GET /api/analytics/shipment-volume — monthly volume data
analyticsRoutes.get("/shipment-volume", (_req, res) => {
    // Simulated monthly data; in production query your database
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    res.json({
        period: "monthly",
        data: months.slice(0, currentMonth + 1).map((month, i) => ({
            month,
            volume: 200 + Math.floor(Math.random() * 500 + i * 30),
            sea: 80 + Math.floor(Math.random() * 200),
            air: 60 + Math.floor(Math.random() * 150),
            road: 40 + Math.floor(Math.random() * 100),
        })),
    });
});
// GET /api/analytics/performance — carrier performance
analyticsRoutes.get("/performance", (_req, res) => {
    res.json([
        { name: "Maersk", onTime: 92, delayed: 8, totalShipments: 145 },
        { name: "CMA CGM", onTime: 87, delayed: 13, totalShipments: 112 },
        { name: "Hapag-Lloyd", onTime: 95, delayed: 5, totalShipments: 89 },
        { name: "MSC", onTime: 78, delayed: 22, totalShipments: 201 },
        { name: "COSCO", onTime: 83, delayed: 17, totalShipments: 67 },
    ]);
});
// GET /api/analytics/cargo-distribution
analyticsRoutes.get("/cargo-distribution", async (_req, res) => {
    const stats = await shipmentRepo.getStats();
    const total = stats.total || 1;
    const byType = {};
    stats.byType.forEach((t) => byType[t.type] = t.count);
    res.json([
        { name: "Sea", value: Math.round(((byType.sea || 0) / total) * 100) || 45, color: "#1A2B4C" },
        { name: "Air", value: Math.round(((byType.air || 0) / total) * 100) || 30, color: "#3B82F6" },
        { name: "Ground", value: Math.round(((byType.road || 0) / total) * 100) || 25, color: "#94A3B8" },
    ]);
});
// GET /api/analytics/pipeline-summary — kanban column counts
analyticsRoutes.get("/pipeline-summary", async (_req, res) => {
    const stats = await shipmentRepo.getStats();
    const byStatus = {};
    stats.byStatus.forEach((s) => byStatus[s.status] = s.count);
    res.json({
        columns: [
            { label: "Inquiry Received", count: byStatus["inquiry"] || 1 },
            { label: "Quotation Sent", count: 1 },
            { label: "Booking Done", count: 1 },
            { label: "KYC Pending", count: byStatus["kyc_pending"] || 1 },
            { label: "KYC Completed", count: 1 },
            { label: "SI Pending", count: 1 },
            { label: "SI Submitted", count: byStatus["si_submitted"] || 1 },
            { label: "BL Draft Pending", count: 1 },
            { label: "BL Approved", count: byStatus["bl_approved"] || 1 },
            { label: "Invoice Pending", count: 1 },
            { label: "Completed", count: byStatus["completed"] || 1 },
        ],
    });
});
