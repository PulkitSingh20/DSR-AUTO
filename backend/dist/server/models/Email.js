import mongoose, { Schema } from "mongoose";
const EmailSchema = new Schema({
    shipment_id: { type: String, ref: "Shipment" },
    to_address: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: "general" },
    status: { type: String, default: "sent" },
    sent_at: { type: Date, default: Date.now },
    created_by: { type: String },
}, { timestamps: false });
EmailSchema.index({ shipment_id: 1 });
export const EmailModel = mongoose.model("Email", EmailSchema);
