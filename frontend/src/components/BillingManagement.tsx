import React, { useState, useEffect } from "react";
import { 
  Banknote, 
  CreditCard, 
  ArrowUpRight, 
  TrendingDown, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  Download,
  Plus,
  Zap,
  Globe,
  DollarSign,
  Bell,
  Settings2,
  ChevronDown,
  Calendar
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/src/services/api";

interface Invoice {
  id: string;
  shipmentId: string;
  entity: string;
  type: "Liner" | "Customer";
  amount: string;
  currency: string;
  status: "Invoice Pending" | "Sent to Accounts" | "Invoice Generated" | "Payment Received";
  dueDate: string;
  hasReminder?: boolean;
}

export function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Generated" | "Received">("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    id: "", shipmentId: "", entity: "", type: "Customer" as Invoice["type"],
    amount: "", currency: "INR", status: "Invoice Pending" as Invoice["status"], dueDate: ""
  });

  const fetchLedger = () => {
    setLoading(true);
    api.invoices.list()
      .then((res: any) => {
        const rawInvs = res?.invoices || [];
        const mapped: Invoice[] = rawInvs.map((inv: any) => ({
          id: inv._id,
          shipmentId: inv.shipment_id || "N/A",
          entity: inv.customer_id ? inv.customer_id.replace("CUST_", "").replace(/_/g, " ") : "Liner Line",
          type: (inv.type === "customer" ? "Customer" : "Liner") as Invoice["type"],
          amount: Number(inv.amount).toLocaleString(),
          currency: inv.currency || "INR",
          status: (inv.status === "paid" ? "Payment Received" : inv.status === "sent" ? "Invoice Generated" : "Invoice Pending") as Invoice["status"],
          dueDate: inv.due_date || "N/A",
          hasReminder: inv.has_reminder === 1
        }));
        setInvoices(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch invoices:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Pending" && inv.status === "Invoice Pending") ||
      (activeTab === "Generated" && inv.status === "Invoice Generated") ||
      (activeTab === "Received" && inv.status === "Payment Received");
    const matchesSearch =
      !searchQuery ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.shipmentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreateInvoice = () => {
    if (!newInvoice.id || !newInvoice.entity || !newInvoice.amount) return;
    
    const rawAmount = parseFloat(newInvoice.amount.replace(/,/g, "")) || 0;
    const data = {
      id: newInvoice.id,
      shipment_id: newInvoice.shipmentId,
      customer_id: "CUST_" + newInvoice.entity.replace(/[^A-Z0-9]/ig, "_").toUpperCase(),
      type: newInvoice.type.toLowerCase(),
      amount: rawAmount,
      currency: newInvoice.currency,
      status: newInvoice.status === "Payment Received" ? "paid" : newInvoice.status === "Invoice Generated" ? "sent" : "pending",
      due_date: newInvoice.dueDate || new Date().toISOString().split("T")[0],
      has_reminder: 0
    };

    api.invoices.create(data)
      .then(() => {
        setNewInvoice({ id: "", shipmentId: "", entity: "", type: "Customer", amount: "", currency: "INR", status: "Invoice Pending", dueDate: "" });
        setShowCreateModal(false);
        fetchLedger();
      })
      .catch(err => {
        console.error("Failed to create invoice:", err);
        alert("Error creating invoice: " + err.message);
      });
  };

  const isOverdue = (dateStr: string, status: Invoice["status"]) => {
    if (status === "Payment Received" || dateStr === "N/A") return false;
    
    const parts = dateStr.split("-");
    if (parts.length < 3) return false;
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date(2026, 5, 16); // June 16, 2026
    
    return dueDate < today;
  };

  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderConfig, setReminderConfig] = useState({
    enabled: true,
    daysBefore: 3,
    frequency: "Daily"
  });

  const toggleReminder = (id: string) => {
    const targetInv = invoices.find(inv => inv.id === id);
    if (!targetInv) return;

    api.invoices.update(id, { has_reminder: targetInv.hasReminder ? 0 : 1 })
      .then(() => {
        setInvoices(prev => prev.map(inv => 
          inv.id === id ? { ...inv, hasReminder: !inv.hasReminder } : inv
        ));
      })
      .catch(err => console.error("Failed to toggle reminder:", err));
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "Payment Received": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Invoice Generated": return "bg-blue-50 text-blue-600 border-blue-100";
      case "Sent to Accounts": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "Invoice Pending": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const totalReceivables = invoices
    .filter(inv => inv.type === "Customer")
    .reduce((sum, inv) => sum + (parseFloat(inv.amount.replace(/,/g, "")) || 0), 0);

  const totalPayables = invoices
    .filter(inv => inv.type === "Liner")
    .reduce((sum, inv) => sum + (parseFloat(inv.amount.replace(/,/g, "")) || 0), 0);

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-12 pb-24 transition-colors">
      {/* Title Section */}
      <section className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Financial Ledger v4.0</span>
          </div>
          <h2 className="text-6xl font-manrope font-extrabold text-text-main tracking-tighter mb-4 transition-colors">Accounts & Billing</h2>
          <p className="text-slate-500 max-w-3xl text-lg font-medium leading-relaxed transition-colors">
            Real-time financial monitoring of liner costs and customer receivables. 
            Automated billing cycles and multi-currency rate reconciliation.
          </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowReminderSettings(!showReminderSettings)}
             className={cn(
               "bg-surface border text-text-main px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all",
               showReminderSettings ? "border-primary text-primary" : "border-border"
             )}
           >
             <Settings2 size={20} /> Auto-Reminders
           </button>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
             <Plus size={20} /> Create Invoice
           </button>
        </div>
      </section>

      {/* Reminder Config Panel */}
      <AnimatePresence>
        {showReminderSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#1A2B4C] text-white p-10 rounded-[40px] shadow-2xl flex flex-col md:flex-row gap-12 items-center">
               <div className="bg-white/10 p-6 rounded-3xl text-amber-400">
                 <Bell size={32} />
               </div>
               <div className="flex-grow space-y-2">
                 <h4 className="text-xl font-extrabold">Automated Payment Reminders</h4>
                 <p className="text-sm text-slate-400">Configure systemic "gentle nudges" for outstanding customer invoices.</p>
               </div>
               <div className="flex gap-8 items-center bg-white/5 p-6 rounded-3xl border border-white/10">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-500">Frequency</p>
                   <select 
                     value={reminderConfig.frequency}
                     onChange={(e) => setReminderConfig(prev => ({ ...prev, frequency: e.target.value }))}
                     className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer"
                   >
                     <option className="bg-[#1A2B4C]">Daily</option>
                     <option className="bg-[#1A2B4C]">Weekly</option>
                     <option className="bg-[#1A2B4C]">Bi-Weekly</option>
                   </select>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-500">Days Before Due</p>
                   <div className="flex items-center gap-2">
                     <span className="text-lg font-black">{reminderConfig.daysBefore}</span>
                     <div className="flex flex-col">
                       <button onClick={() => setReminderConfig(prev => ({ ...prev, daysBefore: Math.min(prev.daysBefore + 1, 14) }))} className="text-[10px] hover:text-primary transition-colors">▲</button>
                       <button onClick={() => setReminderConfig(prev => ({ ...prev, daysBefore: Math.max(prev.daysBefore - 1, 1) }))} className="text-[10px] hover:text-primary transition-colors">▼</button>
                     </div>
                   </div>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <button 
                   onClick={() => setReminderConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     reminderConfig.enabled ? "bg-emerald-50 text-white" : "bg-white/10 text-slate-400"
                   )}
                 >
                   {reminderConfig.enabled ? "Enabled" : "Disabled"}
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1A2B4C]">Create New Invoice</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Financial Ledger v4.0</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">✕</button>
              </div>
              {[
                { label: "Invoice ID", placeholder: "e.g. INV-5500", field: "id" },
                { label: "Shipment ID", placeholder: "e.g. EID-5500", field: "shipmentId" },
                { label: "Entity / Client", placeholder: "e.g. Global Tech", field: "entity" },
                { label: "Amount", placeholder: "e.g. 8,500", field: "amount" },
                { label: "Due Date", placeholder: "e.g. 20 Jun", field: "dueDate" },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder}
                    value={(newInvoice as any)[f.field]}
                    onChange={e => setNewInvoice(p => ({ ...p, [f.field]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Type</label>
                  <select value={newInvoice.type} onChange={e => setNewInvoice(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:border-blue-500 outline-none">
                    <option value="Customer">Customer</option>
                    <option value="Liner">Liner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
                  <select value={newInvoice.status} onChange={e => setNewInvoice(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:border-blue-500 outline-none">
                    <option>Invoice Pending</option>
                    <option>Invoice Generated</option>
                    <option>Sent to Accounts</option>
                    <option>Payment Received</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleCreateInvoice} disabled={!newInvoice.id || !newInvoice.entity || !newInvoice.amount}
                  className="flex-1 py-3 rounded-xl bg-[#1A2B4C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#243869] transition-colors">
                  <Plus size={16} /> Create Invoice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricBox 
          icon={<ArrowUpRight className="text-emerald-500" />} 
          label="Total Receivables" 
          value={loading ? "..." : "₹" + totalReceivables.toLocaleString()} 
          trend="+12% vs last month"
          trendColor="text-emerald-500"
        />
        <MetricBox 
          icon={<TrendingDown className="text-amber-500" />} 
          label="Liner Payables" 
          value={loading ? "..." : "₹" + totalPayables.toLocaleString()} 
          trend="4 invoices due today"
          trendColor="text-amber-500"
        />
        <MetricBox 
          icon={<Clock className="text-blue-500" />} 
          label="Avg. Payment Cycle" 
          value="14 Days" 
          trend="Down from 18 days"
          trendColor="text-emerald-500"
        />
        <MetricBox 
          icon={<Globe className="text-indigo-500" />} 
          label="Multi-Currency" 
          value="4 Types" 
          trend="USD, EUR, INR, AED"
          trendColor="text-indigo-500"
        />
      </div>

      {/* Invoice Table Section */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface transition-colors">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-surface-soft border border-border rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-surface hover:border-slate-300 transition-all shadow-sm"
              >
                <Filter size={14} className="text-blue-600" />
                <span>Status: <span className="text-blue-600">{activeTab}</span></span>
                <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsFilterOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-48 bg-[#0F172A] rounded-xl shadow-xl border border-slate-800 p-2 z-50"
                    >
                      {(["All", "Pending", "Generated", "Received"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors",
                            activeTab === tab 
                              ? "bg-blue-600 text-white" 
                              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                          )}
                        >
                          {tab === "All" ? "Clear Filter" : tab}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Live Ledger: {filteredInvoices.length} Entries
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                 type="text" 
                 placeholder="Search ledger..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest w-48 lg:w-64 focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/30 transition-all outline-none"
               />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-xs font-mono text-slate-400 uppercase tracking-widest">
              Syncing Financial Manifest...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center text-xs font-mono text-slate-400 uppercase tracking-widest">
              No Ledger Records Found
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Ref</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipment</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Auto-Remind</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => {
                  const overdue = isOverdue(inv.dueDate, inv.status);
                  return (
                    <tr key={inv.id} className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      overdue && "bg-red-50/30"
                    )}>
                      <td className="px-8 py-6 font-extrabold text-[#1A2B4C] text-sm">
                        <div className="flex flex-col gap-1">
                          {inv.id}
                          {overdue && (
                            <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-tighter bg-red-100/50 px-1.5 py-0.5 rounded w-fit">
                              <AlertCircle size={8} /> Late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-primary">{inv.shipmentId}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-[#1A2B4C]/20" />
                           <span className="text-sm font-bold text-slate-600">{inv.entity}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          inv.type === "Liner" ? "bg-slate-100 text-slate-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1">
                           <span className="text-xs font-bold text-slate-400">{inv.currency}</span>
                           <span className="text-sm font-black text-[#1A2B4C]">{inv.amount}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <div className={cn(
                            "px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                            getStatusColor(inv.status),
                            overdue && "border-red-200"
                          )}>
                            {inv.status === "Payment Received" ? <CheckCircle2 size={12} /> : 
                            inv.status === "Invoice Pending" ? <AlertCircle size={12} /> : <Clock size={12} />}
                            {inv.status}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <button 
                              onClick={() => toggleReminder(inv.id)}
                              className={cn(
                                "p-2.5 rounded-xl transition-all border",
                                inv.hasReminder ? "bg-amber-50 border-amber-200 text-amber-500 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-300 hover:text-slate-500"
                              )}
                            >
                              <Bell size={16} />
                            </button>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "text-xs font-bold",
                          overdue ? "text-red-500" : "text-slate-400"
                        )}>
                          {inv.dueDate}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-slate-300 hover:text-[#1A2B4C]"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-[#1A2B4C] p-10 rounded-[40px] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-8">
           <div className="bg-white/10 p-5 rounded-3xl text-emerald-400">
             <DollarSign size={28} />
           </div>
           <div>
             <h4 className="text-2xl font-manrope font-extrabold">Instant Reconciliation</h4>
             <p className="text-sm text-slate-400 italic">Auto-match liner invoices with pre-entered quote rates to detect discrepancies.</p>
           </div>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
          Run End-of-Day Audit
        </button>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value, trend, trendColor }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <h3 className="text-3xl font-extrabold text-[#1A2B4C] mb-2">{value}</h3>
      <p className={cn("text-[10px] font-bold", trendColor)}>{trend}</p>
    </div>
  );
}
