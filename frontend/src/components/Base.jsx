// // src/components/Base.jsx

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Base({ treeHealth }) {
  const ref = useRef();
  const currentColor = useRef(new THREE.Color("#228B22"));

  useFrame(() => {
    if (!ref.current) return;

    const health = Math.max(0, Math.min(1, treeHealth / 100));
    const lushGreen = new THREE.Color("#228B22");
    const dullGreen = new THREE.Color("#6B8E23");

    const targetColor = lushGreen.clone().lerp(dullGreen, 1 - health);
    currentColor.current.lerp(targetColor, 0.05);

    ref.current.material.color.copy(currentColor.current);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[10, 64]} />
      <meshStandardMaterial />
    </mesh>
  );
}
