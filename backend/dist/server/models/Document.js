import mongoose, { Schema } from "mongoose";
const DocumentSchema = new Schema({
    shipment_id: { type: String, ref: "Shipment", required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    file_path: { type: String },
    status: { type: String, default: "pending" },
    notes: { type: String, default: "" },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: { type: String },
}, { timestamps: false });
export const DocumentModel = mongoose.model("Document", DocumentSchema);
