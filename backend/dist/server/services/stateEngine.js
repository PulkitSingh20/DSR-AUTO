// ─── Shipment State Machine ──────────────────────────────────────────────────
// Manages the 20-stage lifecycle with validated transitions,
// customer branching (NEW vs EXISTING), and trigger hooks.
import { ShipmentModel } from "../models/Shipment.js";
import { CustomerModel } from "../models/Customer.js";
import { ReminderModel } from "../models/Reminder.js";
import { DsrRecordModel } from "../models/DsrRecord.js";
import { ActivityLogModel } from "../models/ActivityLog.js";
import { auditLog } from "../database/repositories.js";
// ─── The 20 Stages ──────────────────────────────────────────────────────────
export const SHIPMENT_STAGES = [
    "inquiry_received",
    "quotation_sent",
    "shipping_line_selected",
    "booking_requested",
    "booking_confirmed",
    "kyc_pending", // Only for NEW customers
    "job_opened",
    "si_vgm_cutoff_shared",
    "container_pickup_pending",
    "si_submitted",
    "notify_party_pending",
    "draft_bl_received",
    "draft_bl_approved",
    "bl_approved_portal",
    "vessel_sailed",
    "liner_invoice_received",
    "billing_requested",
    "invoice_sent_to_customer",
    "payment_details_shared",
    "shipment_closed",
];
// ─── Allowed Transitions ────────────────────────────────────────────────────
const TRANSITIONS = {
    inquiry_received: ["quotation_sent"],
    quotation_sent: ["shipping_line_selected"],
    shipping_line_selected: ["booking_requested"],
    booking_requested: ["booking_confirmed"],
    booking_confirmed: ["kyc_pending", "job_opened"], // branch point
    kyc_pending: ["job_opened"],
    job_opened: ["si_vgm_cutoff_shared"],
    si_vgm_cutoff_shared: ["container_pickup_pending"],
    container_pickup_pending: ["si_submitted"],
    si_submitted: ["notify_party_pending"],
    notify_party_pending: ["draft_bl_received"],
    draft_bl_received: ["draft_bl_approved"],
    draft_bl_approved: ["bl_approved_portal"],
    bl_approved_portal: ["vessel_sailed"],
    vessel_sailed: ["liner_invoice_received"],
    liner_invoice_received: ["billing_requested"],
    billing_requested: ["invoice_sent_to_customer"],
    invoice_sent_to_customer: ["payment_details_shared"],
    payment_details_shared: ["shipment_closed"],
    shipment_closed: [], // terminal
};
const STAGE_TRIGGERS = {
    "booking_confirmed→kyc_pending": [
        { type: "email", template: "kyc_request", to: "customer" },
        { type: "reminder", title: "KYC Documents Due", days: 3 },
        { type: "customer_tag", tag: "KYC_PENDING" },
    ],
    "booking_confirmed→job_opened": [
        { type: "generate_job_number" },
        { type: "email", template: "job_opened", to: "customer" },
        { type: "customer_tag", tag: "ACTIVE_SHIPMENT" },
    ],
    "kyc_pending→job_opened": [
        { type: "generate_job_number" },
        { type: "customer_tag", tag: "ACTIVE_SHIPMENT" },
    ],
    "job_opened→si_vgm_cutoff_shared": [
        { type: "email", template: "si_vgm_cutoff", to: "customer" },
        { type: "reminder", title: "SI/VGM Cutoff Approaching", days: 2 },
    ],
    "si_submitted→notify_party_pending": [
        { type: "reminder", title: "Notify Party Details Needed", days: 1 },
    ],
    "notify_party_pending→draft_bl_received": [
        { type: "email", template: "bl_draft_review", to: "customer" },
        { type: "reminder", title: "BL Draft Approval Pending", days: 2 },
    ],
    "draft_bl_approved→bl_approved_portal": [
        { type: "dsr_update", field: "current_stage", value: "bl_approved_portal" },
    ],
    "bl_approved_portal→vessel_sailed": [
        { type: "dsr_update", field: "current_stage", value: "vessel_sailed" },
        { type: "reminder", title: "Await Liner Invoice", days: 5 },
    ],
    "liner_invoice_received→billing_requested": [
        { type: "dsr_update", field: "billing_status", value: "invoiced" },
    ],
    "invoice_sent_to_customer→payment_details_shared": [
        { type: "reminder", title: "Payment Follow-up", days: 7 },
    ],
    "payment_details_shared→shipment_closed": [
        { type: "dsr_close" },
        { type: "dsr_update", field: "payment_status", value: "received" },
        { type: "customer_tag", tag: "COMPLETED" },
    ],
};
export async function transitionShipment(shipmentId, targetStage, userId = "system") {
    const shipment = await ShipmentModel.findById(shipmentId).lean();
    if (!shipment) {
        return { success: false, error: "Shipment not found", from: "", to: targetStage, triggers: [] };
    }
    const currentStage = shipment.status;
    const allowed = TRANSITIONS[currentStage];
    if (!allowed || !allowed.includes(targetStage)) {
        return {
            success: false,
            error: `Cannot transition from "${currentStage}" to "${targetStage}". Allowed: [${(allowed || []).join(", ")}]`,
            from: currentStage,
            to: targetStage,
            triggers: [],
        };
    }
    // Update stage timestamps
    let timestamps = typeof shipment.stage_timestamps === "object" ? shipment.stage_timestamps || {} : {};
    timestamps[targetStage] = new Date().toISOString();
    // Generate job number if triggered
    let jobNumber = shipment.job_number;
    const triggerKey = `${currentStage}→${targetStage}`;
    const triggers = STAGE_TRIGGERS[triggerKey] || [];
    if (triggers.some(t => t.type === "generate_job_number") && !jobNumber) {
        const seq = await ShipmentModel.countDocuments({ job_number: { $ne: null } }) + 1;
        jobNumber = `JOB-${String(seq).padStart(5, "0")}`;
    }
    // Apply the transition
    await ShipmentModel.findByIdAndUpdate(shipmentId, {
        status: targetStage,
        stage_timestamps: timestamps,
        job_number: jobNumber || shipment.job_number,
    });
    await auditLog("shipments", shipmentId, "STAGE_TRANSITION", userId, {
        from: currentStage,
        to: targetStage,
    });
    // Execute side-effect triggers
    await executeTriggers(shipmentId, shipment, triggers, userId);
    return {
        success: true,
        from: currentStage,
        to: targetStage,
        triggers,
        jobNumber: jobNumber || undefined,
    };
}
// ─── Execute triggers ───────────────────────────────────────────────────────
async function executeTriggers(shipmentId, shipment, triggers, userId) {
    for (const trigger of triggers) {
        try {
            switch (trigger.type) {
                case "reminder":
                    if (trigger.title && trigger.days) {
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + trigger.days);
                        await ReminderModel.create({
                            shipment_id: shipmentId,
                            title: trigger.title,
                            message: `Auto-generated reminder for shipment ${shipmentId}`,
                            due_date: dueDate.toISOString(),
                            priority: "high",
                            created_by: userId
                        });
                    }
                    break;
                case "dsr_update":
                    if (trigger.field && trigger.value) {
                        const existing = await DsrRecordModel.findOne({ shipment_id: shipmentId }).lean();
                        if (existing) {
                            await DsrRecordModel.updateOne({ shipment_id: shipmentId }, { [trigger.field]: trigger.value });
                        }
                        else {
                            await DsrRecordModel.create({
                                shipment_id: shipmentId,
                                job_number: shipment.job_number,
                                customer_name: shipment.shipper,
                                shipping_line: shipment.carrier,
                                current_stage: trigger.value
                            });
                        }
                    }
                    break;
                case "dsr_close":
                    await DsrRecordModel.updateOne({ shipment_id: shipmentId }, { is_closed: 1, closed_at: new Date() });
                    break;
                case "customer_tag":
                    if (trigger.tag && shipment.customer_id) {
                        await CustomerModel.findByIdAndUpdate(shipment.customer_id, { customer_tag: trigger.tag });
                    }
                    break;
                case "email":
                    await ActivityLogModel.create({
                        user_id: userId,
                        action: "email_trigger",
                        module: "state_engine",
                        details: { shipmentId, template: trigger.template, to: trigger.to }
                    });
                    break;
                case "generate_job_number":
                    break;
            }
        }
        catch (err) {
            console.error(`[StateEngine] Trigger failed for ${shipmentId}:`, trigger, err);
        }
    }
}
// ─── Helper: determine next stage based on customer type ────────────────────
export async function getNextStageAfterBooking(customerId) {
    if (!customerId)
        return "job_opened";
    const customer = await CustomerModel.findById(customerId).lean();
    if (!customer)
        return "job_opened";
    // NEW customers without verified KYC go through KYC stage
    if (customer.customer_tag === "NEW_CUSTOMER" && customer.kyc_status !== "verified") {
        return "kyc_pending";
    }
    return "job_opened";
}
// ─── Helper: get stage info ─────────────────────────────────────────────────
export function getStageInfo(stage) {
    const index = SHIPMENT_STAGES.indexOf(stage);
    return {
        stage,
        index,
        total: SHIPMENT_STAGES.length,
        progress: index >= 0 ? Math.round(((index + 1) / SHIPMENT_STAGES.length) * 100) : 0,
        isTerminal: stage === "shipment_closed",
        nextAllowed: TRANSITIONS[stage] || [],
    };
}
// ─── Helper: get all stages with their status for a shipment ────────────────
export async function getShipmentTimeline(shipmentId) {
    const shipment = await ShipmentModel.findById(shipmentId).lean();
    if (!shipment)
        return null;
    let timestamps = typeof shipment.stage_timestamps === "object" ? shipment.stage_timestamps || {} : {};
    const currentIdx = SHIPMENT_STAGES.indexOf(shipment.status);
    return SHIPMENT_STAGES.map((stage, idx) => ({
        stage,
        label: stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        status: idx < currentIdx ? "completed"
            : idx === currentIdx ? "current"
                : "upcoming",
        completedAt: timestamps[stage] || null,
    }));
}
