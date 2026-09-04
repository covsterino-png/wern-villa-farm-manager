import { useEffect, useState } from "react";
import { apiFetch, fetchJson } from "../api";

const ICON_OPTIONS = [
  { value: "💡", label: "💡 Light" },
  { value: "🔌", label: "🔌 Plug / Switch" },
  { value: "💧", label: "💧 Water / Pump" },
  { value: "🚪", label: "🚪 Gate / Door" },
  { value: "🌾", label: "🌾 Silo / Feed" },
  { value: "📹", label: "📹 Camera" },
];

const DOMAIN_ICON = { light: "💡", switch: "🔌", camera: "📹" };

export default function OutbuildingDetail({ unit, onBack }) {
  const [devices, setDevices] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💡");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [location, setLocation] = useState(unit?.bays?.[0] || unit?.label || "");
  const [haEntityId, setHaEntityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [haConfigured, setHaConfigured] = useState(false);
  const [haEntities, setHaEntities] = useState([]);

  function loadDevices() {
    fetchJson("/ai/config")
      .then((data) => setDevices(Array.isArray(data.devices) ? data.devices : []))
      .catch(console.error);
  }

  useEffect(() => {
    loadDevices();
    fetchJson("/home-assistant/status")
      .then((data) => setHaConfigured(Boolean(data.configured)))
      .catch(() => setHaConfigured(false));
  }, []);

  useEffect(() => {
    if (!haConfigured) return;
    fetchJson("/home-assistant/entities")
      .then((data) => setHaEntities(Array.isArray(data.entities) ? data.entities : []))
      .catch(() => setHaEntities([]));
  }, [haConfigured]);

  if (!unit) {
    return (
      <div>
        <button onClick={onBack}>← Back</button>
        <p style={{ color: "#aaa" }}>No building selected.</p>
      </div>
    );
  }

  const bayNames = (unit.bays || [unit.label]).map((b) => b.toLowerCase());
  const buildingDevices = devices.filter((dev) =>
    bayNames.includes((dev.location || "").trim().toLowerCase())
  );
  const lights = buildingDevices.filter((dev) => dev.icon !== "📹");
  const cameras = buildingDevices.filter((dev) => dev.icon === "📹");

  async function toggleDevice(id) {
    try {
      const res = await fetchJson(`/ai/devices/${id}/toggle`, { method: "POST" });
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, state: res.state } : d))
      );
    } catch (err) {
      alert("Could not toggle device: " + err.message);
    }
  }

  async function deleteDevice(id) {
    if (!confirm("Remove this device?")) return;
    try {
      await fetchJson(`/ai/devices/${id}`, { method: "DELETE" });
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Could not delete device: " + err.message);
    }
  }

  async function linkEntity(deviceId, entityId) {
    try {
      await fetchJson(`/ai/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haEntityId: entityId || null }),
      });
      loadDevices();
    } catch (err) {
      alert("Could not link Home Assistant entity: " + err.message);
    }
  }

  function selectHaEntity(entityId) {
    setHaEntityId(entityId);
    const entity = haEntities.find((e) => e.entityId === entityId);
    if (entity) {
      if (!name.trim()) setName(entity.name);
      setIcon(DOMAIN_ICON[entity.domain] || icon);
    }
  }

  async function addDevice(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetchJson("/ai/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon, endpointUrl, location, haEntityId }),
      });
      setName("");
      setEndpointUrl("");
      setHaEntityId("");
      setShowAddDevice(false);
      loadDevices();
    } catch (err) {
      alert("Could not add device: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "#2b2b2b",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          ← Home & Yard
        </button>
        <h1 style={{ color: "#03a9f4", margin: 0 }}>🏚️ {unit.label}</h1>
      </div>

      <div
        style={{
          background: "#1f1f1f",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div>🐑 {unit.sheep ?? 0} sheep</div>
        {unit.groups?.length > 0 && (
          <div style={{ marginTop: "8px", color: "#aaa" }}>
            {unit.groups.map((group) => (
              <div key={group}>• {group}</div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: haConfigured ? "#052e1a" : "#1e293b",
          border: haConfigured ? "1px solid #10b981" : "1px solid #334155",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "16px",
          fontSize: "0.85rem",
          color: haConfigured ? "#6ee7b7" : "#94a3b8",
        }}
      >
        {haConfigured
          ? "🏡 Home Assistant connected — pick an entity below to control real lights and cameras."
          : "🏡 Home Assistant not connected yet. Set HOMEASSISTANT_URL and HOMEASSISTANT_TOKEN on the backend to enable live control."}
      </div>

      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0, color: "#f8fafc" }}>💡 Lighting & Switches</h3>
          <button
            type="button"
            onClick={() => setShowAddDevice((v) => !v)}
            style={{
              background: "#334155",
              color: "#38bdf8",
              border: "1px solid #475569",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {showAddDevice ? "✖ Close" : "➕ Add Control"}
          </button>
        </div>

        {showAddDevice && (
          <form
            onSubmit={addDevice}
            style={{
              background: "#0f172a",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "14px",
              display: "grid",
              gap: "10px",
              maxWidth: "450px",
            }}
          >
            {haConfigured && (
              <select
                value={haEntityId}
                onChange={(e) => selectHaEntity(e.target.value)}
                style={{ padding: "8px" }}
              >
                <option value="">— Choose a Home Assistant entity (optional) —</option>
                {haEntities.map((entity) => (
                  <option key={entity.entityId} value={entity.entityId}>
                    {DOMAIN_ICON[entity.domain]} {entity.name} ({entity.entityId})
                  </option>
                ))}
              </select>
            )}
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Device name (e.g. Bay Light)"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <select value={icon} onChange={(e) => setIcon(e.target.value)} style={{ padding: "8px" }}>
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {unit.bays?.length > 1 ? (
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ flex: 1, padding: "8px" }}
                >
                  {unit.bays.map((bay) => (
                    <option key={bay} value={bay}>
                      {bay}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" value={location} readOnly style={{ flex: 1 }} />
              )}
            </div>
            {!haEntityId && (
              <input
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="Webhook / camera snapshot URL (used when no Home Assistant entity is linked)"
              />
            )}
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "8px",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              {saving ? "Saving..." : "Save Control"}
            </button>
          </form>
        )}

        {lights.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No lighting or switches added for this building yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "10px",
            }}
          >
            {lights.map((dev) => (
              <div
                key={dev.id}
                style={{
                  background: dev.state === "on" ? "#0284c7" : "#0f172a",
                  border: dev.state === "on" ? "2px solid #38bdf8" : "1px solid #334155",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "1.4rem" }}>{dev.icon || "💡"}</span>
                  <button
                    type="button"
                    onClick={() => deleteDevice(dev.id)}
                    style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
                <strong style={{ fontSize: "0.85rem" }}>{dev.name}</strong>
                {dev.haEntityId && (
                  <span style={{ fontSize: "0.7rem", color: "#6ee7b7" }}>🏡 {dev.haEntityId}</span>
                )}
                <button
                  type="button"
                  onClick={() => toggleDevice(dev.id)}
                  style={{
                    background: dev.state === "on" ? "#10b981" : "#475569",
                    color: "white",
                    border: "none",
                    padding: "8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {dev.state === "on" ? "🟢 ON" : "⚪ OFF"}
                </button>
                {haConfigured && (
                  <select
                    value={dev.haEntityId || ""}
                    onChange={(e) => linkEntity(dev.id, e.target.value)}
                    style={{ fontSize: "0.7rem", padding: "4px" }}
                  >
                    <option value="">Not linked to Home Assistant</option>
                    {haEntities
                      .filter((entity) => entity.domain !== "camera")
                      .map((entity) => (
                        <option key={entity.entityId} value={entity.entityId}>
                          {entity.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "14px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#f8fafc" }}>📹 Cameras</h3>

        {cameras.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No cameras added yet. Use "➕ Add Control" above with the 📹 Camera icon,
            then link it to a Home Assistant camera entity or a snapshot URL.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "10px",
            }}
          >
            {cameras.map((dev) => (
              <div
                key={dev.id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>📹 {dev.name}</strong>
                  <button
                    type="button"
                    onClick={() => deleteDevice(dev.id)}
                    style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
                <CameraPreview device={dev} />
                {haConfigured && (
                  <select
                    value={dev.haEntityId || ""}
                    onChange={(e) => linkEntity(dev.id, e.target.value)}
                    style={{ fontSize: "0.7rem", padding: "4px", marginTop: "6px", width: "100%" }}
                  >
                    <option value="">Not linked to Home Assistant</option>
                    {haEntities
                      .filter((entity) => entity.domain === "camera")
                      .map((entity) => (
                        <option key={entity.entityId} value={entity.entityId}>
                          {entity.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "12px" }}>
          🏡 Link a device to a Home Assistant entity above for live lighting
          control and camera snapshots straight from Home Assistant.
        </p>
      </div>
    </div>
  );
}

function CameraPreview({ device }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!device.haEntityId) return undefined;
    let currentUrl = null;
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const res = await apiFetch(`/ai/devices/${device.id}/camera-snapshot`);
        if (!res.ok) throw new Error(`Snapshot failed (${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = url;
        setImgUrl(url);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadSnapshot();
    const interval = setInterval(loadSnapshot, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [device.haEntityId, device.id]);

  if (device.haEntityId) {
    if (error) return <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</span>;
    if (!imgUrl) return <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Loading snapshot...</span>;
    return <img src={imgUrl} alt={device.name} style={{ width: "100%", borderRadius: "8px" }} />;
  }

  if (device.endpointUrl) {
    return <img src={device.endpointUrl} alt={device.name} style={{ width: "100%", borderRadius: "8px" }} />;
  }

  return <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>No snapshot source set yet.</span>;
}
