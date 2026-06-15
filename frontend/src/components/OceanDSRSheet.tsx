import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Search,
  Plus,
  Download,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Edit2,
  RefreshCw,
  Activity,
  Clock,
  Mail,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { OceanDsr } from "../types/dsr";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useWebSocket } from "../hooks/useWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DsrRemarkUpdate {
  dsrId: string;
  jobNumber: string;
  zipaRefNo?: string;
  shipperName: string;
  previousRemark: string;
  newRemark: string;
  detectedEvent: string;
  emailSubject: string;
  emailFrom: string;
  processedAt: string;
  logId: string;
}

interface Toast {
  id: string;
  type: "success" | "info" | "error";
  title: string;
  message: string;
  duration: number;
}

interface AuditLogEntry {
  id: string;
  messageId: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  dsrId: string;
  jobNumber: string;
  zipaRefNo?: string;
  matchedBy: string;
  detectedEvent: string;
  previousRemark: string;
  newRemark: string;
  processedAt: string;
}

interface SyncStatus {
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
  processedMessageIds: number;
  pollIntervalMs: number;
  auditLogCount: number;
}

// ─── Status Badge Helpers ─────────────────────────────────────────────────────

const getStatusBadgeStyles = (status: string) => {
  const normalized = (status || "").trim().toUpperCase();
  if (normalized.includes("DELIVERED") || normalized.includes("COMPLETE")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  }
  if (normalized.includes("IN TRANSIT") || normalized.startsWith("TRANSIT")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200/80";
  }
  if (normalized.includes("SI SUBMITTED") || normalized.includes("SI_SUBMITTED") || normalized.includes("SI SUBMISSION")) {
    return "bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold";
  }
  if (normalized.includes("SAILED") || normalized.includes("DEPARTED")) {
    return "bg-teal-50 text-teal-700 border border-teal-200/80";
  }
  if (normalized.includes("DELAY") || normalized.includes("CRITICAL")) {
    return "bg-rose-50 text-rose-700 border border-rose-200/80 animate-pulse";
  }
  if (normalized.includes("PENDING") || normalized.includes("AWAITING")) {
    return "bg-slate-50 text-slate-600 border border-slate-200";
  }
  return "bg-blue-50 text-blue-700 border border-blue-200/80";
};

const getEventBadgeStyles = (event: string) => {
  switch (event) {
    case "SHIPMENT_SAILED": return "bg-teal-100 text-teal-700";
    case "BILLING_AWAITED": return "bg-amber-100 text-amber-700";
    case "DOCUMENTS_RECEIVED": return "bg-blue-100 text-blue-700";
    case "CUSTOMS_CLEARED": return "bg-purple-100 text-purple-700";
    case "DELIVERED": return "bg-emerald-100 text-emerald-700";
    default: return "bg-slate-100 text-slate-600";
  }
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "pointer-events-auto w-[340px] rounded-2xl shadow-2xl border overflow-hidden",
              toast.type === "success" ? "bg-white border-emerald-200" :
              toast.type === "error" ? "bg-white border-red-200" :
              "bg-white border-blue-200"
            )}
          >
            <div className={cn(
              "h-1",
              toast.type === "success" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
              toast.type === "error" ? "bg-gradient-to-r from-red-400 to-rose-500" :
              "bg-gradient-to-r from-blue-400 to-indigo-500"
            )} />
            <div className="p-4 flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                toast.type === "success" ? "bg-emerald-100 text-emerald-600" :
                toast.type === "error" ? "bg-red-100 text-red-600" :
                "bg-blue-100 text-blue-600"
              )}>
                {toast.type === "success" ? <CheckCircle2 size={16} /> :
                 toast.type === "error" ? <AlertCircle size={16} /> :
                 <Mail size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{toast.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Logy Mail Status Badge ───────────────────────────────────────────────────

function LogyMailStatusBadge({
  status,
  onSyncNow,
  onViewLogs,
  isSyncing,
}: {
  status: SyncStatus | null;
  onSyncNow: () => void;
  onViewLogs: () => void;
  isSyncing: boolean;
}) {
  const hasError = status?.lastError;
  const lastRunLabel = status?.lastRunAt
    ? new Date(status.lastRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
        hasError
          ? "bg-red-50 border-red-200 text-red-700"
          : status?.lastRunAt
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      )}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          hasError ? "bg-red-500 animate-pulse" :
          status?.running ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        )} />
        <Activity size={13} />
        <span className="hidden sm:inline">
          {hasError ? "Sync Error" :
           lastRunLabel ? `Synced ${lastRunLabel}` :
           "Auto-sync Active"}
        </span>
      </div>

      <button
        onClick={onSyncNow}
        disabled={isSyncing}
        title="Sync now"
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-semibold transition-all hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Now"}</span>
      </button>

      <button
        onClick={onViewLogs}
        title="View auto-update audit logs"
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-semibold transition-all hover:bg-slate-50"
      >
        <History size={13} />
        <span className="hidden sm:inline">Logs</span>
        {status?.auditLogCount ? (
          <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {status.auditLogCount > 99 ? "99+" : status.auditLogCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

// ─── Audit Log Modal ──────────────────────────────────────────────────────────

function AuditLogModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus | null>(null);

  const load = async (p = 1) => {
    setIsLoading(true);
    try {
      const [logsRes, statusRes] = await Promise.all([
        fetch(`/api/dsr/logy-mail/logs?page=${p}&limit=20`),
        fetch("/api/dsr/logy-mail/status"),
      ]);
      const logsData = await logsRes.json();
      const statusData = await statusRes.json();
      setLogs(logsData.logs || []);
      setTotal(logsData.total || 0);
      setPage(logsData.page || 1);
      setPages(logsData.pages || 1);
      setStatus(statusData.service || null);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const intervalLabel = status?.pollIntervalMs
    ? `${Math.round(status.pollIntervalMs / 60000)} min`
    : "5 min";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <History size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Auto-Update Audit Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Logy Mail API — automated DSR remark updates</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Service Stats */}
          {status && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Processed", value: status.totalProcessed, color: "text-slate-900" },
                { label: "Total Updated", value: status.totalUpdated, color: "text-emerald-600" },
                { label: "Errors", value: status.totalErrors, color: status.totalErrors > 0 ? "text-red-600" : "text-slate-500" },
                { label: "Poll Interval", value: intervalLabel, color: "text-blue-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className={cn("text-xl font-black mt-1", color)}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {status?.lastError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle size={14} />
              <span className="font-medium">Last error: {status.lastError}</span>
            </div>
          )}
        </div>

        {/* Log Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-slate-400" size={28} />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Mail size={36} className="opacity-30 mb-3" />
              <p className="text-sm font-medium">No auto-updates yet</p>
              <p className="text-xs mt-1">Updates will appear here once emails are processed</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                <tr>
                  {["Timestamp", "Shipment / Job #", "Email Subject", "Event", "Remark Change", "Matched By"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={11} className="text-slate-300" />
                        {new Date(log.processedAt).toLocaleString([], {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-bold text-blue-700 font-mono">{log.jobNumber}</p>
                      {log.zipaRefNo && log.zipaRefNo !== log.jobNumber && (
                        <p className="text-[10px] text-slate-400">{log.zipaRefNo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-slate-700 truncate font-medium">{log.emailSubject}</p>
                      <p className="text-[10px] text-slate-400 truncate">{log.emailFrom}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
                        getEventBadgeStyles(log.detectedEvent)
                      )}>
                        {log.detectedEvent.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 italic truncate max-w-[90px]">{log.previousRemark || "—"}</span>
                        <ArrowRight />
                        <span className="font-bold text-emerald-700 truncate max-w-[90px]">{log.newRemark}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        {log.matchedBy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30 shrink-0">
            <p>{total} total entries</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { load(page - 1); }}
                disabled={page <= 1}
                className="p-1.5 hover:bg-white rounded-md border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 font-semibold text-slate-900">Page {page} / {pages}</span>
              <button
                onClick={() => { load(page + 1); }}
                disabled={page >= pages}
                className="p-1.5 hover:bg-white rounded-md border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-300 shrink-0">
    <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function OceanDSRSheet() {
  const [data, setData] = useState<OceanDsr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<OceanDsr>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof OceanDsr | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<OceanDsr>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [manualErrorBanner, setManualErrorBanner] = useState<string | null>(null);

  // Logy Mail states
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ─── Toast helpers ─────────────────────────────────────────────────────────

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev.slice(-4), newToast]); // max 5 toasts
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── WebSocket — DSR remark updates ───────────────────────────────────────

  useWebSocket({
    onDsrRemarkUpdate: useCallback((update: DsrRemarkUpdate) => {
      // Update local data state
      setData(prev =>
        prev.map(item =>
          item._id === update.dsrId
            ? { ...item, remarks: update.newRemark }
            : item
        )
      );

      // Show toast notification
      addToast({
        type: "success",
        title: `Auto-Updated: ${update.shipperName || update.jobNumber}`,
        message: `Remark changed from "${update.previousRemark || "empty"}" → "${update.newRemark}" · ${update.detectedEvent.replace(/_/g, " ")}`,
        duration: 8000,
      });

      // Refresh sync status
      fetch("/api/dsr/logy-mail/status")
        .then(r => r.json())
        .then(d => setSyncStatus(d.service || null))
        .catch(() => {});
    }, [addToast]),
  });

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchDsr = async () => {
    try {
      const res = await fetch("/api/dsr");
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("DSR: Server returned non-JSON response");
        return;
      }
      let json = await res.json();
      if (json.status === "error") {
        console.error("DSR fetch error:", json.message);
        return;
      }
      if (Array.isArray(json) && json.length === 0) {
        await fetch("/api/dsr/seed", { method: "POST" });
        const retryRes = await fetch("/api/dsr");
        json = await retryRes.json();
      }
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Failed to fetch DSR:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch("/api/dsr/logy-mail/status");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.service || null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDsr();
    fetchSyncStatus();
    // Refresh sync status every 60s
    const statusInterval = setInterval(fetchSyncStatus, 60000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    if (!isManualEntryOpen) {
      setTouched({});
      setManualErrorBanner(null);
    }
  }, [isManualEntryOpen]);

  // ─── Manual Sync ───────────────────────────────────────────────────────────

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/dsr/logy-mail/sync", { method: "POST" });
      const result = await res.json();
      await Promise.all([fetchDsr(), fetchSyncStatus()]);
      addToast({
        type: result.updated > 0 ? "success" : "info",
        title: result.updated > 0 ? `${result.updated} record(s) updated` : "Sync complete",
        message: `Processed ${result.processed} email(s), updated ${result.updated} DSR record(s).`,
        duration: 5000,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Sync failed",
        message: err.message || "Could not connect to Logy Mail API",
        duration: 6000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Manual entry ──────────────────────────────────────────────────────────

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    if (!newEntry.shipperName?.trim()) missingFields.push("Shipper Name");
    if (!newEntry.portOfLoading?.trim()) missingFields.push("Port of Loading");

    if (missingFields.length > 0) {
      setManualErrorBanner(`Required fields missing: ${missingFields.join(", ")}`);
      setTouched({ shipperName: true, portOfLoading: true });
      return;
    }

    setIsProcessing(true);
    setManualErrorBanner(null);
    try {
      const res = await fetch("/api/dsr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const saved = await res.json();
      setData([saved, ...data]);
      setIsManualEntryOpen(false);
      setNewEntry({});
      setTouched({});
    } catch (err) {
      console.error("Manual save failed:", err);
      setManualErrorBanner("Form submission failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`/api/dsr/${id}`, { method: "DELETE" });
      setData(data.filter(item => item._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEdit = (item: OceanDsr) => {
    setEditingId(item._id!);
    setEditValues(item);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/dsr/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      setData(data.map(item => item._id === editingId ? { ...item, ...editValues } : item));
      setEditingId(null);
      setEditValues({});
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleInputChange = (key: keyof OceanDsr, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  // ─── Filtering & Sorting ───────────────────────────────────────────────────

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = String(a[sortConfig.key] || "").toLowerCase();
    const bVal = String(b[sortConfig.key] || "").toLowerCase();
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof OceanDsr) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // ─── Sub-components ────────────────────────────────────────────────────────

  const SortIndicator = ({ columnKey }: { columnKey: keyof OceanDsr }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover/th:opacity-50" />;
    return sortConfig.direction === "asc"
      ? <ArrowUp size={12} className="ml-1 text-blue-600" />
      : <ArrowDown size={12} className="ml-1 text-blue-600" />;
  };

  const ConfidenceIndicator = ({ score }: { score?: number }) => {
    if (score === undefined) return null;
    let color = "bg-slate-200";
    if (score > 0.8) color = "bg-emerald-500";
    else if (score > 0.5) color = "bg-amber-500";
    else color = "bg-red-500";
    return (
      <div
        className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", color)}
        title={`${(score * 100).toFixed(0)}% confidence`}
      />
    );
  };

  const TableHeader = ({ label, columnKey, className }: { label: string; columnKey: keyof OceanDsr; className?: string }) => (
    <th
      onClick={() => handleSort(columnKey)}
      className={cn(
        "px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100/50 transition-colors group/th",
        className
      )}
    >
      <div className="flex items-center">
        {label}
        <SortIndicator columnKey={columnKey} />
      </div>
    </th>
  );

  const EditableCell = ({
    item,
    columnKey,
    className,
    type = "text",
  }: {
    item: OceanDsr;
    columnKey: keyof OceanDsr;
    className?: string;
    type?: "text" | "number";
  }) => {
    const isEditing = editingId === item._id;
    const value = isEditing ? (editValues[columnKey] as string) : (item[columnKey] as string);
    const confidence = item.confidenceScores?.[columnKey as string];

    if (isEditing) {
      return (
        <td className="px-2 py-2">
          <input
            type={type}
            value={value || ""}
            onChange={(e) => handleInputChange(columnKey, e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-white border border-blue-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              className
            )}
          />
        </td>
      );
    }

    return (
      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", className)}>
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <ConfidenceIndicator score={confidence} />
        </div>
      </td>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
      {/* Toast Notification Stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Ocean DSR</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">Daily Status Report — Auto-synced via Logy Mail API</p>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Logy Mail Status + Controls */}
          <LogyMailStatusBadge
            status={syncStatus}
            onSyncNow={handleSyncNow}
            onViewLogs={() => setIsAuditOpen(true)}
            isSyncing={isSyncing}
          />

          <button
            onClick={() => setIsManualEntryOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Add New Entry</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-semibold transition-all">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search all fields..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="lg:flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 group shrink-0 border border-emerald-200/50"
            >
              <Plus size={14} className="group-hover:rotate-90 transition-transform" />
              <span>Quick Create</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-white hover:text-slate-900 rounded-lg transition-all border border-transparent hover:border-slate-200">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[3000px]">
            <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
              <tr className="border-b border-slate-100 italic">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                <TableHeader label="Handled By" columnKey="handledBy" />
                <TableHeader label="ZIPA Ref No" columnKey="zipaRefNo" />
                <TableHeader label="Billing Party" columnKey="billingParty" />
                <TableHeader label="Shipper Name" columnKey="shipperName" />
                <TableHeader label="CNEE Name" columnKey="cneeName" />
                <TableHeader label="Remarks" columnKey="remarks" />
                <TableHeader label="Status" columnKey="shipmentStatus" />
                <TableHeader label="Incoterms" columnKey="incoterms" />
                <TableHeader label="Inv No & Date" columnKey="shipperInvNoAndDate" />
                <TableHeader label="S.B No & Date" columnKey="sbNoAndDate" />
                <TableHeader label="Port of Receipt" columnKey="portOfReceipt" />
                <TableHeader label="Port of Loading" columnKey="portOfLoading" />
                <TableHeader label="Port of Discharge" columnKey="portOfDischarge" />
                <TableHeader label="Final Dest" columnKey="finalDestination" />
                <TableHeader label="Commodity" columnKey="commodity" />
                <TableHeader label="LCL/FCL" columnKey="lclFcl" />
                <TableHeader label="20'" columnKey="twentyFoot" />
                <TableHeader label="40'" columnKey="fortyFoot" />
                <TableHeader label="Gross Wt" columnKey="grossWeight" />
                <TableHeader label="Pkg Count" columnKey="noOfPkgs" />
                <TableHeader label="Volume" columnKey="volume" />
                <TableHeader label="Line/Co-Loader" columnKey="shippingLineCoLoader" />
                <TableHeader label="Liner Inv" columnKey="linerInvoiceCoLoader" />
                <TableHeader label="Vessel/Voyage" columnKey="vesselNameVoyage" />
                <TableHeader label="CRO No & Date" columnKey="croNoAndReleaseDt" />
                <TableHeader label="HBL No" columnKey="hblNumber" />
                <TableHeader label="MBL No" columnKey="mblNumber" />
                <TableHeader label="HBL Type" columnKey="hblOblTlxExp" />
                <TableHeader label="MBL Type" columnKey="mblOblSwbTlx" />
                <TableHeader label="Railing Dt" columnKey="railingTruckingDt" />
                <TableHeader label="Stuffing Dt" columnKey="stuffingDate" />
                <TableHeader label="Gate In" columnKey="cntrGatedIn" />
                <TableHeader label="Berth Dt" columnKey="vslBerthDt" />
                <TableHeader label="ETD" columnKey="etd" />
                <TableHeader label="ETA" columnKey="eta" />
                <TableHeader label="Sell Rate" columnKey="sellRateInr" />
                <TableHeader label="Buy Rate" columnKey="buyRateInr" />
                <TableHeader label="Margin" columnKey="marginInr" />
                <TableHeader label="Inv Release" columnKey="invoiceReleasedDt" />
                <TableHeader label="Week" columnKey="billingWeek" />
                <TableHeader label="Month" columnKey="billingMonth" />
                <TableHeader label="Container No." columnKey="containerNo" />
                <TableHeader label="Sales Person" columnKey="salesPerson" className="text-right pr-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={44} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-mono text-xs uppercase tracking-widest">Initializing DSR Data Engine...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={44} className="h-64 text-center text-slate-400 text-sm italic">
                    No records found. Add a new entry to get started.
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => (
                  <tr
                    key={item._id}
                    className={cn(
                      "border-b border-slate-50 transition-colors group",
                      editingId === item._id ? "bg-blue-50/30" : "hover:bg-slate-50/50"
                    )}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {editingId === item._id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                              title="Save Changes"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-all"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-slate-300 hover:text-blue-600 transition-all rounded-md hover:bg-blue-50"
                              title="Edit Row"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteEntry(item._id!)}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-md hover:bg-red-50"
                              title="Delete Row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <EditableCell item={item} columnKey="handledBy" className="font-medium text-slate-700" />
                    <EditableCell item={item} columnKey="zipaRefNo" className="font-mono font-bold text-blue-600" />
                    <EditableCell item={item} columnKey="billingParty" className="text-slate-600" />
                    <EditableCell item={item} columnKey="shipperName" className="text-slate-600" />
                    <EditableCell item={item} columnKey="cneeName" className="text-slate-600" />
                    <td className="px-4 py-3 text-xs whitespace-nowrap max-w-[180px]">
                      <div className="flex items-center gap-2">
                        {editingId === item._id ? (
                          <input
                            type="text"
                            value={(editValues.remarks as string) || ""}
                            onChange={(e) => handleInputChange("remarks", e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-blue-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        ) : (
                          <span className={cn(
                            "italic truncate max-w-[160px]",
                            item.lastAutoUpdatedBy === "LoGyMail"
                              ? "text-emerald-700 font-semibold"
                              : "text-slate-500"
                          )}>
                            {item.remarks || "—"}
                          </span>
                        )}
                        {item.lastAutoUpdatedBy === "LoGyMail" && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                            title="Auto-updated by Logy Mail"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingId === item._id ? (
                        <input
                          value={editValues.shipmentStatus || ""}
                          onChange={(e) => handleInputChange("shipmentStatus", e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-blue-200 rounded text-[10px] uppercase font-bold"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border",
                            getStatusBadgeStyles(item.shipmentStatus)
                          )}>
                            {item.shipmentStatus || "PENDING"}
                          </span>
                          <ConfidenceIndicator score={item.confidenceScores?.shipmentStatus} />
                        </div>
                      )}
                    </td>
                    <EditableCell item={item} columnKey="incoterms" className="text-slate-600" />
                    <EditableCell item={item} columnKey="shipperInvNoAndDate" className="text-slate-600" />
                    <EditableCell item={item} columnKey="sbNoAndDate" className="text-slate-600" />
                    <EditableCell item={item} columnKey="portOfReceipt" className="text-slate-600" />
                    <EditableCell item={item} columnKey="portOfLoading" className="text-slate-600 font-bold" />
                    <EditableCell item={item} columnKey="portOfDischarge" className="text-slate-600 font-bold" />
                    <EditableCell item={item} columnKey="finalDestination" className="text-slate-900 font-bold" />
                    <EditableCell item={item} columnKey="commodity" className="text-slate-600" />
                    <EditableCell item={item} columnKey="lclFcl" className="text-slate-600" />
                    <EditableCell item={item} columnKey="twentyFoot" className="text-slate-600 text-center font-mono" />
                    <EditableCell item={item} columnKey="fortyFoot" className="text-slate-600 text-center font-mono" />
                    <EditableCell item={item} columnKey="grossWeight" className="text-slate-600" />
                    <EditableCell item={item} columnKey="noOfPkgs" className="text-slate-600 text-center" />
                    <EditableCell item={item} columnKey="volume" className="text-slate-600" />
                    <EditableCell item={item} columnKey="shippingLineCoLoader" className="text-slate-600 font-medium text-blue-700" />
                    <EditableCell item={item} columnKey="linerInvoiceCoLoader" className="text-slate-600" />
                    <EditableCell item={item} columnKey="vesselNameVoyage" className="text-slate-600 font-bold" />
                    <EditableCell item={item} columnKey="croNoAndReleaseDt" className="text-slate-600" />
                    <EditableCell item={item} columnKey="hblNumber" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="mblNumber" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="hblOblTlxExp" className="text-slate-600" />
                    <EditableCell item={item} columnKey="mblOblSwbTlx" className="text-slate-600" />
                    <EditableCell item={item} columnKey="railingTruckingDt" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="stuffingDate" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="cntrGatedIn" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="vslBerthDt" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="etd" className="text-red-600 font-bold font-mono" />
                    <EditableCell item={item} columnKey="eta" className="text-emerald-600 font-bold font-mono" />
                    <EditableCell item={item} columnKey="sellRateInr" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="buyRateInr" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="marginInr" className="text-emerald-700 font-bold font-mono" />
                    <EditableCell item={item} columnKey="invoiceReleasedDt" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="billingWeek" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="billingMonth" className="text-slate-600 font-mono" />
                    <EditableCell item={item} columnKey="containerNo" className="text-slate-900 font-mono font-bold" />
                    <td className="px-4 py-3 text-xs text-right pr-10 whitespace-nowrap">
                      {editingId === item._id ? (
                        <input
                          value={editValues.salesPerson || ""}
                          onChange={(e) => handleInputChange("salesPerson", e.target.value)}
                          className="w-32 px-2 py-1 bg-white border border-blue-200 rounded text-right text-xs"
                        />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">{item.salesPerson}</span>
                          <ConfidenceIndicator score={item.confidenceScores?.salesPerson} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
          <p>Showing {sortedData.length} records</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-white rounded-md border border-slate-200 opacity-50"><ChevronLeft size={14} /></button>
            <span className="px-3 font-semibold text-slate-900">Page 1</span>
            <button className="p-1.5 hover:bg-white rounded-md border border-slate-200"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Audit Log Modal */}
      <AnimatePresence>
        {isAuditOpen && <AuditLogModal onClose={() => setIsAuditOpen(false)} />}
      </AnimatePresence>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isManualEntryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setIsManualEntryOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden shadow-blue-500/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Manual Entry Form</h3>
                    <p className="text-sm text-slate-500">Fill in the shipment details manually</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsManualEntryOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleManualSave} className="overflow-y-auto p-8 pt-6">
                {manualErrorBanner && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100/80 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4 duration-300 shrink-0 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold leading-relaxed">{manualErrorBanner}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: "Handled By", key: "handledBy" },
                    { label: "ZIPA Ref No", key: "zipaRefNo" },
                    { label: "Billing Party", key: "billingParty" },
                    { label: "Shipper Name", key: "shipperName", required: true },
                    { label: "CNEE Name", key: "cneeName" },
                    { label: "Remarks", key: "remarks" },
                    { label: "Status", key: "shipmentStatus" },
                    { label: "Incoterms", key: "incoterms" },
                    { label: "Inv No & Date", key: "shipperInvNoAndDate" },
                    { label: "S.B No & Date", key: "sbNoAndDate" },
                    { label: "Port of Receipt", key: "portOfReceipt" },
                    { label: "Port of Loading", key: "portOfLoading", required: true },
                    { label: "Port of Discharge", key: "portOfDischarge" },
                    { label: "Final Dest", key: "finalDestination" },
                    { label: "Commodity", key: "commodity" },
                    { label: "LCL/FCL", key: "lclFcl" },
                    { label: "20' Cntr", key: "twentyFoot" },
                    { label: "40' Cntr", key: "fortyFoot" },
                    { label: "Gross Wt", key: "grossWeight" },
                    { label: "Pkg Count", key: "noOfPkgs" },
                    { label: "Volume", key: "volume" },
                    { label: "Line/Co-Loader", key: "shippingLineCoLoader" },
                    { label: "Liner Inv", key: "linerInvoiceCoLoader" },
                    { label: "Vessel/Voyage", key: "vesselNameVoyage" },
                    { label: "CRO No & Date", key: "croNoAndReleaseDt" },
                    { label: "HBL No", key: "hblNumber" },
                    { label: "MBL No", key: "mblNumber" },
                    { label: "HBL Type", key: "hblOblTlxExp" },
                    { label: "MBL Type", key: "mblOblSwbTlx" },
                    { label: "Railing Dt", key: "railingTruckingDt" },
                    { label: "Stuffing Dt", key: "stuffingDate" },
                    { label: "Gate In", key: "cntrGatedIn" },
                    { label: "Berth Dt", key: "vslBerthDt" },
                    { label: "ETD", key: "etd" },
                    { label: "ETA", key: "eta" },
                    { label: "Sell Rate", key: "sellRateInr" },
                    { label: "Buy Rate", key: "buyRateInr" },
                    { label: "Margin", key: "marginInr" },
                    { label: "Inv Release", key: "invoiceReleasedDt" },
                    { label: "Week", key: "billingWeek" },
                    { label: "Month", key: "billingMonth" },
                    { label: "Container No.", key: "containerNo" },
                    { label: "Sales Person", key: "salesPerson" },
                  ].map((field) => {
                    const isRequired = !!field.required;
                    const value = (newEntry as any)[field.key] || "";
                    const isInvalid = isRequired && touched[field.key] && !value.trim();

                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                          <span>{field.label}</span>
                          {isRequired && <span className="text-red-500 font-bold" title="Required">*</span>}
                        </label>
                        <input
                          type="text"
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all",
                            isInvalid
                              ? "border-red-300 bg-red-50/10 focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50"
                              : "border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50"
                          )}
                          value={value}
                          onChange={(e) => {
                            setNewEntry({ ...newEntry, [field.key]: e.target.value });
                            setTouched(prev => ({ ...prev, [field.key]: true }));
                            if (manualErrorBanner) {
                              const updated = { ...newEntry, [field.key]: e.target.value };
                              if (updated.shipperName?.trim() && updated.portOfLoading?.trim()) {
                                setManualErrorBanner(null);
                              }
                            }
                          }}
                          onBlur={() => {
                            if (isRequired) setTouched(prev => ({ ...prev, [field.key]: true }));
                          }}
                        />
                        {isInvalid && (
                          <p className="text-[10px] text-red-500 font-medium pl-1 animate-in fade-in duration-200">
                            {field.label} is required
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 mt-8 sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsManualEntryOpen(false)}
                    className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold flex-1 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Entry</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
