import { 
  ChevronRight, 
  FileText, 
  Ship,
  Users, 
  CheckCircle2, 
  Save, 
  Plus,
  Zap,
  MapPin,
  Package,
  Anchor
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface ShipmentEntryProps {
  onBack: () => void;
  initialValues?: any;
}

export function ShipmentEntry({ onBack, initialValues }: ShipmentEntryProps) {
  const [shipper, setShipper] = useState(initialValues?.name || "");
  const [consignee, setConsignee] = useState("");
  const [billingEntity, setBillingEntity] = useState("");
  const [forwarder, setForwarder] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(initialValues?.preferredLine === "Maersk" ? 1 : initialValues?.preferredLine === "Hapag-Lloyd" ? 2 : initialValues?.preferredLine === "MSC" ? 3 : 0);
  const [mbl, setMbl] = useState("");
  const [hbl, setHbl] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [commodity, setCommodity] = useState("");
  const [containers, setContainers] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [cached, setCached] = useState(false);
  const [uuid] = useState("ZIP-" + Math.random().toString(36).substring(2, 9).toUpperCase());

  const routes = [
    { label: "North Atlantic Line", code: "ATL-01", carrier: "CMA CGM" },
    { label: "Asia-Pacific Route", code: "ASP-09", carrier: "Maersk" },
    { label: "Trans-Continental Rail", code: "TRC-02", carrier: "Hapag-Lloyd" },
    { label: "Eurasian Landbridge", code: "EUL-05", carrier: "MSC" },
  ];

  const handleConfirmEntry = () => {
    setConfirmed(true);
    setTimeout(() => {
      onBack();
    }, 1800);
  };

  const handleCacheDraft = () => {
    setCached(true);
    setTimeout(() => setCached(false), 2000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-10">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 tracking-tight uppercase mb-2">
          <span>SHIPMENTS</span>
          <ChevronRight size={10} />
          <span className="text-blue-600">CREATE NEW OCEAN ENTRY</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight">Ocean Consignment</h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Auto-Generated UUID: {uuid}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
            <Zap size={12} className="animate-pulse" />
            NODE: DRAFTING
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Form Side */}
        <div className="col-span-8 space-y-8">
          {/* Identification */}
          <FormSection icon={FileText} title="Identification Parameters">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shipment Description</label>
              <input
                type="text"
                placeholder="e.g. North Atlantic Logistics Hub Transfer"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
              />
            </div>
          </FormSection>

          {/* Port Info */}
          <FormSection icon={MapPin} title="Port Details">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Port of Loading (POL)</label>
                <input type="text" placeholder="e.g. Mumbai, INNSA" value={pol} onChange={e => setPol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Port of Discharge (POD)</label>
                <input type="text" placeholder="e.g. Rotterdam, NLRTM" value={pod} onChange={e => setPod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
              </div>
            </div>
          </FormSection>

          {/* Cargo */}
          <FormSection icon={Package} title="Cargo Details">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commodity</label>
                <input type="text" placeholder="e.g. Lithium Battery Units" value={commodity} onChange={e => setCommodity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Container Count / Type</label>
                <input type="text" placeholder="e.g. 2 × 40HC" value={containers} onChange={e => setContainers(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
              </div>
            </div>
          </FormSection>

          {/* Stakeholders */}
          <FormSection icon={Users} title="Network Stakeholders">
            <div className="grid grid-cols-2 gap-8">
              <FormField label="Primary Shipper" placeholder="Manufacturer or supplier" icon={Plus} value={shipper} onChange={(e: any) => setShipper(e.target.value)} />
              <FormField label="Consignee Node" placeholder="Destination recipient" icon={Plus} value={consignee} onChange={(e: any) => setConsignee(e.target.value)} />
              <FormField label="Billing Entity" placeholder="Entity responsible" icon={Plus} value={billingEntity} onChange={(e: any) => setBillingEntity(e.target.value)} />
              <FormField label="Strategic Forwarder" placeholder="Logistics agent" icon={Plus} value={forwarder} onChange={(e: any) => setForwarder(e.target.value)} />
            </div>
          </FormSection>

          {/* MBL / HBL — Ocean Bill of Lading References */}
          <FormSection icon={Anchor} title="Ocean Bill of Lading References">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">MBL Reference <span className="text-blue-500">(Master Bill of Lading)</span></label>
                <input type="text" placeholder="e.g. MAEU123456789" value={mbl} onChange={e => setMbl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                <p className="text-[9px] text-slate-400 font-mono">Issued by the carrier / ocean line</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">HBL Reference <span className="text-blue-500">(House Bill of Lading)</span></label>
                <input type="text" placeholder="e.g. ZIPAW-HBL-0043" value={hbl} onChange={e => setHbl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                <p className="text-[9px] text-slate-400 font-mono">Issued by the freight forwarder</p>
              </div>
            </div>
          </FormSection>
        </div>

        {/* Right Side Cards */}
        <div className="col-span-4 space-y-8">
          {/* Route Allocation */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-900 tracking-widest uppercase mb-6">
              <Ship size={14} className="text-blue-600" />
              Ocean Route Allocation
            </h4>
            <p className="text-xs text-slate-500 mb-8 leading-relaxed">
              Select primary ocean carrier and transit corridor.
            </p>
            <div className="space-y-3">
              {routes.map((r, i) => (
                <div key={i} onClick={() => setSelectedRoute(i)}
                  className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                    selectedRoute === i ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300")}>
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center transition-all",
                    selectedRoute === i ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "border-2 border-slate-200 group-hover:border-slate-300")}>
                    {selectedRoute === i && <CheckCircle2 size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", selectedRoute === i ? "text-slate-900" : "text-slate-600")}>{r.label}</p>
                    <p className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-tight">{r.code} · {r.carrier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Initialize Node */}
          <div className="bg-[#0F172A] p-8 rounded-2xl text-white space-y-8 shadow-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="relative z-10">
              <h4 className="text-lg font-display font-extrabold mb-2">Initialize Node</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Verify all manifest identifiers and stakeholder records before initializing the transit process.
              </p>
            </div>
            <div className="space-y-3 relative z-10">
              <AnimatePresence mode="wait">
                {confirmed ? (
                  <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Entry Confirmed! Redirecting...
                  </motion.div>
                ) : (
                  <motion.button key="confirm-btn" onClick={handleConfirmEntry}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95">
                    <CheckCircle2 size={18} />
                    <span>Confirm Entry</span>
                  </motion.button>
                )}
              </AnimatePresence>
              <button onClick={handleCacheDraft}
                className={cn("w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border",
                  cached ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10")}>
                <Save size={18} />
                <span>{cached ? "Draft Saved!" : "Cache Draft"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistence Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">System Ready</p>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Entry validation complete // Network sync ready</p>
          </div>
        </div>
        <button onClick={onBack} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] px-4 py-2 hover:bg-slate-50 rounded-lg">
          Discard Entry
        </button>
      </div>
    </div>
  );
}

function FormSection({ icon: Icon, title, children }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-blue-500 transition-colors" />
      <div className="flex items-center gap-3 mb-10">
        <Icon className="text-slate-400 group-hover:text-blue-600 transition-colors" size={16} />
        <h4 className="text-[10px] font-bold text-slate-900 tracking-[0.2em] uppercase">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, placeholder, icon: Icon, value, onChange }: any) {
  return (
    <div className="space-y-4">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 group focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
        <Icon className="text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder={placeholder} 
          value={value}
          onChange={onChange}
          className="bg-transparent border-none w-full text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
        />
      </div>
    </div>
  );
}


