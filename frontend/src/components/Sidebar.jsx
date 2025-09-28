// src/components/Sidebar.jsx
import { FaExclamationTriangle, FaRobot, FaHeart } from "react-icons/fa";
import { useState } from "react";
import HazardModal from "./HazardModal";
import AISuggestionsModal from "./AISuggestionsModal";
import HeartModal from "./HeartModal";

export default function Sidebar({ currentYear }) {
  const [isHazardOpen, setHazardOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAISuggestionsOpen, setAISuggestionsOpen] = useState(false);
  const [isHeartOpen, setHeartOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#013220",
          borderRadius: "12px",
          padding: "10px 20px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <FaExclamationTriangle
          size={28}
          color="#2E8B57"
          cursor="pointer"
          onClick={() => setHazardOpen(true)}
        />

        <FaRobot
          size={28}
          color="#2E8B57"
          cursor="pointer"
          onClick={() => setAISuggestionsOpen(true)}
        />

        <FaHeart
          size={28}
          color="#2E8B57"
          cursor="pointer"
          onClick={() => setHeartOpen((prev) => !prev)}
        />
      </div>
      <HazardModal
        isOpen={isHazardOpen}
        onClose={() => setHazardOpen(false)}
        userData={userData}
        setUserData={setUserData}
      />
      <AISuggestionsModal
        isOpen={isAISuggestionsOpen}
        onClose={() => setAISuggestionsOpen(false)}
        currentYear={currentYear}
      />
      <HeartModal
        isOpen={isHeartOpen}
        onClose={() => setHeartOpen(false)}
        currentYear={currentYear}
      />
    </>
  );
}
