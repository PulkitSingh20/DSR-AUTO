import { CustomerModel } from "../models/Customer.js";
import { ShipmentModel } from "../models/Shipment.js";
import { TrackingEventModel } from "../models/TrackingEvent.js";
import { EmailModel } from "../models/Email.js";
import { DocumentModel } from "../models/Document.js";
import { ReminderModel } from "../models/Reminder.js";
import { AuditLogModel } from "../models/AuditLog.js";
import { QuotationModel } from "../models/Quotation.js";
import { InvoiceModel } from "../models/Invoice.js";
import { MailLogModel } from "../models/MailLog.js";
import { DsrRecordModel } from "../models/DsrRecord.js";
import { UserModel } from "../models/User.js";
import { ActivityLogModel } from "../models/ActivityLog.js";
// ─── Audit Helper ─────────────────────────────────────────────────────────────
export async function auditLog(table, recordId, action, changedBy = "system", changes) {
    try {
        await AuditLogModel.create({
            table_name: table,
            record_id: recordId,
            action,
            changed_by: changedBy,
            changes
        });
    }
    catch (err) {
        console.error("AuditLog Error:", err);
    }
}
// ─── Shipments ────────────────────────────────────────────────────────────────
export const shipmentRepo = {
    async getAll(filters) {
        const query = {};
        if (filters?.status)
            query.status = filters.status;
        if (filters?.type)
            query.type = filters.type;
        if (filters?.search) {
            const s = { $regex: filters.search, $options: "i" };
            query.$or = [{ _id: s }, { shipper: s }, { consignee: s }, { destination: s }, { payload: s }];
        }
        return ShipmentModel.find(query).sort({ created_at: -1 }).lean();
    },
    async getById(id) {
        return ShipmentModel.findById(id).lean();
    },
    async create(data, userId = "system") {
        const id = `EID${Math.floor(Math.random() * 9000000 + 1000000)}`;
        const shipment = await ShipmentModel.create({
            ...data,
            _id: id,
            created_by: userId,
            status: data.status || "inquiry",
        });
        await auditLog("shipments", id, "CREATE", userId, data);
        return shipment.toObject();
    },
    async update(id, data, userId = "system") {
        const updated = await ShipmentModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (updated)
            await auditLog("shipments", id, "UPDATE", userId, data);
        return updated;
    },
    async delete(id, userId = "system") {
        await auditLog("shipments", id, "DELETE", userId);
        const res = await ShipmentModel.findByIdAndDelete(id);
        return !!res;
    },
    async getStats() {
        const total = await ShipmentModel.countDocuments();
        const byStatus = await ShipmentModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        const byType = await ShipmentModel.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
        const customs = await ShipmentModel.aggregate([{ $group: { _id: "$customs_status", count: { $sum: 1 } } }]);
        const recent = await ShipmentModel.find().sort({ created_at: -1 }).limit(5).lean();
        return {
            total,
            byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
            byType: byType.map(t => ({ type: t._id, count: t.count })),
            customs: customs.map(c => ({ customs_status: c._id, count: c.count })),
            recent
        };
    }
};
// ─── Customers ────────────────────────────────────────────────────────────────
export const customerRepo = {
    async getAll(search) {
        if (search) {
            const s = { $regex: search, $options: "i" };
            return CustomerModel.find({ $or: [{ name: s }, { email: s }, { country: s }] }).sort({ name: 1 }).lean();
        }
        return CustomerModel.find().sort({ name: 1 }).lean();
    },
    async getById(id) {
        return CustomerModel.findById(id).lean();
    },
    async create(data, userId = "system") {
        const id = `CUST${Date.now()}`;
        const customer = await CustomerModel.create({ ...data, _id: id });
        await auditLog("customers", id, "CREATE", userId, data);
        return customer.toObject();
    },
    async update(id, data, userId = "system") {
        const updated = await CustomerModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (updated)
            await auditLog("customers", id, "UPDATE", userId, data);
        return updated;
    },
    async delete(id, userId = "system") {
        await auditLog("customers", id, "DELETE", userId);
        const res = await CustomerModel.findByIdAndDelete(id);
        return !!res;
    }
};
// ─── Tracking Events ─────────────────────────────────────────────────────────
export const trackingRepo = {
    async getByShipment(shipmentId) {
        return TrackingEventModel.find({ shipment_id: shipmentId }).sort({ occurred_at: -1 }).lean();
    },
    async addEvent(shipmentId, event, userId = "system") {
        const doc = await TrackingEventModel.create({ ...event, shipment_id: shipmentId });
        await auditLog("tracking_events", doc._id.toString(), "CREATE", userId, event);
        return doc._id.toString();
    }
};
// ─── Emails ───────────────────────────────────────────────────────────────────
export const emailRepo = {
    async getAll(shipmentId) {
        if (shipmentId)
            return EmailModel.find({ shipment_id: shipmentId }).sort({ sent_at: -1 }).lean();
        return EmailModel.find().sort({ sent_at: -1 }).limit(100).lean();
    },
    async log(data, userId = "system") {
        const doc = await EmailModel.create({ ...data, created_by: userId });
        return doc._id.toString();
    },
    async getStats() {
        const total = await EmailModel.countDocuments();
        const byType = await EmailModel.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
        const byStatus = await EmailModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        return {
            total,
            byType: byType.map(t => ({ type: t._id, count: t.count })),
            byStatus: byStatus.map(s => ({ status: s._id, count: s.count }))
        };
    }
};
// ─── Documents ────────────────────────────────────────────────────────────────
export const documentRepo = {
    async getByShipment(shipmentId) {
        return DocumentModel.find({ shipment_id: shipmentId }).sort({ uploaded_at: -1 }).lean();
    },
    async create(data, userId = "system") {
        const doc = await DocumentModel.create({ ...data, uploaded_by: userId });
        return doc._id.toString();
    },
    async updateStatus(id, status, userId = "system") {
        await DocumentModel.findByIdAndUpdate(id, { status });
        await auditLog("documents", id, "UPDATE", userId, { status });
    }
};
// ─── Reminders ────────────────────────────────────────────────────────────────
export const reminderRepo = {
    async getAll(status) {
        const query = status ? { status } : {};
        return ReminderModel.find(query).sort({ due_date: 1 }).lean();
    },
    async create(data, userId = "system") {
        const doc = await ReminderModel.create({ ...data, created_by: userId });
        return doc._id.toString();
    },
    async updateStatus(id, status) {
        await ReminderModel.findByIdAndUpdate(id, { status });
    }
};
// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditRepo = {
    async getAll(tableName, limit = 100) {
        const query = tableName ? { table_name: tableName } : {};
        return AuditLogModel.find(query).sort({ occurred_at: -1 }).limit(limit).lean();
    }
};
// ─── Quotations ──────────────────────────────────────────────────────────────
export const quotationRepo = {
    async getAll(filters) {
        const query = {};
        if (filters?.status)
            query.status = filters.status;
        if (filters?.customerId)
            query.customer_id = filters.customerId;
        return QuotationModel.find(query).sort({ created_at: -1 }).lean();
    },
    async getById(id) {
        return QuotationModel.findById(id).lean();
    },
    async getByShipment(shipmentId) {
        return QuotationModel.find({ shipment_id: shipmentId }).sort({ created_at: -1 }).lean();
    },
    async create(data, userId = "system") {
        const id = `QOT-${Date.now()}`;
        const doc = await QuotationModel.create({ ...data, _id: id, created_by: userId });
        await auditLog("quotations", id, "CREATE", userId, data);
        return doc.toObject();
    },
    async update(id, data, userId = "system") {
        const updated = await QuotationModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (updated)
            await auditLog("quotations", id, "UPDATE", userId, data);
        return updated;
    },
    async delete(id, userId = "system") {
        await auditLog("quotations", id, "DELETE", userId);
        const res = await QuotationModel.findByIdAndDelete(id);
        return !!res;
    }
};
// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoiceRepo = {
    async getAll(filters) {
        const query = {};
        if (filters?.status)
            query.status = filters.status;
        if (filters?.type)
            query.type = filters.type;
        if (filters?.search) {
            const s = { $regex: filters.search, $options: "i" };
            query.$or = [{ _id: s }, { shipment_id: s }, { notes: s }];
        }
        return InvoiceModel.find(query).sort({ created_at: -1 }).lean();
    },
    async getById(id) {
        return InvoiceModel.findById(id).lean();
    },
    async getByShipment(shipmentId) {
        return InvoiceModel.find({ shipment_id: shipmentId }).sort({ created_at: -1 }).lean();
    },
    async create(data, userId = "system") {
        const id = data.id || `INV-${Date.now()}`;
        const doc = await InvoiceModel.create({ ...data, _id: id, created_by: userId });
        await auditLog("invoices", id, "CREATE", userId, data);
        return doc.toObject();
    },
    async update(id, data, userId = "system") {
        const updated = await InvoiceModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (updated)
            await auditLog("invoices", id, "UPDATE", userId, data);
        return updated;
    },
    async delete(id, userId = "system") {
        await auditLog("invoices", id, "DELETE", userId);
        const res = await InvoiceModel.findByIdAndDelete(id);
        return !!res;
    },
    async getStats() {
        const total = await InvoiceModel.countDocuments();
        const byStatus = await InvoiceModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        const byType = await InvoiceModel.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
        const totalAmt = await InvoiceModel.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const paidAmt = await InvoiceModel.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
        return {
            total,
            byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
            byType: byType.map(t => ({ type: t._id, count: t.count })),
            totalAmount: totalAmt[0]?.total || 0,
            paidAmount: paidAmt[0]?.total || 0
        };
    }
};
// ─── Mail Log ────────────────────────────────────────────────────────────────
export const mailLogRepo = {
    async getAll(filters, limit = 100) {
        const query = {};
        if (filters?.classification)
            query.classification = filters.classification;
        if (filters?.direction)
            query.direction = filters.direction;
        if (filters?.processed !== undefined)
            query.processed = filters.processed ? 1 : 0;
        return MailLogModel.find(query).sort({ received_at: -1 }).limit(limit).lean();
    },
    async getByShipment(shipmentId) {
        return MailLogModel.find({ shipment_id: shipmentId }).sort({ received_at: -1 }).lean();
    },
    async create(data) {
        const doc = await MailLogModel.create(data);
        return doc._id.toString();
    },
    async markProcessed(id, classification, shipmentId) {
        const update = { processed: 1, processed_at: new Date(), classification };
        if (shipmentId)
            update.shipment_id = shipmentId;
        await MailLogModel.findByIdAndUpdate(id, update);
    }
};
// ─── DSR Records ─────────────────────────────────────────────────────────────
export const dsrRepo = {
    async getAll(includesClosed = false) {
        const query = includesClosed ? {} : { is_closed: 0 };
        return DsrRecordModel.find(query).sort({ updated_at: -1 }).lean();
    },
    async getByShipment(shipmentId) {
        return DsrRecordModel.findOne({ shipment_id: shipmentId }).lean();
    },
    async upsert(shipmentId, data) {
        const existing = await DsrRecordModel.findOne({ shipment_id: shipmentId });
        if (existing) {
            await DsrRecordModel.updateOne({ shipment_id: shipmentId }, data);
        }
        else {
            await DsrRecordModel.create({ ...data, shipment_id: shipmentId });
        }
        return DsrRecordModel.findOne({ shipment_id: shipmentId }).lean();
    },
    async close(shipmentId) {
        await DsrRecordModel.updateOne({ shipment_id: shipmentId }, { is_closed: 1, closed_at: new Date() });
    }
};
// ─── Users ───────────────────────────────────────────────────────────────────
export const userRepo = {
    async getAll() {
        return UserModel.find().sort({ created_at: -1 }).lean();
    },
    async getById(id) {
        return UserModel.findById(id).lean();
    },
    async getByClerkId(clerkId) {
        return UserModel.findOne({ clerk_id: clerkId }).lean();
    },
    async upsert(data) {
        if (data.clerk_id) {
            const existing = await UserModel.findOne({ clerk_id: data.clerk_id });
            if (existing) {
                await UserModel.updateOne({ clerk_id: data.clerk_id }, { username: data.username, email: data.email, last_login: new Date() });
                return UserModel.findOne({ clerk_id: data.clerk_id }).lean();
            }
        }
        const id = `USR-${Date.now()}`;
        const doc = await UserModel.create({ ...data, _id: id });
        return doc.toObject();
    },
    async updateRole(id, role, userId = "system") {
        await UserModel.findByIdAndUpdate(id, { role });
        await auditLog("users", id, "UPDATE", userId, { role });
    }
};
// ─── Activity Log ────────────────────────────────────────────────────────────
export const activityRepo = {
    async getAll(module, limit = 200) {
        const query = module ? { module } : {};
        return ActivityLogModel.find(query).sort({ occurred_at: -1 }).limit(limit).lean();
    },
    async log(userId, action, module, details, ipAddress) {
        await ActivityLogModel.create({ user_id: userId, action, module, details, ip_address: ipAddress });
    }
};
