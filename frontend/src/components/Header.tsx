import { Search, Bell, Settings, Mail, Menu, AlertCircle, FileWarning, MailWarning, Clock, CheckCircle2, X, ChevronDown, LogOut, User, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useUser, useClerk } from '@clerk/clerk-react';

import { useNotifications } from "@/src/lib/store";

interface HeaderProps {
  onMenuClick?: () => void;
  onMailClick?: () => void;
}

export function Header({ onMenuClick, onMailClick }: HeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { notifications, markAllRead, removeNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMailClickOutside(event: MouseEvent) {
      if (mailRef.current && !mailRef.current.contains(event.target as Node)) {
        setIsMailOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMailClickOutside);
    return () => document.removeEventListener("mousedown", handleMailClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleSearchClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleSearchClickOutside);
    return () => document.removeEventListener("mousedown", handleSearchClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      // Mock search results - in real app would query backend
      const mockData = [
        { type: "Shipment", id: "EID0943542", name: "Maersk Atlantic", route: "MUM ➔ ROT" },
        { type: "Shipment", id: "EID0944019", name: "Shipment Express", route: "SHA ➔ LAX" },
        { type: "Customer", id: "CUST001", name: "Global Tech Indus.", contact: "John Doe" },
        { type: "Container", id: "CONT8821", name: "Booking Confirmation", status: "Verified" },
        { type: "Port", id: "PORT_MUM", name: "Mumbai Port", code: "MUM" },
        { type: "Port", id: "PORT_ROT", name: "Rotterdam Port", code: "ROT" },
      ];
      
      const results = mockData.filter(item => 
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.route && item.route.toLowerCase().includes(query.toLowerCase()))
      );
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="text-red-500" size={16} />;
      case "warning": return <FileWarning className="text-amber-500" size={16} />;
      case "success": return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Clock className="text-blue-500" size={16} />;
    }
  };



  return (
    <header className="flex justify-between items-center px-6 lg:px-10 w-full h-20 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
      <div className="flex items-center gap-4 lg:gap-10">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-surface-soft rounded-lg text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <motion.div 
          initial={false}
          animate={{ 
            width: isFocused ? "480px" : "320px",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "hidden md:flex items-center gap-3 bg-surface-soft/50 border border-border rounded-xl px-4 py-2 group transition-all relative",
            isFocused ? "ring-4 ring-blue-500/10 bg-surface border-blue-500/30 shadow-xl shadow-blue-900/5" : "hover:bg-surface-soft"
          )}
          ref={searchRef}
        >
          <Search size={16} className={cn("transition-colors", isFocused ? "text-blue-600" : "text-slate-400")} />
          <input 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-transparent border-none text-sm w-full outline-none placeholder:text-slate-400 font-medium text-text-main" 
            placeholder="System search (ID, Container, Port)..." 
          />
          {isFocused && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-surface-soft px-1.5 py-0.5 rounded border border-border">ESC</span>
            </div>
          )}
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-border shadow-2xl overflow-hidden z-50 w-full"
              >
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors flex items-center justify-between group"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex-1">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{result.type}</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{result.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{result.route || result.contact || result.status || result.code}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 flex-shrink-0">{result.id}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r border-border relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative p-2 rounded-lg transition-all text-slate-500 hover:text-text-main",
              isNotificationsOpen ? "bg-surface-soft text-blue-600 shadow-inner" : "hover:bg-surface-soft"
            )}
          >
            <Bell size={20} />
            {notifications.some(n => n.isNew) && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-surface"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full right-0 mt-4 w-96 bg-white rounded-2xl border border-border shadow-2xl overflow-hidden z-50 origin-top-right"
              >
                <div className="p-4 border-b border-border bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1A2B4C]">Registry Alert Center</h3>
                    <p className="text-[9px] font-mono text-slate-400 font-bold uppercase mt-0.5">Automated Oversight // v4.0.2</p>
                  </div>
                  <button 
                    onClick={markAllRead}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <Bell size={20} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest leading-none">Airspace Clear</h4>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">No system alerts or pending registry updates detected.</p>
                    </div>
                  ) : ["New Details", "Old Details"].map((section) => {
                    const isNewSection = section === "New Details";
                    const sectionNotifications = notifications.filter(n => n.isNew === isNewSection);

                    if (sectionNotifications.length === 0) return null;

                    return (
                      <div key={section} className="py-2">
                        <div className="px-4 py-2 bg-slate-50/30">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            isNewSection ? "text-blue-600" : "text-slate-400"
                          )}>
                            {section}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {sectionNotifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={cn(
                                "p-4 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer relative group",
                                n.isNew && "bg-blue-50/20"
                              )}
                            >
                              <div className="mt-1 flex-shrink-0">
                                {getIcon(n.type)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-[11px] font-bold text-slate-800 leading-none">{n.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-slate-400 font-bold">{n.time}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all text-slate-400 hover:text-slate-600"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed pr-6">{n.description}</p>
                              </div>
                              {n.isNew && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <UserDropdown />
      </div>
    </header>
  );
}

// ─── User Dropdown ────────────────────────────────────────────────────────────
function UserDropdown() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const name = user?.fullName || user?.firstName || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatar = user?.imageUrl;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative pl-2" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 p-1.5 rounded-xl transition-all border",
          isOpen ? "bg-surface-soft border-blue-200 shadow-sm" : "border-transparent hover:bg-surface-soft hover:border-border"
        )}
      >
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover border border-border shadow-sm" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">{initials}</div>
          )}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-bold text-text-main leading-none">{name}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">{email}</p>
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform hidden sm:block", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
          >
            {/* Profile header */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-border">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">{initials}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#1A2B4C] truncate">{name}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider">Active Session</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <button onClick={() => { openUserProfile(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <User size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Manage Profile</p>
                  <p className="text-[10px] text-slate-400">Update name, photo & password</p>
                </div>
              </button>

              <button onClick={() => { openUserProfile(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Shield size={14} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Security</p>
                  <p className="text-[10px] text-slate-400">Two-factor auth & sessions</p>
                </div>
              </button>

              <button onClick={() => { openUserProfile(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Settings size={14} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Account Settings</p>
                  <p className="text-[10px] text-slate-400">Preferences & notifications</p>
                </div>
              </button>
            </div>

            <div className="mx-4 border-t border-border" />

            {/* Sign out */}
            <div className="p-2">
              <button onClick={() => signOut({ redirectUrl: "/" })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-500">Sign Out</p>
                  <p className="text-[10px] text-slate-400">End your current session</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
