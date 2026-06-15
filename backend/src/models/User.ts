import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document<string> {
  _id: string; // custom string ID
  clerk_id?: string;
  username: string;
  email?: string;
  role: string;
  is_active: number;
  last_login?: string;
}

const UserSchema = new Schema(
  {
    _id: { type: String, required: true },
    clerk_id: { type: String, unique: true, sparse: true },
    username: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: "operations" },
    is_active: { type: Number, default: 1 },
    last_login: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false }, _id: false }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
