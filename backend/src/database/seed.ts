import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./mongooseConnection.js";
import { CustomerModel } from "../models/Customer.js";
import { ShipmentModel } from "../models/Shipment.js";
import { InvoiceModel } from "../models/Invoice.js";
import { QuotationModel } from "../models/Quotation.js";
import { TrackingEventModel } from "../models/TrackingEvent.js";
import { ReminderModel } from "../models/Reminder.js";
import { auditLog } from "./repositories.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

console.log("🌱 Seeding MongoDB database with DSR Google Sheet CSV...");

function findLatestCsv(): string | null {
  const possibleDirs = [
    "D:\\Downloads",
    "C:\\Users\\pulki\\Downloads",
    path.resolve(process.cwd(), "../../"), 
    path.resolve(process.cwd(), "../"),
    path.resolve(__dirname, "../../../../"), 
    path.resolve(__dirname, "../../../../../"), 
  ];

  let latestFile: string | null = null;
  let latestTime = 0;

  for (const dir of possibleDirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith("ZIPAWORLD-") && file.endsWith(".csv")) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs > latestTime) {
              latestTime = stats.mtimeMs;
              latestFile = filePath;
            }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  return latestFile;
}

function parseCSV(csvContent: string): string[][] {
  const result: string[][] = [];
  let currentVal = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
          result.push(currentRow);
        }
        currentRow = [];
        currentVal = "";
      }
    } else {
      currentVal += char;
    }
  }
  
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
      result.push(currentRow);
    }
  }

  return result;
}

const cleanPort = (portStr: string) => {
  if (!portStr) return "";
  const parts = portStr.split(",");
  if (parts.length > 1) return parts[1].trim();
  return portStr.trim();
};

const seed = async () => {
  await connectDB();

  const csvPath = findLatestCsv();
  if (!csvPath) {
    console.error("❌ Seeder Error: No ZIPAWORLD CSV file found in download directories!");
    process.exit(1);
  }

  console.log(`📄 Parsing Google Sheet CSV data from: ${csvPath}`);
  
  let rows: string[][];
  try {
    const content = fs.readFileSync(csvPath, "utf-8");
    rows = parseCSV(content);
  } catch (err: any) {
    console.error(`❌ Failed to read/parse CSV: ${err.message}`);
    process.exit(1);
  }

  if (rows.length < 2) {
    console.error("❌ Seeder Error: CSV file does not contain enough records.");
    process.exit(1);
  }

  const headers = rows[0];
  const parsedRecords: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    parsedRecords.push(row);
  }

  // Clear existing collections
  console.log("🧹 Clearing existing collections...");
  await CustomerModel.deleteMany({});
  await ShipmentModel.deleteMany({});
  await InvoiceModel.deleteMany({});
  await QuotationModel.deleteMany({});
  await TrackingEventModel.deleteMany({});
  await ReminderModel.deleteMany({});

  const customersMap = new Map<string, any>();
  const shipments: any[] = [];
  const invoices: any[] = [];
  const quotations: any[] = [];
  const trackingEvents: any[] = [];

  console.log("🛠️  Mapping DSR rows to database schemas...");
  parsedRecords.forEach((row, index) => {
    // 1. Map to Customer
    const customerName = row.branchName || "ZIPAWORLD INNOVATION PVT LTD";
    const customerId = "CUST_" + customerName.replace(/[^A-Z0-9]/ig, "_").toUpperCase();
    
    if (!customersMap.has(customerId)) {
      customersMap.set(customerId, {
        _id: customerId,
        name: customerName,
        email: "ops@zipaworld.com",
        phone: "+91 22 4001 2345",
        country: row.region || "India",
        type: "shipper",
        kyc_status: "verified",
        notes: "Auto-generated shipper from DSR Google Sheet.",
      });
    }

    // 2. Map to Shipment
    const id = row.id || `csv_${index}`;
    // Keep standard EIDxxxxxxx format for shipments, using sequential numbers to avoid collisions
    const shipmentId = "EID" + (1000000 + index).toString();
    const origin = cleanPort(row.originName);
    const destination = cleanPort(row.destinationName);
    const validityStart = row.validityStartDate || new Date().toISOString().split("T")[0];
    const validityEnd = row.validityEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const isSeaType = (row.shipmentMode || "FCL").toUpperCase() !== "AIR";

    shipments.push({
      _id: shipmentId,
      description: row.cargoType || "General Cargo",
      shipper: customerName,
      consignee: "Consignee Logistics Ltd",
      origin: origin,
      destination: destination,
      carrier: row.shippingLineName || "TBD",
      type: isSeaType ? "sea" : "air",
      status: row.isSpotRate === "true" || row.isSpotRate === true ? "in_transit" : "booking_confirmed",
      payload: row.containerName || "General Cargo",
      weight: row.containerName?.includes("20") ? 18500 : 22000,
      cbm: row.containerName?.includes("20") ? 33 : 67,
      etd: validityStart,
      eta: validityEnd,
      bl_number: row.contractNo || `BL-${shipmentId.slice(-6)}`,
      container_number: `ZAWU${Math.floor(1000000 + Math.random() * 9000000)}`,
      job_number: id,
      commodity: row.cargoType || "General Cargo",
      gross_weight: row.containerName?.includes("20") ? 18500 : 22000,
      container_details: row.containerName || "20 Standard",
      incoterm: row.rateType === "OI" ? "CIF" : "FOB",
      shipping_line: row.shippingLineName || "TBD",
      vessel_name: `Vessel ${(row.shippingLineName || "Express").split(" ")[0]}`,
      voyage: `V.${shipmentId.slice(-3).toUpperCase()}`,
      notes: row.additionalRemarks || row.groupNameRemarks || "Rate sheet entry loaded.",
      customer_id: customerId,
      customs_status: "cleared",
    });

    // 3. Map to Invoice
    const buyRateVal = parseFloat(row.buyRate) || 0;
    const rateVal = parseFloat(row.rate) || 0;
    const formatINRVal = (usd: number) => Math.round(usd * 83);

    invoices.push({
      _id: `INV-${shipmentId.slice(-6)}`,
      shipment_id: shipmentId,
      customer_id: customerId,
      type: "customer",
      amount: formatINRVal(rateVal),
      currency: "INR",
      status: "paid",
      due_date: validityEnd,
      paid_date: validityStart,
      notes: "Auto-generated invoice from DSR rates.",
    });

    // 4. Map to Quotation
    quotations.push({
      _id: `QOT-${shipmentId.slice(-6)}`,
      shipment_id: shipmentId,
      customer_id: customerId,
      rates: [
        {
          line: row.shippingLineName || "TBD",
          twentyST: formatINRVal(buyRateVal).toString(),
          fortyHC: formatINRVal(rateVal).toString(),
          transit: row.transitTime || "30 Days",
          validity: validityEnd,
        }
      ],
      selected_line: row.shippingLineName || "TBD",
      status: "accepted",
      valid_until: validityEnd,
    });

    // 5. Tracking events
    trackingEvents.push({
      shipment_id: shipmentId,
      event: "BOOKING_CONFIRMED",
      location: origin,
      notes: "Booking confirmed with shipping line.",
      occurred_at: validityStart,
    });
    if (row.isSpotRate === "true" || row.isSpotRate === true) {
      trackingEvents.push({
        shipment_id: shipmentId,
        event: "IN_TRANSIT",
        location: "Mid Ocean",
        notes: "Vessel departed origin port.",
        occurred_at: validityStart,
      });
    }
  });

  // Save to DB
  console.log("💾 Saving customers to DB...");
  const uniqueCustomers = Array.from(customersMap.values());
  for (const c of uniqueCustomers) {
    await CustomerModel.create(c);
    await auditLog("customers", c._id, "CREATE", "seed");
  }
  console.log(`✅ ${uniqueCustomers.length} unique customers seeded.`);

  console.log("💾 Saving shipments to DB...");
  for (const s of shipments) {
    await ShipmentModel.create(s);
    await auditLog("shipments", s._id, "CREATE", "seed");
  }
  console.log(`✅ ${shipments.length} shipments seeded.`);

  console.log("💾 Saving invoices to DB...");
  for (const inv of invoices) {
    await InvoiceModel.create(inv);
  }
  console.log(`✅ ${invoices.length} invoices seeded.`);

  console.log("💾 Saving quotations to DB...");
  for (const q of quotations) {
    await QuotationModel.create(q);
  }
  console.log(`✅ ${quotations.length} quotations seeded.`);

  console.log("💾 Saving tracking events to DB...");
  for (const t of trackingEvents) {
    await TrackingEventModel.create(t);
  }
  console.log(`✅ ${trackingEvents.length} tracking events seeded.`);

  console.log("\n🎉 Database seeded successfully with Google Sheet DSR rates!");
  process.exit(0);
};

seed();
