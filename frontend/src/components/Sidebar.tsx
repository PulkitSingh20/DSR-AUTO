import { 
  LayoutDashboard, 
  Truck, 
  Plus,
  Settings,
  HelpCircle,
  Files,
  Bell,
  BarChart3,
  Zap,
  X,
  Sun,
  Moon,
  Database,
  Table,
  CreditCard
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onNewShipment?: () => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const navItems = [
  { id: "dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { id: "shipments",  icon: Truck,           label: "Shipments" },
  { id: "dsr",        icon: Table,           label: "Ocean DSR" },
  { id: "documents",  icon: Files,           label: "Documents" },
  { id: "reminders",  icon: Bell,            label: "Reminders" },
  { id: "billing",    icon: CreditCard,      label: "Billing" },
  { id: "db-admin",   icon: Database,        label: "Database" },
];

export function Sidebar({ activeView, onNavigate, onNewShipment, isOpen, onClose, isDarkMode, onToggleTheme }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="h-screen w-[280px] fixed left-0 top-0 bg-[#0F172A] flex flex-col py-8 px-6 gap-2 z-[70] text-slate-400 border-r border-[#1E293B] shadow-2xl"
          >
            <div className="mb-12 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap size={18} className="text-white fill-white" />
                  </div>
                  <h1 className="font-display font-extrabold text-white text-xl tracking-tight leading-none uppercase italic">ZIP-A-WORLD</h1>
                </div>
                <p className="text-[10px] font-mono tracking-[0.2em] text-blue-500 font-medium uppercase pl-1 opacity-80">LOGISTICS DATA HUB</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-grow">
              <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Main Controls</p>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 text-left group",
                    activeView === item.id 
                      ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20" 
                      : "hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon size={18} className={cn(activeView === item.id ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="text-sm tracking-wide">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-6">
              <button 
                onClick={() => {
                  onNewShipment?.();
                  onClose();
                }}
                className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span className="text-sm">New Shipment</span>
              </button>

              <div className="pt-6 border-t border-slate-800 space-y-1">
                <button 
                  onClick={onToggleTheme}
                  className="flex items-center gap-3 py-2.5 px-4 transition-all text-xs font-medium w-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg group"
                >
                  <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={isDarkMode ? "sun" : "moon"}
                        initial={{ y: 15, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -15, opacity: 0, rotate: 90 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        {isDarkMode ? (
                          <Sun size={16} className="text-amber-400" />
                        ) : (
                          <Moon size={16} className="text-blue-400" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="relative h-4 overflow-hidden flex-1">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isDarkMode ? "light" : "dark"}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center"
                      >
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    onNavigate("settings");
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 py-2 px-4 transition-colors text-xs font-medium w-full",
                    activeView === "settings" ? "text-slate-100" : "hover:text-slate-100"
                  )}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={() => {
                    onNavigate("support");
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 py-2 px-4 transition-colors text-xs font-medium w-full",
                    activeView === "support" ? "text-slate-100" : "hover:text-slate-100"
                  )}
                >
                  <HelpCircle size={16} />
                  <span>Support</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
