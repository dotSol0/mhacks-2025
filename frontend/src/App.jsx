// App.jsx
import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Base from "./components/Base";
import Forest from "./components/Forest";
import Deer from "./components/Deer";
import Fox from "./components/Fox";
import Lake from "./components/Lake";
import Fish from "./components/Fish";
import Fish2 from "./components/Fish2";
import Bird from "./components/Bird";
import Clouds from "./components/Clouds";
import Sidebar from "./components/Sidebar";
import Controls from "./components/Controls";
import { FaPlay, FaPause } from "react-icons/fa";
import sampleProjection from "../public/sampleProjection.json";

export default function App() {
  const [emissionLevel, setEmissionLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentYear, setCurrentYear] = useState("2025");
  const currentData = sampleProjection.projection[currentYear];
  const initialTrees = 100;
  const reduction = currentData.trees;
  const treePercentage = 100 - reduction;
  const treeCount = Math.round((treePercentage / 100) * initialTrees);

  const getSkyColor = (score) => {
    if (score > 80) return "blue";
    if (score > 60) return "#5DADE2";
    if (score > 40) return "#4682B4";
    if (score > 20) return "#3c6767";
    return "#255858";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEmissionLevel((prev) => (prev >= 1 ? 0 : prev + 0.01));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <color
          attach="background"
          args={[getSkyColor(currentData.carbonScore)]}
        />

        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <Base treeHealth={treePercentage} />
        <Forest treeCount={treeCount} />
        <Lake
          lakeColor={currentData.lake.color}
          clarity={currentData.lake.clarity}
        />
        <Fish isPaused={isPaused} health={currentData.animals.fish} />
        <Fish2 isPaused={isPaused} health={currentData.animals.fish} />
        <Deer isPaused={isPaused} health={currentData.animals.deer} />
        <Fox isPaused={isPaused} health={currentData.animals.fox} />
        <Bird isPaused={isPaused} health={currentData.animals.bird} />
        <Clouds />

        <OrbitControls
          target={[0, 0, 0]}
          enableRotate={false}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={0.9}
          maxPolarAngle={1.2}
          enablePan={false}
        />
      </Canvas>
      <h1
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          margin: 0,
          fontSize: "60px",
          fontWeight: "700",
          fontFamily: "'Montserrat', sans-serif",
          display: "flex",
          gap: "4px",
        }}
      >
        <span style={{ color: "#013220" }}>Carbon</span>
        <span style={{ color: "#2E8B57" }}>Scape</span>
      </h1>
      <Sidebar currentYear={currentYear} />
      <Controls currentYear={currentYear} setCurrentYear={setCurrentYear} />

      <button
        onClick={() => setIsPaused((p) => !p)}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          padding: "12px",
          borderRadius: "50%",
          border: "none",
          background: "#013220",
          color: "#2E8B57",
          fontSize: "20px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          transition: "background 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPaused ? <FaPlay /> : <FaPause />}
      </button>
    </>
  );
}
