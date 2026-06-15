import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  shipment_id?: string;
  title: string;
  message: string;
  due_date: string;
  priority: string;
  status: string;
  created_by?: string;
  created_at: Date;
}

const ReminderSchema = new Schema(
  {
    shipment_id: { type: String, ref: "Shipment" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    due_date: { type: String, required: true },
    priority: { type: String, default: "medium" },
    status: { type: String, default: "pending" },
    created_by: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const ReminderModel = mongoose.model<IReminder>("Reminder", ReminderSchema);
