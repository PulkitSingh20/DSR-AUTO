import mongoose, { Schema } from "mongoose";
const TrackingEventSchema = new Schema({
    shipment_id: { type: String, ref: "Shipment", required: true },
    event: { type: String, required: true },
    location: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    notes: { type: String },
    occurred_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
TrackingEventSchema.index({ shipment_id: 1 });
export const TrackingEventModel = mongoose.model("TrackingEvent", TrackingEventSchema);
