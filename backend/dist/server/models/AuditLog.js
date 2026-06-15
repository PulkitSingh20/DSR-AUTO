import mongoose, { Schema } from "mongoose";
const AuditLogSchema = new Schema({
    table_name: { type: String, required: true },
    record_id: { type: String, required: true },
    action: { type: String, required: true },
    changed_by: { type: String },
    changes: { type: Schema.Types.Mixed },
    occurred_at: { type: Date, default: Date.now },
}, { timestamps: false });
AuditLogSchema.index({ table_name: 1, record_id: 1 });
export const AuditLogModel = mongoose.model("AuditLog", AuditLogSchema);
