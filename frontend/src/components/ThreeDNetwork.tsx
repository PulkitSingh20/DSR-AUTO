import React, { useEffect, useRef, useState } from "react";

interface Node3D {
  name: string;
  x: number; // 3D X
  y: number; // 3D Y
  z: number; // 3D Z
  // Rotated coordinates
  rx?: number;
  ry?: number;
  rz?: number;
  // Projected 2D coordinates
  px?: number;
  py?: number;
  scale?: number;
}

interface Connection {
  a: number; // index of node A
  b: number; // index of node B
}

interface Pulse {
  a: number; // start node index
  b: number; // end node index
  progress: number; // 0 to 1
  speed: number;
}

// 30 Major global logistics hubs with coordinates mapped to a 3D sphere
const LOGISTICS_HUBS = [
  { name: "SINGAPORE HUB", lat: 1.35, lng: 103.82 },
  { name: "ROTTERDAM PORT", lat: 51.92, lng: 4.48 },
  { name: "MUMBAI JNPT", lat: 18.96, lng: 72.82 },
  { name: "SHANGHAI DONGHAI", lat: 31.23, lng: 121.47 },
  { name: "TOKYO BAY NODE", lat: 35.68, lng: 139.69 },
  { name: "NEW YORK PORT", lat: 40.71, lng: -74.01 },
  { name: "LOS ANGELES PORT", lat: 33.75, lng: -118.19 },
  { name: "DUBAI HARBOR", lat: 25.20, lng: 55.27 },
  { name: "LONDON GATEWAY", lat: 51.51, lng: -0.13 },
  { name: "SYDNEY TERMINAL", lat: -33.87, lng: 151.21 },
  { name: "HAMBURG HUB", lat: 53.55, lng: 9.99 },
  { name: "ANTWERP PORT", lat: 51.22, lng: 4.40 },
  { name: "BUSAN NODE", lat: 35.17, lng: 129.07 },
  { name: "HONG KONG HARBOR", lat: 22.31, lng: 114.16 },
  { name: "PANAMA CANAL", lat: 8.98, lng: -79.52 },
  { name: "SUEZ CANAL NODE", lat: 29.96, lng: 32.54 },
  { name: "GIBRALTAR STRAIT", lat: 36.14, lng: -5.35 },
  { name: "SANTOS PORT", lat: -23.96, lng: -46.33 },
  { name: "CAPE TOWN TERMINAL", lat: -33.92, lng: 18.42 },
  { name: "VANCOUVER GATEWAY", lat: 49.28, lng: -123.12 },
  { name: "GENOA HUB", lat: 44.40, lng: 8.94 },
  { name: "PIRAEUS PORT", lat: 37.94, lng: 23.64 },
  { name: "JEDDAH HARBOR", lat: 21.48, lng: 39.18 },
  { name: "COLOMBO NODE", lat: 6.92, lng: 79.86 },
  { name: "VALENCIA GATEWAY", lat: 39.46, lng: -0.37 },
  { name: "HOUSTON HARBOR", lat: 29.76, lng: -95.36 },
  { name: "SEATTLE GATEWAY", lat: 47.60, lng: -122.33 },
  { name: "MELBOURNE PORT", lat: -37.81, lng: 144.96 },
  { name: "DURBAN HUB", lat: -29.85, lng: 31.02 },
  { name: "MANILA TERMINAL", lat: 14.59, lng: 120.98 }
];

export function ThreeDNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);

  // Use refs to store animation state to avoid React re-renders on every frame
  const stateRef = useRef({
    nodes: [] as Node3D[],
    connections: [] as Connection[],
    pulses: [] as Pulse[],
    angleX: 0.2, // slow starting tilt
    angleY: 0,
    mouseX: 0,
    mouseY: 0,
    isMouseOver: false,
    hoveredIndex: -1,
    targetRotX: 0.001,
    targetRotY: 0.003,
    rotX: 0.001,
    rotY: 0.003,
  });

  useEffect(() => {
    // Initialize 3D points
    const R = 90; // sphere radius
    const nodes: Node3D[] = LOGISTICS_HUBS.map(hub => {
      const phi = (hub.lat * Math.PI) / 180;
      const theta = (hub.lng * Math.PI) / 180;
      
      // Calculate spherical coordinates
      return {
        name: hub.name,
        x: R * Math.cos(phi) * Math.cos(theta),
        y: -R * Math.sin(phi),
        z: R * Math.cos(phi) * Math.sin(theta),
      };
    });

    // Establish connections (connect nodes if 3D distance is below threshold)
    const connections: Connection[] = [];
    const maxDist = R * 1.15; // connection threshold

    for (let i = 0; i < nodes.length; i++) {
      let connectionCount = 0;
      const distances: { index: number; dist: number }[] = [];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        distances.push({ index: j, dist });

        if (dist < maxDist && i < j) {
          connections.push({ a: i, b: j });
          connectionCount++;
        }
      }

      // Ensure every node has at least one connection
      if (connectionCount === 0 && distances.length > 0) {
        distances.sort((a, b) => a.dist - b.dist);
        const closest = distances[0].index;
        if (i < closest) {
          connections.push({ a: i, b: closest });
        } else {
          // Check if already connected in opposite direction
          const exists = connections.some(c => c.a === closest && c.b === i);
          if (!exists) connections.push({ a: closest, b: i });
        }
      }
    }

    // Initialize random pulses along the connections
    const pulses: Pulse[] = [];
    const numPulses = 12;
    for (let i = 0; i < numPulses; i++) {
      if (connections.length === 0) break;
      const conn = connections[Math.floor(Math.random() * connections.length)];
      pulses.push({
        a: conn.a,
        b: conn.b,
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.008,
      });
    }

    stateRef.current.nodes = nodes;
    stateRef.current.connections = connections;
    stateRef.current.pulses = pulses;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationId: number;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const D = 230; // camera focal distance

    // Main animation loop
    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const state = stateRef.current;

      // Update rotation angles with inertia
      if (state.isMouseOver) {
        // Rotational offset based on mouse position
        const targetRotX = (state.mouseY - height / 2) * 0.00008;
        const targetRotY = (state.mouseX - width / 2) * 0.00008;
        state.rotX += (targetRotX - state.rotX) * 0.1;
        state.rotY += (targetRotY - state.rotY) * 0.1;
      } else {
        // Auto-rotation back to base speed
        state.rotX += (0.001 - state.rotX) * 0.05;
        state.rotY += (0.003 - state.rotY) * 0.05;
      }

      state.angleX += state.rotX;
      state.angleY += state.rotY;

      const cosX = Math.cos(state.angleX);
      const sinX = Math.sin(state.angleX);
      const cosY = Math.cos(state.angleY);
      const sinY = Math.sin(state.angleY);

      // 1. Rotate and Project Nodes
      state.nodes.forEach(node => {
        // Rotate around Y axis
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;

        // Rotate around X axis
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        // Save rotated coordinates
        node.rx = x1;
        node.ry = y2;
        node.rz = z2; // z-depth (positive means further back in standard, let's treat +z2 as deeper/away)

        // Perspective projection
        // If z2 goes from -90 to +90, D + z2 goes from 140 to 320
        const scale = D / (D + z2);
        node.scale = scale;

        // Centered position inside canvas
        // Slight shift right to center visually in the banner's right portion
        node.px = width * 0.48 + x1 * scale;
        node.py = height * 0.5 + y2 * scale;
      });

      // 2. Perform Hover Hit-Testing
      let nearestIndex = -1;
      let minDist = 14;

      if (state.isMouseOver) {
        state.nodes.forEach((node, index) => {
          if (node.px === undefined || node.py === undefined) return;
          const dx = state.mouseX - node.px;
          const dy = state.mouseY - node.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Prioritize closer nodes in 3D (foreground) if multiple match
          if (dist < minDist) {
            minDist = dist;
            nearestIndex = index;
          }
        });
      }

      if (nearestIndex !== state.hoveredIndex) {
        state.hoveredIndex = nearestIndex;
        setHoveredNodeName(nearestIndex !== -1 ? state.nodes[nearestIndex].name : null);
      }

      // 3. Update Pulses
      state.pulses.forEach(pulse => {
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          pulse.a = pulse.b;
          
          // Find connections starting from the target node
          const neighbors: number[] = [];
          state.connections.forEach(conn => {
            if (conn.a === pulse.a) neighbors.push(conn.b);
            else if (conn.b === pulse.a) neighbors.push(conn.a);
          });

          if (neighbors.length > 0) {
            pulse.b = neighbors[Math.floor(Math.random() * neighbors.length)];
          } else {
            // Fallback if isolated
            pulse.b = Math.floor(Math.random() * state.nodes.length);
          }
        }
      });

      // 4. Draw Connections (Back Connections first, then Front Connections)
      // Sort connections based on average z-depth of the two endpoints
      const sortedConnections = state.connections.map(conn => {
        const zDepth = ((state.nodes[conn.a].rz || 0) + (state.nodes[conn.b].rz || 0)) / 2;
        return { conn, zDepth };
      }).sort((a, b) => b.zDepth - a.zDepth); // Sort back-to-front (descending zDepth)

      sortedConnections.forEach(({ conn }) => {
        const nodeA = state.nodes[conn.a];
        const nodeB = state.nodes[conn.b];

        if (nodeA.px === undefined || nodeA.py === undefined || nodeB.px === undefined || nodeB.py === undefined) return;

        // Depth factor (0 = far back, 1 = close front)
        const avgRz = ((nodeA.rz || 0) + (nodeB.rz || 0)) / 2;
        // Map rz (-90 to 90) to factor (0 to 1) -> reverse because positive rz is deeper/further back
        const depthFactor = Math.max(0, Math.min(1, 1 - (avgRz + 90) / 180));

        // Connect styling: fade out background connections
        const isHighlighted = state.hoveredIndex === conn.a || state.hoveredIndex === conn.b;
        const opacity = isHighlighted
          ? 0.75 + depthFactor * 0.25
          : 0.08 + depthFactor * 0.35;

        const strokeWidth = isHighlighted ? 2.5 : 1 + depthFactor * 0.8;

        // Create linear gradient for lines
        const grad = ctx.createLinearGradient(nodeA.px, nodeA.py, nodeB.px, nodeB.py);
        if (isHighlighted) {
          grad.addColorStop(0, `rgba(96, 165, 250, ${opacity})`);
          grad.addColorStop(1, `rgba(16, 185, 129, ${opacity})`);
        } else {
          grad.addColorStop(0, `rgba(59, 130, 246, ${opacity * 0.7})`);
          grad.addColorStop(1, `rgba(16, 185, 129, ${opacity * 0.9})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(nodeA.px, nodeA.py);
        ctx.lineTo(nodeB.px, nodeB.py);
        ctx.stroke();
      });

      // 5. Draw Pulses (with depth perspective)
      state.pulses.forEach(pulse => {
        const nodeA = state.nodes[pulse.a];
        const nodeB = state.nodes[pulse.b];
        if (nodeA.px === undefined || nodeA.py === undefined || nodeB.px === undefined || nodeB.py === undefined) return;

        // Calculate current 3D position of the pulse
        const rx = (nodeA.rx || 0) + ((nodeB.rx || 0) - (nodeA.rx || 0)) * pulse.progress;
        const ry = (nodeA.ry || 0) + ((nodeB.ry || 0) - (nodeA.ry || 0)) * pulse.progress;
        const rz = (nodeA.rz || 0) + ((nodeB.rz || 0) - (nodeA.rz || 0)) * pulse.progress;

        const scale = D / (D + rz);
        const px = width * 0.48 + rx * scale;
        const py = height * 0.5 + ry * scale;

        // Depth opacity
        const depthFactor = Math.max(0, Math.min(1, 1 - (rz + 90) / 180));
        const opacity = 0.2 + depthFactor * 0.8;

        // Draw glowing pulse dot
        ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 * scale, 0, 2 * Math.PI);
        ctx.fill();

        // Pulsing glow ring
        ctx.fillStyle = `rgba(16, 185, 129, ${opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, 5 * scale, 0, 2 * Math.PI);
        ctx.fill();
      });

      // 6. Draw Nodes (sorted back-to-front)
      const sortedNodeIndices = state.nodes.map((node, index) => ({ node, index }))
        .sort((a, b) => (b.node.rz || 0) - (a.node.rz || 0));

      sortedNodeIndices.forEach(({ node, index }) => {
        if (node.px === undefined || node.py === undefined || node.scale === undefined) return;

        const depthFactor = Math.max(0, Math.min(1, 1 - ((node.rz || 0) + 90) / 180));
        const isHovered = state.hoveredIndex === index;

        // Styles
        let radius = isHovered ? 6 : 2.5 + depthFactor * 2.5;
        let baseColor = isHovered ? "#60A5FA" : (depthFactor > 0.65 ? "#10B981" : "#3B82F6");
        let opacity = isHovered ? 1.0 : 0.25 + depthFactor * 0.75;

        // Draw node
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw outer glow rings for foreground or hovered nodes
        if (isHovered) {
          ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius * 2.2, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.strokeStyle = "rgba(96, 165, 250, 0.2)";
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius * 3.8, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (depthFactor > 0.6) {
          // Subtle single ring for close nodes
          ctx.strokeStyle = depthFactor > 0.75 ? "rgba(16, 185, 129, 0.25)" : "rgba(59, 130, 246, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius * 2.0, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const state = stateRef.current;
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.isMouseOver = true;
  };

  const handleMouseLeave = () => {
    const state = stateRef.current;
    state.isMouseOver = false;
    state.hoveredIndex = -1;
    setHoveredNodeName(null);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-0 right-0 w-[55%] h-full z-30 select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
      
      {/* Floating HUD display for hovered node */}
      {hoveredNodeName && (
        <div 
          className="absolute pointer-events-none z-40 bg-slate-900/90 border border-blue-500/30 rounded px-3 py-1.5 shadow-lg backdrop-blur-md"
          style={{
            left: `${stateRef.current.mouseX}px`,
            top: `${stateRef.current.mouseY - 45}px`,
            transform: "translate(-50%, -50%)",
            animation: "hudFadeIn 0.15s ease-out forwards",
          }}
        >
          <div className="text-[10px] font-mono font-bold text-[#60A5FA] tracking-wider whitespace-nowrap flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {hoveredNodeName}
          </div>
          <div className="text-[7px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            NODE STATUS: OPERATIONAL
          </div>
        </div>
      )}

      <style>{`
        @keyframes hudFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
