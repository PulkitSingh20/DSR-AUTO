// ─── ZIP-A-WORLD Local SQLite Database ───────────────────────────────────────
// Self-contained, file-based, zero external dependencies.
// Data is stored in ./data/zipaworld.db — back it up by copying that file.
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR))
    fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "zipaworld.db");
export const db = new Database(DB_PATH);
// Performance settings
db.pragma("journal_mode = WAL"); // allows concurrent reads
db.pragma("foreign_keys = ON"); // enforce relationships
db.pragma("synchronous = NORMAL"); // safe + fast
console.log(`✅ Database connected: ${DB_PATH}`);
// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  -- Customers / Shippers
  CREATE TABLE IF NOT EXISTS customers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    country     TEXT,
    address     TEXT,
    type        TEXT DEFAULT 'shipper',  -- shipper | consignee | both
    kyc_status  TEXT DEFAULT 'pending',  -- pending | verified | rejected
    notes       TEXT DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Shipments
  CREATE TABLE IF NOT EXISTS shipments (
    id                TEXT PRIMARY KEY,
    description       TEXT NOT NULL,
    shipper           TEXT NOT NULL,
    consignee         TEXT NOT NULL,
    origin            TEXT NOT NULL,
    destination       TEXT NOT NULL,
    carrier           TEXT NOT NULL,
    type              TEXT NOT NULL DEFAULT 'sea',  -- sea | air | road
    status            TEXT NOT NULL DEFAULT 'inquiry_received',
    mawb              TEXT,
    hawb              TEXT,
    bl_number         TEXT,
    container_number  TEXT,
    vessel_id         TEXT,
    payload           TEXT NOT NULL,
    weight            REAL DEFAULT 0,
    cbm               REAL DEFAULT 0,
    eta               TEXT,
    etd               TEXT,
    customs_status    TEXT DEFAULT 'pending',  -- pending | cleared | hold
    notes             TEXT DEFAULT '',
    created_by        TEXT,  -- Clerk user ID
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Tracking events per shipment
  CREATE TABLE IF NOT EXISTS tracking_events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id  TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    event        TEXT NOT NULL,
    location     TEXT,
    lat          REAL,
    lng          REAL,
    notes        TEXT,
    occurred_at  TEXT NOT NULL DEFAULT (datetime('now')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Email log
  CREATE TABLE IF NOT EXISTS emails (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id  TEXT REFERENCES shipments(id) ON DELETE SET NULL,
    to_address   TEXT NOT NULL,
    subject      TEXT NOT NULL,
    body         TEXT NOT NULL,
    type         TEXT DEFAULT 'general',  -- general | bl | kyc | invoice | alert
    status       TEXT DEFAULT 'sent',     -- sent | failed | bounced
    sent_at      TEXT NOT NULL DEFAULT (datetime('now')),
    created_by   TEXT
  );

  -- Documents
  CREATE TABLE IF NOT EXISTS documents (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id  TEXT REFERENCES shipments(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    type         TEXT NOT NULL,  -- bl | invoice | kyc | packing_list | certificate
    file_path    TEXT,
    status       TEXT DEFAULT 'pending',  -- pending | approved | rejected
    notes        TEXT DEFAULT '',
    uploaded_at  TEXT NOT NULL DEFAULT (datetime('now')),
    uploaded_by  TEXT
  );

  -- Reminders
  CREATE TABLE IF NOT EXISTS reminders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id  TEXT REFERENCES shipments(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    message      TEXT NOT NULL,
    due_date     TEXT NOT NULL,
    priority     TEXT DEFAULT 'medium',  -- low | medium | high | critical
    status       TEXT DEFAULT 'pending', -- pending | done | snoozed
    created_by   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- API keys (for M2M access)
  CREATE TABLE IF NOT EXISTS api_keys (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    key_hash     TEXT NOT NULL UNIQUE,
    permissions  TEXT DEFAULT '["read"]',
    owner        TEXT NOT NULL,
    last_used    TEXT,
    usage_count  INTEGER DEFAULT 0,
    is_active    INTEGER DEFAULT 1,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Audit log — every data change recorded
  CREATE TABLE IF NOT EXISTS audit_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name   TEXT NOT NULL,
    record_id    TEXT NOT NULL,
    action       TEXT NOT NULL,  -- CREATE | UPDATE | DELETE
    changed_by   TEXT,
    changes      TEXT,           -- JSON diff
    occurred_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══ NEW TABLES ════════════════════════════════════════════════════════════

  -- Quotations — rate comparison and selection
  CREATE TABLE IF NOT EXISTS quotations (
    id            TEXT PRIMARY KEY,
    shipment_id   TEXT REFERENCES shipments(id) ON DELETE CASCADE,
    customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
    rates         TEXT NOT NULL DEFAULT '[]',   -- JSON [{line, 20ST, 40HC, transit, validity}]
    selected_line TEXT,
    status        TEXT DEFAULT 'draft',         -- draft | sent | accepted | rejected | expired
    valid_until   TEXT,
    created_by    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Invoices — DB-backed billing lifecycle
  CREATE TABLE IF NOT EXISTS invoices (
    id            TEXT PRIMARY KEY,
    shipment_id   TEXT REFERENCES shipments(id) ON DELETE CASCADE,
    customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
    type          TEXT NOT NULL DEFAULT 'customer', -- liner | customer
    amount        REAL NOT NULL DEFAULT 0,
    currency      TEXT DEFAULT 'USD',
    status        TEXT DEFAULT 'pending',
    -- pending | sent_to_accounts | generated | sent_to_customer | paid
    due_date      TEXT,
    paid_date     TEXT,
    notes         TEXT DEFAULT '',
    has_reminder  INTEGER DEFAULT 0,
    created_by    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Mail log — classified inbound/outbound emails
  CREATE TABLE IF NOT EXISTS mail_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id      TEXT UNIQUE,
    direction       TEXT NOT NULL DEFAULT 'inbound',  -- inbound | outbound
    from_address    TEXT NOT NULL,
    to_address      TEXT NOT NULL,
    subject         TEXT NOT NULL,
    body_preview    TEXT DEFAULT '',
    classification  TEXT DEFAULT 'unknown',
    -- inquiry | quotation_request | booking_confirmation | si | vgm | kyc |
    -- invoice | bl_draft | payment | shipping_line_update | general
    shipment_id     TEXT REFERENCES shipments(id) ON DELETE SET NULL,
    customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
    attachments     TEXT DEFAULT '[]',  -- JSON [{name, type, path, size}]
    processed       INTEGER DEFAULT 0,
    processed_at    TEXT,
    error           TEXT,
    received_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- DSR records — daily shipping report
  CREATE TABLE IF NOT EXISTS dsr_records (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id     TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    job_number      TEXT,
    customer_name   TEXT,
    shipping_line   TEXT,
    etd             TEXT,
    eta             TEXT,
    current_stage   TEXT,
    billing_status  TEXT DEFAULT 'pending',  -- pending | invoiced | paid
    payment_status  TEXT DEFAULT 'pending',  -- pending | partial | received
    pending_actions TEXT DEFAULT '[]',       -- JSON
    is_closed       INTEGER DEFAULT 0,
    closed_at       TEXT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Users & roles
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    clerk_id    TEXT UNIQUE,
    username    TEXT NOT NULL,
    email       TEXT,
    role        TEXT DEFAULT 'operations',  -- operations | accounts | admin | sales
    is_active   INTEGER DEFAULT 1,
    last_login  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Activity log — granular user actions
  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT,
    action      TEXT NOT NULL,
    module      TEXT NOT NULL,
    details     TEXT,      -- JSON
    ip_address  TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══ INDEXES ══════════════════════════════════════════════════════════════
  CREATE INDEX IF NOT EXISTS idx_shipments_status     ON shipments(status);
  CREATE INDEX IF NOT EXISTS idx_shipments_shipper    ON shipments(shipper);
  CREATE INDEX IF NOT EXISTS idx_shipments_carrier    ON shipments(carrier);
  CREATE INDEX IF NOT EXISTS idx_tracking_shipment    ON tracking_events(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_emails_shipment      ON emails(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_audit_table          ON audit_log(table_name, record_id);
  CREATE INDEX IF NOT EXISTS idx_quotations_shipment  ON quotations(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_quotations_customer  ON quotations(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_shipment    ON invoices(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_mail_classification  ON mail_log(classification);
  CREATE INDEX IF NOT EXISTS idx_mail_shipment        ON mail_log(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_dsr_shipment         ON dsr_records(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_users_clerk          ON users(clerk_id);
  CREATE INDEX IF NOT EXISTS idx_activity_module      ON activity_log(module);
`);
// ─── Safe ALTER TABLE migrations ──────────────────────────────────────────────
// Wraps each ALTER in try/catch so re-runs are idempotent (column already exists = no-op)
function safeAlter(sql) {
    try {
        db.exec(sql);
    }
    catch { /* column already exists — ignore */ }
}
// Extend customers table
safeAlter(`ALTER TABLE customers ADD COLUMN contact_person   TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE customers ADD COLUMN shipment_history TEXT DEFAULT '[]'`);
safeAlter(`ALTER TABLE customers ADD COLUMN preferred_lines  TEXT DEFAULT '[]'`);
safeAlter(`ALTER TABLE customers ADD COLUMN payment_status   TEXT DEFAULT 'none'`);
safeAlter(`ALTER TABLE customers ADD COLUMN customer_tag     TEXT DEFAULT 'NEW_CUSTOMER'`);
// Extend shipments table for 20-stage lifecycle
safeAlter(`ALTER TABLE shipments ADD COLUMN job_number         TEXT`);
safeAlter(`ALTER TABLE shipments ADD COLUMN commodity          TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN gross_weight       REAL DEFAULT 0`);
safeAlter(`ALTER TABLE shipments ADD COLUMN container_details  TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN incoterm           TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN shipping_line      TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN vessel_name        TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN voyage             TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN assigned_employee  TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN notify_party       TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN consignee_details  TEXT DEFAULT ''`);
safeAlter(`ALTER TABLE shipments ADD COLUMN stage_timestamps   TEXT DEFAULT '{}'`);
safeAlter(`ALTER TABLE shipments ADD COLUMN customer_id        TEXT REFERENCES customers(id)`);
console.log('✅ Schema migrations applied');
// ─── Audit helper ─────────────────────────────────────────────────────────────
export function auditLog(table, recordId, action, changedBy, changes) {
    db.prepare(`
    INSERT INTO audit_log (table_name, record_id, action, changed_by, changes)
    VALUES (?, ?, ?, ?, ?)
  `).run(table, recordId, action, changedBy || "system", changes ? JSON.stringify(changes) : null);
}
export default db;
