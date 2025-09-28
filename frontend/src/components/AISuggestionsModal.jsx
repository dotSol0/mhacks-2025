// src/components/AISuggestionsModal.jsx
import { useState } from "react";
import Modal from "react-modal";
import { FaLightbulb, FaSpinner } from "react-icons/fa";

Modal.setAppElement("#root");

export default function AISuggestionsModal({
  isOpen,
  onClose,
  currentYear,
  userId,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [alertMsg, setAlertMsg] = useState(""); // floating alert state

  const fetchSuggestions = async () => {
    if (!currentYear || !userId) return;
    setLoading(true);
    setAlertMsg("");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ai_suggestions/${userId}?year=${currentYear}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data.suggestions || data.suggestions.length === 0) {
        setAlertMsg("No AI suggestions returned. Try again later.");
      }
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setAlertMsg("❌ Failed to fetch AI suggestions. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const takeAction = async (impact, actionType = "ai_suggestion") => {
    setActionLoading(JSON.stringify(impact));
    setAlertMsg("");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/take_action/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: parseInt(currentYear),
            action_type: actionType,
            impact,
          }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log("Take action result:", data);
      setAlertMsg("✅ Action successfully applied!");
    } catch (err) {
      console.error("Error taking action:", err);
      setAlertMsg("❌ Failed to take action. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
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

        {/* Suggest Actions Button (always visible) */}
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          style={{
            background: "#2E8B57",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            color: "white",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "16px",
          }}
        >
          {loading ? <FaSpinner className="spin" /> : "Suggest Actions"}
        </button>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {suggestions.map((s, i) => (
              <li
                key={i}
                style={{
                  background: "#2E8B57",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  fontSize: "15px",
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{s.suggestion}</span>
                <button
                  onClick={() => takeAction(s.impact)}
                  disabled={actionLoading === JSON.stringify(s.impact)}
                  style={{
                    marginLeft: "12px",
                    background: "transparent",
                    border: "1px solid white",
                    color: "white",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {actionLoading === JSON.stringify(s.impact) ? (
                    <FaSpinner className="spin" />
                  ) : (
                    "Take Action"
                  )}
                </button>
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

        {/* Spinner animation CSS */}
        <style>
          {`
            .spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </Modal>

      {/* Floating Alert (Bottom Left) */}
      {alertMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            background: "#e74c3c", // bright red so you see it
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            zIndex: 2000,
            maxWidth: "250px",
          }}
        >
          {alertMsg}
        </div>
      )}
    </>
  );
}
