import mongoose, { Schema, Document } from "mongoose";

export interface IDsrRecord extends Document {
  shipment_id: string;
  job_number?: string;
  customer_name?: string;
  shipping_line?: string;
  etd?: string;
  eta?: string;
  current_stage?: string;
  billing_status: string;
  payment_status: string;
  pending_actions: any;
  is_closed: number;
  closed_at?: Date;
  updated_at: Date;
}

const DsrRecordSchema = new Schema(
  {
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
  },
  { timestamps: { createdAt: false, updatedAt: "updated_at" } }
);

DsrRecordSchema.index({ shipment_id: 1 });

export const DsrRecordModel = mongoose.model<IDsrRecord>("DsrRecord", DsrRecordSchema);
