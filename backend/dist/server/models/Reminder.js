import mongoose, { Schema } from "mongoose";
const ReminderSchema = new Schema({
    shipment_id: { type: String, ref: "Shipment" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    due_date: { type: String, required: true },
    priority: { type: String, default: "medium" },
    status: { type: String, default: "pending" },
    created_by: { type: String },
    created_at: { type: Date, default: Date.now },
}, { timestamps: false });
export const ReminderModel = mongoose.model("Reminder", ReminderSchema);
