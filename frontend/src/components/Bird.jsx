// src/components/Bird.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Bird({ isPaused, health }) {
  const ref = useRef();
  const { scene } = useGLTF("/models/Bird.glb");

  const angleRef = useRef(0);
  const currentHealth = useRef(health);

  useFrame((_, delta) => {
    if (!ref.current) return;

    // Smooth transition of health values
    currentHealth.current = THREE.MathUtils.lerp(
      currentHealth.current,
      health,
      0.05
    );

    if (!isPaused) {
      // Clamp health between 0 and 1 for speed calculation
      const clampedHealth = Math.max(0, Math.min(currentHealth.current, 1));
      const baseSpeed = 0.7;
      const speed = baseSpeed * clampedHealth;

      angleRef.current += speed * delta;
    }

    // Flight path (circular orbit)
    const r = 6;
    const x = Math.cos(angleRef.current) * r;
    const z = Math.sin(angleRef.current) * r;
    const y = 3 + Math.sin(angleRef.current * 1.2) * 0.5;

    ref.current.position.set(x, y, z);
    ref.current.rotation.y = -angleRef.current;

    // Color shift if very low health
    ref.current.traverse((child) => {
      if (child.isMesh) {
        const h = currentHealth.current;
        if (h < 0.05) {
          child.material.color.set("#FF0000");
        } else {
          child.material.color.set("#FFFFFF"); // reset to white
        }
      }
    });
  });

  return <primitive ref={ref} object={scene} scale={0.5} />;
}
