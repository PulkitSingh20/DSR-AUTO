const INITIAL_SHIPMENTS = [
    {
        id: "EID0943542",
        description: "Lithium Battery Units",
        shipper: "Global Tech Industries",
        consignee: "Rotterdam Port Authority",
        origin: "Mumbai, IN",
        destination: "Rotterdam, NL",
        carrier: "Maersk",
        type: "sea",
        status: "bl_approved",
        mawb: undefined,
        hawb: undefined,
        blNumber: "MSK2024-A492",
        containerNumber: "MSKU3984722",
        vesselId: "V1",
        payload: "Lithium Units (42t)",
        weight: 42000,
        cbm: 180,
        eta: "2024-10-24T08:30:00Z",
        etd: "2024-10-10T12:00:00Z",
        createdAt: "2024-10-01T09:00:00Z",
        updatedAt: new Date().toISOString(),
        notes: "Hazmat DG Class 9. Requires MSDS certificate.",
        customsStatus: "cleared",
    },
    {
        id: "EID0944019",
        description: "Propulsion Parts",
        shipper: "Aero Dynamics Co.",
        consignee: "Seattle Manufacturing Hub",
        origin: "Shanghai, CN",
        destination: "Seattle, US",
        carrier: "Shipment Express",
        type: "air",
        status: "kyc_pending",
        mawb: "180-40012445",
        hawb: "H-SEA-9933",
        payload: "Propulsion Parts",
        weight: 2100,
        cbm: 12,
        eta: "2024-10-22T14:15:00Z",
        etd: "2024-10-21T06:00:00Z",
        createdAt: "2024-10-15T11:00:00Z",
        updatedAt: new Date().toISOString(),
        notes: "Customer KYC documents pending.",
        customsStatus: "pending",
    },
    {
        id: "EID0944112",
        description: "Semiconductors",
        shipper: "Microchips Inc.",
        consignee: "Hsinchu Science Park",
        origin: "Singapore, SG",
        destination: "Hsinchu, TW",
        carrier: "Global Transit",
        type: "air",
        status: "si_submitted",
        mawb: "618-20934871",
        hawb: "H-TWN-0044",
        payload: "Semiconductors (High Value)",
        weight: 320,
        cbm: 2.4,
        eta: "2024-10-25T10:00:00Z",
        etd: "2024-10-23T18:00:00Z",
        createdAt: "2024-10-18T08:00:00Z",
        updatedAt: new Date().toISOString(),
        notes: "High-value cargo. Insurance required.",
        customsStatus: "pending",
    },
];
const store = new Map(INITIAL_SHIPMENTS.map(s => [s.id, s]));
export const shipmentStore = {
    getAll() {
        return Array.from(store.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    getById(id) {
        return store.get(id);
    },
    create(data) {
        const shipment = {
            ...data,
            id: `EID${Math.floor(Math.random() * 9000000 + 1000000)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        store.set(shipment.id, shipment);
        return shipment;
    },
    update(id, data) {
        const existing = store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
        store.set(id, updated);
        return updated;
    },
    delete(id) {
        return store.delete(id);
    },
    search(query) {
        const q = query.toLowerCase();
        return this.getAll().filter(s => s.id.toLowerCase().includes(q) ||
            s.shipper.toLowerCase().includes(q) ||
            s.destination.toLowerCase().includes(q) ||
            s.payload.toLowerCase().includes(q));
    },
    getByStatus(status) {
        return this.getAll().filter(s => s.status === status);
    },
    getStats() {
        const all = this.getAll();
        return {
            total: all.length,
            byStatus: Object.fromEntries(["inquiry", "booking", "kyc_pending", "si_submitted", "bl_approved", "completed"].map(s => [
                s, all.filter(a => a.status === s).length
            ])),
            byType: {
                sea: all.filter(s => s.type === "sea").length,
                air: all.filter(s => s.type === "air").length,
                road: all.filter(s => s.type === "road").length,
            },
            customsClear: all.filter(s => s.customsStatus === "cleared").length,
        };
    }
};
