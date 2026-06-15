// Email monitoring service
// In production, integrate with SendGrid / Mailgun / Nodemailer SMTP
// This service tracks email delivery, bounces, and opens

export interface EmailRecord {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "opened" | "failed";
  shipmentId?: string;
  type: "reminder" | "manifest" | "alert" | "invoice" | "kyc";
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  error?: string;
}

const emailQueue: EmailRecord[] = [];
const emailHistory: EmailRecord[] = [];

// Seed some historical emails
emailHistory.push(
  {
    id: "em_001", to: "markus.vane@globaltech.com", from: "ops@zipaworld.com",
    subject: "Shipment EID0943542 — Critical Delay Alert",
    body: "Your shipment from Global Tech Industries is experiencing a critical delay. ETA updated to Oct 24.",
    status: "opened", shipmentId: "EID0943542", type: "alert",
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 3540000).toISOString(),
    openedAt: new Date(Date.now() - 3480000).toISOString(),
  },
  {
    id: "em_002", to: "procurement@aerodynamics.com", from: "ops@zipaworld.com",
    subject: "KYC Document Request — EID0944019",
    body: "Please submit the remaining KYC documents for your air freight shipment.",
    status: "delivered", shipmentId: "EID0944019", type: "kyc",
    sentAt: new Date(Date.now() - 7200000).toISOString(),
    deliveredAt: new Date(Date.now() - 7140000).toISOString(),
    openedAt: null,
  },
  {
    id: "em_003", to: "finance@matrixcorp.in", from: "billing@zipaworld.com",
    subject: "Invoice INV-882 — Payment Due",
    body: "Invoice #INV-882 for shipment services is due. Please process payment.",
    status: "bounced", type: "invoice",
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    deliveredAt: null, openedAt: null,
    error: "550 5.1.1 User unknown",
  }
);

export const emailMonitor = {
  intervalId: null as NodeJS.Timeout | null,

  start(broadcast: (channel: string, data: unknown) => void) {
    this.intervalId = setInterval(() => {
      // Process queued emails (simulate delivery)
      emailQueue.forEach((email) => {
        if (email.status === "queued") {
          email.status = Math.random() > 0.1 ? "sent" : "failed";
          email.sentAt = new Date().toISOString();

          if (email.status === "sent") {
            setTimeout(() => {
              email.status = Math.random() > 0.05 ? "delivered" : "bounced";
              email.deliveredAt = email.status === "delivered" ? new Date().toISOString() : null;
              if (email.status === "bounced") email.error = "550 Mailbox unavailable";

              broadcast("email_update", {
                emailId: email.id,
                status: email.status,
                to: email.to,
                subject: email.subject,
              });

              emailHistory.push({ ...email });
            }, 2000 + Math.random() * 3000);
          }
        }
      });

      // Randomly simulate an email open
      const unread = emailHistory.filter(e => e.status === "delivered" && !e.openedAt);
      if (unread.length > 0 && Math.random() > 0.8) {
        const email = unread[Math.floor(Math.random() * unread.length)];
        email.status = "opened";
        email.openedAt = new Date().toISOString();
        broadcast("email_update", {
          emailId: email.id, status: "opened",
          to: email.to, subject: email.subject,
          openedAt: email.openedAt,
        });
      }
    }, 5000);

    console.log("📧 Email monitor started");
  },

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  },

  send(data: Omit<EmailRecord, "id" | "sentAt" | "deliveredAt" | "openedAt" | "status">): EmailRecord {
    const record: EmailRecord = {
      ...data,
      id: `em_${Math.random().toString(36).slice(2, 9)}`,
      status: "queued",
      sentAt: null,
      deliveredAt: null,
      openedAt: null,
    };
    emailQueue.push(record);
    return record;
  },

  getHistory() {
    return [...emailHistory, ...emailQueue];
  },

  getStats() {
    const all = this.getHistory();
    return {
      total: all.length,
      sent: all.filter(e => ["sent", "delivered", "opened"].includes(e.status)).length,
      delivered: all.filter(e => ["delivered", "opened"].includes(e.status)).length,
      opened: all.filter(e => e.status === "opened").length,
      bounced: all.filter(e => e.status === "bounced").length,
      failed: all.filter(e => e.status === "failed").length,
      openRate: all.length > 0
        ? Math.round((all.filter(e => e.status === "opened").length / all.length) * 100)
        : 0,
    };
  }
};
