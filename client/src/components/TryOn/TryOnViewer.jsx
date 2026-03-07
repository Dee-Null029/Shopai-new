import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// Parametric body mannequin using basic Three.js shapes
function BodyModel({ params, garmentColor }) {
  const groupRef = useRef();
  const { height = 170, chest = 95, waist = 80, hip = 95 } = params;

  // Normalize measurements to 3D scale
  const scale = height / 170;
  const chestScale = chest / 95;
  const waistScale = waist / 80;
  const hipScale = hip / 95;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const skinColor = '#f5d6c3';

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -1.5, 0]}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Torso - upper (chest) */}
      <mesh position={[0, 1.25, 0]} scale={[chestScale, 1, 0.7]}>
        <cylinderGeometry args={[0.2, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={garmentColor || '#3b82f6'} />
      </mesh>

      {/* Torso - middle (waist) */}
      <mesh position={[0, 0.95, 0]} scale={[waistScale, 1, 0.65]}>
        <cylinderGeometry args={[0.18, 0.16, 0.3, 16]} />
        <meshStandardMaterial color={garmentColor || '#3b82f6'} />
      </mesh>

      {/* Torso - lower (hip) */}
      <mesh position={[0, 0.7, 0]} scale={[hipScale, 1, 0.7]}>
        <cylinderGeometry args={[0.16, 0.2, 0.2, 16]} />
        <meshStandardMaterial color={garmentColor || '#1e3a5f'} />
      </mesh>

      {/* Left arm */}
      <group position={[-0.3 * chestScale, 1.25, 0]}>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.045, 0.04, 0.35, 12]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[-0.02, -0.4, 0]} rotation={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.04, 0.035, 0.3, 12]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[0.3 * chestScale, 1.25, 0]}>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.045, 0.04, 0.35, 12]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[0.02, -0.4, 0]} rotation={[0, 0, -0.05]}>
          <cylinderGeometry args={[0.04, 0.035, 0.3, 12]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Left leg */}
      <group position={[-0.1 * hipScale, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.4, 12]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.35, 12]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        {/* Shoe */}
        <mesh position={[0.02, -0.72, 0.03]}>
          <boxGeometry args={[0.08, 0.05, 0.14]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
      </group>

      {/* Right leg */}
      <group position={[0.1 * hipScale, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.4, 12]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.35, 12]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        {/* Shoe */}
        <mesh position={[-0.02, -0.72, 0.03]}>
          <boxGeometry args={[0.08, 0.05, 0.14]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
      </group>
    </group>
  );
}

function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading 3D scene...</p>
      </div>
    </Html>
  );
}

export default function TryOnViewer({ bodyParams, garmentColor }) {
  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.5, 2.5], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />

          <BodyModel params={bodyParams} garmentColor={garmentColor} />

          <ContactShadows
            position={[0, -1.7, 0]}
            opacity={0.4}
            scale={3}
            blur={2}
          />

          <Environment preset="studio" />
          <OrbitControls
            enablePan={false}
            minDistance={1.5}
            maxDistance={5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
