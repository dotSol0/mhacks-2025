// src/components/Controls.jsx
import { useEffect } from "react";

// src/components/Controls.jsx
export default function Controls({ currentYear, setCurrentYear, years }) {
  const currentIndex = years.indexOf(currentYear);

  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          padding: "10px",
          borderRadius: "5px",
          background: "#013220",
          color: "#2E8B57",
          fontWeight: "bold",
          fontSize: "28px",
        }}
      >
        Year: {currentYear}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "#013220",
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {years.map((year, i) => (
            <div
              key={i}
              onClick={() => setCurrentYear(year)}
              style={{
                width: "50px",
                height: "10px",
                background: i <= currentIndex ? "#fae902ff" : "#2E8B57",
                borderRadius: "4px",
                transition: "background 0.3s",
                cursor: "pointer",
              }}
              title={year}
            />
          ))}
        </div>
      </div>
    </>
  );
}
