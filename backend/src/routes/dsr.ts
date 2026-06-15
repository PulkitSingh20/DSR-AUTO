// ─── DSR Routes ──────────────────────────────────────────────────────────────
import { Router } from "express";
import { logyMailService, getAuditLogs } from "../services/logyMailService.js";

export const dsrRoutes = Router();

// ─── In-memory Ocean DSR store ────────────────────────────────────────────────
// Exported so logyMailService can access and mutate records directly.
export const oceanDsr: any[] = [
  {
    _id: "dsr_seed_1",
    handledBy: "Sarah Connor",
    zipaRefNo: "ZIP-AO-8821",
    billingParty: "Tech Dynamics Ltd",
    shipperName: "Global Manufacturing Inc",
    cneeName: "Euro Distribution BV",
    remarks: "Sailing AWT",
    shipmentStatus: "IN TRANSIT",
    incoterms: "CIF",
    shipperInvNoAndDate: "INV-1022 - 2025/10/12",
    sbNoAndDate: "SB-9921 - 2025/10/14",
    portOfReceipt: "Mumbai",
    portOfLoading: "Nhava Sheva",
    portOfDischarge: "Rotterdam",
    finalDestination: "Amsterdam",
    commodity: "Electronic Components",
    lclFcl: "FCL",
    twentyFoot: "2",
    fortyFoot: "0",
    grossWeight: "12,400 kg",
    noOfPkgs: "42 Pallets",
    volume: "48 CBM",
    shippingLineCoLoader: "Maersk Line",
    linerInvoiceCoLoader: "ML-INV-0091",
    vesselNameVoyage: "Maersk Atlantic V.12",
    croNoAndReleaseDt: "CRO-441 - 2025/10/10",
    hblNumber: "HBL-ZIP-001",
    mblNumber: "MBL-MAE-772",
    hblOblTlxExp: "Original",
    mblOblSwbTlx: "Seaway Bill",
    railingTruckingDt: "2025/10/15",
    stuffingDate: "2025/10/14",
    cntrGatedIn: "2025/10/16",
    vslBerthDt: "2025/10/18",
    etd: "2025/10/19",
    eta: "2025/11/15",
    sellRateInr: "1,45,000",
    buyRateInr: "1,20,000",
    marginInr: "25,000",
    invoiceReleasedDt: "2025/10/20",
    billingWeek: "W42",
    billingMonth: "October",
    containerNo: "MSKU9921821",
    salesPerson: "John Smith",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "dsr_seed_2",
    handledBy: "Rajesh Kumar",
    zipaRefNo: "ZIP-AO-9012",
    billingParty: "Sunrise Exports Pvt Ltd",
    shipperName: "Sunrise Exports Pvt Ltd",
    cneeName: "Pacific Trading Co",
    remarks: "Sailing AWT",
    shipmentStatus: "PENDING",
    incoterms: "FOB",
    shipperInvNoAndDate: "INV-2045 - 2025/11/01",
    sbNoAndDate: "SB-1100 - 2025/11/03",
    portOfReceipt: "Chennai",
    portOfLoading: "Chennai",
    portOfDischarge: "Singapore",
    finalDestination: "Singapore",
    commodity: "Textiles",
    lclFcl: "LCL",
    twentyFoot: "0",
    fortyFoot: "1",
    grossWeight: "8,200 kg",
    noOfPkgs: "120 Cartons",
    volume: "32 CBM",
    shippingLineCoLoader: "MSC",
    linerInvoiceCoLoader: "MSC-INV-0220",
    vesselNameVoyage: "MSC Beatrice V.8",
    croNoAndReleaseDt: "CRO-512 - 2025/10/30",
    hblNumber: "HBL-ZIP-002",
    mblNumber: "MBL-MSC-441",
    hblOblTlxExp: "Telex",
    mblOblSwbTlx: "OBL",
    railingTruckingDt: "2025/11/02",
    stuffingDate: "2025/11/01",
    cntrGatedIn: "2025/11/03",
    vslBerthDt: "2025/11/05",
    etd: "2025/11/06",
    eta: "2025/11/20",
    sellRateInr: "98,000",
    buyRateInr: "82,000",
    marginInr: "16,000",
    invoiceReleasedDt: "",
    billingWeek: "W45",
    billingMonth: "November",
    containerNo: "MSCU8812344",
    salesPerson: "Priya Nair",
    createdAt: new Date().toISOString(),
  },
];

// Attach the store to the Logy Mail service
logyMailService.attachDsrStore(oceanDsr);

// ─── Standard DSR CRUD Routes ─────────────────────────────────────────────────

// GET /api/dsr - returns array directly
dsrRoutes.get("/", (req, res) => {
  res.json(oceanDsr);
});

// POST /api/dsr/seed
dsrRoutes.post("/seed", (req, res) => {
  res.json({ message: "Already seeded", count: oceanDsr.length });
});

// POST /api/dsr - create new entry
dsrRoutes.post("/", (req, res) => {
  const entry = {
    ...req.body,
    _id: "dsr_" + Date.now() + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
  };
  oceanDsr.unshift(entry);
  res.json(entry);
});

// PUT /api/dsr/:id - update entry
dsrRoutes.put("/:id", (req, res) => {
  // Exclude logy-mail sub-routes from this handler
  if (req.params.id === "logy-mail") return res.status(404).json({ error: "Not found" });
  const index = oceanDsr.findIndex((d) => d._id === req.params.id);
  if (index !== -1) {
    oceanDsr[index] = { ...oceanDsr[index], ...req.body };
    res.json({ status: "updated", record: oceanDsr[index] });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// DELETE /api/dsr/:id
dsrRoutes.delete("/:id", (req, res) => {
  if (req.params.id === "logy-mail") return res.status(404).json({ error: "Not found" });
  const before = oceanDsr.length;
  const idx = oceanDsr.findIndex((d) => d._id === req.params.id);
  if (idx !== -1) oceanDsr.splice(idx, 1);
  if (oceanDsr.length < before) {
    res.json({ status: "deleted" });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// ─── Logy Mail Management Routes ──────────────────────────────────────────────

// POST /api/dsr/logy-mail/sync — trigger immediate manual sync
dsrRoutes.post("/logy-mail/sync", async (req, res) => {
  try {
    const result = await logyMailService.syncNow();
    res.json({
      status: "ok",
      message: "Sync completed",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /api/dsr/logy-mail/status — scheduler status
dsrRoutes.get("/logy-mail/status", (req, res) => {
  res.json({
    status: "ok",
    service: logyMailService.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/dsr/logy-mail/logs — paginated audit log
dsrRoutes.get("/logy-mail/logs", (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10)));
  const result = getAuditLogs(page, limit);
  res.json(result);
});

// GET /api/dsr/logy-mail/logs/:logId — single log entry
dsrRoutes.get("/logy-mail/logs/:logId", (req, res) => {
  const { logs } = getAuditLogs(1, 1000);
  const entry = logs.find((l) => l.id === req.params.logId);
  if (!entry) return res.status(404).json({ error: "Log entry not found" });
  res.json(entry);
});
