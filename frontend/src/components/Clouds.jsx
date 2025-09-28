// src/components/Cloud.jsx
import { useGLTF } from "@react-three/drei";
import { useHelper } from "@react-three/drei";
import { useRef } from "react";
import { BoxHelper } from "three";

export default function Cloud() {
  const ref = useRef();
  const { scene } = useGLTF("/models/Clouds.glb");

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material.color.set("white");
    }
  });

  return <primitive ref={ref} object={scene} scale={2} position={[4, 5, -2]} />;
}
