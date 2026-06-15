import { useState, useRef, useEffect } from "react";
import { 
  Bell, 
  HelpCircle, 
  Search, 
  User, 
  Send, 
  Edit3, 
  AlertTriangle, 
  Mail, 
  Stars, 
  TrendingUp, 
  Timer, 
  ArrowRight,
  Plus,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Settings,
  MoreVertical,
  Calendar,
  Flag,
  ListFilter,
  FileText,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useNotifications, Notification } from "@/src/lib/store";

const mainTabs = ["Templates", "Automation Rules", "Follow-up Engine"];
const filterTabs = ["KYC", "SI (Shipping Instructions)", "Customer Setup", "Billing & Finance"];

interface Template {
  id: string;
  tag: string;
  title: string;
  content: string;
  borderColor: string;
  iconType: "user" | "alert" | "mail" | "check" | "invoice";
}

interface AutoRule {
  id: string;
  condition: string;
  action: string;
  frequency: string;
  active: boolean;
}

interface MailLog {
  id: string;
  shipmentId: string;
  recipient: string;
  subject: string;
  status: "sent" | "pending" | "failed";
  timestamp: string;
  type: "auto" | "manual";
}

interface SmartTask {
  id: string;
  title: string;
  type: "cutoff" | "si" | "payment";
  priority: "urgent" | "upcoming";
  dueDate: string;
  shipmentId: string;
  status: "pending" | "done";
}

interface CalendarTask {
  id: string;
  day: number;
  month: number; // 0=Apr, 1=May
  title: string;
  type: "cutoff" | "si" | "payment" | "kyc";
  shipmentId: string;
}

const INITIAL_TASKS: SmartTask[] = [
  { id: "T1", title: "Port Cutoff Imminent", type: "cutoff", priority: "urgent", dueDate: "Today, 18:00", shipmentId: "EID-0943", status: "pending" },
  { id: "T2", title: "SI Submission Overdue", type: "si", priority: "urgent", dueDate: "Yesterday", shipmentId: "EID-4401", status: "pending" },
  { id: "T3", title: "Final Payment Pending", type: "payment", priority: "upcoming", dueDate: "29 Apr", shipmentId: "EID-9912", status: "pending" },
  { id: "T4", title: "Vessel Cutoff Warning", type: "cutoff", priority: "upcoming", dueDate: "30 Apr", shipmentId: "EID-1022", status: "pending" },
];

const INITIAL_CALENDAR_TASKS: CalendarTask[] = [
  { id: "C1", day: 1, month: 0, title: "KYC Deadline", type: "kyc", shipmentId: "EID-0943" },
  { id: "C2", day: 5, month: 0, title: "Port Cutoff", type: "cutoff", shipmentId: "EID-4401" },
  { id: "C3", day: 12, month: 0, title: "SI Submission", type: "si", shipmentId: "EID-9912" },
  { id: "C4", day: 18, month: 0, title: "Payment Due", type: "payment", shipmentId: "EID-1022" },
  { id: "C5", day: 28, month: 0, title: "Vessel Departure", type: "cutoff", shipmentId: "EID-0943" },
  { id: "C6", day: 29, month: 0, title: "Final Docs", type: "si", shipmentId: "EID-4401" },
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: "kyc-req",
    tag: "ONBOARDING",
    title: "KYC Request",
    content: `"Dear [Customer Name], to proceed with the ZIP-A-WORLD onboarding, please provide your tax identification and trade licenses..."`,
    borderColor: "border-primary",
    iconType: "user"
  },
  {
    id: "booking-conf",
    tag: "BOOKING",
    title: "Booking Confirmation",
    content: `"CONFIRMED: Your shipment for [Vessel] has been allocated space. Please find the booking note attached..."`,
    borderColor: "border-emerald-500",
    iconType: "check"
  },
  {
    id: "si-sub",
    tag: "DOCUMENTATION",
    title: "SI Submission",
    content: `"Pending Action: We require the final Shipping Instructions for Ref #[Ref]. Please submit via the portal by [Date]..."`,
    borderColor: "border-amber-500",
    iconType: "mail"
  },
  {
    id: "cutoff-rem",
    tag: "CRITICAL",
    title: "Cutoff Reminder",
    content: `"URGENT: Port cutoff for [Vessel] is tomorrow. Failure to deliver container [ID] will result in roll-over and penalties..."`,
    borderColor: "border-error",
    iconType: "alert"
  },
  {
    id: "invoice-mail",
    tag: "FINANCE",
    title: "Invoice Notification",
    content: `"Invoice generated for Shipment #[Ref]. Total amount: [Amount]. Please settle within [Days] to release documentation..."`,
    borderColor: "border-indigo-500",
    iconType: "invoice"
  }
];

const INITIAL_RULES: AutoRule[] = [
  { id: "1", condition: "Stage = 'KYC Pending'", action: "Send 'KYC Request' Template", frequency: "Every 24 hrs", active: true },
  { id: "2", condition: "Cutoff Date = Tomorrow", action: "Send 'Cutoff Reminder' Alert", frequency: "Once (Immediate)", active: true },
  { id: "3", condition: "SI Submitted = True", action: "Send 'Consignee Update' Mail", frequency: "Once", active: false }
];

const INITIAL_LOGS: MailLog[] = [
  { id: "L1", shipmentId: "EID-0943", recipient: "Global Tech", subject: "KYC Follow-up", status: "sent", timestamp: "14:15 PM", type: "auto" },
  { id: "L2", shipmentId: "EID-4401", recipient: "Aero Dynamics", subject: "Port Cutoff Alert", status: "pending", timestamp: "Tomorrow 08:00 AM", type: "auto" },
  { id: "L3", shipmentId: "EID-9912", recipient: "Markus Vane", subject: "Manual SI Query", status: "sent", timestamp: "9:30 AM", type: "manual" },
];

// Calendar helpers
const MONTH_NAMES = ["April", "May"];
const MONTH_DAYS = [30, 31];
// April 2025 starts on Tuesday (index 2)
const MONTH_STARTS = [2, 4];

const TASK_TYPE_COLORS: Record<string, string> = {
  cutoff: "bg-red-500",
  si: "bg-amber-500",
  payment: "bg-indigo-500",
  kyc: "bg-primary",
};
const TASK_TYPE_LIGHT: Record<string, string> = {
  cutoff: "bg-red-50 text-red-600 border-red-200",
  si: "bg-amber-50 text-amber-600 border-amber-200",
  payment: "bg-indigo-50 text-indigo-600 border-indigo-200",
  kyc: "bg-blue-50 text-blue-600 border-blue-200",
};

export function ReminderCenter() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("Templates");
  const [activeFilter, setActiveFilter] = useState("KYC");
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [rules, setRules] = useState<AutoRule[]>(INITIAL_RULES);
  const [tasks, setTasks] = useState<SmartTask[]>(INITIAL_TASKS);
  const [logs, setLogs] = useState<MailLog[]>(INITIAL_LOGS);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(INITIAL_CALENDAR_TASKS);

  // Deploy rule modal
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newRule, setNewRule] = useState({ condition: "", action: "", frequency: "Every 24 hrs" });

  // Edit template modal
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Add new template modal
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ tag: "", title: "", content: "", iconType: "mail" as Template["iconType"], borderColor: "border-primary" });

  // Add automation logic modal
  const [showAddLogic, setShowAddLogic] = useState(false);
  const [newLogic, setNewLogic] = useState({ condition: "", action: "", frequency: "Every 24 hrs" });

  // Mail timeline row menu
  const [openLogMenu, setOpenLogMenu] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<MailLog | null>(null);
  const [editLogForm, setEditLogForm] = useState({ subject: "", recipient: "", timestamp: "" });

  // Add reminder task modal
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", type: "cutoff" as SmartTask["type"], priority: "upcoming" as SmartTask["priority"], dueDate: "", shipmentId: "" });

  // Calendar state
  const [calMonth, setCalMonth] = useState(0);
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const [showCalTaskModal, setShowCalTaskModal] = useState(false);
  const [calTaskForm, setCalTaskForm] = useState({ title: "", type: "cutoff" as CalendarTask["type"], shipmentId: "" });
  const [editingCalTask, setEditingCalTask] = useState<CalendarTask | null>(null);

  // Close log menu on outside click
  const logMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (logMenuRef.current && !logMenuRef.current.contains(e.target as Node)) setOpenLogMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [editingRule, setEditingRule] = useState<AutoRule | null>(null);
  const [editRuleForm, setEditRuleForm] = useState({ condition: "", action: "", frequency: "Every 24 hrs" });

  const handleOpenEditRule = (rule: AutoRule) => {
    setEditingRule(rule);
    setEditRuleForm({ condition: rule.condition, action: rule.action, frequency: rule.frequency });
  };

  const handleSaveRule = () => {
    if (!editingRule) return;
    setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...editRuleForm } : r));
    setEditingRule(null);
  };
  const handleDeployRule = () => {
    if (!newRule.condition || !newRule.action) return;
    setRules(prev => [...prev, { id: Date.now().toString(), condition: newRule.condition, action: newRule.action, frequency: newRule.frequency, active: true }]);
    setNewRule({ condition: "", action: "", frequency: "Every 24 hrs" });
    setShowDeployModal(false);
    setActiveTab("Automation Rules");
  };

  const handleAddLogic = () => {
    if (!newLogic.condition || !newLogic.action) return;
    setRules(prev => [...prev, { id: Date.now().toString(), condition: newLogic.condition, action: newLogic.action, frequency: newLogic.frequency, active: true }]);
    setNewLogic({ condition: "", action: "", frequency: "Every 24 hrs" });
    setShowAddLogic(false);
  };

  const handleOpenEditTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    setEditingTemplate(t);
    setEditContent(t.content);
    setEditTag(t.tag);
    setEditTitle(t.title);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, content: editContent, tag: editTag, title: editTitle } : t));
    setEditingTemplate(null);
  };

  const handleSaveNewTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) return;
    const colors = ["border-primary", "border-emerald-500", "border-amber-500", "border-error", "border-indigo-500", "border-violet-500"];
    setTemplates(prev => [...prev, {
      id: Date.now().toString(),
      tag: newTemplate.tag || "CUSTOM",
      title: newTemplate.title,
      content: newTemplate.content,
      borderColor: newTemplate.borderColor,
      iconType: newTemplate.iconType
    }]);
    setNewTemplate({ tag: "", title: "", content: "", iconType: "mail", borderColor: "border-primary" });
    setShowNewTemplate(false);
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.shipmentId) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), ...newTask, status: "pending" }]);
    
    // Add notification globally
    const notif: Notification = {
      id: Date.now().toString() + "_notif",
      title: "New Reminder Set",
      description: `Task "${newTask.title}" for ${newTask.shipmentId} due ${newTask.dueDate}`,
      type: "info",
      time: "Just now",
      isNew: true,
      category: "system"
    };
    addNotification(notif);

    setNewTask({ title: "", type: "cutoff", priority: "upcoming", dueDate: "", shipmentId: "" });
    setShowAddTask(false);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    setOpenLogMenu(null);
  };

  const handleResendLog = (log: MailLog) => {
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, status: "pending", timestamp: "Just now" } : l));
    setOpenLogMenu(null);
  };

  const handleOpenEditLog = (log: MailLog) => {
    setEditingLog(log);
    setEditLogForm({ subject: log.subject, recipient: log.recipient, timestamp: log.timestamp });
    setOpenLogMenu(null);
  };

  const handleSaveLog = () => {
    if (!editingLog) return;
    setLogs(prev => prev.map(l => l.id === editingLog.id ? { ...l, ...editLogForm } : l));
    setEditingLog(null);
  };

  // Calendar task operations
  const getTasksForDay = (day: number) => calendarTasks.filter(t => t.day === day && t.month === calMonth);

  const handleDayClick = (day: number) => {
    setSelectedCalDay(day);
    setCalTaskForm({ title: "", type: "cutoff", shipmentId: "" });
    setEditingCalTask(null);
    setShowCalTaskModal(true);
  };

  const handleEditCalTask = (task: CalendarTask) => {
    setEditingCalTask(task);
    setCalTaskForm({ title: task.title, type: task.type, shipmentId: task.shipmentId });
    setSelectedCalDay(task.day);
    setShowCalTaskModal(true);
  };

  const handleSaveCalTask = () => {
    if (!calTaskForm.title || !selectedCalDay) return;
    if (editingCalTask) {
      setCalendarTasks(prev => prev.map(t => t.id === editingCalTask.id ? { ...t, ...calTaskForm } : t));
    } else {
      setCalendarTasks(prev => [...prev, { id: Date.now().toString(), day: selectedCalDay, month: calMonth, ...calTaskForm }]);
    }
    setShowCalTaskModal(false);
    setEditingCalTask(null);
  };

  const handleDeleteCalTask = (id: string) => {
    setCalendarTasks(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: Template["iconType"]) => {
    switch (type) {
      case "user": return <User size={20} className="text-primary" />;
      case "alert": return <AlertTriangle size={20} className="text-error" />;
      case "check": return <CheckCircle2 size={20} className="text-emerald-500" />;
      case "invoice": return <Activity size={20} className="text-indigo-500" />;
      default: return <Mail size={20} className="text-primary" />;
    }
  };

  // Build calendar grid
  const buildCalGrid = () => {
    const startDay = MONTH_STARTS[calMonth]; // 0=Sun
    const totalDays = MONTH_DAYS[calMonth];
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  };

  const today = 28; // mock today

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* Title */}
      <section className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Automation Engine v2.0</span>
          </div>
          <h2 className="text-6xl font-manrope font-extrabold text-on-surface tracking-tighter mb-4">Mail Automation Center</h2>
          <p className="text-on-surface-variant max-w-3xl text-lg font-medium leading-relaxed opacity-80">
            Design template-driven communication workflows. Set logic-based triggers and monitor the global shipment communication timeline.
          </p>
        </div>
        <button onClick={() => setShowDeployModal(true)} className="bg-[#1A2B4C] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95">
          <Zap size={20} className="text-amber-400" /> Deploy Rule
        </button>
      </section>

      {/* ── MODAL: Deploy Rule ── */}
      <AnimatePresence>
        {showDeployModal && (
          <Modal onClose={() => setShowDeployModal(false)} title="Deploy Automation Rule" subtitle="Logic Trigger Engine v2.0">
            <ModalField label="Trigger Condition" value={newRule.condition} placeholder="e.g. Stage = 'Customs Hold'" onChange={v => setNewRule(p => ({ ...p, condition: v }))} />
            <ModalField label="Action" value={newRule.action} placeholder="e.g. Send 'Customs Alert' Template" onChange={v => setNewRule(p => ({ ...p, action: v }))} />
            <ModalSelect label="Frequency" value={newRule.frequency} options={["Once (Immediate)", "Every 24 hrs", "Every 48 hrs", "Weekly"]} onChange={v => setNewRule(p => ({ ...p, frequency: v }))} />
            <ModalFooter onCancel={() => setShowDeployModal(false)} onConfirm={handleDeployRule} confirmLabel="Deploy Rule" disabled={!newRule.condition || !newRule.action} confirmIcon={<Zap size={16} className="text-amber-400" />} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Edit Template ── */}
      <AnimatePresence>
        {editingTemplate && (
          <Modal onClose={() => setEditingTemplate(null)} title="Edit Template" subtitle={`Editing: ${editingTemplate.title}`}>
            <ModalField label="Tag / Category" value={editTag} placeholder="e.g. ONBOARDING" onChange={setEditTag} />
            <ModalField label="Template Title" value={editTitle} placeholder="e.g. KYC Request" onChange={setEditTitle} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Template Body</label>
              <textarea
                rows={6}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none"
                placeholder={`"Dear [Customer Name], ..."`}
              />
              <p className="text-[9px] text-slate-400 mt-1 font-mono">Use [Customer Name], [Vessel], [Ref], [Date], [Amount] as dynamic placeholders.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Border Accent</label>
              <div className="flex gap-2">
                {["border-primary","border-emerald-500","border-amber-500","border-error","border-indigo-500","border-violet-500"].map(c => (
                  <button key={c} onClick={() => setEditingTemplate(p => p ? { ...p, borderColor: c } : p)}
                    className={cn("w-8 h-8 rounded-full border-4 transition-transform", c.replace("border-","bg-"), editingTemplate?.borderColor === c ? "scale-125 ring-2 ring-offset-2 ring-slate-300" : "opacity-60")} />
                ))}
              </div>
            </div>
            <ModalFooter onCancel={() => setEditingTemplate(null)} onConfirm={handleSaveTemplate} confirmLabel="Save Template" />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: New Template ── */}
      <AnimatePresence>
        {showNewTemplate && (
          <Modal onClose={() => setShowNewTemplate(false)} title="Craft New Template" subtitle="Design a reusable communication template">
            <ModalField label="Tag / Category" value={newTemplate.tag} placeholder="e.g. ONBOARDING" onChange={v => setNewTemplate(p => ({ ...p, tag: v }))} />
            <ModalField label="Template Title" value={newTemplate.title} placeholder="e.g. Welcome Email" onChange={v => setNewTemplate(p => ({ ...p, title: v }))} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Template Body</label>
              <textarea
                rows={6}
                value={newTemplate.content}
                onChange={e => setNewTemplate(p => ({ ...p, content: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none"
                placeholder={`"Dear [Customer Name], ..."`}
              />
              <p className="text-[9px] text-slate-400 mt-1 font-mono">Use [Customer Name], [Vessel], [Ref], [Date], [Amount] as dynamic placeholders.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Icon Type</label>
              <div className="flex gap-2">
                {(["user","mail","check","alert","invoice"] as Template["iconType"][]).map(ic => (
                  <button key={ic} onClick={() => setNewTemplate(p => ({ ...p, iconType: ic }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", newTemplate.iconType === ic ? "bg-[#1A2B4C] text-white border-[#1A2B4C]" : "bg-slate-50 text-slate-500 border-slate-200")}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Border Accent</label>
              <div className="flex gap-2">
                {["border-primary","border-emerald-500","border-amber-500","border-error","border-indigo-500","border-violet-500"].map(c => (
                  <button key={c} onClick={() => setNewTemplate(p => ({ ...p, borderColor: c }))}
                    className={cn("w-8 h-8 rounded-full border-4 transition-transform", c.replace("border-","bg-"), newTemplate.borderColor === c ? "scale-125 ring-2 ring-offset-2 ring-slate-300" : "opacity-60")} />
                ))}
              </div>
            </div>
            <ModalFooter onCancel={() => setShowNewTemplate(false)} onConfirm={handleSaveNewTemplate} confirmLabel="Create Template" disabled={!newTemplate.title || !newTemplate.content} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add New Automation Logic ── */}
      <AnimatePresence>
        {showAddLogic && (
          <Modal onClose={() => setShowAddLogic(false)} title="Add Automation Logic" subtitle="Define a new trigger-action rule">
            <ModalField label="Trigger Condition" value={newLogic.condition} placeholder="e.g. Stage = 'BL Pending'" onChange={v => setNewLogic(p => ({ ...p, condition: v }))} />
            <ModalField label="Action" value={newLogic.action} placeholder="e.g. Send 'BL Draft' Template" onChange={v => setNewLogic(p => ({ ...p, action: v }))} />
            <ModalSelect label="Frequency" value={newLogic.frequency} options={["Once (Immediate)", "Every 24 hrs", "Every 48 hrs", "Weekly"]} onChange={v => setNewLogic(p => ({ ...p, frequency: v }))} />
            <ModalFooter onCancel={() => setShowAddLogic(false)} onConfirm={handleAddLogic} confirmLabel="Add Logic" disabled={!newLogic.condition || !newLogic.action} confirmIcon={<Zap size={16} className="text-amber-400" />} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add Reminder Task ── */}
      <AnimatePresence>
        {showAddTask && (
          <Modal onClose={() => setShowAddTask(false)} title="Add Reminder Task" subtitle="Manually schedule a follow-up task">
            <ModalField label="Task Title" value={newTask.title} placeholder="e.g. Chase KYC from Global Tech" onChange={v => setNewTask(p => ({ ...p, title: v }))} />
            <ModalField label="Shipment ID" value={newTask.shipmentId} placeholder="e.g. EID-1234" onChange={v => setNewTask(p => ({ ...p, shipmentId: v }))} />
            <ModalField label="Due Date" value={newTask.dueDate} placeholder="e.g. 15 May, 2025" onChange={v => setNewTask(p => ({ ...p, dueDate: v }))} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Task Type</label>
              <div className="flex gap-2">
                {(["cutoff","si","payment"] as SmartTask["type"][]).map(t => (
                  <button key={t} onClick={() => setNewTask(p => ({ ...p, type: t }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase", newTask.type === t ? "bg-[#1A2B4C] text-white border-[#1A2B4C]" : "bg-slate-50 text-slate-500 border-slate-200")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Priority</label>
              <div className="flex gap-2">
                {(["urgent","upcoming"] as SmartTask["priority"][]).map(p => (
                  <button key={p} onClick={() => setNewTask(pr => ({ ...pr, priority: p }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase", newTask.priority === p ? "bg-[#1A2B4C] text-white border-[#1A2B4C]" : "bg-slate-50 text-slate-500 border-slate-200")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ModalFooter onCancel={() => setShowAddTask(false)} onConfirm={handleAddTask} confirmLabel="Add Task" disabled={!newTask.title || !newTask.shipmentId} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Calendar Task ── */}
      <AnimatePresence>
        {showCalTaskModal && (
          <Modal onClose={() => { setShowCalTaskModal(false); setEditingCalTask(null); }} title={editingCalTask ? "Edit Calendar Task" : `Add Task – ${MONTH_NAMES[calMonth]} ${selectedCalDay}`} subtitle="Shipment calendar event">
            <ModalField label="Task Title" value={calTaskForm.title} placeholder="e.g. Port Cutoff Deadline" onChange={v => setCalTaskForm(p => ({ ...p, title: v }))} />
            <ModalField label="Shipment ID" value={calTaskForm.shipmentId} placeholder="e.g. EID-0943" onChange={v => setCalTaskForm(p => ({ ...p, shipmentId: v }))} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Task Type</label>
              <div className="flex gap-2 flex-wrap">
                {(["cutoff","si","payment","kyc"] as CalendarTask["type"][]).map(t => (
                  <button key={t} onClick={() => setCalTaskForm(p => ({ ...p, type: t }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase", calTaskForm.type === t ? "bg-[#1A2B4C] text-white border-[#1A2B4C]" : "bg-slate-50 text-slate-500 border-slate-200")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ModalFooter onCancel={() => { setShowCalTaskModal(false); setEditingCalTask(null); }} onConfirm={handleSaveCalTask} confirmLabel={editingCalTask ? "Save Changes" : "Add to Calendar"} disabled={!calTaskForm.title || !calTaskForm.shipmentId} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Edit Rule ── */}
      <AnimatePresence>
        {editingRule && (
          <Modal onClose={() => setEditingRule(null)} title="Edit Automation Rule" subtitle="Modify trigger condition and action">
            <ModalField label="Trigger Condition" value={editRuleForm.condition} placeholder="e.g. Stage = 'KYC Pending'" onChange={v => setEditRuleForm(p => ({ ...p, condition: v }))} />
            <ModalField label="Action" value={editRuleForm.action} placeholder="e.g. Send 'KYC Request' Template" onChange={v => setEditRuleForm(p => ({ ...p, action: v }))} />
            <ModalSelect label="Frequency" value={editRuleForm.frequency} options={["Once (Immediate)", "Every 24 hrs", "Every 48 hrs", "Weekly"]} onChange={v => setEditRuleForm(p => ({ ...p, frequency: v }))} />
            <ModalFooter onCancel={() => setEditingRule(null)} onConfirm={handleSaveRule} confirmLabel="Save Rule" disabled={!editRuleForm.condition || !editRuleForm.action} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <AnimatePresence>
        {editingLog && (
          <Modal onClose={() => setEditingLog(null)} title="Edit Mail Log" subtitle={`Entry: ${editingLog.shipmentId}`}>
            <ModalField label="Recipient" value={editLogForm.recipient} placeholder="e.g. Global Tech" onChange={v => setEditLogForm(p => ({ ...p, recipient: v }))} />
            <ModalField label="Subject" value={editLogForm.subject} placeholder="e.g. KYC Follow-up" onChange={v => setEditLogForm(p => ({ ...p, subject: v }))} />
            <ModalField label="Timestamp" value={editLogForm.timestamp} placeholder="e.g. 14:15 PM" onChange={v => setEditLogForm(p => ({ ...p, timestamp: v }))} />
            <ModalFooter onCancel={() => setEditingLog(null)} onConfirm={handleSaveLog} confirmLabel="Save Changes" disabled={!editLogForm.subject || !editLogForm.recipient} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/15">
        {mainTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-10 py-5 text-sm font-bold transition-all relative", activeTab === tab ? "text-primary" : "text-secondary hover:text-on-surface")}>
            {tab}
            {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ─── TEMPLATES TAB ─── */}
        {activeTab === "Templates" && (
          <motion.div key="templates" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-10">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filterTabs.map(tab => (
                <button key={tab} onClick={() => setActiveFilter(tab)}
                  className={cn("px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                    activeFilter === tab ? "bg-surface-container-highest text-primary shadow-sm ring-1 ring-primary/20" : "bg-surface-container-low text-secondary hover:bg-surface-container-high")}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <ReminderCard key={template.id} tag={template.tag} title={template.title} icon={getIcon(template.iconType)} content={template.content}
                  onEdit={() => handleOpenEditTemplate(template.id)}
                  onSend={() => alert(`Manual dispatch for ${template.title} triggered.`)}
                  borderColor={template.borderColor} />
              ))}
              <div onClick={() => setShowNewTemplate(true)}
                className="border-2 border-dashed border-outline-variant/30 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-surface-container-low/50 transition-all group min-h-[400px]">
                <div className="bg-surface-container-low p-6 rounded-3xl group-hover:scale-110 transition-all">
                  <Plus size={32} className="text-secondary" />
                </div>
                <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Craft New Template</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── AUTOMATION RULES TAB ─── */}
        {activeTab === "Automation Rules" && (
          <motion.div key="rules" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className={cn("p-4 rounded-2xl", rule.active ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-300")}><Zap size={24} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trigger Condition</p>
                      <h4 className="font-extrabold text-[#1A2B4C] mb-1">{rule.condition}</h4>
                      <p className="text-xs text-primary font-bold">{rule.action} • {rule.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))
                      }
                      className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", rule.active ? "bg-emerald-500" : "bg-slate-200")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", rule.active ? "right-1" : "left-1")} />
                    </div>
                    <button onClick={() => handleOpenEditRule(rule)} className="text-slate-300 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-50"><Settings size={16} /></button>
                    <button onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowAddLogic(true)}
                className="w-full py-4 border-2 border-dashed border-slate-100 rounded-3xl text-sm font-bold text-slate-400 hover:border-primary/20 hover:text-primary transition-all">
                + Add New Automation Logic
              </button>
            </div>
            <div className="lg:col-span-4 bg-[#1A2B4C] text-white p-8 rounded-[40px] shadow-2xl">
              <h4 className="text-xl font-manrope font-extrabold mb-6">Automation Health</h4>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Precision Rate</span><span>99.2%</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[99.2%]" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-3xl"><p className="text-2xl font-extrabold">1,402</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SENT TODAY</p></div>
                  <div className="bg-white/5 p-5 rounded-3xl"><p className="text-2xl font-extrabold">{rules.filter(r => r.active).length}</p><p className="text-[10px] font-bold text-amber-400 uppercase mt-1">ACTIVE RULES</p></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── MAIL TIMELINE TAB ─── */}
        {activeTab === "Mail Timeline" && (
          <motion.div key="timeline" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto" ref={logMenuRef}>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Shipment ID","Recipient","Subject","Type","Time","Status",""].map(h => (
                      <th key={h} className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6"><span className="text-sm font-extrabold text-[#1A2B4C]">{log.shipmentId}</span></td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold">{log.recipient[0]}</div>
                          <span className="text-sm font-bold text-slate-600">{log.recipient}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6"><span className="text-sm font-medium text-slate-500">{log.subject}</span></td>
                      <td className="px-8 py-6">
                        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", log.type === "auto" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>
                          {log.type === "auto" ? "⚡ AUTO" : "👤 MANUAL"}
                        </span>
                      </td>
                      <td className="px-8 py-6"><span className="text-[10px] font-bold text-slate-400">{log.timestamp}</span></td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", log.status === "sent" ? "bg-emerald-500" : "bg-amber-400")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A2B4C]">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right relative">
                        <button onClick={() => setOpenLogMenu(openLogMenu === log.id ? null : log.id)} className="text-slate-300 hover:text-primary transition-colors"><MoreVertical size={16} /></button>
                        <AnimatePresence>
                          {openLogMenu === log.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-6 top-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 w-44 overflow-hidden">
                              <button onClick={() => handleResendLog(log)} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                <Send size={13} /> Resend Mail
                              </button>
                              <button onClick={() => handleOpenEditLog(log)} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                <Edit3 size={13} /> Edit Log
                              </button>
                              <button onClick={() => handleDeleteLog(log.id)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                <Trash2 size={13} /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ─── FOLLOW-UP ENGINE TAB ─── */}
        {activeTab === "Follow-up Engine" && (
          <motion.div key="follow-up" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Task List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-manrope font-extrabold text-[#1A2B4C]">Intelligent Task Queue</h3>
                <button className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-colors"><ListFilter size={18} /></button>
              </div>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={cn("group relative bg-white p-6 rounded-3xl border transition-all hover:shadow-lg", task.status === "done" ? "opacity-60 grayscale" : "border-slate-100")}>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", task.priority === "urgent" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500")}>
                          {task.type === "cutoff" ? <Clock size={22} /> : task.type === "si" ? <FileText size={22} /> : <Activity size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-extrabold text-[#1A2B4C]">{task.title}</h4>
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", task.priority === "urgent" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                              {task.priority === "urgent" ? "🔴 URGENT" : "🟡 UPCOMING"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-400">Shipment: <span className="text-primary">{task.shipmentId}</span> • Due: <span className="text-[#1A2B4C]">{task.dueDate}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === "done" ? "pending" : "done" } : t))}
                          className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", task.status === "done" ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500")}>
                          <CheckCircle2 size={20} />
                        </button>
                        <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-300 hover:border-red-400 hover:text-red-400 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowAddTask(true)}
                  className="w-full py-4 border-2 border-dashed border-slate-100 rounded-3xl text-sm font-bold text-slate-400 hover:border-primary/20 hover:text-primary transition-all">
                  + Manually Add Reminder Task
                </button>
              </div>
            </div>

            {/* Calendar + Next Trigger */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-black text-[#1A2B4C] uppercase tracking-widest">Global Cutoff Calendar</h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalMonth(0)} className={cn("px-3 py-1 text-[10px] rounded-lg font-bold transition-all", calMonth === 0 ? "bg-[#1A2B4C] text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>APR</button>
                    <button onClick={() => setCalMonth(1)} className={cn("px-3 py-1 text-[10px] rounded-lg font-bold transition-all", calMonth === 1 ? "bg-[#1A2B4C] text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>MAY</button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} className="text-[10px] font-black text-slate-300 text-center py-2">{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {buildCalGrid().map((day, i) => {
                    if (!day) return <div key={i} />;
                    const dayTasks = getTasksForDay(day);
                    const isToday = day === today && calMonth === 0;
                    return (
                      <div key={i} onClick={() => handleDayClick(day)}
                        className={cn("aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all group",
                          isToday ? "bg-[#1A2B4C] text-white shadow-lg" : dayTasks.length > 0 ? "bg-slate-50 hover:bg-slate-100" : "hover:bg-slate-50")}>
                        <span className="text-[11px] font-bold">{day}</span>
                        {/* Task dots */}
                        {dayTasks.length > 0 && !isToday && (
                          <div className="flex gap-0.5 absolute bottom-1.5">
                            {dayTasks.slice(0,3).map(t => (
                              <div key={t.id} className={cn("w-1 h-1 rounded-full", TASK_TYPE_COLORS[t.type])} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected day tasks */}
                {selectedCalDay && getTasksForDay(selectedCalDay).length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{MONTH_NAMES[calMonth]} {selectedCalDay} — Tasks</p>
                    {getTasksForDay(selectedCalDay).map(ct => (
                      <div key={ct.id} className={cn("flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold", TASK_TYPE_LIGHT[ct.type])}>
                        <span>{ct.title} · {ct.shipmentId}</span>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditCalTask(ct); }} className="p-1 hover:opacity-70 transition-opacity"><Edit3 size={11} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteCalTask(ct.id); }} className="p-1 hover:opacity-70 transition-opacity"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-3">
                  {Object.entries(TASK_TYPE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", color)} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{type}</span>
                    </div>
                  ))}
                </div>

                {/* High-risk alert */}
                <div className="mt-4 flex items-center gap-3 bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
                  <AlertTriangle size={16} className="text-red-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-red-600 leading-none">6 VESSELS REBATING</p>
                    <p className="text-[9px] font-bold text-red-500/70 mt-1">Immediate action required on Ref #8821</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A2B4C] p-8 rounded-[40px] shadow-xl text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl"><Timer size={24} className="text-amber-400" /></div>
                  <h4 className="font-manrope font-extrabold">Next Trigger Logic</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-xs text-slate-400 font-medium tracking-wide">Daily Cutoff Batch</span>
                    <span className="text-xs font-bold text-emerald-400">IN 42 MINS</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-xs text-slate-400 font-medium tracking-wide">SI Delta Sweep</span>
                    <span className="text-xs font-bold">04:00 AM</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-400 font-medium tracking-wide">KYC Auto-Drip</span>
                    <span className="text-xs font-bold">TOMORROW</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Metrics */}
      <div className="bg-surface-container-low p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm text-primary ring-1 ring-black/5"><Stars size={28} /></div>
          <div>
            <h4 className="text-2xl font-manrope font-extrabold text-on-surface mb-1">Workflow Intelligence</h4>
            <p className="text-sm text-secondary font-medium opacity-70 italic">Predictive delivery times calculated using actual vessel transit data.</p>
          </div>
        </div>
        <div className="flex gap-16">
          <Stat value="84%" label="OPEN RATE" />
          <Stat value="1.2s" label="DISPATCH" />
          <Stat value="24k" label="AUTOMATED" />
        </div>
      </div>
    </div>
  );
}

// ── Reusable Modal Shell ──
function Modal({ onClose, title, subtitle, children }: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[#1A2B4C]">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none" />
    </div>
  );
}

function ModalSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:border-blue-500 outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, disabled, confirmIcon }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled?: boolean; confirmIcon?: React.ReactNode }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
      <button onClick={onConfirm} disabled={disabled}
        className="flex-1 py-3 rounded-xl bg-[#1A2B4C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#243869] transition-colors">
        {confirmIcon}{confirmLabel}
      </button>
    </div>
  );
}

function ReminderCard({ tag, title, icon, content, onEdit, onSend, borderColor }: any) {
  return (
    <div className={cn("bg-surface-container-lowest p-8 rounded-[32px] flex flex-col gap-6 shadow-sm border-l-[6px] h-full transition-all hover:shadow-md", borderColor)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{tag}</p>
          <h4 className="text-2xl font-manrope font-extrabold text-on-surface leading-tight">{title}</h4>
        </div>
        <div className="p-4 bg-surface-container-low rounded-2xl">{icon}</div>
      </div>
      <div className="bg-surface-container-low/50 p-6 rounded-2xl italic text-sm text-on-surface-variant/80 leading-relaxed min-h-[120px] flex items-center">
        {content}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-auto pt-6">
        <button onClick={onEdit} className="bg-surface-container-highest text-primary py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container-high transition-colors">Edit Template</button>
        <button onClick={onSend} className="bg-primary text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary-dim transition-colors">Dispatch</button>
      </div>
    </div>
  );
}

function Stat({ value, label }: any) {
  return (
    <div className="text-center group cursor-default">
      <p className="text-4xl font-manrope font-extrabold text-on-surface tracking-tighter group-hover:text-primary transition-colors">{value}</p>
      <p className="text-[10px] font-bold text-secondary tracking-[0.2em] mt-2 opacity-60">{label}</p>
    </div>
  );
}
