import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, fetchJson } from "../api";

const DEVICE_ON_COLOR = "#4caf50";
const DEVICE_OFF_COLOR = "#616161";
const DOMAIN_ICON = { light: "\uD83D\uDCA1", switch: "\uD83D\uDD0C", camera: "\uD83D\uDCF9" };
const ICON_OPTIONS = [
  { value: "\uD83D\uDCA1", label: "\uD83D\uDCA1 Light" },
  { value: "\uD83D\uDD0C", label: "\uD83D\uDD0C Plug / Switch" },
  { value: "\uD83D\uDCA7", label: "\uD83D\uDCA7 Water / Pump" },
  { value: "\uD83D\uDEAA", label: "\uD83D\uDEAA Gate / Door" },
  { value: "\uD83D\uDCF9", label: "\uD83D\uDCF9 Camera" },
];

export default function FloorPlan({ user }) {
  const [floorplans, setFloorplans] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [pins, setPins] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [placingDeviceId, setPlacingDeviceId] = useState("");
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [draggingPinId, setDraggingPinId] = useState(null);
  const imageRef = useRef(null);

  const [haConfigured, setHaConfigured] = useState(false);
  const [haEntities, setHaEntities] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIcon, setDeviceIcon] = useState("\uD83D\uDCA1");
  const [deviceLocation, setDeviceLocation] = useState("House");
  const [deviceHaEntityId, setDeviceHaEntityId] = useState("");
  const [savingDevice, setSavingDevice] = useState(false);

  const isDavid = user === "David";
  const active = floorplans.find((f) => f.id === activeId) || null;

  const loadFloorplans = useCallback(() => {
    fetchJson("/floorplans")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFloorplans(list);
        if (!activeId && list.length) setActiveId(list[0].id);
      })
      .catch((err) => setError(err.message));
  }, [activeId]);

  function loadPins(id) {
    if (!id) return;
    fetchJson(`/floorplans/${id}/devices`)
      .then((data) => setPins(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }

  function loadAllDevices() {
    fetchJson("/ai/config")
      .then((data) => setAllDevices(Array.isArray(data.devices) ? data.devices : []))
      .catch(() => setAllDevices([]));
  }

  useEffect(() => {
    loadFloorplans();
    loadAllDevices();
    fetchJson("/home-assistant/status")
      .then((data) => setHaConfigured(Boolean(data.configured)))
      .catch(() => setHaConfigured(false));
  }, [loadFloorplans]);

  useEffect(() => {
    if (!haConfigured) return;
    fetchJson("/home-assistant/entities")
      .then((data) => setHaEntities(Array.isArray(data.entities) ? data.entities : []))
      .catch(() => setHaEntities([]));
  }, [haConfigured]);

  useEffect(() => {
    loadPins(activeId);
  }, [activeId]);

  function selectHaEntity(entityId) {
    setDeviceHaEntityId(entityId);
    const entity = haEntities.find((e) => e.entityId === entityId);
    if (entity) {
      if (!deviceName.trim()) setDeviceName(entity.name);
      setDeviceIcon(DOMAIN_ICON[entity.domain] || deviceIcon);
    }
  }

  async function addDevice(e) {
    e.preventDefault();
    if (!deviceName.trim()) return;
    setSavingDevice(true);
    try {
      await fetchJson("/ai/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deviceName.trim(),
          icon: deviceIcon,
          location: deviceLocation,
          haEntityId: deviceHaEntityId || null,
        }),
      });
      setDeviceName("");
      setDeviceHaEntityId("");
      setShowAddDevice(false);
      loadAllDevices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDevice(false);
    }
  }

  async function uploadFloorplan(e) {
    e.preventDefault();
    if (!newName.trim() || !newFile) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", newName.trim());
      formData.append("image", newFile);
      const res = await apiFetch("/floorplans", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      setNewName("");
      setNewFile(null);
      loadFloorplans();
      if (data.id) setActiveId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteFloorplan(id) {
    if (!confirm("Delete this floorplan and its device placements?")) return;
    try {
      await fetchJson(`/floorplans/${id}`, { method: "DELETE" });
      setFloorplans((prev) => prev.filter((f) => f.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setPins([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleImageClick(e) {
    if (!placingDeviceId || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    placeDevice(placingDeviceId, xPct, yPct);
  }

  async function placeDevice(deviceId, xPct, yPct) {
    try {
      await fetchJson(`/floorplans/${activeId}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, xPct, yPct }),
      });
      setPlacingDeviceId("");
      loadPins(activeId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function movePin(pinId, xPct, yPct) {
    setPins((prev) => prev.map((p) => (p.pinId === pinId ? { ...p, xPct, yPct } : p)));
    try {
      await fetchJson(`/floorplans/devices/${pinId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xPct, yPct }),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePin(pinId) {
    try {
      await fetchJson(`/floorplans/devices/${pinId}`, { method: "DELETE" });
      setPins((prev) => prev.filter((p) => p.pinId !== pinId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleDevice(deviceId) {
    try {
      const res = await fetchJson(`/ai/devices/${deviceId}/toggle`, { method: "POST" });
      setPins((prev) =>
        prev.map((p) => (p.deviceId === deviceId ? { ...p, state: res.state } : p))
      );
    } catch (err) {
      alert("Could not toggle device: " + err.message);
    }
  }

  function handlePinDragStart(pinId, e) {
    e.stopPropagation();
    setDraggingPinId(pinId);
  }

  function handleImageDragOver(e) {
    if (draggingPinId) e.preventDefault();
  }

  function handleImageDrop(e) {
    if (!draggingPinId || !imageRef.current) return;
    e.preventDefault();
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    movePin(draggingPinId, xPct, yPct);
    setDraggingPinId(null);
  }

  const unplacedDevices = allDevices.filter(
    (d) => !pins.some((p) => p.deviceId === d.id)
  );

  return (
    <div>
      <h1>🏠 Floorplan Devices</h1>
      <p style={{ color: "#aaa", maxWidth: 700 }}>
        Upload a floorplan photo or drawing, then place your smart devices on it so you can see
        and control them right from the layout of the house.
      </p>

      {error && <p style={{ color: "#f44336" }}>{error}</p>}

      {isDavid && (
        <form
          onSubmit={uploadFloorplan}
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
            background: "#1e1e1e",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Floorplan name (e.g. Ground Floor)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #444", background: "#111", color: "white" }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            style={{ color: "white" }}
          />
          <button
            type="submit"
            disabled={uploading || !newName.trim() || !newFile}
            style={{
              background: uploading || !newName.trim() || !newFile ? "#555" : "#03a9f4",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: uploading || !newName.trim() || !newFile ? "not-allowed" : "pointer",
              opacity: uploading || !newName.trim() || !newFile ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Add Floorplan"}
          </button>
          {(!newName.trim() || !newFile) && (
            <span style={{ color: "#888", fontSize: "0.8rem" }}>
              Enter a name and choose an image to enable this button
            </span>
          )}
        </form>
      )}

      {floorplans.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {floorplans.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              style={{
                background: activeId === f.id ? "#03a9f4" : "#2b2b2b",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: activeId === f.id ? "bold" : "normal",
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {!floorplans.length && (
        <p style={{ color: "#888" }}>No floorplans yet. Upload one above to get started.</p>
      )}

      {active && (
        <>
          {isDavid && (
            <div style={{ marginBottom: "10px" }}>
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
                {showAddDevice ? "✖ Close" : "➕ Add New Device"}
              </button>

              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  background: haConfigured ? "#052e1a" : "#1e293b",
                  border: haConfigured ? "1px solid #10b981" : "1px solid #334155",
                  color: haConfigured ? "#6ee7b7" : "#94a3b8",
                }}
              >
                {haConfigured
                  ? "🏡 Home Assistant connected — pick an entity below to control a real light/switch/camera."
                  : "🏡 Home Assistant not connected yet. Devices added here will be placeholders until HOMEASSISTANT_URL/TOKEN are set on the backend."}
              </div>

              {showAddDevice && (
                <form
                  onSubmit={addDevice}
                  style={{
                    background: "#0f172a",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "8px",
                    display: "grid",
                    gap: "10px",
                    maxWidth: "450px",
                  }}
                >
                  {haConfigured && (
                    <select
                      value={deviceHaEntityId}
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
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Device name (e.g. Living Room Lamp)"
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={deviceIcon}
                      onChange={(e) => setDeviceIcon(e.target.value)}
                      style={{ padding: "8px" }}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={deviceLocation}
                      onChange={(e) => setDeviceLocation(e.target.value)}
                      placeholder="Room / location"
                      style={{ flex: 1, padding: "8px" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingDevice || !deviceName.trim()}
                    style={{
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: savingDevice || !deviceName.trim() ? "not-allowed" : "pointer",
                      opacity: savingDevice || !deviceName.trim() ? 0.6 : 1,
                    }}
                  >
                    {savingDevice ? "Saving..." : "Save Device"}
                  </button>
                </form>
              )}
            </div>
          )}

          {isDavid && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#aaa" }}>Place a device:</span>
              <select
                value={placingDeviceId}
                onChange={(e) => setPlacingDeviceId(e.target.value)}
                style={{ padding: "6px", borderRadius: "6px", background: "#111", color: "white", border: "1px solid #444" }}
              >
                <option value="">-- choose device --</option>
                {unplacedDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.name}
                  </option>
                ))}
              </select>
              {placingDeviceId && (
                <span style={{ color: "#03a9f4", fontSize: "0.85rem" }}>
                  Click anywhere on the floorplan to drop it there
                </span>
              )}
              <button
                onClick={() => deleteFloorplan(active.id)}
                style={{
                  marginLeft: "auto",
                  background: "#8b1a1a",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete Floorplan
              </button>
            </div>
          )}

          <div
            style={{
              position: "relative",
              display: "inline-block",
              maxWidth: "100%",
              border: "1px solid #333",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: placingDeviceId ? "crosshair" : "default",
            }}
            onClick={handleImageClick}
            onDragOver={handleImageDragOver}
            onDrop={handleImageDrop}
          >
            <img
              ref={imageRef}
              src={active.imageUrl}
              alt={active.name}
              draggable={false}
              style={{ display: "block", maxWidth: "100%", userSelect: "none" }}
            />
            {pins.map((pin) => (
              <div
                key={pin.pinId}
                draggable={isDavid}
                onDragStart={(e) => handlePinDragStart(pin.pinId, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDevice(pin.deviceId);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isDavid) removePin(pin.pinId);
                }}
                title={`${pin.name} (${pin.state}) — click to toggle${isDavid ? ", right-click to remove" : ""}`}
                style={{
                  position: "absolute",
                  left: `${pin.xPct}%`,
                  top: `${pin.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  background: pin.state === "on" ? DEVICE_ON_COLOR : DEVICE_OFF_COLOR,
                  color: "white",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.4)",
                }}
              >
                {pin.icon || "💡"}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
