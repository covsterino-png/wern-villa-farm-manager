import { useState } from "react";

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#03a9f4" : "#2b2b2b",
        color: "white",
        border: "none",
        padding: "10px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: active ? "bold" : "normal",
      }}
    >
      {label}
    </button>
  );
}

export default function SheepDetail({ sheep, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!sheep) {
    return (
      <div style={{ padding: "20px", color: "white" }}>
        <button
          onClick={onBack}
          style={{
            background: "#03a9f4",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <h2 style={{ marginTop: "20px" }}>Sheep details unavailable</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <button
        onClick={onBack}
        style={{
          background: "#03a9f4",
          color: "white",
          border: "none",
          padding: "12px 18px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Back
      </button>

      <h1 style={{ color: "#03a9f4", marginBottom: "8px" }}>
        🐑 {sheep.name}
      </h1>

      <div style={{ color: "#aaa", marginBottom: "24px" }}>
        {sheep.sex || "Unknown"} • {sheep.groupName || "No group"}
        <br />
        Field: {sheep.currentField || "Unknown"}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          label="Notes"
          active={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
        />
      </div>

      {activeTab === "overview" && (
        <div style={{ background: "#1f1f1f", padding: "20px", borderRadius: "14px" }}>
          <h2 style={{ marginTop: 0, color: "#fff" }}>Overview</h2>
          <p><strong>EID:</strong> {sheep.eid || "N/A"}</p>
          <p><strong>Date of birth:</strong> {sheep.dob || "N/A"}</p>
          <p><strong>Status:</strong> {sheep.status || "Unknown"}</p>
        </div>
      )}

      {activeTab === "notes" && (
        <div style={{ background: "#1f1f1f", padding: "20px", borderRadius: "14px" }}>
          <h2 style={{ marginTop: 0, color: "#fff" }}>Notes</h2>
          <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
            {sheep.notes || "No notes available."}
          </p>
        </div>
      )}
    </div>
  );
}
