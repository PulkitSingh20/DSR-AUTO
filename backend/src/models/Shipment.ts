import mongoose, { Schema, Document } from "mongoose";

export interface IShipment extends Document<string> {
  _id: string; // custom string ID
  description: string;
  shipper: string;
  consignee: string;
  origin: string;
  destination: string;
  carrier: string;
  type: string;
  status: string;
  mawb?: string;
  hawb?: string;
  bl_number?: string;
  container_number?: string;
  vessel_id?: string;
  payload: string;
  weight: number;
  cbm: number;
  eta?: string;
  etd?: string;
  customs_status: string;
  notes: string;
  created_by?: string;
  job_number?: string;
  commodity: string;
  gross_weight: number;
  container_details: string;
  incoterm: string;
  shipping_line: string;
  vessel_name: string;
  voyage: string;
  assigned_employee: string;
  notify_party: string;
  consignee_details: string;
  stage_timestamps: any;
  customer_id?: string;
}

const ShipmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    description: { type: String, required: true },
    shipper: { type: String, required: true },
    consignee: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    carrier: { type: String, required: true },
    type: { type: String, default: "sea" },
    status: { type: String, default: "inquiry_received" },
    mawb: { type: String },
    hawb: { type: String },
    bl_number: { type: String },
    container_number: { type: String },
    vessel_id: { type: String },
    payload: { type: String, required: true },
    weight: { type: Number, default: 0 },
    cbm: { type: Number, default: 0 },
    eta: { type: String },
    etd: { type: String },
    customs_status: { type: String, default: "pending" },
    notes: { type: String, default: "" },
    created_by: { type: String },
    job_number: { type: String },
    commodity: { type: String, default: "" },
    gross_weight: { type: Number, default: 0 },
    container_details: { type: String, default: "" },
    incoterm: { type: String, default: "" },
    shipping_line: { type: String, default: "" },
    vessel_name: { type: String, default: "" },
    voyage: { type: String, default: "" },
    assigned_employee: { type: String, default: "" },
    notify_party: { type: String, default: "" },
    consignee_details: { type: String, default: "" },
    stage_timestamps: { type: Schema.Types.Mixed, default: {} },
    customer_id: { type: String, ref: "Customer" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, _id: false }
);

ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ shipper: 1 });
ShipmentSchema.index({ carrier: 1 });

export const ShipmentModel = mongoose.model<IShipment>("Shipment", ShipmentSchema);
