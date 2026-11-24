import { useState } from "react";
import {
  readDashboardLayout,
  saveDashboardLayout,
} from "../dashboardLayout";

const selectStyle = {
  padding: "8px",
  borderRadius: "8px",
  background: "var(--settings-surface)",
  color: "var(--app-content-text)",
  border: "1px solid #475569",
};

export default function HomeScreenLayoutSettings({ user }) {
  const [layout, setLayout] = useState(() => readDashboardLayout(user));
  const [saveError, setSaveError] = useState("");

  function updateColumnCount(field, value) {
    try {
      const saved = saveDashboardLayout(user, {
        ...layout,
        [field]: Number(value),
      });
      setLayout(saved);
      setSaveError("");
    } catch (error) {
      console.error("Could not save home screen layout:", error);
      setSaveError("Could not save this layout on this device.");
    }
  }

  return (
    <section
      style={{
        background: "var(--settings-surface)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ color: "#03a9f4", marginTop: 0 }}>🏠 Home screen layout</h2>
      <p className="settings-help">
        Choose how many dashboard tiles appear in each row. These settings are
        saved for {user} on this device.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <label style={{ display: "grid", gap: "6px" }}>
          Phone columns
          <select
            aria-label="Phone dashboard columns"
            style={selectStyle}
            value={layout.mobileColumns}
            onChange={(event) =>
              updateColumnCount("mobileColumns", event.target.value)
            }
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "tile" : "tiles"} per row
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          Desktop columns
          <select
            aria-label="Desktop dashboard columns"
            style={selectStyle}
            value={layout.desktopColumns}
            onChange={(event) =>
              updateColumnCount("desktopColumns", event.target.value)
            }
          >
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count} tiles per row
              </option>
            ))}
          </select>
        </label>
      </div>
      {saveError && (
        <p role="alert" style={{ color: "#ef4444", marginBottom: 0 }}>
          {saveError}
        </p>
      )}
    </section>
  );
}
