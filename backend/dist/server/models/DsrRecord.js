import mongoose, { Schema } from "mongoose";
const DsrRecordSchema = new Schema({
    shipment_id: { type: String, ref: "Shipment", required: true },
    job_number: { type: String },
    customer_name: { type: String },
    shipping_line: { type: String },
    etd: { type: String },
    eta: { type: String },
    current_stage: { type: String },
    billing_status: { type: String, default: "pending" },
    payment_status: { type: String, default: "pending" },
    pending_actions: { type: Schema.Types.Mixed, default: [] },
    is_closed: { type: Number, default: 0 },
    closed_at: { type: Date },
}, { timestamps: { createdAt: false, updatedAt: "updated_at" } });
DsrRecordSchema.index({ shipment_id: 1 });
export const DsrRecordModel = mongoose.model("DsrRecord", DsrRecordSchema);
