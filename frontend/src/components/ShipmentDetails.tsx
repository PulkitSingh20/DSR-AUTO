import React, { useState } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Package, 
  Clock, 
  FileText, 
  Mail, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  History,
  Download
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";



interface ShipmentDetailsProps {
  id: string;
  isNewCustomer?: boolean;
  onBack: () => void;
  onViewDocuments?: () => void;
}

const TIMELINE_STAGES = [
  { title: "Inquiry Received", time: "Day 1", user: "Customer", isSystem: false, description: "Initial shipment inquiry received via portal." },
  { title: "Quotation Sent", time: "Day 1", user: "Sales_Agent", isSystem: false, description: "Automated rate quotation generated and dispatched." },
  { title: "Shipping Line Selected", time: "Day 2", user: "Customer", isSystem: false, description: "Carrier preferences confirmed by the shipper." },
  { title: "Booking Requested", time: "Day 2", user: "Ops_Team", isSystem: false, description: "Space request submitted to shipping line." },
  { title: "Booking Confirmed", time: "Day 3", user: "Carrier_API", isSystem: true, description: "Booking confirmation and SO received." },
  { title: "KYC Pending", time: "Day 3", user: "Compliance_Bot", isSystem: true, description: "Awaiting mandatory KYC clearance for new account." },
  { title: "Job Opened", time: "Day 4", user: "System", isSystem: true, description: "Internal job reference allocated and active." },
  { title: "SI/VGM Cutoff Shared", time: "Day 4", user: "Ops_Team", isSystem: false, description: "Cutoff deadlines published to shipper." },
  { title: "Container Pickup Pending", time: "Day 5", user: "Transporter", isSystem: false, description: "Empty container dispatch to loading point." },
  { title: "SI Submitted", time: "Day 6", user: "Customer", isSystem: false, description: "Shipping instructions provided for draft BL." },
  { title: "Notify Party Pending", time: "Day 6", user: "System", isSystem: true, description: "Awaiting consignee and notify party validation." },
  { title: "Draft BL Received", time: "Day 7", user: "Carrier_API", isSystem: true, description: "Initial BL draft obtained from carrier." },
  { title: "Draft BL Approved", time: "Day 7", user: "Customer", isSystem: false, description: "Draft BL verified and approved by shipper." },
  { title: "BL Approved Portal", time: "Day 8", user: "Ops_Team", isSystem: false, description: "Final BL confirmed on carrier portal." },
  { title: "Vessel Sailed", time: "Day 10", user: "AIS_Tracker", isSystem: true, description: "Vessel departure confirmed from POL." },
  { title: "Liner Invoice Received", time: "Day 12", user: "Finance_Bot", isSystem: true, description: "Carrier freight invoice synchronized." },
  { title: "Billing Requested", time: "Day 12", user: "System", isSystem: true, description: "Internal billing cycle triggered." },
  { title: "Invoice Sent to Customer", time: "Day 13", user: "Finance_Team", isSystem: false, description: "Commercial invoice dispatched to client." },
  { title: "Payment Details Shared", time: "Day 14", user: "System", isSystem: true, description: "Bank transaction reference logged." },
  { title: "Shipment Closed", time: "Day 15", user: "System_Core", isSystem: true, description: "Lifecycle complete. File archived." }
];

function getJobNumber(id: string) {
  if (id.startsWith("JOB-")) return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return `JOB-${Math.abs(hash).toString(36).toUpperCase().padStart(6, 'X')}`;
}

export function ShipmentDetails({ id, isNewCustomer = false, onBack, onViewDocuments }: ShipmentDetailsProps) {
  const [kycDone, setKycDone] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); 
  const activeStages = isNewCustomer ? TIMELINE_STAGES : TIMELINE_STAGES.filter(s => s.title !== "KYC Pending");
  
  const jobNumber = getJobNumber(id);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 h-24 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-200"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-manrope font-extrabold text-[#1A2B4C]">{jobNumber}</h2>
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">ACTIVE FLOW</span>
            </div>
            <p className="text-xs font-bold text-slate-400">TRACKING ID: {id} • CREATED 24 APR 2024</p>
          </div>
        </div>
      </header>

      <main className="mt-24 p-6 lg:p-10 max-w-[1440px] mx-auto grid grid-cols-12 gap-8 w-full">
        <div className="col-span-8 space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-8 items-center">
            <div className="flex-grow max-w-[280px]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Milestone Quick-Sync</h4>
              <div className="flex gap-4">
                {isNewCustomer ? (
                  <StatusToggle 
                    label="KYC Complete" 
                    active={kycDone} 
                    onClick={() => setKycDone(!kycDone)} 
                  />
                ) : (
                  <div className="px-5 py-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} /> Existing Customer (KYC Verified)
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-12 w-px bg-slate-100" />
            
            <div className="flex-grow">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <AlertCircle size={12} className="text-amber-500" /> Manual Stage Override
              </h4>
              <select 
                value={currentStage}
                onChange={(e) => setCurrentStage(Number(e.target.value))}
                className="w-full bg-amber-50/50 border border-amber-200/50 text-[#1A2B4C] text-xs font-bold rounded-xl px-4 py-2.5 outline-none hover:border-amber-300 focus:ring-2 focus:ring-amber-200 transition-all cursor-pointer"
              >
                {activeStages.map((stage, idx) => {
                  const isBlockedByKyc = isNewCustomer && !kycDone && idx > 5;
                  return (
                    <option key={idx} value={idx} disabled={isBlockedByKyc}>
                      {idx + 1}. {stage.title} {isBlockedByKyc ? "(KYC Required)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="h-12 w-px bg-slate-100" />
            
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Update</p>
              <p className="text-sm font-extrabold text-[#1A2B4C]">Just now</p>
            </div>
          </div>

          <Section title="CUSTOMER INFO" icon={User}>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <User size={24} />
                </div>
                <div>
                  <h5 className="font-extrabold text-[#1A2B4C]">Global Tech Industries</h5>
                  <p className="text-xs font-bold text-slate-400">Primary Account: GTA-9912</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                <InfoItem label="Port of Loading" value="MUMBAI (INBOM)" />
                <InfoItem label="Port of Discharge" value="ROTTERDAM (NLRTM)" />
                <InfoItem label="Gross Weight" value="42,500.00 KG" />
                <InfoItem label="Incoterm" value="CIF - COST & FREIGHT" />
              </div>
            </div>
          </Section>

          <Section title="CURRENT STAGE" icon={Clock}>
            <div className="pl-8 pt-2 pb-4">
              <TimelineItem 
                status="active" 
                title={activeStages[currentStage]?.title || "Unknown Stage"} 
                time="IN_PROGRESS"
                user={activeStages[currentStage]?.user}
                isSystem={activeStages[currentStage]?.isSystem}
                description={activeStages[currentStage]?.description}
              />
            </div>
          </Section>
        </div>

        <div className="col-span-4 space-y-8">
          <Section title="VAULT DOCUMENTS" icon={FileText}>
            <div className="space-y-3">
              <button 
                onClick={onViewDocuments}
                className="w-full py-4 bg-slate-900 rounded-xl text-[10px] font-bold text-white hover:bg-blue-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
              >
                <FileText size={16} /> Open Document Vault
              </button>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-blue-600">
            <Icon size={16} />
          </div>
          <h4 className="text-[10px] font-bold text-slate-900 tracking-[0.2em] uppercase">{title}</h4>
        </div>
        <button className="text-slate-300 hover:text-slate-900 transition-colors">
          <ExternalLink size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function StatusToggle({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all",
        active 
          ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm" 
          : "bg-slate-50 border-slate-100 text-slate-400"
      )}
    >
      {active ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function InfoItem({ label, value }: any) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItem({ status, title, time, user, description, isSystem = false }: any) {
  return (
    <div className="relative group">
      <div className={cn(
        "absolute -left-[31px] top-1 w-5 h-5 rounded-lg border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110",
        status === "completed" ? "bg-blue-600" : status === "active" ? "bg-amber-400" : "bg-slate-100"
      )}>
        {status === "completed" && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
        {status === "active" && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <h5 className={cn("text-xs font-bold", status === "active" ? "text-blue-600" : "text-slate-900")}>{title}</h5>
            {user && (
              <span className={cn(
                "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded",
                isSystem ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-600"
              )}>
                {isSystem ? "SYSTEM//" : "USER//"}{user}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400">{time}</span>
        </div>
        <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-xl group-hover:text-slate-700 transition-colors">{description}</p>
      </div>
    </div>
  );
}
