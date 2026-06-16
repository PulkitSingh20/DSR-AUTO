import { motion } from "motion/react";
import { TrendingUp, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ThreeDNetwork } from "./ThreeDNetwork";
import { useState, useEffect } from "react";
import { api } from "@/src/services/api";

export function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.shipments.stats()
      .then((data: any) => {
        if (!active) return;
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch shipment stats for overview:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute active nodes (total minus closed shipments)
  const total = stats?.total || 0;
  const closedCount = stats?.byStatus?.find((s: any) => s.status === "shipment_closed")?.count || 0;
  const activeNodesCount = total - closedCount;

  return (
    <section className="relative overflow-hidden bg-[#0A1121] rounded-[32px] p-12 text-white min-h-[340px] flex flex-col justify-between shadow-technical border border-white/5">
      {/* Background Repeating Text - Rolling Animation */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none overflow-hidden select-none flex flex-col justify-between py-4" style={{ lineHeight: '0.7' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ x: i % 2 === 0 ? "0%" : "-50%" }}
            animate={{ x: i % 2 === 0 ? "-50%" : "0%" }}
            transition={{ 
              duration: 25 + i * 5, 
              repeat: Infinity, 
              repeatType: "loop",
              ease: "linear"
            }}
            className="text-[140px] font-black whitespace-nowrap -ml-20 tracking-tighter uppercase italic flex gap-8"
          >
            {Array.from({ length: 12 }).map((_, j) => (
              <span key={j}>SHIPMENT</span>
            ))}
          </motion.div>
        ))}
      </div>

      <style>{`
        @keyframes routeDash {
          to {
            stroke-dashoffset: -60;
          }
        }
        .route-dash-animate {
          animation: routeDash 12s linear infinite;
        }
      `}</style>

      {/* Interactive 3D Canvas Network Globe */}
      <ThreeDNetwork />

      <div className="relative z-20">
        <h2 className="text-6xl font-display font-extrabold tracking-tight mb-4 max-w-xl leading-[0.95]">
          Logistics <br/>
          <span className="text-blue-500">Intelligence.</span>
        </h2>
        <p className="text-slate-200 font-medium text-lg max-w-sm">
          Real-time monitoring of global transit nodes and terminal operations.
        </p>
      </div>

      <div className="relative z-20 flex flex-wrap gap-12 mt-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-300 font-bold block mb-2">ACTIVE NODES</span>
          <span className="text-5xl font-display font-extrabold text-white">
            {loading ? "..." : activeNodesCount.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-300 font-bold block mb-2">EFFICIENCY RATING</span>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-display font-extrabold text-blue-500">94.2%</span>
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const pipelineSteps = [
  { label: "Inquiry Received", status: "completed" },
  { label: "Quotation Sent", status: "completed" },
  { label: "Booking Done", status: "completed" },
  { label: "KYC Pending", status: "active" },
  { label: "KYC Completed", status: "pending" },
  { label: "SI Pending", status: "pending" },
  { label: "SI Submitted", status: "pending" },
  { label: "BL Draft Pending", status: "pending" },
  { label: "BL Approved", status: "pending" },
  { label: "Invoice Pending", status: "pending" },
  { label: "Completed", status: "pending" },
];

export function CompliancePipeline() {
  return (
    <section className="bg-surface-soft p-8 rounded-2xl shadow-sm border border-border transition-colors">
      <div className="flex justify-between items-center mb-10">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Global Compliance Pipeline</h3>
          <p className="text-xs text-slate-500 font-mono">NODE SYNC ACTIVE // 42 LOCATIONS</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Real-time
        </div>
      </div>

      <div className="relative flex justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
        <div className="absolute top-4 left-0 w-full h-[1px] bg-slate-100 z-0" />
        <div className="absolute top-4 left-0 w-[30%] h-[1px] bg-blue-600 z-0 transition-all duration-1000" />

        {pipelineSteps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center gap-4 min-w-[100px] shrink-0 group">
            {step.status === "completed" ? (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 transition-transform group-hover:scale-110">
                <Check size={14} strokeWidth={4} />
              </div>
            ) : step.status === "active" ? (
              <div className="w-8 h-8 rounded-lg bg-white border border-blue-600 flex items-center justify-center shadow-md shadow-blue-600/10 transition-transform group-hover:scale-110">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center transition-transform group-hover:border-slate-400">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
              </div>
            )}
            <span className={cn(
              "text-[9px] text-center font-bold uppercase tracking-tight max-w-[80px]",
              step.status === "pending" ? "text-slate-400" : "text-slate-900",
              step.status === "active" && "text-blue-600"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
