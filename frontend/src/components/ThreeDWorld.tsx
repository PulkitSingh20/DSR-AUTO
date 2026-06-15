import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  MeshDistortMaterial, 
  MeshWobbleMaterial, 
  Stars, 
  Text,
  Environment,
  ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';

function CargoBox({ position, color = "#3b82f6", delay = 0 }: { position: [number, number, number], color?: string, delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t + delay) * 0.2;
    meshRef.current.rotation.x = Math.sin(t / 4) / 4;
    meshRef.current.rotation.y = Math.sin(t / 2) / 2;
  });

  return (
    <Float rotation={[Math.PI / 4, 0, 0]} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={1.1}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.1} />
      </mesh>
    </Float>
  );
}

function Grid() {
  return (
    <gridHelper args={[20, 20, "#1e293b", "#0f172a"]} position={[0, -2, 0]} />
  );
}

function MovingParticles() {
  const count = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null!);
  useFrame((state) => {
    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#3b82f6" transparent opacity={0.6} />
    </points>
  );
}

export function ThreeDWorld() {
  return (
    <div className="w-full h-[80vh] bg-[#0F172A] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight uppercase italic italic">3D Node Operations</h2>
        <p className="text-[10px] font-mono text-blue-500 tracking-[0.2em] font-bold">SPATIAL DATA VISUALIZATION // V1.0</p>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <CargoBox position={[-2, 0, 0]} color="#3b82f6" />
        <CargoBox position={[0, 0, -2]} color="#6366f1" delay={1} />
        <CargoBox position={[2, 0, 0]} color="#8b5cf6" delay={2} />
        
        {/* Floating Sphere */}
        <Float speed={2} rotationIntensity={2} floatIntensity={2}>
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <MeshDistortMaterial color="#f472b6" speed={5} distort={0.4} />
          </mesh>
        </Float>

        <Text
          position={[0, -1, 5]}
          fontSize={0.5}
          color="#1e293b"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyMZhrib2Bg-4.ttf"
        >
          LOGISTICS NETWORK
        </Text>

        <Grid />
        <MovingParticles />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={24} far={4.5} />
        
        <Environment preset="city" />
      </Canvas>

      <div className="absolute bottom-8 right-8 z-10 flex gap-4 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
          <p className="text-[8px] font-bold uppercase tracking-widest text-blue-400 mb-1">Active Nodes</p>
          <p className="text-xl font-mono font-bold">124</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
          <p className="text-[8px] font-bold uppercase tracking-widest text-pink-400 mb-1">Throttling</p>
          <p className="text-xl font-mono font-bold text-pink-500">0.02%</p>
        </div>
      </div>
    </div>
  );
}
