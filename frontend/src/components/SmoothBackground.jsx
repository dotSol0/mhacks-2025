import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SmoothBackground({ targetColor }) {
  const colorRef = useRef(new THREE.Color(targetColor));

  useFrame(() => {
    colorRef.current.lerp(new THREE.Color(targetColor), 0.02);
  });

  return <color attach="background" args={[colorRef.current]} />;
}
