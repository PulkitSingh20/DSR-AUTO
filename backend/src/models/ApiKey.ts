import mongoose, { Schema, Document } from "mongoose";

export interface IApiKey extends Document<string> {
  _id: string; // custom string ID
  name: string;
  key_hash: string;
  permissions: any;
  owner: string;
  last_used?: Date;
  usage_count: number;
  is_active: number;
  created_at: Date;
}

const ApiKeySchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    key_hash: { type: String, required: true, unique: true },
    permissions: { type: Schema.Types.Mixed, default: ["read"] },
    owner: { type: String, required: true },
    last_used: { type: Date },
    usage_count: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false, _id: false }
);

export const ApiKeyModel = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
