// Frontend API client — all requests go through here
import { useAuth } from '@clerk/clerk-react';
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_KEY = import.meta.env.VITE_API_KEY || "zaw_live_default_master_key_2024";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export function useApi() {
  const { getToken } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  return { authFetch };
}

export const api = {
  // Shipments
  shipments: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/shipments${q}`);
    },
    get: (id: string) => request<any>(`/shipments/${id}`),
    create: (data: any) => request<any>("/shipments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/shipments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/shipments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    delete: (id: string) => request<any>(`/shipments/${id}`, { method: "DELETE" }),
    stats: () => request<any>("/shipments/stats"),
  },

  // Tracking
  tracking: {
    vessels: () => request<any>("/tracking/vessels"),
    vessel: (id: string) => request<any>(`/tracking/vessels/${id}`),
    shipment: (id: string) => request<any>(`/tracking/shipments/${id}`),
    track: (data: { blNumber?: string; containerNumber?: string; mawb?: string }) =>
      request<any>("/tracking/track", { method: "POST", body: JSON.stringify(data) }),
  },

  // Email
  email: {
    history: () => request<any>("/email/history"),
    stats: () => request<any>("/email/stats"),
    send: (data: { to: string; subject: string; body: string; shipmentId?: string; type?: string }) =>
      request<any>("/email/send", { method: "POST", body: JSON.stringify(data) }),
    templates: () => request<any>("/email/templates"),
  },

  // Analytics
  analytics: {
    overview: () => request<any>("/analytics/overview"),
    volume: () => request<any>("/analytics/shipment-volume"),
    performance: () => request<any>("/analytics/performance"),
    cargoDistribution: () => request<any>("/analytics/cargo-distribution"),
    pipelineSummary: () => request<any>("/analytics/pipeline-summary"),
  },

  // API Keys
  auth: {
    verify: () => request<any>("/auth/verify"),
    usage: () => request<any>("/auth/usage"),
    listKeys: () => request<any>("/auth/keys"),
    createKey: (data: any) => request<any>("/auth/keys", { method: "POST", body: JSON.stringify(data) }),
    revokeKey: (id: string) => request<any>(`/auth/keys/${id}`, { method: "DELETE" }),
  },

  // Customers
  customers: {
    list: (search?: string) => request<any>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    get: (id: string) => request<any>(`/customers/${id}`),
    create: (data: any) => request<any>("/customers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/customers/${id}`, { method: "DELETE" }),
  },

  // Invoices
  invoices: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/invoices${q}`);
    },
    get: (id: string) => request<any>(`/invoices/${id}`),
    getByShipment: (shipmentId: string) => request<any>(`/invoices/shipment/${shipmentId}`),
    create: (data: any) => request<any>("/invoices", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/invoices/${id}`, { method: "DELETE" }),
  }
};
