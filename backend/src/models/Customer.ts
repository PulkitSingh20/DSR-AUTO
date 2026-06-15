import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document<string> {
  _id: string; // custom string ID
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  type: string;
  kyc_status: string;
  notes: string;
  contact_person: string;
  shipment_history: any[];
  preferred_lines: string[];
  payment_status: string;
  customer_tag: string;
}

const CustomerSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    country: { type: String },
    address: { type: String },
    type: { type: String, default: "shipper" },
    kyc_status: { type: String, default: "pending" },
    notes: { type: String, default: "" },
    contact_person: { type: String, default: "" },
    shipment_history: { type: Schema.Types.Mixed, default: [] },
    preferred_lines: { type: [String], default: [] },
    payment_status: { type: String, default: "none" },
    customer_tag: { type: String, default: "NEW_CUSTOMER" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, _id: false }
);

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema);
