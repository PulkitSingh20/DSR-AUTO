// ─── DSR Routes ──────────────────────────────────────────────────────────────
import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
export const dsrRoutes = Router();
// In-memory Ocean DSR store (standalone, not linked to shipments)
let oceanDsr = [
    {
        _id: "dsr_seed_1",
        handledBy: "Sarah Connor",
        zipaRefNo: "ZIP-AO-8821",
        billingParty: "Tech Dynamics Ltd",
        shipperName: "Global Manufacturing Inc",
        cneeName: "Euro Distribution BV",
        remarks: "Urgent shipment for Q4 peak",
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
        createdAt: new Date().toISOString()
    }
];
// GET /api/dsr - returns array directly (compatible with OceanDSRSheet)
dsrRoutes.get("/", (req, res) => {
    res.json(oceanDsr);
});
// POST /api/dsr/seed
dsrRoutes.post("/seed", (req, res) => {
    res.json({ message: "Already seeded", count: oceanDsr.length });
});
// POST /api/dsr/autofill - AI-powered autofill from text/email
dsrRoutes.post("/autofill", async (req, res) => {
    try {
        const { prompt, existingDsrList } = req.body;
        if (!prompt)
            return res.status(400).json({ error: "Prompt is required" });
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: "AI service not configured. Add GEMINI_API_KEY to .env" });
        }
        const ai = new GoogleGenAI({ apiKey });
        const dSRSummary = Array.isArray(existingDsrList)
            ? existingDsrList.map((item) => ({
                _id: item._id,
                zipaRefNo: item.zipaRefNo || "",
                shipperName: item.shipperName || "",
                cneeName: item.cneeName || "",
                containerNo: item.containerNo || "",
                remarks: item.remarks || "",
                shipmentStatus: item.shipmentStatus || ""
            }))
            : [];
        const systemPrompt = `Analyze the following logistics email/SI instruction and determine if it matches or updates any existing shipment in the Ocean DSR database, or if it represents a brand new shipment.

Email Info:
${prompt}

Existing DSR Records (summary):
${JSON.stringify(dSRSummary, null, 2)}

Respond ONLY with a valid JSON object in this exact format:
{
  "isExistingMatch": true/false,
  "matchedDsrId": "string or null",
  "explanation": "brief explanation of match/no-match",
  "suggestedUpdates": { fields to update for existing record },
  "extractedDsr": {
    "handledBy": "", "zipaRefNo": "", "billingParty": "", "shipperName": "", "cneeName": "",
    "remarks": "", "shipmentStatus": "", "incoterms": "", "shipperInvNoAndDate": "",
    "sbNoAndDate": "", "portOfReceipt": "", "portOfLoading": "", "portOfDischarge": "",
    "finalDestination": "", "commodity": "", "lclFcl": "", "twentyFoot": "", "fortyFoot": "",
    "grossWeight": "", "noOfPkgs": "", "volume": "", "shippingLineCoLoader": "",
    "linerInvoiceCoLoader": "", "vesselNameVoyage": "", "croNoAndReleaseDt": "",
    "hblNumber": "", "mblNumber": "", "hblOblTlxExp": "", "mblOblSwbTlx": "",
    "railingTruckingDt": "", "stuffingDate": "", "cntrGatedIn": "", "vslBerthDt": "",
    "etd": "", "eta": "", "sellRateInr": "", "buyRateInr": "", "marginInr": "",
    "invoiceReleasedDt": "", "billingWeek": "", "billingMonth": "", "containerNo": "", "salesPerson": ""
  }
}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: systemPrompt,
        });
        const text = response.text || "";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
    }
    catch (err) {
        console.error("DSR autofill error:", err);
        res.status(500).json({ error: err.message || "Autofill failed" });
    }
});
// POST /api/dsr - create new entry
dsrRoutes.post("/", (req, res) => {
    const entry = {
        ...req.body,
        _id: "dsr_" + Date.now() + Math.random().toString(36).substr(2, 5),
        createdAt: new Date().toISOString()
    };
    oceanDsr.unshift(entry);
    res.json(entry);
});
// PUT /api/dsr/:id - update entry
dsrRoutes.put("/:id", (req, res) => {
    const index = oceanDsr.findIndex(d => d._id === req.params.id);
    if (index !== -1) {
        oceanDsr[index] = { ...oceanDsr[index], ...req.body };
        res.json({ status: "updated", record: oceanDsr[index] });
    }
    else {
        res.status(404).json({ error: "Not found" });
    }
});
// DELETE /api/dsr/:id
dsrRoutes.delete("/:id", (req, res) => {
    const before = oceanDsr.length;
    oceanDsr = oceanDsr.filter(d => d._id !== req.params.id);
    if (oceanDsr.length < before) {
        res.json({ status: "deleted" });
    }
    else {
        res.status(404).json({ error: "Not found" });
    }
});
