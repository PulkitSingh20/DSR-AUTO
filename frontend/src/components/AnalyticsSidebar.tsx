import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area, CartesianGrid } from "recharts";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { Plus, Trash2, LayoutGrid, BarChart3, Database } from "lucide-react";

const INITIAL_DISTRIBUTION = [
  { name: "Sea", value: 45, color: "#1A2B4C" },
  { name: "Air", value: 30, color: "#3B82F6" },
  { name: "Ground", value: 25, color: "#94A3B8" },
];

const INITIAL_SUCCESS = [
  { name: "Atlas", done: 85, left: 15 },
  { name: "EuroL", done: 70, left: 30 },
  { name: "PacLog", done: 92, left: 8 },
  { name: "AsiaM", done: 45, left: 55 },
  { name: "Global", done: 80, left: 20 },
];

const INITIAL_VOLUME = [
  { month: "Jan", volume: 450, target: 400 },
  { month: "Feb", volume: 380, target: 400 },
  { month: "Mar", volume: 520, target: 500 },
  { month: "Apr", volume: 490, target: 450 },
  { month: "May", volume: 680, target: 700 },
  { month: "Jun", volume: 720, target: 600 },
];

export function AnalyticsSidebar({ fullWidth = false }: { fullWidth?: boolean }) {
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [distributionData, setDistributionData] = useState(INITIAL_DISTRIBUTION);
  const [customerData, setCustomerData] = useState(INITIAL_SUCCESS);
  const [volumeData, setVolumeData] = useState(INITIAL_VOLUME);

  // Form states for adding new customer
  const [newName, setNewName] = useState("");
  const [newDone, setNewDone] = useState(50);

  const addCustomer = () => {
    if (!newName) return;
    const newEntry = {
      name: newName,
      done: newDone,
      left: 100 - newDone
    };
    setCustomerData([...customerData, newEntry]);
    setNewName("");
    setNewDone(50);
  };

  const removeCustomer = (name: string) => {
    setCustomerData(customerData.filter(c => c.name !== name));
  };

  return (
    <div className={cn("space-y-8", fullWidth ? "w-full" : "lg:col-span-4")}>
      <div className={cn("grid gap-8", fullWidth ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
        {/* Shipment Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">Cargo Distribution</h3>
          
          <div className="relative flex items-center justify-center" style={{ height: "208px" }}>
            <ResponsiveContainer width="100%" height={208}>
              <PieChart>
                <Pie
                  data={distributionData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setHoveredData(distributionData[index])}
                  onMouseLeave={() => setHoveredData(null)}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {!hoveredData ? (
                <>
                  <span className="text-3xl font-display font-extrabold text-slate-900 leading-none">1.2k</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Units Total</span>
                </>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">{hoveredData.name}</span>
                  <span className="text-2xl font-display font-extrabold text-slate-900">{hoveredData.value}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Success Performance */}
        {fullWidth && (
          <div className={cn("bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-colors", fullWidth && "lg:col-span-2")}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Customer Success Metrics</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Done</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-100 rounded-sm" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Left</span>
                </div>
              </div>
            </div>
            
            <div className={cn("w-full", fullWidth ? "h-80" : "h-64")} style={{ minHeight: fullWidth ? "320px" : "256px" }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={fullWidth ? 320 : 256}>
                <BarChart
                  data={customerData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}
                  />
                  <Bar dataKey="done" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} name="Done (%)" barSize={fullWidth ? 48 : 24} />
                  <Bar dataKey="left" stackId="a" fill="#F1F5F9" radius={[4, 4, 0, 0]} name="Pending (%)" barSize={fullWidth ? 48 : 24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Data Management Section - Only in full width */}
        {fullWidth && (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Database size={16} />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Live Data Management</h3>
            </div>

            <div className="space-y-6 flex-1">
              {/* Add New Form */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-3">Add Customer Dataset</p>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Customer (e.g. FedEx)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold ring-primary/10 focus:ring-2 transition-all outline-none"
                  />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Success Rate: {newDone}%</label>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={newDone}
                      onChange={(e) => setNewDone(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <button 
                    onClick={addCustomer}
                    className="w-full bg-blue-600 text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={12} /> Inject Metric
                  </button>
                </div>
              </div>

              {/* Data List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-2">Current Nodes</p>
                {customerData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800">{c.name}</span>
                      <span className="text-[9px] font-mono text-blue-600 font-bold">{c.done}% / {c.left}%</span>
                    </div>
                    <button 
                      onClick={() => removeCustomer(c.name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-md"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* kyc velocity */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">System Velocity</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-700 uppercase">Verification Engine</span>
                <span className="text-xs font-mono font-bold text-blue-600">92%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[92%] transition-all duration-1000" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-700 uppercase">Document Audit</span>
                <span className="text-xs font-mono font-bold text-blue-600">68%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[68%] transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>

        {/* Volume Over Time - Only in full width */}
        {fullWidth && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 lg:col-span-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">Shipment Volume Trend (Monthly)</h3>
            <div className="space-y-4">
              <div className="flex gap-6">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Volume vs Target</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                    <span className="text-[10px] font-bold text-slate-700">Actual</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 bg-amber-400 rounded-sm" />
                    <span className="text-[10px] font-bold text-slate-700">Target</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full" style={{ minHeight: "256px" }}>
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={volumeData}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      name="Actual"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#F59E0B', r: 3 }}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}