import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SmoothFog({ targetColor, targetFog }) {
  const fogRef = useRef();
  const colorRef = useRef(new THREE.Color(targetColor));
  const fogDensity = useRef(targetFog);

  useFrame(() => {
    // Smooth fog density
    fogDensity.current = THREE.MathUtils.lerp(
      fogDensity.current,
      targetFog,
      0.02
    );

    // Smooth color
    colorRef.current.lerp(new THREE.Color(targetColor), 0.02);

    if (fogRef.current) {
      fogRef.current.color.copy(colorRef.current);
      fogRef.current.density = fogDensity.current;
    }
  });

  return (
    <fog
      ref={fogRef}
      attach="fog"
      args={[new THREE.Color(targetColor), 1, 15]}
    />
  );
}
