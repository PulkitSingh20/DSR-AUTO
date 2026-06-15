import { Truck, Plane, Ship, ArrowUpRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ShipmentProps {
  id: string;
  vessel: string;
  shipper: string;
  payload: string;
  destination: string;
  eta: string;
  status: "delayed" | "on-track";
  statusLabel: string;
  type: "sea" | "air";
  carrier?: string;
  onClick?: () => void;
}

const LINE_LOGOS: Record<string, string> = {
  "CMA CGM": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/CMA_CGM_logo.svg/1200px-CMA_CGM_logo.svg.png",
  "Maersk": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Maersk_Group_Logo.svg/1200px-Maersk_Group_Logo.svg.png",
  "Hapag-Lloyd": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Hapag-Lloyd_logo.svg/1200px-Hapag-Lloyd_logo.svg.png",
  "MSC": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/MSC_Mediterranean_Shipping_Company_logo.svg/1200px-MSC_Mediterranean_Shipping_Company_logo.svg.png",
  "Maersk Atlantic": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Maersk_Group_Logo.svg/1200px-Maersk_Group_Logo.svg.png",
};

export function ShipmentCard({ 
  id, 
  vessel, 
  shipper, 
  payload, 
  destination, 
  eta, 
  status, 
  statusLabel,
  type,
  carrier,
  onClick
}: ShipmentProps) {
  const isDelayed = status === "delayed";
  const carrierName = type === "sea" ? (vessel || carrier || "") : (carrier || "");
  const logoUrl = Object.entries(LINE_LOGOS).find(([key]) => carrierName.toLowerCase().includes(key.toLowerCase()))?.[1];

  return (
    <div 
      onClick={onClick}
      className="bg-surface-soft p-5 rounded-xl flex items-center gap-6 group hover:border-blue-500/30 transition-all cursor-pointer border border-border shadow-sm relative overflow-hidden"
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        isDelayed ? "bg-red-500" : "bg-emerald-500"
      )} />

      <div className="flex items-center gap-4 min-w-[200px]">
        {logoUrl ? (
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center p-1.5 shrink-0">
            <img 
              src={logoUrl} 
              alt={carrierName} 
              className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
            {type === "sea" ? <Ship size={18} className="text-slate-400" /> : <Plane size={18} className="text-slate-400" />}
          </div>
        )}
        <div>
          <h4 className="text-sm font-mono font-bold text-text-main tracking-tight transition-colors">{id}</h4>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{carrierName}</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-8">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Route & Payload</p>
          <p className="text-xs font-semibold text-text-main truncate transition-colors">{shipper} → <span className="text-blue-600">{destination}</span></p>
          <p className="text-[10px] text-slate-500 mt-0.5">{payload}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", isDelayed ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wide",
              isDelayed ? "text-red-600" : "text-emerald-600"
            )}>
              {statusLabel}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
          <p className={cn(
            "text-xs font-mono font-medium",
            isDelayed ? "text-red-600" : "text-slate-700"
          )}>{eta}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 transition-all border border-slate-100">
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

// In ShipmentCard.tsx, also need to add ArrowUpRight to imports if not there. I'll check.
