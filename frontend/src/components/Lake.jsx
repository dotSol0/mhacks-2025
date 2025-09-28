// export default function Lake() {

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lake({ lakeColor, clarity }) {
  const ref = useRef();

  // store current values
  const currentClarity = useRef(clarity);
  const currentColor = useRef(new THREE.Color(lakeColor));

  useFrame(() => {
    if (!ref.current) return;

    // Smooth clarity
    currentClarity.current = THREE.MathUtils.lerp(
      currentClarity.current,
      clarity,
      0.05
    );

    // Smooth color
    const targetColor = new THREE.Color(lakeColor);
    currentColor.current.lerp(targetColor, 0.05);

    ref.current.material.color.copy(currentColor.current);
    ref.current.material.opacity = currentClarity.current;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.009, 0]} ref={ref}>
      <circleGeometry args={[2, 64]} />
      <meshStandardMaterial transparent />
    </mesh>
  );
}
