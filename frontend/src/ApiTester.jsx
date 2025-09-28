import { useState } from "react";

const API_BASE = "http://localhost:8000";

export default function ApiTester() {
  const [response, setResponse] = useState(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("tssanjai98@gmail.com");
  const [name, setName] = useState("Sanjai");

  const callApi = async (endpoint, method = "GET", body = null) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
      });
      const data = await res.json();
      setResponse(data);

      // auto set userId if returned
      if (data.user_id) setUserId(data.user_id);
    } catch (err) {
      setResponse({ error: err.message });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>API Tester</h2>
      <p>Current User ID: {userId || "none"}</p>

      {/* Login / Signup */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="Name (for signup)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "8px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: "8px" }}
        />
        <button onClick={() => callApi("/login", "POST", { email })}>
          Login
        </button>
        <button onClick={() => callApi("/signup", "POST", { name, email })}>
          Signup
        </button>
      </div>

      {/* Items */}
      <div style={{ marginBottom: "12px" }}>
        <button onClick={() => callApi(`/items/${userId}`)}>Get Items</button>
        <button
          onClick={() =>
            callApi(`/items/${userId}`, "PATCH", { items: { car: 1 } })
          }
        >
          Add Car
        </button>
        <button
          onClick={() =>
            callApi(`/items/${userId}`, "PUT", { items: { car: 5, ac: 1 } })
          }
        >
          Update Items
        </button>
      </div>

      {/* Projection */}
      <div style={{ marginBottom: "12px" }}>
        <button onClick={() => callApi(`/projection/${userId}`)}>
          Generate Projection
        </button>
        <button onClick={() => callApi(`/projections/${userId}`)}>
          Get Saved Projection
        </button>
      </div>

      {/* AI Suggestions */}
      <div style={{ marginBottom: "12px" }}>
        <button onClick={() => callApi(`/ai_suggestions/${userId}?year=2025`)}>
          Get AI Suggestions (2025)
        </button>
        <button
          onClick={() =>
            callApi(`/take_action/${userId}`, "POST", {
              year: 2025,
              action_type: "reduce_ac",
              impact: { ac: -0.2 },
            })
          }
        >
          Take Action (reduce AC)
        </button>
      </div>

      {/* Response viewer */}
      <h3>Response:</h3>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {response ? JSON.stringify(response, null, 2) : "No response yet"}
      </pre>
    </div>
  );
}
