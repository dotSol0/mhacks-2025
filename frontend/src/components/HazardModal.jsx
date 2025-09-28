// src/components/HazardModal.jsx
import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("carbonscapeUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserId(parsed.user_id);

      axios
        .get(`http://localhost:8000/items/${parsed.user_id}`)
        .then((res) => setUserItems(res.data.items || {}))
        .catch(() => setUserItems({}));
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/login", { email });
      if (res.data.status === "ok") {
        setUserId(res.data.user_id);
        localStorage.setItem("carbonscapeUser", JSON.stringify(res.data));
        const itemsRes = await axios.get(
          `http://localhost:8000/items/${res.data.user_id}`
        );
        setUserItems(itemsRes.data.items || {});
        setError("");
      } else {
        setError(res.data.detail || "Login failed.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Server not reachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/signup", {
        name,
        email,
      });
      if (res.data.status === "ok") {
        setUserId(res.data.user_id);
        localStorage.setItem("carbonscapeUser", JSON.stringify(res.data));
        setError("");
      } else {
        setError(res.data.detail || "Signup failed.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Server not reachable.");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/projection/${userId}`);
      localStorage.setItem(
        "carbonscapeProjection",
        JSON.stringify(res.data.projection)
      );
      setProjection(res.data.projection);
      onClose();
    } catch {
      setError("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem || !newCount) return;
    setLoading(true);
    try {
      const res = await axios.patch(`http://localhost:8000/items/${userId}`, {
        items: { [selectedItem]: parseFloat(newCount) },
      });
      setUserItems(res.data.items);
      if (res.data.projection) {
        setProjection(res.data.projection);
        localStorage.setItem(
          "carbonscapeProjection",
          JSON.stringify(res.data.projection)
        );
      }
      setSelectedItem("");
      setNewCount("");
    } catch {
      setError("Add failed");
    } finally {
      setLoading(false);
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
          width: "420px",
          maxHeight: "70%",
          margin: "auto",
          background: "#013220",
          borderRadius: "16px",
          padding: "24px",
          color: "#2E8B57",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "16px",
          border: "2px solid #2E8B57",
          overflow: "auto",
        },
        overlay: { backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000 },
      }}
    >
      <h2
        style={{
          color: "#2E8B57",
          fontSize: "26px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        {userId ? "Your Items" : "Login / Signup"}
      </h2>

      {!userId ? (
        <>
          <input
            type="text"
            placeholder="Name (for signup)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={handleLogin} style={btnPrimary} disabled={loading}>
              {loading ? "..." : "Login"}
            </button>
            <button
              onClick={handleSignup}
              style={btnPrimary}
              disabled={loading}
            >
              {loading ? "..." : "Sign Up"}
            </button>
          </div>
        </>
      ) : (
        <>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginBottom: "16px",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            {Object.entries(userItems).map(([item, count]) => (
              <li key={item} style={{ marginBottom: "8px" }}>
                {count} × {item}
              </li>
            ))}
          </ul>

          <div style={{ marginBottom: "16px" }}>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              style={inputStyle}
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
              style={{ ...inputStyle, marginTop: "8px" }}
            />
            <button
              onClick={handleAddItem}
              style={{ ...btnPrimary, width: "100%", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "..." : "Add Item"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handlePredict}
              style={btnPrimary}
              disabled={loading}
            >
              {loading ? "..." : "Predict"}
            </button>
            <button onClick={handleLogout} style={btnSecondary}>
              Logout
            </button>
            <button onClick={onClose} style={btnSecondary}>
              Close
            </button>
          </div>
        </>
      )}

      {error && (
        <p style={{ marginTop: "12px", color: "#e74c3c", textAlign: "center" }}>
          {error}
        </p>
      )}
    </Modal>
  );
}

// shared styles
const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #2E8B57",
  background: "#013220",
  color: "#2E8B57",
  marginBottom: "8px",
};

const btnPrimary = {
  flex: 1,
  padding: "10px",
  borderRadius: "6px",
  border: "none",
  background: "#2E8B57",
  color: "#013220",
  cursor: "pointer",
};

const btnSecondary = {
  flex: 1,
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #2E8B57",
  background: "transparent",
  color: "#2E8B57",
  cursor: "pointer",
};
