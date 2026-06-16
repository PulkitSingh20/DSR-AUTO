import { motion } from "motion/react";
import { Package, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/src/services/api";

const getStageStyles = (stage: string) => {
  switch (stage) {
    case "inquiry_received":
    case "quotation_sent":
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    case "booking_requested":
    case "shipping_line_selected":
      return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    case "booking_confirmed":
    case "job_opened":
      return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    case "kyc_pending":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "si_vgm_cutoff_shared":
    case "container_pickup_pending":
    case "si_submitted":
    case "notify_party_pending":
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "draft_bl_received":
    case "draft_bl_approved":
    case "bl_approved_portal":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "vessel_sailed":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    case "liner_invoice_received":
    case "billing_requested":
    case "invoice_sent_to_customer":
    case "payment_details_shared":
      return "text-amber-550 bg-amber-500/10 border-amber-500/20";
    case "shipment_closed":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    default:
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  }
};

const getStageLabel = (stage: string) => {
  if (!stage) return "";
  return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

export function DashboardMetrics({ onViewAll }: { onViewAll?: () => void }) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.shipments.list()
      .then((res: any) => {
        if (!active) return;
        if (res && res.shipments) {
          setShipments(res.shipments);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching shipments for dashboard metrics:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-surface-soft border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Shipments Tracker</h3>
        <button
          onClick={onViewAll}
          className="cursor-pointer text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors tracking-widest uppercase flex items-center gap-1 group"
        >
          View All <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 py-8 text-center text-xs font-mono text-slate-400 uppercase tracking-widest">
            Loading Node Assets...
          </div>
        ) : shipments.length === 0 ? (
          <div className="col-span-4 py-8 text-center text-xs font-mono text-slate-400 uppercase tracking-widest">
            No Active Transits
          </div>
        ) : (
          shipments.slice(0, 4).map((shipment, i) => (
            <motion.button
              key={shipment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-12 h-12 mb-3 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all shadow-inner">
                <Package size={24} />
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors mb-1 line-clamp-1 w-full truncate">
                {shipment.shipper}
              </h4>
              <p className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors mb-4">
                {shipment._id}
              </p>

              <div className={cn("px-2 py-1.5 w-full rounded-lg border text-[10px] font-bold tracking-wide transition-colors whitespace-nowrap overflow-hidden text-ellipsis", getStageStyles(shipment.status))}>
                {getStageLabel(shipment.status)}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
