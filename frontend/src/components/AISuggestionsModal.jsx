import { useState, useEffect } from "react";
import Modal from "react-modal";
import { FaLightbulb } from "react-icons/fa";
import sampleProjection from "../../public/sampleProjection.json";

Modal.setAppElement("#root");

export default function AISuggestionsModal({ isOpen, onClose, currentYear }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isOpen && currentYear) {
      const yearData = sampleProjection.projection[currentYear];
      setSuggestions(yearData?.suggestions || []);
    }
  }, [isOpen, currentYear]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          maxWidth: "500px",
          margin: "auto",
          background: "#013220",
          borderRadius: "10px",
          padding: "20px",
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        },
      }}
    >
      <h2 style={{ color: "#2E8B57", marginBottom: "16px" }}>
        <FaLightbulb style={{ marginRight: "8px" }} />
        AI Suggestions – {currentYear}
      </h2>

      {suggestions.length === 0 ? (
        <p>No suggestions available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              style={{
                background: "#2E8B57",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "8px",
                fontSize: "15px",
                color: "white",
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onClose}
        style={{
          marginTop: "20px",
          background: "transparent",
          border: "1px solid #2E8B57",
          color: "#2E8B57",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </Modal>
  );
}
