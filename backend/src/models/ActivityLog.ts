import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user_id?: string;
  action: string;
  module: string;
  details?: any;
  ip_address?: string;
  occurred_at: Date;
}

const ActivityLogSchema = new Schema(
  {
    user_id: { type: String },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip_address: { type: String },
    occurred_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ActivityLogSchema.index({ module: 1 });

export const ActivityLogModel = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
