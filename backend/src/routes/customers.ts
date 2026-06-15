// ─── Customer Routes ─────────────────────────────────────────────────────────
import { Router } from "express";
import { customerRepo } from "../database/repositories.js";
import { getAuth } from "@clerk/express";

export const customerRoutes = Router();

// GET /api/customers
customerRoutes.get("/", async (req, res) => {
  const { search } = req.query as any;
  const customers = await customerRepo.getAll(search);
  res.json({ customers, count: customers.length });
});

// GET /api/customers/:id
customerRoutes.get("/:id", async (req, res) => {
  const customer = await customerRepo.getById(req.params.id);
  if (!customer) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(customer);
});

// POST /api/customers
customerRoutes.post("/", async (req: any, res) => {
  const userId = getAuth(req)?.userId || "api";
  const customer = await customerRepo.create(req.body, userId);
  res.status(201).json(customer);
});

// PATCH /api/customers/:id
customerRoutes.patch("/:id", async (req: any, res) => {
  const userId = getAuth(req)?.userId || "api";
  const updated = await customerRepo.update(req.params.id, req.body, userId);
  if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(updated);
});

// PATCH /api/customers/:id/tag — update customer tag
customerRoutes.patch("/:id/tag", async (req: any, res) => {
  const userId = getAuth(req)?.userId || "api";
  const { customer_tag } = req.body;
  if (!customer_tag) return res.status(400).json({ error: "customer_tag required" });
  const updated = await customerRepo.update(req.params.id, { customer_tag }, userId);
  if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(updated);
});

// PATCH /api/customers/:id/kyc — update KYC status
customerRoutes.patch("/:id/kyc", async (req: any, res) => {
  const userId = getAuth(req)?.userId || "api";
  const { kyc_status } = req.body;
  if (!kyc_status) return res.status(400).json({ error: "kyc_status required" });
  const updated = await customerRepo.update(req.params.id, { kyc_status }, userId);
  if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(updated);
});

// DELETE /api/customers/:id
customerRoutes.delete("/:id", async (req: any, res) => {
  const userId = getAuth(req)?.userId || "api";
  const deleted = await customerRepo.delete(req.params.id, userId);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ ok: true });
});
