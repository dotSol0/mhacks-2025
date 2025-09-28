import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Fish2({ isPaused, health }) {
  const ref = useRef();
  const { scene } = useGLTF("/models/Fish2.glb");

  const angleRef = useRef(0);
  const currentHealth = useRef(health);

  useFrame((_, delta) => {
    if (!ref.current) return;

    currentHealth.current = THREE.MathUtils.lerp(
      currentHealth.current,
      health,
      0.05
    );

    if (!isPaused) {
      const baseSpeed = 1.2;
      const speed = baseSpeed * currentHealth.current;
      angleRef.current += speed * delta;
    }

    const r = 1.5;
    const x = Math.cos(angleRef.current) * r;
    const z = Math.sin(angleRef.current) * r;

    ref.current.position.set(x, -0.01, z);
    ref.current.rotation.y = -angleRef.current;

    // Color
    ref.current.traverse((child) => {
      if (child.isMesh) {
        const h = currentHealth.current;
        if (h < 0.05) child.material.color.set("#FF0000");
      }
    });
  });

  return <primitive ref={ref} object={scene} scale={0.003} />;
}
