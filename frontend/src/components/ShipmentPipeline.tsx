import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { MoreVertical, Filter, X, Check, ArrowUpRight, ChevronRight } from "lucide-react";
import { useSmoothDrag } from "@/src/hooks/useDrag";
import { api } from "@/src/services/api";

const STAGE_TO_COLUMN: Record<string, string> = {
  inquiry_received: "Inquiry Received",
  quotation_sent: "Quotation Sent",
  shipping_line_selected: "Shipping Line Selected",
  booking_requested: "Booking Requested",
  booking_confirmed: "Booking Confirmed",
  kyc_pending: "KYC Pending",
  job_opened: "Job Opened",
  si_vgm_cutoff_shared: "SI/VGM Cutoff Shared",
  container_pickup_pending: "Container Pickup Pending",
  si_submitted: "SI Submitted",
  notify_party_pending: "Notify Party Pending",
  draft_bl_received: "Draft BL Received",
  draft_bl_approved: "Draft BL Approved",
  bl_approved_portal: "BL Approved Portal",
  vessel_sailed: "Vessel Sailed",
  liner_invoice_received: "Liner Invoice Received",
  billing_requested: "Billing Requested",
  invoice_sent_to_customer: "Invoice Sent to Customer",
  payment_details_shared: "Payment Details Shared",
  shipment_closed: "Shipment Closed",
};

interface PipelineCardProps {
  key?: React.Key;
  shipper: string;
  route: string;
  line: string;
  status: string;
  statusColor: string;
  onClick?: () => void;
  isNew?: boolean;
}

// ─── 20-Stage Lifecycle ──────────────────────────────────────────────────────
// Existing customers: skip "KYC Pending" (19 stages)
const oldUserColumns = [
  "Inquiry Received",
  "Quotation Sent",
  "Shipping Line Selected",
  "Booking Requested",
  "Booking Confirmed",
  "Job Opened",
  "SI/VGM Cutoff Shared",
  "Container Pickup Pending",
  "SI Submitted",
  "Notify Party Pending",
  "Draft BL Received",
  "Draft BL Approved",
  "BL Approved Portal",
  "Vessel Sailed",
  "Liner Invoice Received",
  "Billing Requested",
  "Invoice Sent to Customer",
  "Payment Details Shared",
  "Shipment Closed",
];

// New customers: includes mandatory KYC (all 20 stages)
const newUserColumns = [
  "Inquiry Received",
  "Quotation Sent",
  "Shipping Line Selected",
  "Booking Requested",
  "Booking Confirmed",
  "KYC Pending",
  "Job Opened",
  "SI/VGM Cutoff Shared",
  "Container Pickup Pending",
  "SI Submitted",
  "Notify Party Pending",
  "Draft BL Received",
  "Draft BL Approved",
  "BL Approved Portal",
  "Vessel Sailed",
  "Liner Invoice Received",
  "Billing Requested",
  "Invoice Sent to Customer",
  "Payment Details Shared",
  "Shipment Closed",
];

const LINE_LOGOS: Record<string, string> = {
  "CMA CGM": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/CMA_CGM_logo.svg/1200px-CMA_CGM_logo.svg.png",
  "Maersk": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Maersk_Group_Logo.svg/1200px-Maersk_Group_Logo.svg.png",
  "Hapag-Lloyd": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Hapag-Lloyd_logo.svg/1200px-Hapag-Lloyd_logo.svg.png",
  "MSC": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/MSC_Mediterranean_Shipping_Company_logo.svg/1200px-MSC_Mediterranean_Shipping_Company_logo.svg.png",
  "COSCO": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/COSCO_Shipping_logo.svg/1200px-COSCO_Shipping_logo.svg.png",
  "ONE": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Ocean_Network_Express_logo.svg/1200px-Ocean_Network_Express_logo.svg.png"
};

export function ShipmentPipeline({ onShipmentClick }: { onShipmentClick?: (id: string, isNewCustomer?: boolean) => void }) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShippers, setSelectedShippers] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const { containerRef: oldPipelineRef } = useSmoothDrag({ friction: 0.90 });
  const { containerRef: newPipelineRef } = useSmoothDrag({ friction: 0.90 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.shipments.list(), api.customers.list()])
      .then(([shipmentsRes, customersRes]: any) => {
        if (!active) return;
        if (shipmentsRes && shipmentsRes.shipments) {
          setShipments(shipmentsRes.shipments);
        }
        if (customersRes && customersRes.customers) {
          setCustomers(customersRes.customers);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load pipeline data:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const customerMap = useMemo(() => {
    const m = new Map<string, any>();
    customers.forEach(c => m.set(c._id, c));
    return m;
  }, [customers]);

  const { oldUserShipments, newUserShipments } = useMemo(() => {
    const oldList: any[] = [];
    const newList: any[] = [];

    shipments.forEach((s, idx) => {
      const cust = customerMap.get(s.customer_id);
      const isNew = cust?.customer_tag === "NEW_CUSTOMER" || s.status === "kyc_pending";
      
      const col = STAGE_TO_COLUMN[s.status] || "Inquiry Received";
      
      const item = {
        _id: s._id,
        shipper: s.shipper || "ZIPAWORLD",
        route: `${s.origin || "MUM"} ➔ ${s.destination || "ROT"}`,
        line: s.carrier || "TBD",
        status: col,
        color: s.status === "kyc_pending" ? "bg-red-500" :
               s.status === "shipment_closed" ? "bg-emerald-600" :
               s.status === "in_transit" ? "bg-blue-500" : "bg-indigo-400",
        isNewCustomer: isNew
      };

      if (isNew) {
        newList.push(item);
      } else {
        oldList.push(item);
      }
    });

    const oldGrouped: Record<string, any[]> = {};
    const newGrouped: Record<string, any[]> = {};

    oldUserColumns.forEach(col => { oldGrouped[col] = []; });
    newUserColumns.forEach(col => { newGrouped[col] = []; });

    oldList.forEach(item => {
      if (oldGrouped[item.status]) {
        oldGrouped[item.status].push(item);
      } else {
        oldGrouped["Inquiry Received"].push(item);
      }
    });

    newList.forEach(item => {
      if (newGrouped[item.status]) {
        newGrouped[item.status].push(item);
      } else {
        newGrouped["Inquiry Received"].push(item);
      }
    });

    return { oldUserShipments: oldGrouped, newUserShipments: newGrouped };
  }, [shipments, customerMap]);

  // Extract unique values for filters from both pipelines
  const filterOptions = useMemo(() => {
    const shippers = new Set<string>();
    const routes = new Set<string>();
    const statuses = new Set<string>();

    [...Object.values(oldUserShipments).flat(), ...Object.values(newUserShipments).flat()].forEach(s => {
      shippers.add(s.shipper);
      routes.add(s.route);
      statuses.add(s.status);
    });

    return {
      shippers: Array.from(shippers),
      routes: Array.from(routes),
      statuses: Array.from(statuses)
    };
  }, [oldUserShipments, newUserShipments]);

  const toggleFilter = (type: "shipper" | "route" | "status", value: string) => {
    const setters = {
      shipper: { state: selectedShippers, set: setSelectedShippers },
      route: { state: selectedRoutes, set: setSelectedRoutes },
      status: { state: selectedStatuses, set: setSelectedStatuses }
    };
    
    setters[type].set(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSelectedShippers([]);
    setSelectedRoutes([]);
    setSelectedStatuses([]);
  };

  const filteredOldUserShipments = useMemo(() => {
    const result: Record<string, any[]> = {};
    oldUserColumns.forEach(col => {
      const items = oldUserShipments[col] || [];
      result[col] = items.filter(s => {
        const shipperMatch = selectedShippers.length === 0 || selectedShippers.includes(s.shipper);
        const routeMatch = selectedRoutes.length === 0 || selectedRoutes.includes(s.route);
        const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
        return shipperMatch && routeMatch && statusMatch;
      });
    });
    return result;
  }, [oldUserShipments, selectedShippers, selectedRoutes, selectedStatuses]);

  const filteredNewUserShipments = useMemo(() => {
    const result: Record<string, any[]> = {};
    newUserColumns.forEach(col => {
      const items = newUserShipments[col] || [];
      result[col] = items.filter(s => {
        const shipperMatch = selectedShippers.length === 0 || selectedShippers.includes(s.shipper);
        const routeMatch = selectedRoutes.length === 0 || selectedRoutes.includes(s.route);
        const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
        return shipperMatch && routeMatch && statusMatch;
      });
    });
    return result;
  }, [newUserShipments, selectedShippers, selectedRoutes, selectedStatuses]);

  const activeFilterCount = selectedShippers.length + selectedRoutes.length + selectedStatuses.length;
  const oldUserTotal = Object.values(oldUserShipments).flat().length;
  const newUserTotal = Object.values(newUserShipments).flat().length;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Shipment Pipeline</h3>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
              showFilters || activeFilterCount > 0 
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400"
            )}
          >
            <Filter size={12} />
            FILTERS
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="bg-white text-blue-600 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        <div className="text-[10px] font-mono text-slate-700 font-semibold uppercase bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-300">
          LAST SYNC: 14:02 UTC
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <FilterGroup 
                  label="Shipper" 
                  options={filterOptions.shippers} 
                  selected={selectedShippers} 
                  toggle={(v: string) => toggleFilter("shipper", v)} 
                />
                <FilterGroup 
                  label="Route" 
                  options={filterOptions.routes} 
                  selected={selectedRoutes} 
                  toggle={(v: string) => toggleFilter("route", v)} 
                />
                <FilterGroup 
                  label="Status" 
                  options={filterOptions.statuses} 
                  selected={selectedStatuses} 
                  toggle={(v: string) => toggleFilter("status", v)} 
                />
              </div>
              
              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing {Object.values(filteredOldUserShipments).flat().length + Object.values(filteredNewUserShipments).flat().length} of {oldUserTotal + newUserTotal} items
                </p>
                <div className="flex gap-4">
                   <button 
                    onClick={clearFilters}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
                   >
                     <X size={14} /> Clear All
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIPELINE SELECTOR BUTTONS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          onClick={() => setExpandedPipeline(expandedPipeline === "old" ? null : "old")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex flex-col items-center justify-center text-center p-5 rounded-2xl border transition-all cursor-pointer group focus:outline-none",
            expandedPipeline === "old" 
              ? "bg-slate-900 border-blue-500 shadow-xl shadow-blue-900/30" 
              : "bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-blue-500/50"
          )}
        >
          <div className={cn(
            "w-12 h-12 mb-3 rounded-xl flex items-center justify-center transition-all shadow-inner",
            expandedPipeline === "old" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400"
          )}>
            <span className="text-xl font-black">👥</span>
          </div>
          <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors mb-1">
            Existing Customers Pipeline
          </h4>
          <p className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors mb-4">
            Without KYC Requirements
          </p>
          <div className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/50 text-[9px] font-bold tracking-wide text-slate-300">
            {Object.values(filteredOldUserShipments).flat().length} / {oldUserTotal} Active
          </div>
        </motion.button>

        <motion.button
          onClick={() => setExpandedPipeline(expandedPipeline === "new" ? null : "new")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex flex-col items-center justify-center text-center p-5 rounded-2xl border transition-all cursor-pointer group focus:outline-none",
            expandedPipeline === "new" 
              ? "bg-emerald-900/40 border-emerald-500 shadow-xl shadow-emerald-900/30" 
              : "bg-slate-800/40 border-slate-700 hover:bg-emerald-900/20 hover:border-emerald-500/50"
          )}
        >
          <div className={cn(
            "w-12 h-12 mb-3 rounded-xl flex items-center justify-center transition-all shadow-inner",
            expandedPipeline === "new" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400"
          )}>
            <span className="text-xl font-black">⭐</span>
          </div>
          <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors mb-1">
            New Customers Pipeline
          </h4>
          <p className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors mb-4">
            With Mandatory KYC Verification
          </p>
          <div className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/50 text-[9px] font-bold tracking-wide text-slate-300">
            {Object.values(filteredNewUserShipments).flat().length} / {newUserTotal} Active
          </div>
        </motion.button>
      </div>

      {/* ACTIVE PIPELINE KANBAN BOARDS */}
      <AnimatePresence mode="wait">
        {expandedPipeline === "old" && (
          <motion.div
            key="old-pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div ref={oldPipelineRef} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 h-[620px] cursor-grab active:cursor-grabbing select-none pipeline-scroll">
              {oldUserColumns.map((column) => (
                <div key={column} className="flex-shrink-0 w-[280px] flex flex-col gap-4">
                  <header className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider truncate mr-2">
                      {column}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      [{filteredOldUserShipments[column]?.length || 0}]
                    </span>
                  </header>

                  <div className="flex flex-col gap-3 flex-grow overflow-y-auto scrollbar-hide p-1">
                    <AnimatePresence mode="popLayout">
                      {filteredOldUserShipments[column]?.map((shipment, idx) => (
                        <motion.div
                          key={shipment.shipper + idx}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <PipelineCard 
                             shipper={shipment.shipper}
                             route={shipment.route}
                             line={shipment.line}
                             status={shipment.status}
                             statusColor={shipment.color}
                             isNew={false}
                             onClick={() => onShipmentClick?.(shipment._id, false)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <div className="flex-grow border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center p-6 opacity-30 group hover:opacity-100 hover:border-primary/20 transition-all min-h-[100px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Slot Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {expandedPipeline === "new" && (
          <motion.div
            key="new-pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div ref={newPipelineRef} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 h-[620px] cursor-grab active:cursor-grabbing select-none pipeline-scroll">
              {newUserColumns.map((column) => (
                <div key={column} className="flex-shrink-0 w-[280px] flex flex-col gap-4">
                  <header className={cn("flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border shadow-sm", 
                    column === "KYC Pending" ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                  )}>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider truncate mr-2",
                      column === "KYC Pending" ? "text-emerald-900" : "text-slate-900"
                    )}>
                      {column}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      [{filteredNewUserShipments[column]?.length || 0}]
                    </span>
                  </header>

                  <div className="flex flex-col gap-3 flex-grow overflow-y-auto scrollbar-hide p-1">
                    <AnimatePresence mode="popLayout">
                      {filteredNewUserShipments[column]?.map((shipment, idx) => (
                        <motion.div
                          key={shipment.shipper + idx}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <PipelineCard 
                             shipper={shipment.shipper}
                             route={shipment.route}
                             line={shipment.line}
                             status={shipment.status}
                             statusColor={shipment.color}
                             isNew={true}
                             onClick={() => onShipmentClick?.(shipment._id, true)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <div className="flex-grow border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center p-6 opacity-30 group hover:opacity-100 hover:border-primary/20 transition-all min-h-[100px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Slot Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FilterGroup({ label, options, selected, toggle }: any) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black text-[#1A2B4C] uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border flex items-center gap-2",
                isActive 
                  ? "bg-[#1A2B4C] border-[#1A2B4C] text-white shadow-md" 
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300"
              )}
            >
              {isActive && <Check size={10} />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Generate initials from a company name e.g. "Global Tech Indus." → "GT"
function getInitials(name: string): string {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
}

// Deterministic color from name so same company always gets same color
function stringToColor(str: string): string {
  const colors = [
    "#1A2B4C", "#2563eb", "#0891b2", "#0d9488",
    "#059669", "#7c3aed", "#db2777", "#ea580c",
    "#65a30d", "#475569",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function PipelineCard({ shipper, route, line, status, statusColor, onClick, isNew }: PipelineCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2, borderLeftColor: "#3B82F6" }}
      onClick={onClick}
      className={cn("p-4 rounded-xl border shadow-sm transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden flex flex-col gap-3 border-l-4", 
        isNew ? "bg-emerald-50 border-emerald-200 border-l-emerald-400 hover:shadow-lg hover:shadow-emerald-100" : "bg-white border-slate-200 border-l-slate-200 hover:shadow-lg hover:shadow-blue-100"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-0.5 mt-1">
          <h5 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{shipper}</h5>
          <p className="text-[10px] font-mono text-slate-400">{line}</p>
        </div>
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black tracking-wide shadow-sm"
            style={{ backgroundColor: stringToColor(shipper) }}
          >
            {getInitials(shipper)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 py-2 border-y border-slate-50">
        <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
          {route.split(' ➔ ')[0]}
        </div>
        <div className="flex-grow border-t border-slate-200" />
        <div className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
          {route.split(' ➔ ')[1]}
        </div>
      </div>

      <div className="flex items-center justify-between">
         <span className={cn(
           "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
           statusColor === "bg-red-500" ? "text-red-600 bg-red-50" : 
           statusColor.includes("emerald") ? "text-emerald-600 bg-emerald-50" :
           statusColor.includes("amber") ? "text-amber-600 bg-amber-50" :
           "text-blue-600 bg-blue-50"
         )}>
           {status}
         </span>
         <button className={cn("transition-colors", isNew ? "text-emerald-400 group-hover:text-emerald-600" : "text-slate-300 group-hover:text-blue-500")}>
           <ArrowUpRight size={14} />
         </button>
      </div>
    </motion.div>
  );
}