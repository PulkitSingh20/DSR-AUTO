import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Globe from "react-globe.gl";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { api } from "@/src/services/api";
import { Wifi, WifiOff, Activity } from "lucide-react";

interface Vessel {
  id: string;
  label: string;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: "nominal" | "delayed" | "critical";
  type: "ship" | "plane";
  origin: string;
  destination: string;
}

const FALLBACK_VESSELS: Vessel[] = [
  { id: "V1", label: "VESSEL_ATLANTIC_MSK", name: "Maersk Atlanta", lat: 35.7, lng: -40.2, heading: 45, speed: 18, status: "nominal", type: "ship", origin: "Mumbai, IN", destination: "Rotterdam, NL" },
  { id: "V2", label: "CARRIER_ATLAS_747", name: "Atlas Air 747", lat: 40.7, lng: -74.0, heading: 270, speed: 550, status: "nominal", type: "plane", origin: "New York, US", destination: "Seattle, US" },
  { id: "V3", label: "GLOBAL_PACIFIC_LOG", name: "Global Pacific", lat: -15.8, lng: -140.5, heading: 90, speed: 15, status: "delayed", type: "ship", origin: "Shanghai, CN", destination: "Long Beach, US" },
  { id: "V4", label: "EURO_EXPRESS_L01", name: "Euro Express 01", lat: 51.5, lng: -0.1, heading: 135, speed: 480, status: "nominal", type: "plane", origin: "London, UK", destination: "Singapore, SG" },
  { id: "V5", label: "ASIA_MARU_99", name: "Asia Maru 99", lat: 34.7, lng: 139.7, heading: 200, speed: 20, status: "nominal", type: "ship", origin: "Tokyo, JP", destination: "Sydney, AU" },
  { id: "V6", label: "INDIA_GULF_EXP", name: "India Gulf Express", lat: 15.0, lng: 56.0, heading: 315, speed: 16, status: "critical", type: "ship", origin: "Mumbai, IN", destination: "Dubai, UAE" },
];

// Real origin → destination coordinates for each vessel
const ROUTE_ARCS = [
  // Maersk Atlanta: Mumbai → Rotterdam
  { startLat: 18.96, startLng: 72.82, endLat: 51.92, endLng: 4.48,  color: "#3b82f6", label: "Maersk Atlanta" },
  // Atlas Air 747: New York → Seattle
  { startLat: 40.71, startLng: -74.01, endLat: 47.61, endLng: -122.33, color: "#3b82f6", label: "Atlas Air 747" },
  // Global Pacific: Shanghai → Long Beach
  { startLat: 31.23, startLng: 121.47, endLat: 33.75, endLng: -118.19, color: "#fbbf24", label: "Global Pacific" },
  // Euro Express: London → Singapore
  { startLat: 51.51, startLng: -0.13, endLat: 1.35, endLng: 103.82, color: "#3b82f6", label: "Euro Express" },
  // Asia Maru: Tokyo → Sydney
  { startLat: 35.68, startLng: 139.69, endLat: -33.87, endLng: 151.21, color: "#3b82f6", label: "Asia Maru 99" },
  // India Gulf Express: Mumbai → Dubai
  { startLat: 18.96, startLng: 72.82, endLat: 25.20, endLng: 55.27,  color: "#ef4444", label: "India Gulf Exp" },
];

export function LiveGlobalHub() {
  const [vessels, setVessels] = useState<Vessel[]>(FALLBACK_VESSELS);
  const [telemetry, setTelemetry] = useState<string[]>(["> INITIALIZING GLOBAL NODE HUB...", "> SYNCING WITH TRACKING API..."]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [throughput, setThroughput] = useState("4.8k");
  const containerRef = useRef<HTMLDivElement>(null);
  const globeWrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: typeof window !== "undefined" ? window.innerWidth : 800, height: 480 });
  const [isHoveringGlobe, setIsHoveringGlobe] = useState(false);
  // Globe zoom level: distance from camera (smaller = more zoomed in)
  const zoomDistanceRef = useRef(280);

  // Point camera at proper distance after globe mounts
  const setCameraDistance = useCallback((dist: number) => {
    const camera = globeRef.current?.camera();
    if (!camera) return;
    const dir = camera.position.clone().normalize();
    camera.position.copy(dir.multiplyScalar(dist));
  }, []);

  const [dataSource, setDataSource] = useState<string>("LOCAL_SIM");

  const { isConnected } = useWebSocket({
    onVesselUpdate: useCallback((data: { vessels: Vessel[] }) => {
      if (data?.vessels) {
        setVessels(data.vessels);
        const v = data.vessels[Math.floor(Math.random() * data.vessels.length)];
        setTelemetry(prev => [
          `> UPDATE: ${v.label} | ${v.lat.toFixed(2)}, ${v.lng.toFixed(2)} | ${v.status.toUpperCase()}`,
          ...prev
        ].slice(0, 6));
        setThroughput((4 + Math.random() * 2).toFixed(1) + "k");
      }
    }, []),
    onAlerts: useCallback((alert: any) => {
      if (alert?.message) {
        setTelemetry(prev => [`> ALERT: ${alert.message}`, ...prev].slice(0, 6));
      }
    }, []),
  });

  useEffect(() => {
    if (!isConnected) {
      let cleanup: (() => void) | undefined;
      api.tracking.vessels().then((data: any) => {
        if (data?.vessels?.length) setVessels(data.vessels);
        if (data?.source) setDataSource(data.source.toUpperCase());
      }).catch(() => {
        const interval = setInterval(() => {
          setVessels(prev => prev.map(v => ({
            ...v,
            lat: v.lat + (Math.random() - 0.5) * 0.15,
            lng: v.lng + (Math.random() - 0.5) * 0.15,
          })));
        }, 3000);
        cleanup = () => clearInterval(interval);
      });
      return () => cleanup?.();
    }
  }, [isConnected]);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      setDimensions({ width: rect.width, height: rect.height || 480 });
    }
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 480;
        if (w > 0) setDimensions({ width: w, height: h });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const initControls = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false; // we handle zoom manually
    controls.minDistance = 150;
    controls.maxDistance = 600;
  }, []);

  useEffect(() => {
    initControls();
    const t = setTimeout(() => {
      initControls();
      setCameraDistance(zoomDistanceRef.current);
    }, 600);
    return () => clearTimeout(t);
  }, [dimensions.width, initControls]);

  // Handle scroll via native listener (passive:false required for preventDefault)
  const isHoveringGlobeRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!isHoveringGlobeRef.current) return; // page scrolls normally
      e.preventDefault();
      const controls = globeRef.current?.controls();
      if (!controls) return;
      const delta = e.deltaY > 0 ? 20 : -20;
      zoomDistanceRef.current = Math.min(600, Math.max(150, zoomDistanceRef.current + delta));
      controls.minDistance = zoomDistanceRef.current;
      controls.maxDistance = zoomDistanceRef.current;
      setCameraDistance(zoomDistanceRef.current);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const pointColor = useCallback((v: any) =>
    v.status === "nominal" ? "#3b82f6" : v.status === "delayed" ? "#fbbf24" : "#ef4444", []);

  const nominalCount = vessels.filter(v => v.status === "nominal").length;
  const delayedCount = vessels.filter(v => v.status === "delayed").length;
  const criticalCount = vessels.filter(v => v.status === "critical").length;

  // Globe radius is ~100 units at default view; use container center to detect hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const radiusPx = (rect.height / 2) * 0.82;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    const hovering = dist < radiusPx;
    isHoveringGlobeRef.current = hovering;
    setIsHoveringGlobe(hovering);
  }, []);

  return (
    <div className="bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-technical">
      <div className="flex items-center justify-between p-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Global Node Hub</h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">STREAM_ACTIVE</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-bold uppercase ${isConnected ? "text-blue-400" : "text-slate-500"}`}>
            {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isConnected ? `LIVE` : dataSource}
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Throughput</p>
            <p className="text-xs font-mono font-medium text-white">{throughput} ops/sec</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fleet</p>
            <p className="text-xs font-mono font-medium">
              <span className="text-emerald-400">{nominalCount}✓ </span>
              <span className="text-amber-400">{delayedCount}! </span>
              <span className="text-red-400">{criticalCount}✗</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nodes Sync</p>
            <p className="text-xs font-mono font-medium text-blue-400">{vessels.length}/{vessels.length} OK</p>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[480px] w-full bg-[#060e20] flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { isHoveringGlobeRef.current = false; setIsHoveringGlobe(false); }}
        style={{ cursor: isHoveringGlobe ? "zoom-in" : "default" }}
      >
        {/* Subtle ring hint when hovering globe */}
        {isHoveringGlobe && (
          <div
            className="absolute rounded-full border border-blue-400/20 pointer-events-none z-20 transition-all duration-200"
            style={{
              width: `${dimensions.height * 0.82 * 2}px`,
              height: `${dimensions.height * 0.82 * 2}px`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        <div ref={globeWrapperRef} className="absolute inset-0 z-0">
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#060e20"
            globeImageUrl="https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg"
            bumpImageUrl="https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png"
            atmosphereColor="#3b82f6"
            atmosphereAltitude={0.15}
            pointsData={vessels}
            pointLat="lat"
            pointLng="lng"
            pointColor={pointColor}
            pointAltitude={0.04}
            pointRadius={0.7}
            pointsMerge={false}
            pointLabel={(v: any) => `<div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px 12px;font-family:monospace;font-size:11px;color:#e2e8f0"><b style="color:#60a5fa">${v.name || v.label}</b><br/>${v.origin} → ${v.destination}<br/><span style="color:${v.status === "nominal" ? "#34d399" : v.status === "delayed" ? "#fbbf24" : "#ef4444"}">${v.status?.toUpperCase()}</span></div>`}
            arcsData={ROUTE_ARCS}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcDashLength={0.6}
            arcDashGap={0.15}
            arcDashAnimateTime={3000}
            arcStroke={0.6}
            arcAltitudeAutoScale={0.35}
            animateIn={true}
            onPointClick={(v: any) => setSelectedVessel(v as Vessel)}
          />
        </div>

        <div className="absolute bottom-8 left-8 space-y-4 z-10 pointer-events-none">
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 w-64 shadow-2xl pointer-events-auto">
            <h4 className="text-[10px] font-bold text-[#98b1f2] uppercase mb-3 flex items-center gap-2">
              <Activity size={10} /> Regional Operations
            </h4>
            <div className="space-y-2">
              <HubStatus label="Rotterdam Terminal" status="NOMINAL" color="text-green-400" />
              <HubStatus label="Singapore Hub" status="NOMINAL" color="text-green-400" />
              <HubStatus label="Long Beach Port" status="CONGESTED" color="text-red-400" />
              <HubStatus label="JNPT Mumbai" status="NOMINAL" color="text-green-400" />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedVessel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-8 left-8 z-10 p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 w-72 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[9px] font-mono text-blue-400 uppercase">{selectedVessel.type}</p>
                  <h4 className="text-sm font-bold text-white">{selectedVessel.name}</h4>
                </div>
                <button onClick={() => setSelectedVessel(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
              </div>
              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between"><span className="text-slate-400">Position</span><span className="text-white">{selectedVessel.lat?.toFixed(3)}°, {selectedVessel.lng?.toFixed(3)}°</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Route</span><span className="text-white text-right max-w-[160px]">{selectedVessel.origin} → {selectedVessel.destination}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Speed</span><span className="text-white">{selectedVessel.speed} {selectedVessel.type === "plane" ? "kts" : "kn"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status</span>
                  <span className={selectedVessel.status === "nominal" ? "text-green-400" : selectedVessel.status === "delayed" ? "text-amber-400" : "text-red-400"}>{selectedVessel.status?.toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-8 right-8 text-right font-mono text-[9px] text-white/40 space-y-1 z-10 pointer-events-none max-w-xs">
          <AnimatePresence mode="popLayout">
            {telemetry.map((log, i) => (
              <motion.p key={log + i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1 - i * 0.18, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="truncate">
                {log}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-4 right-8 z-10 pointer-events-none opacity-30">
          <p className="text-[8px] font-mono text-white uppercase tracking-widest">
            {isHoveringGlobe ? "SCROLL TO ZOOM ↕" : "HOVER GLOBE TO ZOOM"} • DRAG TO ROTATE • CLICK VESSEL
          </p>
        </div>
      </div>
    </div>
  );
}

function HubStatus({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-white/70">{label}</span>
      <span className={`font-bold font-mono ${color}`}>{status}</span>
    </div>
  );
}