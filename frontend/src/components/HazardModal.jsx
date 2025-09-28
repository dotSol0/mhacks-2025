import { useState, useEffect } from "react";
import Modal from "react-modal";
import { FaCar, FaSnowflake, FaWind, FaBicycle, FaTv } from "react-icons/fa";
import sampleProjection from "../../public/sampleProjection.json";

Modal.setAppElement("#root");

export default function HazardModal({ isOpen, onClose }) {
  const [userItems, setUserItems] = useState({});

  useEffect(() => {
    if (isOpen) {
      setUserItems(sampleProjection.userItems);
    }
  }, [isOpen]);

  const itemIcons = {
    car: <FaCar color="#2E8B57" />,
    refrigerator: <FaSnowflake color="#2E8B57" />,
    ac: <FaWind color="#2E8B57" />,
    bike: <FaBicycle color="#2E8B57" />,
    tv: <FaTv color="#2E8B57" />,
  };

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
      <h2 style={{ color: "#2E8B57", marginBottom: "16px" }}>Your Items</h2>

      {Object.keys(userItems).length === 0 ? (
        <p>No items found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(userItems).map(([item, count], idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
                fontSize: "16px",
              }}
            >
              {itemIcons[item] || "📦"} {count} × {item}
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
