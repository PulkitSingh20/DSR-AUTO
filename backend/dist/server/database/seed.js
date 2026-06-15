import { connectDB } from "./mongooseConnection.js";
import { CustomerModel } from "../models/Customer.js";
import { ShipmentModel } from "../models/Shipment.js";
import { TrackingEventModel } from "../models/TrackingEvent.js";
import { ReminderModel } from "../models/Reminder.js";
import { auditLog } from "./repositories.js";
console.log("🌱 Seeding MongoDB database...");
const seed = async () => {
    await connectDB();
    // Clear existing
    await CustomerModel.deleteMany({});
    await ShipmentModel.deleteMany({});
    await TrackingEventModel.deleteMany({});
    await ReminderModel.deleteMany({});
    const customers = [
        { _id: "CUST001", name: "Global Tech Industries", email: "ops@globaltech.com", phone: "+91 22 4001 2345", country: "India", type: "shipper", kyc_status: "verified" },
        { _id: "CUST002", name: "Rotterdam Port Authority", email: "import@rotterdam.nl", phone: "+31 10 252 1010", country: "Netherlands", type: "consignee", kyc_status: "verified" },
        { _id: "CUST003", name: "Aero Dynamics Co.", email: "logistics@aerodynamics.cn", phone: "+86 21 6000 1234", country: "China", type: "shipper", kyc_status: "verified" },
    ];
    for (const c of customers) {
        await CustomerModel.create(c);
        await auditLog("customers", c._id, "CREATE", "seed");
    }
    console.log(`✅ ${customers.length} customers seeded`);
    const shipments = [
        {
            _id: "EID0943542", description: "Lithium Battery Units",
            shipper: "Global Tech Industries", consignee: "Rotterdam Port Authority",
            origin: "Mumbai, IN", destination: "Rotterdam, NL",
            carrier: "Maersk", type: "sea", status: "bl_approved",
            bl_number: "MSK2024-A492", container_number: "MSKU3984722", vessel_id: "V1",
            payload: "Lithium Units (42t)", weight: 42000, cbm: 180,
            eta: "2024-10-24T08:30:00Z", etd: "2024-10-10T12:00:00Z",
            customs_status: "cleared", notes: "Hazmat DG Class 9. Requires MSDS certificate.",
        },
    ];
    for (const s of shipments) {
        await ShipmentModel.create(s);
        await auditLog("shipments", s._id, "CREATE", "seed");
    }
    console.log(`✅ ${shipments.length} shipments seeded`);
    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
};
seed();
