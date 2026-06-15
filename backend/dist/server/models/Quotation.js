import mongoose, { Schema } from "mongoose";
const QuotationSchema = new Schema({
    _id: { type: String, required: true },
    shipment_id: { type: String, ref: "Shipment" },
    customer_id: { type: String, ref: "Customer" },
    rates: { type: Schema.Types.Mixed, default: [] },
    selected_line: { type: String },
    status: { type: String, default: "draft" },
    valid_until: { type: String },
    created_by: { type: String },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, _id: false });
QuotationSchema.index({ shipment_id: 1 });
QuotationSchema.index({ customer_id: 1 });
export const QuotationModel = mongoose.model("Quotation", QuotationSchema);
