// src/components/HeartModal.jsx
import React from "react";

export default function HeartModal({ isOpen, currentYear, projection }) {
  if (!isOpen) return null;

  const currentData = projection?.[currentYear] || null;
  console.log(currentData);
  const animals = currentData?.animals || {};

  const getBarColor = (value) => {
    if (value > 0.7) return "#2E8B57";
    if (value > 0.3) return "#2E8B57";
    return "#2E8B57";
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "48px",
        right: "20px",
        width: "260px",
        background: "#013220",
        borderRadius: "12px",
        padding: "16px",
        color: "#2E8B57",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          textAlign: "center",
          color: "#2E8B57",
          fontSize: "18px",
        }}
      >
        Animal Health - {currentYear}
      </h3>

      {Object.keys(animals).length === 0 ? (
        <p style={{ color: "#2E8B57", textAlign: "center" }}>
          No data available.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(animals).map(([animal, health]) => (
            <li key={animal} style={{ marginBottom: "12px" }}>
              <span
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  textTransform: "capitalize",
                  color: "#2E8B57",
                }}
              >
                {animal}
              </span>
              <div
                style={{
                  background: "#013220",
                  borderRadius: "6px",
                  height: "10px",
                  width: "100%",
                  border: "1px solid #2E8B57",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(health || 0) * 100}%`,
                    background: getBarColor(health || 0),
                    borderRadius: "6px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
