// src/App.jsx
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
  const [projection, setProjection] = useState(null);
  const [currentYear, setCurrentYear] = useState("2025");
  const [isPaused, setIsPaused] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentData = projection?.[currentYear] || null;

  const defaultData = {
    carbonScore: 50,
    trees: 0,
    lake: { color: "#1E90FF", clarity: 1.0 },
    animals: { fish: 100, deer: 100, fox: 100, bird: 100 },
  };

  const displayData = currentData || defaultData;

  const initialTrees = 100;
  const treePercentage = displayData.trees || 0;
  const treeCount = Math.round((treePercentage / 100) * initialTrees);

  useEffect(() => {
    const savedUser = localStorage.getItem("carbonscapeUser");
    if (savedUser) {
      const { user_id } = JSON.parse(savedUser);

      fetch(`http://127.0.0.1:8000/projections/${user_id}`)
        .then((res) => {
          if (!res.ok) throw new Error("No projection found");
          return res.json();
        })
        .then((data) => {
          if (data && data.projection) {
            const normalized = {};
            Object.keys(data.projection).forEach((year) => {
              const snapshot = data.projection[year];
              normalized[year] = {
                ...snapshot,
                trees: 100 - (snapshot.trees || 0), // flip
              };
            });
            setProjection(normalized);
            localStorage.setItem(
              "carbonscapeProjection",
              JSON.stringify(normalized)
            );
          } else {
            setProjection(sampleProjection.projection);
          }
        })
        .catch(() => {
          const savedProj = localStorage.getItem("carbonscapeProjection");
          if (savedProj) {
            setProjection(JSON.parse(savedProj));
          } else {
            setProjection(sampleProjection.projection);
          }
        })
        .finally(() => setIsInitialLoad(false));
    } else {
      setProjection(sampleProjection.projection);
      setIsInitialLoad(false);
    }
  }, []);

  const getSkyColor = (score) => {
    if (score > 80) return "#35a4ee";
    if (score > 75) return "#5DADE2";
    if (score > 40) return "#4682B4";
    if (score > 20) return "#3c6767";
    return "#255858";
  };

  const safeData = {
    carbonScore: displayData?.carbonScore || 50,
    trees: displayData?.trees || 0,
    lake: {
      color: displayData?.lake?.color || "#1E90FF",
      clarity: displayData?.lake?.clarity || 1.0,
    },
    animals: {
      fish: displayData?.animals?.fish || 100,
      deer: displayData?.animals?.deer || 100,
      fox: displayData?.animals?.fox || 100,
      bird: displayData?.animals?.bird || 100,
    },
  };

  return (
    <>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <color attach="background" args={[getSkyColor(safeData.carbonScore)]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <Base treeHealth={treePercentage} />
        <Forest treeCount={treeCount} />
        <Lake lakeColor={safeData.lake.color} clarity={safeData.lake.clarity} />
        <Fish
          isPaused={isPaused}
          health={Math.max(0.1, safeData.animals.fish)}
        />
        <Fish2
          isPaused={isPaused}
          health={Math.max(0.1, safeData.animals.fish)}
        />
        <Deer
          isPaused={isPaused}
          health={Math.max(0.1, safeData.animals.deer)}
        />
        <Fox isPaused={isPaused} health={Math.max(0.1, safeData.animals.fox)} />
        <Bird
          isPaused={isPaused}
          health={Math.max(0.1, safeData.animals.bird)}
        />
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

      {isInitialLoad && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            fontSize: "18px",
            zIndex: 1000,
          }}
        >
          Loading projection data...
        </div>
      )}

      <Sidebar currentYear={currentYear} setProjection={setProjection} />
      <Controls
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        years={Object.keys(projection || {})}
      />

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
        }}
      >
        {isPaused ? <FaPlay /> : <FaPause />}
      </button>
    </>
  );
}
