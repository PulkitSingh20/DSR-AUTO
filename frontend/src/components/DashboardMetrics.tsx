import { motion } from "motion/react";
import { Package, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

const activeShipments = [
  {
    id: "SHP-10492",
    name: "Lithium Units (42t) - Maersk Atlantic",
    stage: "In Transit",
    statusColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "SHP-10493",
    name: "Propulsion Parts - Shipment Express",
    stage: "KYC Pending",
    statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "SHP-10494",
    name: "Semiconductors - Global Transit",
    stage: "Customs Cleared",
    statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "SHP-10495",
    name: "Medical Equipment - Ocean Star",
    stage: "Booking Done",
    statusColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "SHP-10496",
    name: "Automotive Parts - Neo Transit",
    stage: "Pending Dispatch",
    statusColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "SHP-10497",
    name: "Raw Materials - Heavy Lifter",
    stage: "Customs Hold",
    statusColor: "text-red-500 bg-red-500/10 border-red-500/20",
  },
  {
    id: "SHP-10498",
    name: "Consumer Goods - Quick Freight",
    stage: "In Transit",
    statusColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  }
];

export function DashboardMetrics({ onViewAll }: { onViewAll?: () => void }) {
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
        {activeShipments.slice(0, 4).map((shipment, i) => (
          <motion.button
            key={shipment.id}
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
              {shipment.name.split(' - ')[0]}
            </h4>
            <p className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors mb-4">
              {shipment.id}
            </p>

            <div className={cn("px-2 py-1.5 w-full rounded-lg border text-[10px] font-bold tracking-wide transition-colors whitespace-nowrap overflow-hidden text-ellipsis", shipment.statusColor)}>
              {shipment.stage}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
