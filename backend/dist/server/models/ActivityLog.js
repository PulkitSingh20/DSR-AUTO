import mongoose, { Schema } from "mongoose";
const ActivityLogSchema = new Schema({
    user_id: { type: String },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip_address: { type: String },
    occurred_at: { type: Date, default: Date.now },
}, { timestamps: false });
ActivityLogSchema.index({ module: 1 });
export const ActivityLogModel = mongoose.model("ActivityLog", ActivityLogSchema);
