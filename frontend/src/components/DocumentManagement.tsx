import React, { useState, useRef } from "react";
import { 
  LayoutGrid,
  List,
  FileText, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MoreVertical,
  Download,
  Link as LinkIcon,
  Plus,
  Check,
  Trash2,
  ShieldCheck,
  Zap,
  Sparkles,
  X,
  Users,
  ChevronDown,
  ChevronRight,
  Globe
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Document {
  id: string;
  name: string;
  type: "KYC" | "Booking Confirmation" | "SI" | "BL Draft" | "Invoice";
  shipmentId: string;
  customerId: string;
  status: "Missing" | "Uploaded" | "Verified";
  uploadedAt?: string;
  size?: string;
  isVerifying?: boolean;
}

interface Customer {
  id: string;
  name: string;
  country: string;
  shipmentId: string;
  requiredDocs: Array<Document["type"]>;
}

const CUSTOMERS: Customer[] = [
  { id: "GLO", name: "Global Tech Industries", country: "India", shipmentId: "EID-GLO-0", requiredDocs: ["KYC", "Booking Confirmation", "SI", "BL Draft", "Invoice"] },
  { id: "AER", name: "Aero Dynamics", country: "China", shipmentId: "EID-AER-0", requiredDocs: ["KYC", "Booking Confirmation", "SI", "BL Draft", "Invoice"] },
  { id: "OCE", name: "Oceanic Ltd", country: "UAE", shipmentId: "EID-OCE-0", requiredDocs: ["KYC", "Booking Confirmation", "SI", "BL Draft"] },
  { id: "PRE", name: "Precision Parts", country: "Singapore", shipmentId: "EID-PRE-0", requiredDocs: ["KYC", "SI", "Invoice"] },
  { id: "LIT", name: "Lithium Global", country: "Hong Kong", shipmentId: "EID-LIT-0", requiredDocs: ["KYC", "Booking Confirmation", "Invoice"] },
  { id: "SOL", name: "Solaris Corp", country: "China", shipmentId: "EID-SOL-0", requiredDocs: ["KYC", "BL Draft", "SI"] },
];

const INITIAL_DOCS: Document[] = [
  { id: "1", name: "Corporate_KYC_v2.pdf", type: "KYC", customerId: "GLO", shipmentId: "EID-GLO-0", status: "Verified", uploadedAt: "2 hours ago", size: "1.2 MB" },
  { id: "2", name: "Booking_Note_8821.pdf", type: "Booking Confirmation", customerId: "GLO", shipmentId: "EID-GLO-0", status: "Uploaded", uploadedAt: "5 hours ago", size: "840 KB" },
  { id: "3", name: "Draft_BL_Global_Tech.pdf", type: "BL Draft", customerId: "GLO", shipmentId: "EID-GLO-0", status: "Missing", uploadedAt: "-", size: "-" },
  { id: "4", name: "Packing_List_Final.xlsx", type: "SI", customerId: "PRE", shipmentId: "EID-PRE-0", status: "Verified", uploadedAt: "Yesterday", size: "2.4 MB" },
  { id: "5", name: "Commercial_Invoice_2024.pdf", type: "Invoice", customerId: "LIT", shipmentId: "EID-LIT-0", status: "Uploaded", uploadedAt: "1 day ago", size: "3.1 MB" },
  { id: "6", name: "Aero_KYC_Form.pdf", type: "KYC", customerId: "AER", shipmentId: "EID-AER-0", status: "Verified", uploadedAt: "3 days ago", size: "900 KB" },
  { id: "7", name: "Oceanic_Booking_Conf.pdf", type: "Booking Confirmation", customerId: "OCE", shipmentId: "EID-OCE-0", status: "Uploaded", uploadedAt: "1 day ago", size: "1.5 MB" },
  { id: "8", name: "LIT_KYC_Docs.pdf", type: "KYC", customerId: "LIT", shipmentId: "EID-LIT-0", status: "Missing", uploadedAt: "-", size: "-" },
];

const MOCK_SHIPMENTS = [
  { id: "EID-GLO-0", label: "Global Tech Indus. (MUM ➔ ROT)" },
  { id: "EID-AER-0", label: "Aero Dynamics (SHA ➔ LAX)" },
  { id: "EID-LIT-0", label: "Lithium Global (HKG ➔ HAM)" },
  { id: "EID-PRE-0", label: "Precision Parts (SIN ➔ NYC)" },
  { id: "EID-OCE-0", label: "Oceanic Ltd (DXB ➔ ANT)" },
  { id: "EID-SOL-0", label: "Solaris Corp (SZE ➔ MEL)" },
  { id: "PENDING", label: "No Shipment Linked" },
];

export function DocumentManagement() {
  const [docs, setDocs] = useState<Document[]>(INITIAL_DOCS);
  const [activeTab, setActiveTab] = useState<"All" | "Missing" | "Uploaded" | "Verified">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [docViewMode, setDocViewMode] = useState<"archive" | "customer">("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterType, setFilterType] = useState<string>("All");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Invoice" as Document["type"],
    shipmentId: "PENDING",
    customerId: ""
  });

  const handleDownload = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a mock text blob and trigger download with the document's filename
    const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nStatus: ${doc.status}\nShipment: ${doc.shipmentId}\nUploaded: ${doc.uploadedAt || "N/A"}\nSize: ${doc.size || "N/A"}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getShipmentLabel = (id: string) => {
    return MOCK_SHIPMENTS.find(s => s.id === id)?.label || id;
  };

  const handleOpenUpload = () => {
    setEditingDoc(null);
    setUploadedFile(null);
    setFormData({ name: "", type: "Invoice", shipmentId: "PENDING", customerId: "" });
    setShowUploadModal(true);
  };

  const handleOpenEdit = (doc: Document) => {
    setEditingDoc(doc);
    setUploadedFile(null);
    setFormData({
      name: doc.name,
      type: doc.type,
      shipmentId: doc.shipmentId || "PENDING",
      customerId: doc.customerId || ""
    });
    setShowUploadModal(true);
  };

  const handleSaveDocument = () => {
    const docName = formData.name || uploadedFile?.name;
    if (!docName) return;

    if (editingDoc) {
      setDocs(prev => prev.map(d =>
        d.id === editingDoc.id
          ? { ...d, name: docName, type: formData.type, shipmentId: formData.shipmentId, customerId: formData.customerId }
          : d
      ));
    } else {
      const customer = CUSTOMERS.find(c => c.id === formData.customerId);
      const shipmentId = formData.shipmentId === "PENDING" && customer ? customer.shipmentId : formData.shipmentId;
      const newDoc: Document = {
        id: Date.now().toString(),
        name: docName,
        type: formData.type,
        shipmentId,
        customerId: formData.customerId,
        status: "Uploaded",
        uploadedAt: "Just now",
        size: uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB` : (Math.random() * 5).toFixed(1) + " MB"
      };
      setDocs(prev => [newDoc, ...prev]);
    }
    setUploadedFile(null);
    setShowUploadModal(false);
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    if (!formData.name) {
      setFormData(prev => ({ ...prev, name: file.name }));
    }
    // auto-tag type from filename
    const n = file.name.toLowerCase();
    let type: Document["type"] = "Invoice";
    if (n.includes("kyc")) type = "KYC";
    else if (n.includes("booking")) type = "Booking Confirmation";
    else if (n.includes("si") || n.includes("instruction")) type = "SI";
    else if (n.includes("bl") || n.includes("draft")) type = "BL Draft";
    setFormData(prev => ({ ...prev, type, name: file.name }));
  };

  const smartVerify = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, isVerifying: true } : d));
    
    // Simulate external verification service
    setTimeout(() => {
      setDocs(prev => prev.map(d => {
        if (d.id === id) {
          return { ...d, status: "Verified" as const, isVerifying: false };
        }
        return d;
      }));
    }, 2500);
  };

  const runBulkSmartVerify = () => {
    const targets = selectedIds.length > 0 
      ? selectedIds 
      : docs.filter(d => d.status === "Uploaded").map(d => d.id);
    
    if (targets.length === 0) return;

    setIsBulkVerifying(true);
    setDocs(prev => prev.map(d => targets.includes(d.id) ? { ...d, isVerifying: true } : d));

    // Simulate batch processing
    setTimeout(() => {
      setDocs(prev => prev.map(d => {
        if (targets.includes(d.id)) {
          return { ...d, status: "Verified" as const, isVerifying: false };
        }
        return d;
      }));
      setIsBulkVerifying(false);
      setSelectedIds([]);
    }, 3000);
  };

  const filteredDocs = docs.filter(doc => {
    const matchesTab = activeTab === "All" || doc.status === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.shipmentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || doc.type === filterType;
    return matchesTab && matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map(d => d.id));
    }
  };

  const bulkVerify = () => {
    setDocs(prev => prev.map(d => 
      selectedIds.includes(d.id) ? { ...d, status: "Verified" as const } : d
    ));
    setSelectedIds([]);
  };

  const bulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} documents?`)) {
      setDocs(prev => prev.filter(d => !selectedIds.includes(d.id)));
      setSelectedIds([]);
    }
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "Verified": return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "Uploaded": return <Clock size={16} className="text-blue-500" />;
      case "Missing": return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "Verified": return "bg-emerald-50 text-emerald-600";
      case "Uploaded": return "bg-blue-50 text-blue-600";
      case "Missing": return "bg-red-50 text-red-600";
    }
  };

  const handleUpload = () => {
    const name = prompt("Enter Document Name:");
    if (!name) return;
    
    // Simple auto-tagging simulation based on name
    let type: Document["type"] = "Invoice";
    if (name.toLowerCase().includes("kyc")) type = "KYC";
    else if (name.toLowerCase().includes("booking")) type = "Booking Confirmation";
    else if (name.toLowerCase().includes("si") || name.toLowerCase().includes("instruction")) type = "SI";
    else if (name.toLowerCase().includes("draft") || name.toLowerCase().includes("bl")) type = "BL Draft";

    const newDoc: Document = {
      id: Date.now().toString(),
      name,
      type,
      shipmentId: "PENDING-LINK",
      customerId: "GLO",
      status: "Uploaded",
      uploadedAt: "Just now",
      size: (Math.random() * 5).toFixed(1) + " MB"
    };

    setDocs(prev => [newDoc, ...prev]);
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* Title Section */}
      <section className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Digital Archive v3.1</span>
          </div>
          <h2 className="text-6xl font-manrope font-extrabold text-white tracking-tighter mb-4">Document Management</h2>
          <p className="text-slate-500 max-w-3xl text-lg font-medium leading-relaxed">
            Centralized document repository for the entire global supply chain. 
            Auto-tagging, shipment linking, and verification verification engine.
          </p>
        </div>
          <div className="flex gap-4">
            <button 
              onClick={runBulkSmartVerify}
              disabled={isBulkVerifying || docs.filter(d => d.status === "Uploaded").length === 0}
              className="bg-white border border-slate-100 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Zap size={20} className={cn("text-amber-500", isBulkVerifying && "animate-pulse")} />
              {isBulkVerifying ? "Analyzing Documents..." : "Smart Audit"}
            </button>
            <button 
              onClick={handleOpenUpload}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Upload size={20} /> Upload Document
            </button>
          </div>
      </section>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 rounded-3xl border border-slate-100">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
          {(["All", "Missing", "Uploaded", "Verified"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setDocViewMode("customer")}
              className={cn("px-3 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", docViewMode === "customer" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <Users size={14} /> By Customer
            </button>
            <button 
              onClick={() => setDocViewMode("archive")}
              className={cn("px-3 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", docViewMode === "archive" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid size={14} /> Archive
            </button>
          </div>
          {docViewMode === "archive" && (
            <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-xl transition-all", viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-xl transition-all", viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                <List size={18} />
              </button>
            </div>
          )}
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or shipment ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={cn("p-3 border rounded-2xl transition-colors", showFilterPanel ? "bg-primary text-white border-primary" : "bg-slate-50 border-slate-100 text-slate-400 hover:text-primary")}
            >
              <Filter size={20} />
            </button>
            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by Type</p>
                  </div>
                  {["All", "KYC", "Booking Confirmation", "SI", "BL Draft", "Invoice"].map(type => (
                    <button
                      key={type}
                      onClick={() => { setFilterType(type); setShowFilterPanel(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-bold transition-colors",
                        filterType === type ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Documents Content */}
      <AnimatePresence mode="wait">
        {docViewMode === "customer" ? (
          /* ── CUSTOMER-WISE VIEW ── */
          <motion.div key="customer-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {CUSTOMERS.map(customer => {
              const customerDocs = docs.filter(d => d.customerId === customer.id &&
                (!searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())));
              const submitted = customerDocs.filter(d => d.status !== "Missing");
              const missing = customer.requiredDocs.filter(req => !customerDocs.some(d => d.type === req && d.status !== "Missing"));
              const isExpanded = selectedCustomer === customer.id;
              const completionPct = Math.round((submitted.length / customer.requiredDocs.length) * 100);

              return (
                <motion.div key={customer.id} layout className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Customer Header */}
                  <div className="flex items-center gap-5 p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setSelectedCustomer(isExpanded ? null : customer.id)}>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-lg">
                      {customer.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-extrabold text-white text-lg">{customer.name}</h3>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Globe size={10} /> {customer.country}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{customer.shipmentId}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1 bg-white rounded-full h-1.5 max-w-[200px]">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{completionPct}% complete</span>
                        <span className="text-[10px] text-slate-400">{submitted.length}/{customer.requiredDocs.length} docs</span>
                        {missing.length > 0 && (
                          <span className="bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase">
                            {missing.length} missing
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={e => { e.stopPropagation(); setFormData(f => ({ ...f, customerId: customer.id, shipmentId: customer.shipmentId })); setShowUploadModal(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all">
                        <Upload size={12} /> Upload
                      </button>
                      {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded: Doc rows + Missing */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-slate-100">
                          {/* Required doc checklist */}
                          <div className="p-6 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Document Checklist</p>
                            {customer.requiredDocs.map(reqType => {
                              const doc = customerDocs.find(d => d.type === reqType && d.status !== "Missing");
                              return (
                                <div key={reqType} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                  doc ? (doc.status === "Verified" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100") : "bg-red-50/50 border-red-100/50 border-dashed")}>
                                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                                    doc?.status === "Verified" ? "bg-emerald-500 text-white" : doc ? "bg-blue-500 text-white" : "bg-red-100 text-red-400")}>
                                    {doc?.status === "Verified" ? <CheckCircle2 size={16} /> : doc ? <Clock size={16} /> : <AlertCircle size={16} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm text-white">{reqType}</p>
                                      <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg",
                                        doc?.status === "Verified" ? "bg-emerald-100 text-emerald-600" :
                                        doc ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500")}>
                                        {doc?.status || "Missing"}
                                      </span>
                                    </div>
                                    {doc ? (
                                      <p className="text-[11px] text-slate-500 mt-0.5">{doc.name} · {doc.size} · {doc.uploadedAt}</p>
                                    ) : (
                                      <p className="text-[11px] text-red-400 mt-0.5">Required · Not yet submitted</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {doc && (
                                      <button onClick={() => handleDownload(doc, new MouseEvent("click") as any)}
                                        className="p-2 text-slate-300 hover:text-primary transition-colors"><Download size={14} /></button>
                                    )}
                                    {!doc && (
                                      <button onClick={() => { setFormData(f => ({ ...f, customerId: customer.id, shipmentId: customer.shipmentId, type: reqType as any })); setShowUploadModal(true); }}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Extra uploaded docs not in required list */}
                          {customerDocs.filter(d => !customer.requiredDocs.includes(d.type)).length > 0 && (
                            <div className="px-6 pb-6">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Additional Documents</p>
                              <div className="space-y-2">
                                {customerDocs.filter(d => !customer.requiredDocs.includes(d.type)).map(doc => (
                                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <FileText size={14} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700 flex-1">{doc.name}</span>
                                    <span className="text-[10px] text-slate-400">{doc.size}</span>
                                    <button onClick={() => handleDownload(doc, new MouseEvent("click") as any)} className="p-1.5 text-slate-300 hover:text-primary"><Download size={13} /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => toggleSelect(doc.id)}
                className={cn(
                  "bg-white rounded-[32px] p-8 border hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden cursor-pointer",
                  selectedIds.includes(doc.id) ? "border-primary ring-2 ring-primary/10" : "border-slate-100"
                )}
              >
                {/* Status Indicator Bar */}
                <div className={cn("absolute top-0 left-0 right-0 h-1.5", 
                  doc.status === "Verified" ? "bg-emerald-500" : 
                  doc.status === "Uploaded" ? "bg-blue-500" : "bg-red-500"
                )} />

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedIds.includes(doc.id) ? "bg-primary border-primary text-white" : "border-border group-hover:border-slate-300"
                    )}>
                      {selectedIds.includes(doc.id) && <Check size={14} strokeWidth={4} />}
                    </div>
                    <div className={cn(
                      "w-14 h-14 rounded-2xl px-4 flex items-center justify-center bg-slate-50 text-slate-400 font-bold",
                      getStatusColor(doc.status)
                    )}>
                      <FileText size={28} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={(e) => handleDownload(doc, e)}
                       className="p-2 text-slate-300 hover:text-primary transition-colors"
                     >
                       <Download size={18} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleOpenEdit(doc); }}
                       className="p-2 text-slate-300 hover:text-primary transition-colors"
                     >
                       <MoreVertical size={18} />
                     </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <div className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        doc.status === "Verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        doc.status === "Uploaded" ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {doc.status}
                      </div>
                      {doc.status === "Missing" && (
                        <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
                          <AlertCircle size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Urgent</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-white truncate">{doc.name}</h3>
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.type}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400">{doc.size}</span>
                    </div>
                  </div>

                  {doc.isVerifying ? (
                    <div className="bg-amber-50 p-3 rounded-2xl flex items-center gap-3 border border-amber-100">
                      <Sparkles size={14} className="text-amber-500 animate-spin" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">AI Verification in Progress...</span>
                    </div>
                  ) : doc.status === "Uploaded" && (
                    <div className="bg-blue-50/50 p-3 rounded-2xl flex items-center justify-between border border-blue-100/30">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pending Verification</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); smartVerify(doc.id); }}
                        className="text-[9px] font-black text-primary hover:underline uppercase tracking-tight"
                      >
                        Verify Now
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Shipment Link</p>
                      <div className="flex items-center gap-1.5 group/link cursor-pointer">
                        <LinkIcon size={12} className="text-slate-300 group-hover/link:text-primary" />
                        <span className="text-xs font-bold text-white group-hover/link:text-primary truncate max-w-[120px]">
                          {getShipmentLabel(doc.shipmentId)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Uploaded</p>
                      <p className="text-xs font-bold text-slate-500">{doc.uploadedAt}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">
                    <button 
                      onClick={selectAll}
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        selectedIds.length === filteredDocs.length && filteredDocs.length > 0
                          ? "bg-primary border-primary text-white" 
                          : "border-border bg-white"
                      )}
                    >
                      {selectedIds.length === filteredDocs.length && filteredDocs.length > 0 && <Check size={14} strokeWidth={4} />}
                    </button>
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipment ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocs.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => toggleSelect(doc.id)}
                    className={cn(
                      "hover:bg-slate-50/30 transition-colors cursor-pointer",
                      selectedIds.includes(doc.id) ? "bg-primary/5" : ""
                    )}
                  >
                    <td className="px-8 py-6">
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mx-auto",
                        selectedIds.includes(doc.id) ? "bg-primary border-primary text-white" : "border-border bg-white"
                      )}>
                        {selectedIds.includes(doc.id) && <Check size={14} strokeWidth={4} />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", getStatusColor(doc.status))}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-white">{doc.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{doc.size} • {doc.uploadedAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-primary truncate max-w-[150px] block">
                        {getShipmentLabel(doc.shipmentId)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {doc.isVerifying ? (
                          <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                            <Sparkles size={12} className="animate-spin" /> Analyzing
                          </div>
                        ) : (
                          <div className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm transition-all",
                            doc.status === "Verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            doc.status === "Uploaded" ? "bg-blue-100/50 text-blue-600 border-blue-200" :
                            "bg-red-100/80 text-red-600 border-red-200 ring-4 ring-red-50"
                          )}>
                            {getStatusIcon(doc.status)}
                            {doc.status}
                            {doc.status === "Uploaded" && <span className="opacity-50 ml-1">(Pending Approval)</span>}
                            {doc.status === "Missing" && <span className="ml-1 text-[8px] opacity-70">Action Required</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => handleDownload(doc, e)} className="p-2 text-slate-300 hover:text-primary transition-colors"><Download size={16} /></button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(doc); }}
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
        
        {filteredDocs.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Search size={40} />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No documents match your query</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary Bar */}
      <div className="bg-[#1A2B4C] p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl text-white">
        <div className="flex items-center gap-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm text-amber-400">
            <AlertCircle size={28} />
          </div>
          <div>
            <h4 className="text-2xl font-manrope font-extrabold text-white mb-1">Verification Backlog</h4>
            <p className="text-sm text-slate-400 font-medium opacity-70 italic">14 documents pending agent approval in the Europe sector.</p>
          </div>
        </div>
        <div className="flex gap-16">
          <div className="text-center">
             <p className="text-3xl font-extrabold">248</p>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">VERIFIED</p>
          </div>
          <div className="text-center">
             <p className="text-3xl font-extrabold text-red-400">12</p>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MISSING</p>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#1A2B4C] text-white px-8 py-6 rounded-full shadow-2xl flex items-center gap-10 z-50 border border-border min-w-[600px]"
          >
            <div className="flex items-center gap-4 border-r border-border pr-10">
               <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-black text-sm">
                 {selectedIds.length}
               </div>
               <p className="text-sm font-black uppercase tracking-widest text-slate-300">Selected</p>
            </div>
            
            <div className="flex gap-6 flex-grow">
               <button 
                 onClick={runBulkSmartVerify}
                 className="flex items-center gap-2 hover:text-amber-400 transition-colors font-bold text-xs uppercase tracking-widest group"
               >
                 <Zap size={18} className="group-hover:scale-110 transition-transform text-amber-500" /> 
                 Smart Audit
               </button>
               <button 
                 onClick={bulkVerify}
                 className="flex items-center gap-2 hover:text-emerald-400 transition-colors font-bold text-xs uppercase tracking-widest group"
               >
                 <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" /> 
                 Verify All
               </button>
               <button 
                 onClick={() => {
                   const targets = selectedIds.length > 0 ? docs.filter(d => selectedIds.includes(d.id)) : filteredDocs;
                   targets.forEach(doc => {
                     const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nStatus: ${doc.status}\nShipment: ${doc.shipmentId}`], { type: "text/plain" });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement("a"); a.href = url; a.download = doc.name; a.click();
                     URL.revokeObjectURL(url);
                   });
                 }}
                 className="flex items-center gap-2 hover:text-blue-400 transition-colors font-bold text-xs uppercase tracking-widest group"
               >
                 <Download size={18} className="group-hover:scale-110 transition-transform" /> 
                 Download Bundle
               </button>
               <button 
                 onClick={bulkDelete}
                 className="flex items-center gap-2 hover:text-red-400 transition-colors font-bold text-xs uppercase tracking-widest group"
               >
                 <Trash2 size={18} className="group-hover:scale-110 transition-transform" /> 
                 Remove
               </button>
            </div>

            <button 
              onClick={() => setSelectedIds([])}
              className="px-6 py-2 bg-slate-50 hover:bg-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-manrope font-extrabold text-slate-900">
                      {editingDoc ? "Edit Document" : "Upload Document"}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      {editingDoc ? "Modify document properties" : "Add new files to shipment pipeline"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-primary transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Document Name</label>
                    <input 
                      type="text"
                      placeholder="e.g., Shipping_Instructions_v1.pdf"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Document Type</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Document["type"] }))}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        {["KYC", "Booking Confirmation", "SI", "BL Draft", "Invoice"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Link Shipment</label>
                      <select 
                        value={formData.shipmentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipmentId: e.target.value }))}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        {MOCK_SHIPMENTS.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!editingDoc && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Customer</label>
                        <select
                          value={formData.customerId}
                          onChange={e => {
                            const c = CUSTOMERS.find(c => c.id === e.target.value);
                            setFormData(prev => ({ ...prev, customerId: e.target.value, shipmentId: c?.shipmentId || "PENDING" }));
                          }}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">— Select Customer —</option>
                          {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-slate-100 hover:border-primary/30"
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.xlsx,.docx,.doc,.xls"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                        />
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                          uploadedFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-300 group-hover:text-primary")}>
                          {uploadedFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                        </div>
                        <div className="text-center">
                          {uploadedFile ? (
                            <>
                              <p className="text-sm font-bold text-emerald-600">{uploadedFile.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-slate-900">Drop files or click to upload</p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">PDF, XLSX, DOCX (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveDocument}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingDoc ? "Save Changes" : "Confirm Upload"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
