import crypto from "crypto";

export interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  owner: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  usageCount: number;
  usageLogs: Array<{ method: string; path: string; ts: string }>;
}

// Seed with a default key so the app works out of the box
const DEFAULT_KEY = "zaw_live_default_master_key_2024";
const ADMIN_KEY = "zaw_admin_9x82hf_secret";

const store: Map<string, ApiKeyRecord> = new Map([
  [DEFAULT_KEY, {
    id: "key_001",
    key: DEFAULT_KEY,
    name: "Master Production Key",
    owner: "Alex Chen",
    permissions: ["shipments:read", "shipments:write", "tracking:read", "email:send", "analytics:read"],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: null,
    isActive: true,
    usageCount: 0,
    usageLogs: [],
  }],
  [ADMIN_KEY, {
    id: "key_002",
    key: ADMIN_KEY,
    name: "Admin Control Key",
    owner: "System Admin",
    permissions: ["admin", "shipments:read", "shipments:write", "tracking:read", "email:send", "analytics:read"],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: null,
    isActive: true,
    usageCount: 0,
    usageLogs: [],
  }]
]);

export const apiKeyStore = {
  generate(name: string, owner: string, permissions: string[], expiresInDays?: number): ApiKeyRecord {
    const key = `zaw_live_${crypto.randomBytes(16).toString("hex")}`;
    const record: ApiKeyRecord = {
      id: `key_${crypto.randomBytes(4).toString("hex")}`,
      key,
      name,
      owner,
      permissions,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null,
      isActive: true,
      usageCount: 0,
      usageLogs: [],
    };
    store.set(key, record);
    return record;
  },

  validate(key: string): ApiKeyRecord | null {
    const record = store.get(key);
    if (!record || !record.isActive) return null;
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      record.isActive = false;
      return null;
    }
    return record;
  },

  logUsage(key: string, method: string, path: string) {
    const record = store.get(key);
    if (!record) return;
    record.lastUsedAt = new Date().toISOString();
    record.usageCount++;
    record.usageLogs.push({ method, path, ts: new Date().toISOString() });
    // Keep last 50 logs only
    if (record.usageLogs.length > 50) record.usageLogs = record.usageLogs.slice(-50);
  },

  revoke(id: string): boolean {
    for (const [key, record] of store.entries()) {
      if (record.id === id) {
        record.isActive = false;
        return true;
      }
    }
    return false;
  },

  list(): Omit<ApiKeyRecord, "key">[] {
    return Array.from(store.values()).map(({ key: _key, ...rest }) => ({
      ...rest,
      key: _key.substring(0, 12) + "..." + _key.slice(-4), // masked
    })) as any;
  },

  getByKey(key: string): ApiKeyRecord | undefined {
    return store.get(key);
  },

  getAll(): ApiKeyRecord[] {
    return Array.from(store.values());
  }
};
