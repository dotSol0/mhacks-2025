// // // src/components/Forest.jsx
// import { useMemo } from "react";

// import { useRef, useState, useEffect } from "react";
// import { useFrame } from "@react-three/fiber";
// import * as THREE from "three";

// export default function Forest({ treeCount }) {
//   const [trees, setTrees] = useState([]);
//   const refs = useRef([]);

//   // Add/remove trees when count changes
//   useEffect(() => {
//     setTrees((prev) => {
//       const diff = treeCount - prev.length;
//       if (diff > 0) {
//         // Add new trees
//         const added = Array.from({ length: diff }, () => {
//           const angle = Math.random() * Math.PI * 2;
//           const r = 9 + Math.random();
//           const x = Math.cos(angle) * r;
//           const z = Math.sin(angle) * r;
//           return [x, 0, z];
//         });
//         return [...prev, ...added];
//       } else {
//         // Keep same positions, extra ones will fade out
//         return prev;
//       }
//     });
//   }, [treeCount]);

//   useFrame(() => {
//     refs.current.forEach((mesh, i) => {
//       if (!mesh) return;

//       const shouldBeVisible = i < treeCount;
//       const target = shouldBeVisible ? 1 : 0;
//       const s = THREE.MathUtils.lerp(mesh.scale.y, target, 0.05);

//       mesh.scale.set(s, s, s);
//       mesh.material.opacity = s;
//     });
//   });

//   return (
//     <>
//       {trees.map((pos, i) => (
//         <mesh
//           key={i}
//           ref={(el) => (refs.current[i] = el)}
//           position={pos}
//           scale={[0, 0, 0]}
//         >
//           <coneGeometry args={[0.5, 1.5, 8]} />
//           <meshStandardMaterial color="green" transparent />
//         </mesh>
//       ))}
//     </>
//   );
// }

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Forest({ treeCount }) {
  const [trees, setTrees] = useState([]);
  const refs = useRef([]);

  useEffect(() => {
    setTrees((prev) => {
      const diff = treeCount - prev.length;
      if (diff > 0) {
        const added = Array.from({ length: diff }, () => {
          const angle = Math.random() * Math.PI * 2;
          const r = 9 + Math.random();
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          return [x, 0, z];
        });
        return [...prev, ...added];
      } else {
        return prev;
      }
    });
  }, [treeCount]);

  useFrame(() => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const shouldBeVisible = i < treeCount;
      const target = shouldBeVisible ? 1 : 0;
      const s = THREE.MathUtils.lerp(mesh.scale.y, target, 0.05);
      mesh.scale.set(s, s, s);
      mesh.material.opacity = s;
    });
  });

  return (
    <>
      {trees.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={pos}
          scale={[0, 0, 0]}
        >
          <coneGeometry args={[0.5, 1.5, 8]} />
          <meshStandardMaterial color="green" transparent />
        </mesh>
      ))}
    </>
  );
}
