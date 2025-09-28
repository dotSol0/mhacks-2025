// src/components/HazardModal.jsx
import { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const ITEM_OPTIONS = [
  { key: "car", label: "Car" },
  { key: "motorbike", label: "Motorbike" },
  { key: "air_travel_km", label: "Air Travel (km/year)" },
  { key: "refrigerator", label: "Refrigerator" },
  { key: "ac", label: "Air Conditioner" },
  { key: "washing_machine", label: "Washing Machine" },
  { key: "clothes_dryer", label: "Clothes Dryer" },
  { key: "stove", label: "Stove" },
  { key: "water_heater", label: "Water Heater" },
  { key: "electricity_kwh", label: "Electricity (kWh/year)" },
  { key: "natural_gas_therms", label: "Natural Gas (therms/year)" },
  { key: "meat_diet", label: "Meat Diet" },
  { key: "clothing", label: "Clothing" },
  { key: "electronics", label: "Electronics" },
  { key: "trees", label: "Trees Planted" },
];

export default function HazardModal({ isOpen, onClose, setProjection }) {
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [userItems, setUserItems] = useState({});
  const [selectedItem, setSelectedItem] = useState("");
  const [newCount, setNewCount] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("carbonscapeUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserId(parsed.user_id);

      fetch(`http://127.0.0.1:8000/items/${parsed.user_id}`)
        .then((res) => res.json())
        .then((data) => setUserItems(data.items || {}))
        .catch(() => setUserItems({}));
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setUserId(data.user_id);
        localStorage.setItem("carbonscapeUser", JSON.stringify(data));
        fetch(`http://127.0.0.1:8000/items/${data.user_id}`)
          .then((r) => r.json())
          .then((d) => setUserItems(d.items || {}));
        setError("");
      } else {
        setError(data.detail || "Login failed.");
      }
    } catch {
      setError("Server not reachable.");
    }
  };

  const handleSignup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setUserId(data.user_id);
        localStorage.setItem("carbonscapeUser", JSON.stringify(data));
        setError("");
      } else {
        setError(data.detail || "Signup failed.");
      }
    } catch {
      setError("Server not reachable.");
    }
  };

  const handlePredict = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/projection/${userId}`);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(
          "carbonscapeProjection",
          JSON.stringify(data.projection)
        );
        setProjection(data.projection);
        onClose();
      }
    } catch {
      setError("Prediction failed");
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem || !newCount) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/items/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: { [selectedItem]: parseFloat(newCount) },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserItems(data.items);
        if (data.projection) {
          setProjection(data.projection);
          localStorage.setItem(
            "carbonscapeProjection",
            JSON.stringify(data.projection)
          );
        }
        setSelectedItem("");
        setNewCount("");
      }
    } catch {
      setError("Add failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("carbonscapeUser");
    localStorage.removeItem("carbonscapeProjection");
    setUserId(null);
    setUserItems({});
    setProjection(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          width: "40%",
          height: "60%",
          margin: "auto",
          background: "#013220",
          borderRadius: "16px",
          padding: "30px",
          color: "#2E8B57",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "18px",
          border: "2px solid #2E8B57",
        },
        overlay: { backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000 },
      }}
    >
      <h2 style={{ color: "#2E8B57", fontSize: "28px", marginBottom: "20px" }}>
        Manage Your Items
      </h2>

      {!userId ? (
        <>
          <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>
            Login / Sign Up
          </h3>
          <input
            type="text"
            placeholder="Enter name (for signup)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #2E8B57",
              background: "#013220",
              color: "#2E8B57",
            }}
          />
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #2E8B57",
              background: "#013220",
              color: "#2E8B57",
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleLogin}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: "#2E8B57",
                color: "#013220",
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              onClick={handleSignup}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: "#2E8B57",
                color: "#013220",
                cursor: "pointer",
              }}
            >
              Sign Up
            </button>
          </div>
          {error && <p style={{ marginTop: "12px" }}>{error}</p>}
        </>
      ) : (
        <>
          {Object.keys(userItems).length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px" }}>
              {Object.entries(userItems).map(([item, count]) => (
                <li
                  key={item}
                  style={{ marginBottom: "10px", fontSize: "18px" }}
                >
                  {count} × {item}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items found.</p>
          )}

          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>
              ➕ Add Item
            </h3>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #2E8B57",
                background: "#013220",
                color: "#2E8B57",
              }}
            >
              <option value="">-- Select Item --</option>
              {ITEM_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Count"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
              style={{
                marginLeft: "10px",
                width: "100px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #2E8B57",
                background: "#013220",
                color: "#2E8B57",
              }}
            />
            <button
              onClick={handleAddItem}
              style={{
                marginLeft: "12px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "none",
                background: "#2E8B57",
                color: "#013220",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>

          <div style={{ marginTop: "auto", display: "flex", gap: "12px" }}>
            <button
              onClick={handlePredict}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: "#2E8B57",
                color: "#013220",
              }}
            >
              Predict
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #2E8B57",
                background: "transparent",
                color: "#2E8B57",
              }}
            >
              Logout
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #2E8B57",
                background: "transparent",
                color: "#2E8B57",
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
