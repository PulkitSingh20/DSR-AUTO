import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Database, Table, Search, RefreshCw, Edit2, Trash2, Download, Terminal, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Shield, HardDrive, Activity, X, Save } from "lucide-react";
import { cn } from "@/src/lib/utils";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_KEY = import.meta.env.VITE_API_KEY || "zaw_live_default_master_key_2024";

async function dbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}/db-admin${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Api-Key": API_KEY, ...opts.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const TABLES = [
  { name: "shipments",       icon: "🚢", label: "Shipments",        color: "blue" },
  { name: "customers",       icon: "🏢", label: "Customers",        color: "emerald" },
  { name: "tracking_events", icon: "📍", label: "Tracking Events",  color: "purple" },
  { name: "emails",          icon: "✉️",  label: "Emails",           color: "amber" },
  { name: "documents",       icon: "📄", label: "Documents",        color: "teal" },
  { name: "reminders",       icon: "🔔", label: "Reminders",        color: "orange" },
  { name: "audit_log",       icon: "🛡️",  label: "Audit Log",        color: "slate" },
];

export function DatabaseAdmin() {
  const [activeTab, setActiveTab] = useState<"overview" | "tables" | "query" | "audit">("overview");
  const [activeTable, setActiveTable] = useState("shipments");
  const [stats, setStats] = useState<any>(null);
  const [tableData, setTableData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editRow, setEditRow] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});

  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStats = useCallback(async () => {
    try { setStats(await dbFetch("/stats")); } catch (e: any) { setError(e.message); }
  }, []);

  const loadTable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbFetch(`/table/${activeTable}?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      setTableData(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTable, page, search]);

  const loadAudit = useCallback(async () => {
    try { setAuditLog(await dbFetch("/audit?limit=100")); } catch {}
  }, []);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (activeTab === "tables") loadTable(); }, [activeTab, activeTable, page]);
  useEffect(() => { if (activeTab === "audit") loadAudit(); }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadTable(); };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditData({ ...row });
  };

  const handleSave = async () => {
    if (!editRow) return;
    const id = editRow.id || editRow.rowid;
    try {
      await dbFetch(`/table/${activeTable}/${id}`, { method: "PATCH", body: JSON.stringify(editData) });
      showToast("Row updated successfully");
      setEditRow(null);
      loadTable();
    } catch (e: any) { showToast(e.message, "err"); }
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Delete this row? This cannot be undone.`)) return;
    const id = row.id || row.rowid;
    try {
      await dbFetch(`/table/${activeTable}/${id}`, { method: "DELETE" });
      showToast("Row deleted");
      loadTable();
    } catch (e: any) { showToast(e.message, "err"); }
  };


  const handleBackup = () => {
    window.open(`${BASE}/db-admin/backup`, "_blank");
  };

  return (
    <div className="bg-surface min-h-screen p-6 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn("fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-bold",
              toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}
          >
            {toast.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-text-main uppercase tracking-tight">Database Admin</h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">zipaworld_db — MongoDB</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadStats} className="p-2 rounded-lg hover:bg-surface-soft transition-colors text-slate-400 hover:text-blue-600">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
            <Download size={14} /> Backup DB
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-soft p-1 rounded-xl w-fit">
        {[
          { id: "overview", label: "Overview",    icon: Activity },
          { id: "tables",   label: "Collections", icon: Table },
          { id: "audit",    label: "Audit Log",   icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* DB file info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HardDrive} label="DB Size" value={`${stats.db_size_kb} KB`} color="blue" />
            <StatCard icon={Database} label="Shipments" value={stats.shipments} color="emerald" />
            <StatCard icon={Database} label="Customers" value={stats.customers} color="purple" />
            <StatCard icon={Shield} label="Audit Entries" value={stats.audit_log} color="slate" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Database} label="Tracking Events" value={stats.tracking_events} color="teal" />
            <StatCard icon={Database} label="Emails Logged"   value={stats.emails}          color="amber" />
            <StatCard icon={Database} label="Reminders"       value={stats.reminders}        color="orange" />
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4">Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TABLES.map(t => (
                <button
                  key={t.name}
                  onClick={() => { setActiveTable(t.name); setActiveTab("tables"); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                >
                  <span className="text-xl">{t.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">{t.label}</p>
                    <p className="text-[10px] font-mono text-slate-400">{t.name}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {(stats as any)[t.name] ?? 0} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Latest activity */}
          {stats.latest_shipment && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-3">Latest Activity</h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="font-mono text-slate-500">{new Date(stats.latest_shipment.created_at).toLocaleString()}</span>
                <span className="font-bold text-slate-700">New shipment:</span>
                <span className="font-mono text-blue-600">{stats.latest_shipment.id}</span>
                <span className="text-slate-500">by {stats.latest_shipment.shipper}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tables ── */}
      {activeTab === "tables" && (
        <div className="space-y-4">
          {/* Table selector + search */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 flex-wrap">
              {TABLES.map(t => (
                <button
                  key={t.name}
                  onClick={() => { setActiveTable(t.name); setPage(1); setSearch(""); }}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                    activeTable === t.name ? "bg-blue-600 text-white" : "bg-surface-soft text-slate-500 hover:bg-slate-200")}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
              <div className="flex items-center gap-2 bg-surface-soft border border-border rounded-xl px-3 py-2">
                <Search size={14} className="text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search..." className="bg-transparent text-xs outline-none w-40 text-slate-700"
                />
              </div>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Search</button>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
                {TABLES.find(t => t.name === activeTable)?.icon} {activeTable}
              </h3>
              {tableData && (
                <span className="text-[10px] font-mono text-slate-400">{tableData.total} total rows</span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tableData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {tableData.columns.map((col: string) => (
                        <th key={col} className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500 whitespace-nowrap text-[10px]">{col}</th>
                      ))}
                      <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500 text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tableData.rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                        {tableData.columns.map((col: string) => (
                          <td key={col} className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap max-w-[200px] truncate">
                            {row[col] === null ? <span className="text-slate-300 italic">null</span> :
                              String(row[col]).length > 40 ? String(row[col]).substring(0, 40) + "…" : String(row[col])}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {activeTable !== "audit_log" && (
                              <>
                                <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition-colors">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Pagination */}
            {tableData && tableData.pages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  Page {page} of {tableData.pages} ({tableData.total} rows)
                </span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-soft disabled:opacity-30 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={page >= tableData.pages} onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-soft disabled:opacity-30 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Audit Log ── */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Every change recorded automatically</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {auditLog.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className={cn("mt-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide shrink-0",
                  entry.action === "CREATE" ? "bg-emerald-50 text-emerald-600" :
                  entry.action === "UPDATE" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                )}>
                  {entry.action}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{entry.table_name}</span>
                    <span className="text-[10px] font-mono text-blue-600">{entry.record_id}</span>
                  </div>
                  {entry.changes && (
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{entry.changes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-slate-400">{new Date(entry.occurred_at).toLocaleString()}</p>
                  <p className="text-[9px] text-slate-300 mt-0.5">{entry.changed_by || "system"}</p>
                </div>
              </div>
            ))}
            {auditLog.length === 0 && (
              <p className="p-8 text-center text-slate-400 text-xs">No audit entries yet</p>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editRow && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-sm font-black text-slate-800">Edit Row</h2>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{activeTable} / {editRow.id || editRow.rowid}</p>
                </div>
                <button onClick={() => setEditRow(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                {Object.keys(editData).filter(k => !["created_at", "updated_at", "id"].includes(k)).map(key => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{key}</label>
                    <input
                      value={editData[key] ?? ""}
                      onChange={e => setEditData((d: any) => ({ ...d, [key]: e.target.value }))}
                      className="w-full text-xs font-mono bg-surface-soft border border-border rounded-lg px-3 py-2 outline-none focus:border-blue-400 text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button onClick={() => setEditRow(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                  <Save size={13} /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600", slate: "bg-slate-100 text-slate-600",
    teal: "bg-teal-50 text-teal-600", amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}
