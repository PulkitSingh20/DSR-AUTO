import React, { useState } from "react";
import { 
  Building2, 
  Bell, 
  Shield, 
  Link2, 
  Globe, 
  User, 
  Save, 
  ChevronRight,
  Database,
  Mail,
  Zap,
  CheckCircle2,
  Lock,
  Smartphone,
  Clock,
  CalendarDays,
  ShieldCheck,
  Fingerprint,
  RefreshCw,
  Key,
  Copy
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type SettingsTab = "organization" | "notifications" | "automations" | "security" | "integrations" | "regional";

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
  const [isSaving, setIsSaving] = useState(false);

  // 2FA States
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaMethod, setMfaMethod] = useState<"app" | "sms">("app");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://api.zipaworld.com/webhooks/live-updates");

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    setShowBackupCodes(true);
  };

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "automations", label: "Automated Reminders", icon: Clock },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Link2 },
    { id: "regional", label: "Regional", icon: Globe },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  return (
    <div className="p-10 max-w-[1400px] mx-auto min-h-screen">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-manrope font-extrabold text-[#1A2B4C] mb-2 tracking-tight">System Configuration</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zip-A-World Control Engine</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSaving ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Database size={20} />
              </motion.div>
              Updating...
            </>
          ) : (
            <>
              <Save size={20} /> Save Configuration
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-12">
        {/* Left Nav */}
        <div className="col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-5 rounded-3xl transition-all group relative overflow-hidden text-left",
                activeTab === tab.id 
                  ? "bg-white shadow-xl shadow-primary/10 text-primary border border-primary/5" 
                  : "text-slate-400 hover:bg-white/50 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                activeTab === tab.id ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
              )}>
                <tab.icon size={20} />
              </div>
              <span className="font-bold text-sm tracking-wide">{tab.label}</span>
              {activeTab === tab.id && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="col-span-9 bg-white rounded-[40px] shadow-2xl border border-slate-50 overflow-hidden min-h-[700px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-12 h-full"
            >
              {activeTab === "organization" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Corporate Identity</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Logistics Provider details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                      <input 
                        type="text" 
                        defaultValue="Zip-A-World Logistics India Pvt Ltd"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Registration (GSTIN)</label>
                      <input 
                        type="text" 
                        defaultValue="27AAACZ1234F1Z5"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all font-mono" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Office Address</label>
                      <textarea 
                        rows={3}
                        defaultValue="Level 14, Tower B, Smart Global Hub, Gurugram, Haryana 122002"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ Branch Location</label>
                      <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>New Delhi, IN (Headquarters)</option>
                        <option>Mumbai, IN (Western Regional)</option>
                        <option>Dubai, UAE (Global Node)</option>
                        <option>Antwerp, BE (EU Hub)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-[#1A2B4C] font-bold">Verified Provider Status</h4>
                      <p className="text-sm text-slate-500">Your organization is fully compliant with AEO Tier-2 standards.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Certified
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Alert Intelligence</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Configure transit and events notifications</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: "Critical Delay Alerts", desc: "Notification when ETA deviance exceeds 12 hours", icon: Zap, color: "text-amber-500", group: "Operations" },
                      { title: "Kyc Component Approval", desc: "Alert when customer document verification is completed", icon: Shield, color: "text-blue-500", group: "Compliance" },
                      { title: "Financial Manifest Ready", desc: "Alert when invoice has been generated by billing engine", icon: Link2, color: "text-emerald-500", group: "Finance" },
                      { title: "Terminal Arrival", desc: "Port/Airport touchdown notifications for live tracking", icon: Globe, color: "text-indigo-500", group: "Transit" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all rounded-[24px] border border-transparent hover:border-slate-100 group">
                        <div className="flex items-center gap-6">
                          <div className={cn("p-4 rounded-2xl bg-white shadow-sm transition-all group-hover:scale-110", item.color)}>
                            <item.icon size={22} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{item.group}</span>
                            <h4 className="text-[#1A2B4C] font-extrabold text-md mt-0.5">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary/20 transition-all">
                            <Mail size={16} />
                          </button>
                          <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary/20 transition-all">
                            <Smartphone size={16} />
                          </button>
                          <div className="w-12 h-6 bg-emerald-500 rounded-full relative ml-4 cursor-pointer">
                            <div className="absolute right-1 top-1 bottom-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "automations" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Reminder Parameters</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global automation rules for shipment follow-ups</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                      <div className="flex items-center gap-4 text-primary">
                        <Clock size={24} />
                        <h4 className="font-extrabold text-lg">Batch Frequency</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: "Real-time Dispatch", desc: "Instant alerts on event triggers", val: "realtime" },
                          { label: "Daily Summary", desc: "Consolidated morning report at 08:00", val: "daily", checked: true },
                          { label: "Weekly Audit", desc: "Full performance check every Monday", val: "weekly" },
                        ].map((freq, idx) => (
                          <label key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-primary/20 cursor-pointer group transition-all">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#1A2B4C] group-hover:text-primary transition-colors">{freq.label}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{freq.desc}</span>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                              freq.checked ? "border-primary bg-primary" : "border-slate-200"
                            )}>
                              {freq.checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                      <div className="flex items-center gap-4 text-amber-500">
                        <CalendarDays size={24} />
                        <h4 className="font-extrabold text-lg">Lead Time Triggers</h4>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            <span>KYC Expiry Reminder</span>
                            <span className="text-amber-600 font-bold">5 Days Before</span>
                          </div>
                          <input type="range" min="1" max="14" defaultValue="5" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            <span>Shipment ETA Alert</span>
                            <span className="text-blue-600 font-bold">2 Days Before</span>
                          </div>
                          <input type="range" min="1" max="7" defaultValue="2" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            <span>Billing Overdue Follow-up</span>
                            <span className="text-emerald-600 font-bold">Daily After Due Date</span>
                          </div>
                          <input type="range" min="1" max="10" defaultValue="1" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Zap size={20} className="fill-indigo-600" />
                      <h4 className="font-extrabold">Automation Intelligence</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      ZIP-A-WORLD's automated engine uses natural language generation to draft reminders. 
                      Enabling **"Proactive Nudge"** will allow the system to send follow-up emails automatically if documents 
                      are missing 48 hours after the booking is confirmed.
                    </p>
                    <button className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-white px-6 py-3 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                      Configure AI Templates
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">E-Mall Connectivity</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manage external API nodes and carrier portals</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { name: "Maersk Tracking API", status: "Connected", uptime: "99.9%" },
                      { name: "Global Customs Gateway", status: "Connected", uptime: "98.4%" },
                      { name: "DHL Express Sync", status: "Unauthorized", uptime: "-" },
                      { name: "FedEx Insight Hub", status: "Degraded", uptime: "92.1%" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-8 rounded-[32px] border border-slate-100 space-y-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black uppercase text-xl">
                            {item.name[0]}
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            item.status === "Connected" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            item.status === "Unauthorized" ? "bg-red-50 text-red-600 border-red-100" :
                            "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {item.status}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-extrabold text-[#1A2B4C]">{item.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Uptime: {item.uptime}</p>
                        </div>
                        <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 transition-all">
                          Configure Node
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 border-t border-slate-100">
                    <h4 className="text-xl font-manrope font-extrabold text-[#1A2B4C] mb-6">Service Credentials</h4>
                    <div className="max-w-xl space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DHL Express API Key</label>
                        <div className="relative">
                           <input 
                            type="password" 
                            placeholder="Enter your production API key (e.g. dhl_live_...)"
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all pr-12" 
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                            <Lock size={18} />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium ml-1 flex items-center gap-2">
                           <Shield size={10} className="text-emerald-500" />
                           Your keys are encrypted at rest using AES-256 standards.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 space-y-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Webhooks</h4>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Post-event HTTP callbacks for external logic</p>
                      </div>
                      <button 
                        onClick={handleSave}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} 
                        {isSaving ? "Saving..." : "Save Webhook"}
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-8 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook URL</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://api.yourdomain.com/webhooks/shipment-update"
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all pr-12" 
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                             <Link2 size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 flex items-center justify-end">
                        <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                             <p className={cn("text-[10px] font-bold uppercase", webhookEnabled ? "text-emerald-500" : "text-slate-400")}>
                               {webhookEnabled ? "Enabled" : "Disabled"}
                             </p>
                          </div>
                          <div 
                            onClick={() => setWebhookEnabled(!webhookEnabled)}
                            className={cn(
                              "w-12 h-6 rounded-full relative cursor-pointer transition-all",
                              webhookEnabled ? "bg-emerald-500" : "bg-slate-200"
                            )}
                          >
                            <motion.div 
                              animate={{ x: webhookEnabled ? 26 : 4 }}
                              className="absolute top-1 bottom-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-50">
                        <Bell size={18} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        System will send JSON payloads to this endpoint for events such as <span className="font-bold text-[#1A2B4C]">Shipment ETA Changes</span>, <span className="font-bold text-[#1A2B4C]">Terminal Arrivals</span>, and <span className="font-bold text-[#1A2B4C]">KYC Approvals</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Access Control</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manage authentication and user permissions</p>
                  </div>

                  <div className="space-y-8">
                    {/* MFA SECTION */}
                    <div className="bg-slate-50 rounded-[40px] border border-slate-100 p-10 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className={cn(
                              "p-5 rounded-3xl transition-all",
                              mfaEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-200 text-slate-400"
                            )}>
                               <ShieldCheck size={28} />
                            </div>
                            <div>
                               <h4 className="text-xl font-extrabold text-[#1A2B4C]">Two-Factor Authentication</h4>
                               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Multi-layered protocol protection</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => setMfaEnabled(!mfaEnabled)}
                           className={cn(
                             "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all",
                             mfaEnabled 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-white text-slate-400 border border-slate-200 hover:border-primary/20 hover:text-primary"
                           )}
                         >
                           {mfaEnabled ? "Enabled" : "Disabled"}
                         </button>
                      </div>

                      <AnimatePresence>
                        {mfaEnabled && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-8 overflow-hidden pt-4"
                          >
                            <div className="grid grid-cols-2 gap-6">
                               <button 
                                 onClick={() => setMfaMethod("app")}
                                 className={cn(
                                   "p-8 rounded-[32px] border text-left transition-all group",
                                   mfaMethod === "app" ? "bg-white border-primary shadow-xl shadow-primary/5" : "bg-slate-100/50 border-transparent hover:bg-white hover:border-slate-200"
                                 )}
                               >
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all",
                                    mfaMethod === "app" ? "bg-primary text-white" : "bg-white text-slate-300 group-hover:text-primary"
                                  )}>
                                     <Smartphone size={24} />
                                  </div>
                                  <h5 className={cn("font-extrabold", mfaMethod === "app" ? "text-primary" : "text-slate-400")}>Authenticator App</h5>
                                  <p className="text-xs text-slate-400 mt-1">Use Google Authenticator or Authy for secure codes.</p>
                               </button>

                               <button 
                                 onClick={() => setMfaMethod("sms")}
                                 className={cn(
                                   "p-8 rounded-[32px] border text-left transition-all group",
                                   mfaMethod === "sms" ? "bg-white border-primary shadow-xl shadow-primary/5" : "bg-slate-100/50 border-transparent hover:bg-white hover:border-slate-200"
                                 )}
                               >
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all",
                                    mfaMethod === "sms" ? "bg-primary text-white" : "bg-white text-slate-300 group-hover:text-primary"
                                  )}>
                                     <Mail size={24} />
                                  </div>
                                  <h5 className={cn("font-extrabold", mfaMethod === "sms" ? "text-primary" : "text-slate-400")}>SMS Recovery</h5>
                                  <p className="text-xs text-slate-400 mt-1">Receive verification codes via your registered mobile number.</p>
                               </button>
                            </div>

                            <div className="bg-[#1A2B4C] rounded-[32px] p-10 text-white overflow-hidden relative">
                               <div className="relative z-10 space-y-6">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                           <Key size={24} />
                                        </div>
                                        <div>
                                           <h5 className="font-extrabold text-lg">Backup Access Codes</h5>
                                           <p className="text-white/50 text-xs">Generate offline emergency recovery keys</p>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={generateBackupCodes}
                                       className="bg-white text-[#1A2B4C] px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-slate-100 transition-all"
                                     >
                                        <RefreshCw size={16} /> {backupCodes.length > 0 ? "Regenerate" : "Generate Codes"}
                                     </button>
                                  </div>

                                  <AnimatePresence>
                                     {showBackupCodes && (
                                       <motion.div 
                                         initial={{ opacity: 0, y: 10 }}
                                         animate={{ opacity: 1, y: 0 }}
                                         className="grid grid-cols-4 gap-3 pt-4"
                                       >
                                          {backupCodes.map((code, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center font-mono text-[10px] font-black text-white/80 group relative overflow-hidden">
                                               {code}
                                               <button className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                  <Copy size={12} className="text-white" />
                                               </button>
                                            </div>
                                          ))}
                                       </motion.div>
                                     )}
                                  </AnimatePresence>
                                  
                                  {backupCodes.length > 0 && (
                                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center pt-4 opacity-70">
                                      Store these in a secure location. Each code can be used once.
                                    </p>
                                  )}
                               </div>
                               <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                              <Fingerprint size={24} />
                           </div>
                           <h4 className="text-[#1A2B4C] font-extrabold text-lg">Biometric Logins</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">Enable platform-specific biometrics (FaceID, TouchID) for instant node access.</p>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Device: Mac M1</span>
                           <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                              <div className="absolute left-1 top-1 bottom-1 w-3 h-3 bg-white rounded-full" />
                           </div>
                        </div>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col justify-center items-center text-center">
                          <User size={32} className="text-primary mb-4" />
                          <h4 className="text-[#1A2B4C] font-extrabold">Enterprise Capacity</h4>
                          <p className="text-3xl font-manrope font-black text-primary mt-1">12 / 25 Nodes</p>
                          <p className="text-xs text-slate-400 mt-2 font-medium">Standard License</p>
                          <button className="mt-6 text-xs font-black uppercase tracking-widest text-[#1A2B4C] bg-white px-8 py-3 rounded-xl border border-slate-200 hover:border-primary/20 hover:text-primary transition-all">Manage Team</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "regional" && (
                <div className="space-y-10">
                  <div className="border-b border-slate-100 pb-10">
                    <h3 className="text-2xl font-manrope font-extrabold text-[#1A2B4C] mb-2">Localization Hub</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Timezones, Currencies, and Unit Systems</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Timezone</label>
                      <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>(GMT+05:30) Mumbai, India</option>
                        <option>(GMT+00:00) London, UK</option>
                        <option>(GMT-05:00) New York, USA</option>
                        <option>(GMT+08:00) Shanghai, China</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
                      <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>INR - Indian Rupee (₹)</option>
                        <option>USD - US Dollar ($)</option>
                        <option>EUR - Euro (€)</option>
                        <option>AED - UAE Dirham (د.إ)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement System</label>
                      <div className="flex gap-3">
                        <button className="flex-1 py-4 bg-primary text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-primary/20">Metric (kg / m³)</button>
                        <button className="flex-1 py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-bold text-sm">Imperial (lb / ft³)</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Format</label>
                      <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-[#1A2B4C] focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
