import mongoose, { Schema, Document } from "mongoose";

export interface IMailLog extends Document {
  message_id?: string;
  direction: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_preview: string;
  classification: string;
  shipment_id?: string;
  customer_id?: string;
  attachments: any;
  processed: number;
  processed_at?: Date;
  error?: string;
  received_at: Date;
}

const MailLogSchema = new Schema(
  {
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
  },
  { timestamps: false }
);

MailLogSchema.index({ classification: 1 });
MailLogSchema.index({ shipment_id: 1 });

export const MailLogModel = mongoose.model<IMailLog>("MailLog", MailLogSchema);
