import { Router } from "express";
import { emailMonitor } from "../services/emailMonitor.js";
export const emailRoutes = Router();
// GET /api/email/history
emailRoutes.get("/history", (_req, res) => {
    res.json({
        emails: emailMonitor.getHistory(),
        stats: emailMonitor.getStats(),
    });
});
// GET /api/email/stats
emailRoutes.get("/stats", (_req, res) => {
    res.json(emailMonitor.getStats());
});
// POST /api/email/send
emailRoutes.post("/send", (req, res) => {
    const { to, subject, body, shipmentId, type } = req.body;
    if (!to || !subject || !body) {
        return res.status(400).json({ error: "VALIDATION", message: "to, subject, body required" });
    }
    const emailRecord = emailMonitor.send({
        to,
        from: "ops@zipaworld.com",
        subject,
        body,
        shipmentId,
        type: type || "reminder",
    });
    res.status(202).json({
        success: true,
        message: "Email queued for delivery",
        emailId: emailRecord.id,
        status: emailRecord.status,
    });
});
// POST /api/email/send-bulk — send reminders to multiple customers
emailRoutes.post("/send-bulk", (req, res) => {
    const { recipients, template, shipmentId } = req.body;
    if (!recipients || !Array.isArray(recipients) || !template) {
        return res.status(400).json({ error: "VALIDATION", message: "recipients array and template required" });
    }
    const queued = recipients.map((to) => emailMonitor.send({
        to,
        from: "ops@zipaworld.com",
        subject: template.subject,
        body: template.body,
        shipmentId,
        type: template.type || "reminder",
    }));
    res.status(202).json({
        success: true,
        queued: queued.length,
        emailIds: queued.map(e => e.id),
    });
});
// GET /api/email/templates — return available templates
emailRoutes.get("/templates", (_req, res) => {
    res.json([
        {
            id: "kyc_reminder",
            name: "KYC Document Reminder",
            subject: "Action Required: KYC Documents for Shipment {shipmentId}",
            body: "Dear {customerName},\n\nYour KYC documents are pending for shipment {shipmentId}. Please submit them within 48 hours to avoid delays.\n\nBest regards,\nZIP-A-WORLD Operations",
        },
        {
            id: "eta_update",
            name: "ETA Update",
            subject: "ETA Update for Your Shipment {shipmentId}",
            body: "Dear {customerName},\n\nThe estimated arrival time for shipment {shipmentId} has been updated to {eta}.\n\nBest regards,\nZIP-A-WORLD Tracking",
        },
        {
            id: "invoice_due",
            name: "Invoice Due Notice",
            subject: "Invoice {invoiceId} Due — ZIP-A-WORLD",
            body: "Dear {customerName},\n\nInvoice {invoiceId} for shipment {shipmentId} is now due. Please process payment at your earliest convenience.\n\nBest regards,\nZIP-A-WORLD Billing",
        },
        {
            id: "customs_hold",
            name: "Customs Hold Alert",
            subject: "URGENT: Customs Hold on Shipment {shipmentId}",
            body: "Dear {customerName},\n\nYour shipment {shipmentId} is currently on customs hold. Please contact our compliance team immediately.\n\nZIP-A-WORLD Compliance",
        },
    ]);
});
