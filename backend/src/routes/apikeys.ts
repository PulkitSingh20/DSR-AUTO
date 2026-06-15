import { Router } from "express";
import { apiKeyStore } from "../services/apiKeyStore.js";
import { requireAuth as authMiddleware } from "../middleware/auth.js";

export const apiKeyRoutes = Router();

// POST /api/auth/keys — generate new API key (requires existing valid key to be admin)
apiKeyRoutes.post("/keys", authMiddleware, (req: any, res) => {
  const { name, owner, permissions, expiresInDays } = req.body;

  // Only admin keys can create new keys
  if (!req.keyData?.permissions?.includes("admin")) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Admin permission required to generate API keys" });
  }

  if (!name || !owner || !permissions) {
    return res.status(400).json({ error: "VALIDATION", message: "name, owner, permissions required" });
  }

  const key = apiKeyStore.generate(name, owner, permissions, expiresInDays);

  res.status(201).json({
    success: true,
    id: key.id,
    key: key.key, // Only returned once
    name: key.name,
    owner: key.owner,
    permissions: key.permissions,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
    warning: "Store this key securely. It will not be shown again.",
  });
});

// GET /api/auth/keys — list all keys (admin only, masked)
apiKeyRoutes.get("/keys", authMiddleware, (req: any, res) => {
  if (!req.keyData?.permissions?.includes("admin")) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  res.json({ keys: apiKeyStore.list() });
});

// DELETE /api/auth/keys/:id — revoke a key
apiKeyRoutes.delete("/keys/:id", authMiddleware, (req: any, res) => {
  if (!req.keyData?.permissions?.includes("admin")) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  const revoked = apiKeyStore.revoke(req.params.id);
  if (!revoked) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ success: true, message: `Key ${req.params.id} has been revoked` });
});

// GET /api/auth/verify — verify current key and get its info
apiKeyRoutes.get("/verify", authMiddleware, (req: any, res) => {
  res.json({
    valid: true,
    keyInfo: {
      id: req.keyData.id,
      name: req.keyData.name,
      owner: req.keyData.owner,
      permissions: req.keyData.permissions,
    },
  });
});

// GET /api/auth/usage — get usage stats for current key
apiKeyRoutes.get("/usage", authMiddleware, (req: any, res) => {
  const record = apiKeyStore.getByKey(req.apiKey || "");
  if (!record) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({
    usageCount: record.usageCount,
    lastUsedAt: record.lastUsedAt,
    recentLogs: record.usageLogs.slice(-20),
  });
});
