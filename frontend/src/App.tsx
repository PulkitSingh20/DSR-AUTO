import { Sidebar } from "./components/Sidebar";
import { useAuth, useUser, SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import { Header } from "./components/Header";
import { Overview } from "./components/Overview";
import { OceanDSRSheet } from "./components/OceanDSRSheet";
import { ShipmentPipeline } from "./components/ShipmentPipeline";
import { AnalyticsSidebar } from "./components/AnalyticsSidebar";
import { DashboardMetrics } from "./components/DashboardMetrics";
import { LiveGlobalHub } from "./components/LiveGlobalHub";
import { ShipmentEntry } from "./components/ShipmentEntry";
import { ReminderCenter } from "./components/ReminderCenter";
import { DocumentManagement } from "./components/DocumentManagement";
import { CustomerManagement } from "./components/CustomerManagement";
import { SettingsManagement } from "./components/SettingsManagement";
import { ShipmentDetails } from "./components/ShipmentDetails";
import { DatabaseAdmin } from "./components/DatabaseAdmin";
import { Filter, SortAsc, Search, Bell, HelpCircle, ArrowLeft, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import SignInPage from "./pages/SignInPage";


export default function App() {
  const [view, setView] = useState("dashboard");
  const [shipmentSubView, setShipmentSubView] = useState("Monitoring Pipeline");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [selectedShipmentIsNew, setSelectedShipmentIsNew] = useState(false);
  const [autofillData, setAutofillData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Sync internal state to browser history so the back button works step-by-step
  useEffect(() => {
    const currentState = { view, shipmentSubView, selectedShipmentId, selectedShipmentIsNew };
    const historyState = window.history.state;
    
    if (
      !historyState ||
      historyState.view !== view ||
      historyState.shipmentSubView !== shipmentSubView ||
      historyState.selectedShipmentId !== selectedShipmentId ||
      historyState.selectedShipmentIsNew !== selectedShipmentIsNew
    ) {
      window.history.pushState(currentState, "", `?view=${view}`);
    }
  }, [view, shipmentSubView, selectedShipmentId, selectedShipmentIsNew]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.view) setView(event.state.view);
        if (event.state.shipmentSubView) setShipmentSubView(event.state.shipmentSubView);
        setSelectedShipmentId(event.state.selectedShipmentId || null);
        setSelectedShipmentIsNew(event.state.selectedShipmentIsNew || false);
      } else {
        setView("dashboard");
      }
    };
    
    // Initialize the very first history state so we have a base to pop to
    if (!window.history.state) {
      window.history.replaceState({ view, shipmentSubView, selectedShipmentId, selectedShipmentIsNew }, "", `?view=${view}`);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Authenticating...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleShipmentClick = (id: string, isNew: boolean = false) => {
    setSelectedShipmentId(id);
    setSelectedShipmentIsNew(isNew);
    setView("shipment-details");
  };

  const handleAutofillShipment = (customer: any) => {
    setAutofillData(customer);
    setView("new-shipment");
  };

  return (
    <AnimatePresence mode="wait">
      {view === "shipment-details" && selectedShipmentId ? (
        <motion.div
          key="shipment-details"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Sidebar
            activeView="shipments"
            onNavigate={setView}
            onNewShipment={() => setView("new-shipment")}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
          <main className="flex-1">
            <ShipmentDetails 
              id={selectedShipmentId} 
              isNewCustomer={selectedShipmentIsNew} 
              onBack={() => setView("dashboard")} 
              onViewDocuments={() => setView("documents")}
            />
          </main>
        </motion.div>
      ) : (
        <motion.div
          key="main-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-screen bg-surface transition-colors duration-300"
        >
          <Sidebar
            activeView={view === "new-shipment" ? "shipments" : view}
            onNavigate={setView}
            onNewShipment={() => setView("new-shipment")}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />

          <main className="flex-1 min-h-screen bg-surface w-full max-w-full overflow-x-hidden transition-colors duration-300">
            {view === "reminders" ? (
              <header className="flex justify-between items-center px-6 lg:px-10 w-full h-20 bg-surface border-b border-border sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 hover:bg-surface-soft rounded-lg text-slate-500 transition-colors"
                  >
                    <Menu size={20} />
                  </button>
                  <h2 className="text-sm font-bold text-text-main uppercase tracking-[0.2em] hidden sm:block">ZIP-A-WORLD COMMAND</h2>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-3 bg-surface-soft rounded-lg px-4 py-2 w-80 border border-border">
                    <Search size={14} className="text-slate-400" />
                    <input
                      className="bg-transparent border-none text-xs w-full outline-none placeholder:text-slate-400 font-medium text-text-main"
                      placeholder="Search pipeline..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Optional: show user name */}
                    <span className="text-xs text-slate-500 hidden md:block">
                      {user?.firstName}
                    </span>
                    {/* Clerk's built-in user button (avatar + sign out + profile) */}
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>
              </header>
            ) : view === "new-shipment" ? (
              <header className="flex justify-between items-center px-6 lg:px-10 w-full h-20 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40 text-text-main">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView("dashboard")} className="p-2 hover:bg-surface-soft rounded-lg text-slate-400 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Entry Creation Node</h2>
                </div>
              </header>
            ) : (
              <Header onMenuClick={() => setIsSidebarOpen(true)} onMailClick={() => setView("reminders")} />
            )}

            <div className="pb-20 max-w-full">
              {view === "new-shipment" && (
                <ShipmentEntry
                  onBack={() => {
                    setView("dashboard");
                    setAutofillData(null);
                  }}
                  initialValues={autofillData}
                />
              )}
              {view === "dashboard" && (
                <div className="p-6 lg:p-10 w-full space-y-12">
                  <Overview />
                  <DashboardMetrics onViewAll={() => setView("shipments")} />
                  <LiveGlobalHub />
                </div>
              )}

              {view === "shipments" && (
                <div className="p-6 lg:p-10 w-full space-y-12">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-display font-extrabold text-text-main tracking-tight transition-colors">Global Shipment Hub</h2>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-border transition-colors">
                    {["Monitoring Pipeline", "Customer CRM"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setShipmentSubView(tab)}
                        className={cn(
                          "px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                          shipmentSubView === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {tab}
                        {shipmentSubView === tab && (
                          <motion.div layoutId="shipment-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {shipmentSubView === "Monitoring Pipeline" ? (
                      <motion.div
                        key="pipeline"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <ShipmentPipeline onShipmentClick={handleShipmentClick} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="crm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <CustomerManagement 
                          onAutofill={handleAutofillShipment} 
                          onShipmentClick={handleShipmentClick} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {view === "reminders" && <ReminderCenter />}

              {view === "documents" && <DocumentManagement />}

              {view === "settings" && <SettingsManagement />}

              {view === "db-admin" && <DatabaseAdmin />}

              {view === "dsr" && <OceanDSRSheet />}

              {view === "analytics" && (
                <div className="p-6 lg:p-10 w-full space-y-12">
                  <header className="mb-8 flex items-center gap-4">
                    <button onClick={() => setView("dashboard")} className="p-2 hover:bg-surface-soft rounded-lg text-slate-400 transition-colors"><ArrowLeft size={20} /></button>
                    <h2 className="text-3xl font-display font-extrabold text-text-main tracking-tight transition-colors">Logistics Analytics</h2>
                  </header>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                      <AnalyticsSidebar fullWidth={true} />
                    </div>
                  </div>
                </div>
              )}

              {view === "support" && (
                <div className="p-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <HelpCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-manrope font-extrabold text-[#1A2B4C]">Hub Support Center</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">Need help with transit logs or document audits? Our global support team is available 24/7 for ZIP-A-WORLD dispatch commands.</p>
                  <div className="flex gap-4 justify-center">
                    <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold font-sans">Live Chat</button>
                    <button className="bg-slate-50 text-slate-600 px-8 py-3 rounded-xl font-bold font-sans border border-slate-100">Browse Docs</button>
                  </div>
                </div>
              )}

              {/* Other views placeholder */}
              {view !== "dashboard" && view !== "reminders" && view !== "shipments" && view !== "documents" && view !== "settings" && view !== "support" && view !== "analytics" && view !== "new-shipment" && view !== "db-admin" && view !== "shipment-details" && view !== "dsr" && (
                <div className="p-20 text-center text-secondary">
                  <p className="text-lg italic">{view.toUpperCase()} module coming soon...</p>
                  <button
                    onClick={() => setView("dashboard")}
                    className="mt-4 text-primary font-bold underline"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}