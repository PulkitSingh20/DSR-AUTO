// ─── Logy Mail API — Automated DSR Remark Update Service ─────────────────────
// Polls Logy Mail API every LOGY_MAIL_POLL_INTERVAL_MS (default 5 min),
// matches emails to DSR records, detects shipment events, updates remarks,
// and broadcasts real-time WebSocket notifications.

import dotenv from "dotenv";
dotenv.config();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoGyMailEmail {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  receivedAt: string;
  body: string;
  htmlBody?: string;
  headers?: Record<string, string>;
}

export interface LoGyMailAuditLog {
  id: string;
  messageId: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  dsrId: string;
  jobNumber: string;
  zipaRefNo?: string;
  matchedBy: "zipaRefNo" | "hblNumber" | "mblNumber" | "invoiceNo" | "keyword";
  detectedEvent: string;
  previousRemark: string;
  newRemark: string;
  processedAt: string;
}

export type ShipmentEvent =
  | "SHIPMENT_SAILED"
  | "BILLING_AWAITED"
  | "DOCUMENTS_RECEIVED"
  | "CUSTOMS_CLEARED"
  | "DELIVERED"
  | "UNKNOWN";

// ─── Configurable Keyword Rules ───────────────────────────────────────────────

const EVENT_KEYWORD_MAP: Record<ShipmentEvent, string[]> = {
  SHIPMENT_SAILED: [
    "vessel departed",
    "vessel has sailed",
    "vessel sailed",
    "shipment sailed",
    "sailed from",
    "departed from",
    "atd",
    "actual time of departure",
    "vessel left port",
    "ship has departed",
    "bl released",
    "goods on board",
  ],
  BILLING_AWAITED: [
    "billing awaited",
    "billing awt",
    "invoice pending",
    "awaiting billing",
    "awaiting invoice",
    "bill of lading issued",
    "hbl issued",
    "mbl issued",
    "document ready for billing",
    "freight invoice due",
  ],
  DOCUMENTS_RECEIVED: [
    "documents received",
    "docs received",
    "original bl received",
    "telex released",
    "telex release",
    "express release",
    "documents collected",
    "bl surrendered",
    "original documents received",
    "docs in hand",
    "proof of delivery documents",
  ],
  CUSTOMS_CLEARED: [
    "customs cleared",
    "out of customs",
    "customs release",
    "customs clearance done",
    "goods cleared",
    "cleared by customs",
    "duty paid",
    "customs examination completed",
    "cha cleared",
    "custom clearance completed",
  ],
  DELIVERED: [
    "shipment delivered",
    "cargo delivered",
    "delivery completed",
    "proof of delivery",
    "pod received",
    "delivered to consignee",
    "goods delivered",
    "delivery done",
    "final delivery",
    "cargo handover completed",
  ],
  UNKNOWN: [],
};

// ─── Remark Transition Logic ───────────────────────────────────────────────────

function computeNewRemark(currentRemark: string, event: ShipmentEvent): string | null {
  const normalized = (currentRemark || "").toLowerCase().trim();

  switch (event) {
    case "SHIPMENT_SAILED":
      // If currently "Sailing AWT" or similar → "Shipment Sailed / Billing AWT"
      if (
        normalized.includes("sailing awt") ||
        normalized.includes("sailing awaited") ||
        normalized.includes("awtsailing") ||
        normalized.includes("vessel expected")
      ) {
        return "Shipment Sailed / Billing AWT";
      }
      // Generic: just indicate sailed
      return "Shipment Sailed / Billing AWT";

    case "BILLING_AWAITED":
      if (!normalized.includes("billing awt") && !normalized.includes("billing awaited")) {
        return "Billing AWT";
      }
      return null; // already correct

    case "DOCUMENTS_RECEIVED":
      if (!normalized.includes("documents received") && !normalized.includes("docs received")) {
        return "Documents Received";
      }
      return null;

    case "CUSTOMS_CLEARED":
      if (!normalized.includes("customs cleared")) {
        return "Customs Cleared";
      }
      return null;

    case "DELIVERED":
      if (!normalized.includes("delivered")) {
        return "Delivered";
      }
      return null;

    default:
      return null;
  }
}

// ─── Event Detection Engine ───────────────────────────────────────────────────

function detectEvent(subject: string, body: string): ShipmentEvent {
  const text = `${subject} ${body}`.toLowerCase();

  // Priority order: DELIVERED > CUSTOMS_CLEARED > DOCUMENTS_RECEIVED > SHIPMENT_SAILED > BILLING_AWAITED
  const priority: ShipmentEvent[] = [
    "DELIVERED",
    "CUSTOMS_CLEARED",
    "DOCUMENTS_RECEIVED",
    "SHIPMENT_SAILED",
    "BILLING_AWAITED",
  ];

  for (const event of priority) {
    const keywords = EVENT_KEYWORD_MAP[event];
    if (keywords.some((kw) => text.includes(kw))) {
      return event;
    }
  }

  return "UNKNOWN";
}

// ─── Shipment Matching ────────────────────────────────────────────────────────

interface MatchResult {
  dsrId: string;
  matchedBy: LoGyMailAuditLog["matchedBy"];
  zipaRefNo?: string;
  jobNumber: string;
}

function matchDsrRecord(
  emailBody: string,
  emailSubject: string,
  dsrList: any[]
): MatchResult | null {
  const text = `${emailSubject} ${emailBody}`.toLowerCase();

  for (const dsr of dsrList) {
    // 1. Primary: ZIPA Ref No (treated as Job Number)
    if (dsr.zipaRefNo && dsr.zipaRefNo.trim()) {
      const ref = dsr.zipaRefNo.trim().toLowerCase();
      if (text.includes(ref)) {
        return {
          dsrId: dsr._id,
          matchedBy: "zipaRefNo",
          zipaRefNo: dsr.zipaRefNo,
          jobNumber: dsr.zipaRefNo,
        };
      }
    }

    // 2. Fallback: HBL Number
    if (dsr.hblNumber && dsr.hblNumber.trim()) {
      const hbl = dsr.hblNumber.trim().toLowerCase();
      if (hbl.length > 4 && text.includes(hbl)) {
        return {
          dsrId: dsr._id,
          matchedBy: "hblNumber",
          zipaRefNo: dsr.zipaRefNo,
          jobNumber: dsr.zipaRefNo || dsr.hblNumber,
        };
      }
    }

    // 3. Fallback: MBL Number
    if (dsr.mblNumber && dsr.mblNumber.trim()) {
      const mbl = dsr.mblNumber.trim().toLowerCase();
      if (mbl.length > 4 && text.includes(mbl)) {
        return {
          dsrId: dsr._id,
          matchedBy: "mblNumber",
          zipaRefNo: dsr.zipaRefNo,
          jobNumber: dsr.zipaRefNo || dsr.mblNumber,
        };
      }
    }

    // 4. Fallback: Invoice No (extract from "shipperInvNoAndDate")
    if (dsr.shipperInvNoAndDate && dsr.shipperInvNoAndDate.trim()) {
      // Extract the invoice number part before the " - " separator
      const invPart = dsr.shipperInvNoAndDate.split(" - ")[0]?.trim().toLowerCase();
      if (invPart && invPart.length > 4 && text.includes(invPart)) {
        return {
          dsrId: dsr._id,
          matchedBy: "invoiceNo",
          zipaRefNo: dsr.zipaRefNo,
          jobNumber: dsr.zipaRefNo || invPart,
        };
      }
    }
  }

  return null;
}

// ─── Logy Mail API Client ─────────────────────────────────────────────────────

async function fetchLogyMailEmails(
  apiUrl: string,
  apiKey: string,
  maxEmails: number
): Promise<LoGyMailEmail[]> {
  // Logy Mail API — fetch inbox messages
  // Adapter: adjust the URL structure to match actual Logy Mail API docs
  const url = `${apiUrl.replace(/\/$/, "")}/messages?limit=${maxEmails}&folder=inbox`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Logy Mail API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Normalise the response into our LoGyMailEmail shape.
  // Logy Mail API may return: { messages: [...] } or { data: { messages: [...] } } or a direct array.
  // We handle all common shapes here:
  const raw: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
    ? data.messages
    : Array.isArray(data?.data?.messages)
    ? data.data.messages
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return raw.map((msg: any) => ({
    messageId: msg.messageId || msg.message_id || msg.id || msg._id || "",
    subject: msg.subject || msg.Subject || "",
    from: msg.from || msg.From || msg.sender || "",
    to: msg.to || msg.To || msg.recipient || "",
    receivedAt: msg.receivedAt || msg.received_at || msg.date || msg.Date || new Date().toISOString(),
    body: msg.body || msg.text || msg.plainText || msg.plain_text || msg.content || "",
    htmlBody: msg.htmlBody || msg.html || msg.bodyHtml || "",
    headers: msg.headers || {},
  }));
}

// ─── Retry with Exponential Backoff ──────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[LoGyMail] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─── Audit Log Store ──────────────────────────────────────────────────────────

const auditLogs: LoGyMailAuditLog[] = [];

function addAuditLog(entry: Omit<LoGyMailAuditLog, "id">): LoGyMailAuditLog {
  const log: LoGyMailAuditLog = {
    ...entry,
    id: `lm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  auditLogs.unshift(log); // newest first
  // Keep at most 1000 entries in memory
  if (auditLogs.length > 1000) auditLogs.pop();
  return log;
}

export function getAuditLogs(page = 1, limit = 50): { logs: LoGyMailAuditLog[]; total: number; page: number; pages: number } {
  const total = auditLogs.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  return { logs: auditLogs.slice(start, start + limit), total, page, pages };
}

// ─── Service State ─────────────────────────────────────────────────────────────

interface ServiceStatus {
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
  processedMessageIds: number;
  pollIntervalMs: number;
}

// ─── Main Service ─────────────────────────────────────────────────────────────

class LoGyMailService {
  private intervalId: NodeJS.Timeout | null = null;
  private processedIds = new Set<string>();
  private broadcast: ((channel: string, data: unknown) => void) | null = null;
  private dsrStore: any[] | null = null; // reference to the DSR in-memory array

  private status: ServiceStatus = {
    running: false,
    lastRunAt: null,
    nextRunAt: null,
    lastError: null,
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0,
    processedMessageIds: 0,
    pollIntervalMs: parseInt(process.env.LOGY_MAIL_POLL_INTERVAL_MS || "300000", 10),
  };

  /** Attach the DSR in-memory store reference so the service can mutate it */
  attachDsrStore(store: any[]) {
    this.dsrStore = store;
  }

  start(broadcastFn: (channel: string, data: unknown) => void) {
    this.broadcast = broadcastFn;
    this.status.running = true;

    const pollInterval = this.status.pollIntervalMs;

    // Run immediately on start
    this.runSync().catch((err) => {
      console.error("[LoGyMail] Initial sync failed:", err);
    });

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.runSync().catch((err) => {
        console.error("[LoGyMail] Periodic sync failed:", err);
      });
    }, pollInterval);

    this.updateNextRunAt();
    console.log(
      `✉️  Logy Mail service started — polling every ${pollInterval / 1000}s`
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.running = false;
    console.log("[LoGyMail] Service stopped.");
  }

  /** Force an immediate sync — called by the manual sync API */
  async syncNow(): Promise<{ processed: number; updated: number; errors: number }> {
    return this.runSync();
  }

  getStatus(): ServiceStatus & { auditLogCount: number } {
    return {
      ...this.status,
      processedMessageIds: this.processedIds.size,
      auditLogCount: auditLogs.length,
    };
  }

  private updateNextRunAt() {
    const next = new Date(Date.now() + this.status.pollIntervalMs);
    this.status.nextRunAt = next.toISOString();
  }

  private async runSync(): Promise<{ processed: number; updated: number; errors: number }> {
    const apiUrl = process.env.LOGY_MAIL_API_URL;
    const apiKey = process.env.LOGY_MAIL_API_KEY;

    const counters = { processed: 0, updated: 0, errors: 0 };

    if (!apiUrl || !apiKey) {
      const msg = "LOGY_MAIL_API_URL or LOGY_MAIL_API_KEY not configured — skipping sync";
      console.warn(`[LoGyMail] ${msg}`);
      this.status.lastError = msg;
      this.updateNextRunAt();
      return counters;
    }

    if (!this.dsrStore) {
      const msg = "DSR store not attached — call attachDsrStore() before starting";
      console.warn(`[LoGyMail] ${msg}`);
      this.status.lastError = msg;
      return counters;
    }

    const maxEmails = parseInt(process.env.LOGY_MAIL_MAX_EMAILS_PER_POLL || "50", 10);

    try {
      console.log("[LoGyMail] Fetching emails from Logy Mail API...");
      const emails = await withRetry(() => fetchLogyMailEmails(apiUrl, apiKey, maxEmails));
      console.log(`[LoGyMail] Fetched ${emails.length} email(s).`);

      for (const email of emails) {
        try {
          await this.processEmail(email, counters);
        } catch (err: any) {
          counters.errors++;
          this.status.totalErrors++;
          console.error(`[LoGyMail] Error processing email "${email.messageId}":`, err.message);
        }
      }

      this.status.lastRunAt = new Date().toISOString();
      this.status.lastError = null;
      this.status.totalProcessed += counters.processed;
      this.status.totalUpdated += counters.updated;
      this.updateNextRunAt();

      console.log(
        `[LoGyMail] Sync complete — processed: ${counters.processed}, updated: ${counters.updated}, errors: ${counters.errors}`
      );
    } catch (err: any) {
      this.status.lastError = err.message;
      this.status.totalErrors++;
      this.status.lastRunAt = new Date().toISOString();
      this.updateNextRunAt();
      console.error("[LoGyMail] Sync failed:", err.message);
    }

    return counters;
  }

  private async processEmail(email: LoGyMailEmail, counters: { processed: number; updated: number; errors: number }) {
    const msgId = email.messageId;
    if (!msgId) {
      console.warn("[LoGyMail] Email missing messageId — skipping");
      return;
    }

    // Duplicate check
    if (this.processedIds.has(msgId)) {
      return; // Already processed
    }

    // Detect shipment event
    const event = detectEvent(email.subject, email.body);
    counters.processed++;
    this.status.totalProcessed++;

    if (event === "UNKNOWN") {
      // Still mark as processed to avoid reprocessing
      this.processedIds.add(msgId);
      this.status.processedMessageIds = this.processedIds.size;
      console.log(`[LoGyMail] Email "${email.subject}" — no recognisable event detected`);
      return;
    }

    // Match DSR record
    const match = matchDsrRecord(email.body, email.subject, this.dsrStore!);
    if (!match) {
      this.processedIds.add(msgId);
      this.status.processedMessageIds = this.processedIds.size;
      console.log(
        `[LoGyMail] Email "${email.subject}" — event ${event} detected but no matching DSR record found`
      );
      return;
    }

    // Find the record
    const dsrIndex = this.dsrStore!.findIndex((d) => d._id === match.dsrId);
    if (dsrIndex === -1) {
      console.warn(`[LoGyMail] DSR record ${match.dsrId} vanished from store`);
      return;
    }

    const record = this.dsrStore![dsrIndex];
    const previousRemark = record.remarks || "";

    // Compute new remark
    const newRemark = computeNewRemark(previousRemark, event);
    if (!newRemark) {
      // No change needed — already correct remark
      this.processedIds.add(msgId);
      this.status.processedMessageIds = this.processedIds.size;
      console.log(
        `[LoGyMail] DSR ${match.jobNumber} already has correct remark for event ${event}`
      );
      return;
    }

    // Apply update (transaction-safe for in-memory store)
    this.dsrStore![dsrIndex] = {
      ...record,
      remarks: newRemark,
      lastAutoUpdatedAt: new Date().toISOString(),
      lastAutoUpdatedBy: "LoGyMail",
    };

    // Mark as processed
    this.processedIds.add(msgId);
    this.status.processedMessageIds = this.processedIds.size;
    counters.updated++;
    this.status.totalUpdated++;

    // Audit log
    const logEntry = addAuditLog({
      messageId: msgId,
      emailSubject: email.subject,
      emailFrom: email.from,
      emailDate: email.receivedAt,
      dsrId: match.dsrId,
      jobNumber: match.jobNumber,
      zipaRefNo: match.zipaRefNo,
      matchedBy: match.matchedBy,
      detectedEvent: event,
      previousRemark,
      newRemark,
      processedAt: new Date().toISOString(),
    });

    console.log(
      `[LoGyMail] ✅ Updated DSR ${match.jobNumber}: "${previousRemark}" → "${newRemark}" (event: ${event})`
    );

    // Broadcast real-time WebSocket notification
    if (this.broadcast) {
      this.broadcast("dsr_remark_update", {
        dsrId: match.dsrId,
        jobNumber: match.jobNumber,
        zipaRefNo: match.zipaRefNo,
        shipperName: record.shipperName || "",
        previousRemark,
        newRemark,
        detectedEvent: event,
        emailSubject: email.subject,
        emailFrom: email.from,
        processedAt: logEntry.processedAt,
        logId: logEntry.id,
      });
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const logyMailService = new LoGyMailService();
