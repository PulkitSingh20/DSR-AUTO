import mongoose, { Schema } from "mongoose";
const InvoiceSchema = new Schema({
    _id: { type: String, required: true },
    shipment_id: { type: String, ref: "Shipment" },
    customer_id: { type: String, ref: "Customer" },
    type: { type: String, default: "customer" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, default: "pending" },
    due_date: { type: String },
    paid_date: { type: String },
    notes: { type: String, default: "" },
    has_reminder: { type: Number, default: 0 },
    created_by: { type: String },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, _id: false });
InvoiceSchema.index({ shipment_id: 1 });
InvoiceSchema.index({ status: 1 });
export const InvoiceModel = mongoose.model("Invoice", InvoiceSchema);
