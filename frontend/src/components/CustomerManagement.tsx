import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  History, 
  MapPin, 
  TrendingUp,
  Package,
  Plus,
  Zap,
  X,
  Check,
  Building2,
  Mail,
  Globe,
  Ship
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Shipment {
  id: string;
  route: string;
  status: string;
  date: string;
}

interface Customer {
  id: string;
  name: string;
  kycStatus: "Verified" | "Pending" | "Expired";
  totalShipments: number;
  preferredLine: string;
  lastActive: string;
  country: string;
  contactEmail: string;
  shipments: Shipment[];
}

const SHIPPING_LINES = ["CMA CGM", "Maersk", "Hapag-Lloyd", "MSC", "COSCO", "ONE", "Evergreen", "Yang Ming"];
const COUNTRIES = ["India", "China", "USA", "Germany", "Japan", "Singapore", "UAE", "UK", "France", "South Korea", "Netherlands", "Australia"];

const INITIAL_CUSTOMERS: Customer[] = [
  { 
    id: "C1", name: "Global Tech Industries", kycStatus: "Verified", totalShipments: 142, preferredLine: "CMA CGM", lastActive: "2 hours ago", country: "India", contactEmail: "shipping@globaltech.com",
    shipments: [
      { id: "SHP-GT-0942", route: "MUM ➔ ROT", status: "In Transit", date: "Oct 24" },
      { id: "SHP-GT-0941", route: "DEL ➔ DXB", status: "Delivered", date: "Sep 15" }
    ]
  },
  { 
    id: "C2", name: "Aero Dynamics Co.", kycStatus: "Verified", totalShipments: 89, preferredLine: "Maersk", lastActive: "1 day ago", country: "Germany", contactEmail: "logistics@aero.de",
    shipments: [
      { id: "SHP-AD-4412", route: "HAM ➔ JFK", status: "Customs Hold", date: "Oct 22" },
      { id: "SHP-AD-4411", route: "FRA ➔ SIN", status: "Delivered", date: "Oct 10" },
      { id: "SHP-AD-4410", route: "MUC ➔ DXB", status: "Delivered", date: "Sep 28" }
    ]
  },
  { 
    id: "C3", name: "Lithium Global", kycStatus: "Pending", totalShipments: 12, preferredLine: "Hapag-Lloyd", lastActive: "3 days ago", country: "China", contactEmail: "ops@lithium.cn",
    shipments: [
      { id: "SHP-LG-0012", route: "SHA ➔ LAX", status: "Booking Confirmed", date: "Oct 25" }
    ]
  },
  { 
    id: "C4", name: "Precision Parts Ltd", kycStatus: "Expired", totalShipments: 45, preferredLine: "MSC", lastActive: "1 week ago", country: "USA", contactEmail: "vane@precision.com",
    shipments: [
      { id: "SHP-PP-0845", route: "NYC ➔ LHR", status: "Delivered", date: "Aug 12" },
      { id: "SHP-PP-0844", route: "LAX ➔ SYD", status: "Delivered", date: "Jul 05" }
    ]
  },
];

const EMPTY_FORM = { name: "", country: "", contactEmail: "", preferredLine: "", kycStatus: "Pending" as Customer["kycStatus"] };

export function CustomerManagement({ 
  onAutofill, 
  onShipmentClick 
}: { 
  onAutofill: (customer: Customer) => void;
  onShipmentClick?: (id: string, isNewCustomer?: boolean) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Company name is required";
    if (!form.country) e.country = "Country is required";
    if (!form.contactEmail.trim()) e.contactEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = "Enter a valid email";
    if (!form.preferredLine) e.preferredLine = "Select a shipping line";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const newCustomer: Customer = {
      id: `C${customers.length + 1}`,
      name: form.name.trim(),
      country: form.country,
      contactEmail: form.contactEmail.trim(),
      preferredLine: form.preferredLine,
      kycStatus: "Pending",
      totalShipments: 0,
      lastActive: "Just now",
      shipments: [],
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setErrors({});
    }, 1800);
  };

  const handleClose = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSuccess(false);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-manrope font-extrabold text-[#1A2B4C] mb-1">Shipper Registry</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage {customers.length + 1200} active global partners</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search shippers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium w-80 shadow-sm text-[#1A2B4C] placeholder-slate-400 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 outline-none transition-all"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#1A2B4C] hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer) => (
            <motion.div
              key={customer.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:border-slate-300/60 transition-all duration-300 group relative",
                activeDropdown === customer.id ? "z-30" : "z-10"
              )}
            >
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] text-slate-400 transition-opacity">
                  <Users size={96} />
                </div>
              </div>
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50/70 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50 font-black text-lg">
                    {customer.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h4 className="text-base font-extrabold text-[#1A2B4C]">{customer.name}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border",
                        customer.kycStatus === "Verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        customer.kycStatus === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {customer.kycStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{customer.country}</span>
                      <span className="opacity-30">•</span>
                      <span>ID: {customer.id}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === customer.id ? null : customer.id)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
                  >
                    <MoreVertical size={20} />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === customer.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-2xl py-2 z-20"
                      >
                        <button 
                          onClick={() => { setActiveDropdown(null); alert(`Editing profile for ${customer.name}`); }}
                          className="w-full text-left px-4 py-2.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-3 uppercase tracking-widest transition-colors"
                        >
                          <Building2 size={14} className="text-primary" /> Edit Profile
                        </button>
                        <button 
                          onClick={() => { setActiveDropdown(null); alert(`Sending email to ${customer.contactEmail}`); }}
                          className="w-full text-left px-4 py-2.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 flex items-center gap-3 uppercase tracking-widest transition-colors"
                        >
                          <Mail size={14} className="text-blue-500" /> Send Email
                        </button>
                        <div className="h-px bg-slate-100 my-1 mx-4" />
                        <button 
                          onClick={() => { setActiveDropdown(null); alert(`Suspended ${customer.name}'s account.`); }}
                          className="w-full text-left px-4 py-2.5 text-[11px] font-extrabold text-red-600 hover:bg-red-50 flex items-center gap-3 uppercase tracking-widest transition-colors"
                        >
                          <X size={14} /> Suspend Account
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Flows</p>
                  <div className="flex items-center gap-1.5">
                    <Package size={13} className="text-[#1A2B4C]" />
                    <span className="text-xs font-extrabold text-[#1A2B4C]">{customer.totalShipments}</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pref. Line</p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-emerald-600" />
                    <span className="text-xs font-extrabold text-[#1A2B4C]">{customer.preferredLine}</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Last Sync</p>
                  <div className="flex items-center gap-1.5">
                    <History size={13} className="text-slate-400" />
                    <span className="text-xs font-extrabold text-[#1A2B4C]">{customer.lastActive}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-[11px] font-black text-[#1A2B4C] uppercase tracking-widest flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all">
                    Profile <ExternalLink size={13} />
                  </button>
                  <button 
                    onClick={() => setExpandedCustomerId(expandedCustomerId === customer.id ? null : customer.id)}
                    className="text-[11px] font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {expandedCustomerId === customer.id ? "Hide Shipments" : "View Shipments"}
                  </button>
                </div>
                <button
                  onClick={() => onAutofill(customer)}
                  className="bg-[#1A2B4C] text-white px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-[#253961] shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Zap size={13} className="text-amber-400" /> Auto-Fill Shipment
                </button>
              </div>

              {/* Shipments List */}
              <AnimatePresence>
                {expandedCustomerId === customer.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="pt-6 border-t border-slate-200">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recent Shipments</h5>
                      {customer.shipments.length === 0 ? (
                         <div className="text-xs text-slate-500 text-center py-4">No recent shipments found.</div>
                      ) : (
                        <div className="space-y-3">
                          {customer.shipments.map(ship => (
                            <div 
                              key={ship.id} 
                              onClick={() => onShipmentClick?.(ship.id, customer.kycStatus !== "Verified")}
                              className="flex items-center justify-between p-4 rounded-xl bg-slate-100/50 border border-slate-200/60 hover:border-slate-350 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1A2B4C] shadow-sm group-hover:bg-[#1A2B4C] group-hover:text-white transition-colors">
                                  <Package size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#1A2B4C] mb-0.5">{ship.id}</p>
                                  <p className="text-[10px] font-bold text-slate-500">{ship.route}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500">{ship.date}</span>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                  ship.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                                  ship.status === "In Transit" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  {ship.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Register New Shipper card */}
        <button
          onClick={() => setShowModal(true)}
          className="border-2 border-dashed border-slate-200 bg-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-600/30 hover:bg-blue-50/10 hover:text-blue-600 transition-all group min-h-[220px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]"
        >
          <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center transition-all">
            <Plus size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest transition-colors">Register New Shipper</p>
        </button>
      </div>

      {/* ── Register Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Building2 size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1A2B4C]">Register New Shipper</h3>
                    <p className="text-xs text-slate-400 font-medium">Add a new partner to the registry</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Success State */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Check size={36} className="text-emerald-600" />
                    </div>
                    <p className="text-lg font-extrabold text-[#1A2B4C]">Shipper Registered!</p>
                    <p className="text-sm text-slate-400">KYC verification has been initiated</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              {!success && (
                <div className="px-8 py-6 space-y-5">
                  {/* Company Name */}
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Company Name *</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350" />
                      <input
                        type="text"
                        placeholder="e.g. Acme Logistics Ltd."
                        value={form.name}
                        onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
                        className={cn("w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all", errors.name ? "border-red-350 bg-red-50 focus:ring-2 focus:ring-red-200" : "bg-slate-50 border-slate-200 text-[#1A2B4C] focus:bg-white")}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Contact Email *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350" />
                      <input
                        type="email"
                        placeholder="e.g. ops@company.com"
                        value={form.contactEmail}
                        onChange={e => { setForm(f => ({ ...f, contactEmail: e.target.value })); setErrors(er => ({ ...er, contactEmail: "" })); }}
                        className={cn("w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all", errors.contactEmail ? "border-red-350 bg-red-50 focus:ring-2 focus:ring-red-200" : "bg-slate-50 border-slate-200 text-[#1A2B4C] focus:bg-white")}
                      />
                    </div>
                    {errors.contactEmail && <p className="text-xs text-red-500 mt-1 font-medium">{errors.contactEmail}</p>}
                  </div>

                  {/* Country + Shipping Line */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Country *</label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" />
                        <select
                          value={form.country}
                          onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setErrors(er => ({ ...er, country: "" })); }}
                          className={cn("w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium outline-none appearance-none bg-slate-50 transition-all", errors.country ? "border-red-350 bg-red-50" : "bg-slate-50 border-slate-200 text-[#1A2B4C] focus:bg-white")}
                        >
                          <option value="">Select…</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {errors.country && <p className="text-xs text-red-500 mt-1 font-medium">{errors.country}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Pref. Line *</label>
                      <div className="relative">
                        <Ship size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350 pointer-events-none" />
                        <select
                          value={form.preferredLine}
                          onChange={e => { setForm(f => ({ ...f, preferredLine: e.target.value })); setErrors(er => ({ ...er, preferredLine: "" })); }}
                          className={cn("w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium outline-none appearance-none bg-slate-50 transition-all", errors.preferredLine ? "border-red-350 bg-red-50" : "bg-slate-50 border-slate-200 text-[#1A2B4C] focus:bg-white")}
                        >
                          <option value="">Select…</option>
                          {SHIPPING_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      {errors.preferredLine && <p className="text-xs text-red-500 mt-1 font-medium">{errors.preferredLine}</p>}
                    </div>
                  </div>

                  {/* KYC note */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700 text-xs font-black">!</div>
                    <p className="text-xs font-medium text-amber-700">New shippers are registered as <b>KYC Pending</b>. Verification is initiated automatically.</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-[#253961] transition-colors active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Plus size={16} /> Register Shipper
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}