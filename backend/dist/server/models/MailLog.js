import mongoose, { Schema } from "mongoose";
const MailLogSchema = new Schema({
    message_id: { type: String, unique: true, sparse: true },
    direction: { type: String, default: "inbound" },
    from_address: { type: String, required: true },
    to_address: { type: String, required: true },
    subject: { type: String, required: true },
    body_preview: { type: String, default: "" },
    classification: { type: String, default: "unknown" },
    shipment_id: { type: String, ref: "Shipment" },
    customer_id: { type: String, ref: "Customer" },
    attachments: { type: Schema.Types.Mixed, default: [] },
    processed: { type: Number, default: 0 },
    processed_at: { type: Date },
    error: { type: String },
    received_at: { type: Date, default: Date.now },
}, { timestamps: false });
MailLogSchema.index({ classification: 1 });
MailLogSchema.index({ shipment_id: 1 });
export const MailLogModel = mongoose.model("MailLog", MailLogSchema);
