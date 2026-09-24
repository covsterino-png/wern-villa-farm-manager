import { useEffect, useState } from "react";
import { API, fetchJson } from "../api";

export default function Settings({ user, theme, onThemeChange }) {
const [fields, setFields] = useState([]);
const [newField, setNewField] = useState("");
const [fieldSize, setFieldSize] =  useState("");
const [fieldParcelNumber, setFieldParcelNumber] = useState("");
const [medicines, setMedicines] = useState([]);
const [newMedicine, setNewMedicine] = useState("");
const [doseRate, setDoseRate] =  useState("");
const [withdrawalDays,  setWithdrawalDays,] = useState("");
const [administrationMethod, setAdministrationMethod,] = useState("");
const [bottleVolumeMl, setBottleVolumeMl] = useState("");
const [bottleCost, setBottleCost] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordMessage, setPasswordMessage] = useState("");
const [resetUser, setResetUser] = useState("Gemma");
const [resetPassword, setResetPassword] = useState("");
const [confirmResetPassword, setConfirmResetPassword] = useState("");
const [resetMessage, setResetMessage] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showAppearance, setShowAppearance] = useState(true);
const [showFields, setShowFields] = useState(false);
const [showMedicines, setShowMedicines] = useState(false);
const [holdings, setHoldings] = useState([]);
const [showEidCymru, setShowEidCymru] = useState(false);
const [holdingMessage, setHoldingMessage] = useState("");
const [clickEvents, setClickEvents] = useState([]);
const [showClickLog, setShowClickLog] = useState(false);
const [clickLogMessage, setClickLogMessage] = useState("");
const [clickLogUser, setClickLogUser] = useState("Gemma");

const [showAiCustomizer, setShowAiCustomizer] = useState(false);
const [aiPrompt, setAiPrompt] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiMessage, setAiMessage] = useState("");
const [aiChatHistory, setAiChatHistory] = useState([]);
const [smartDevices, setSmartDevices] = useState([]);
const [appConfigs, setAppConfigs] = useState([]);

const [showManualDeviceForm, setShowManualDeviceForm] = useState(false);
const [manualName, setManualName] = useState("");
const [manualIcon, setManualIcon] = useState("💡");
const [manualEndpoint, setManualEndpoint] = useState("");
const [manualLocation, setManualLocation] = useState("");

const [devNotes, setDevNotes] = useState([]);
const [showDevNotes, setShowDevNotes] = useState(false);

const [showChickens, setShowChickens] = useState(false);
const [chickenCount, setChickenCount] = useState(0);
const [chickenCountInput, setChickenCountInput] = useState("0");
const [savingChickenCount, setSavingChickenCount] = useState(false);
const [chickenMessage, setChickenMessage] = useState("");

function loadChickens() {
  fetchJson("/chickens")
    .then((data) => {
      setChickenCount(Number(data?.count) || 0);
      setChickenCountInput(String(Number(data?.count) || 0));
    })
    .catch((err) => console.error("Error loading chickens:", err));
}

useEffect(() => {
  loadChickens();
}, []);

async function saveChickenCount() {
  const amount = Number(chickenCountInput);
  if (!Number.isFinite(amount) || amount < 0) {
    setChickenMessage("Enter a valid chicken count.");
    return;
  }
  setSavingChickenCount(true);
  setChickenMessage("");
  try {
    await fetchJson("/chickens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: amount }),
    });
    setChickenCount(amount);
    setChickenMessage("Saved!");
  } catch (err) {
    setChickenMessage("Could not save: " + err.message);
  } finally {
    setSavingChickenCount(false);
  }
}

function loadDevNotes() {
  fetchJson("/dev-notes")
    .then((data) => setDevNotes(Array.isArray(data) ? data : []))
    .catch((err) => console.error("Error loading dev notes:", err));
}

async function deleteDevNote(id) {
  try {
    await fetchJson(`/dev-notes/${id}`, { method: "DELETE" });
    setDevNotes((prev) => prev.filter((n) => n.id !== id));
  } catch (err) {
    alert("Could not delete note: " + err.message);
  }
}

function loadAiConfig() {
  fetchJson("/ai/config")
    .then((data) => {
      setSmartDevices(data.devices || []);
      setAppConfigs(data.config || []);
    })
    .catch((err) => console.error("Error loading AI config:", err));
}

useEffect(() => {
  loadAiConfig();
}, []);

async function sendAiCustomizerPrompt(promptText) {
  const textToSend = promptText || aiPrompt;
  if (!textToSend.trim()) return;

  setAiLoading(true);
  setAiMessage("");
  const userMsg = { role: "user", text: textToSend };
  setAiChatHistory((prev) => [...prev, userMsg]);
  if (!promptText) setAiPrompt("");

  try {
    const res = await fetchJson("/ai/customizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: textToSend }),
    });

    const aiMsg = { role: "ai", text: res.reply || "Request processed successfully." };
    setAiChatHistory((prev) => [...prev, aiMsg]);
    if (res.devices) setSmartDevices(res.devices);
    if (res.config) setAppConfigs(res.config);
  } catch (error) {
    setAiChatHistory((prev) => [
      ...prev,
      { role: "ai", text: `Error: ${error.message}` },
    ]);
  } finally {
    setAiLoading(false);
  }
}

async function toggleSmartDevice(id) {
  try {
    const res = await fetchJson(`/ai/devices/${id}/toggle`, { method: "POST" });
    setSmartDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, state: res.state } : d))
    );
  } catch (err) {
    alert("Could not toggle device: " + err.message);
  }
}

async function deleteSmartDevice(id) {
  if (!confirm("Are you sure you want to remove this device?")) return;
  try {
    await fetchJson(`/ai/devices/${id}`, { method: "DELETE" });
    setSmartDevices((prev) => prev.filter((d) => d.id !== id));
  } catch (err) {
    alert("Could not delete device: " + err.message);
  }
}

async function addManualDevice(e) {
  e.preventDefault();
  if (!manualName.trim()) return;
  try {
    await fetchJson("/ai/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manualName,
        icon: manualIcon,
        endpointUrl: manualEndpoint,
        location: manualLocation,
      }),
    });
    setManualName("");
    setManualEndpoint("");
    setManualLocation("");
    setShowManualDeviceForm(false);
    loadAiConfig();
  } catch (err) {
    alert("Could not add device: " + err.message);
  }
}

async function changePassword(event) {
  event.preventDefault();
  setPasswordMessage("");
  if (newPassword !== confirmPassword) {
    setPasswordMessage("New passwords do not match");
    return;
  }
  try {
    await fetchJson("/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password changed successfully");
  } catch (error) {
    setPasswordMessage(error.message);
  }
}

async function resetAccountPassword(event) {
  event.preventDefault();
  setResetMessage("");
  if (resetPassword !== confirmResetPassword) {
    setResetMessage("New passwords do not match");
    return;
  }
  try {
    await fetchJson("/auth/admin-reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: resetUser, newPassword: resetPassword }),
    });
    setResetPassword("");
    setConfirmResetPassword("");
    setResetMessage(`${resetUser}'s password was reset`);
  } catch (error) {
    setResetMessage(error.message);
  }
}

  function loadMedicines() {
  fetch(`${API}/medicines`)
    .then((response) => response.json())
    .then((data) => {
      setMedicines(data);
    });
}

  function loadFields() {
    fetch(`${API}/fields`)
      .then((response) => response.json())
      .then((data) => {
        setFields(data);
      });
  }

  function loadHoldings() {
    fetch(`${API}/eid-cymru/holdings`)
      .then((response) => response.json())
      .then((data) => setHoldings(data));
  }

  async function loadClickEvents(selectedUser = clickLogUser) {
    setClickLogMessage("");
    try {
      setClickEvents(await fetchJson(`/click-log?userName=${encodeURIComponent(selectedUser)}`));
    } catch (error) {
      setClickLogMessage(error.message);
    }
  }

  async function saveHolding(farm, cph) {
    setHoldingMessage("");
    try {
      const response = await fetch(`${API}/eid-cymru/holdings/${encodeURIComponent(farm)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cph }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save CPH number");
      setHoldingMessage(`${farm} CPH saved.`);
      loadHoldings();
    } catch (error) {
      setHoldingMessage(error.message);
    }
  }

useEffect(() => {
  loadFields();
  loadMedicines();
  loadHoldings();
}, []);
function addMedicine() {
  if (!newMedicine.trim()) return;
  if (!(Number(bottleVolumeMl) > 0)) {
    alert("Enter the bottle volume in ml.");
    return;
  }
  if (!(Number(bottleCost) >= 0)) {
    alert("Enter the bottle cost.");
    return;
  }

  fetch(`${API}/medicines`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
body: JSON.stringify({
  name: newMedicine,
  doseRate,
  withdrawalDays,
  administrationMethod,
  bottleVolumeMl: Number(bottleVolumeMl) || 0,
  bottleCost: Number(bottleCost) || 0,
})
}).then(() => {
  setNewMedicine("");
  setDoseRate("");
  setWithdrawalDays("");
  setAdministrationMethod("");
  setBottleVolumeMl("");
  setBottleCost("");
  loadMedicines();
});
}

  function addField() {
    if (!newField.trim()) return;

    fetch(`${API}/fields`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  name: newField,
  size: fieldSize,
  parcelNumber: fieldParcelNumber,
})
      }
    ).then(() => {
      setNewField("");
      setFieldSize("");
      setFieldParcelNumber("");
      loadFields();
    });
  }

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        ⚙️ Administration
      </h1>

      <SettingsSection
        title="🎨 Appearance"
        open={showAppearance}
        onToggle={() => setShowAppearance((open) => !open)}
      >
        <p className="settings-help">Choose how Wern Villa Farm Manager looks on this device.</p>
        <div className="theme-choice-group" role="group" aria-label="Colour theme">
          {[{ value: "light", label: "☀️ Light" }, { value: "dark", label: "🌙 Dark" }].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-choice${theme === option.value ? " selected" : ""}`}
              aria-pressed={theme === option.value}
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      {user === "David" && (
        <SettingsSection
          title="🤖 AI App Customizer & Smart Farm Controls (David Only)"
          open={showAiCustomizer}
          onToggle={() => setShowAiCustomizer((open) => !open)}
        >
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#38bdf8" }}>✨ Describe any change or feature in plain English</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 12px 0" }}>
              Powered by Google Gemini (Free tier). Ask to add smart light switches, water pumps, gate controls, custom forms, or app settings!
            </p>

            {/* Quick Suggestions */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => sendAiCustomizerPrompt("Add a smart switch to turn on the Lambing Shed Lights")}
                style={{ background: "#334155", color: "#e2e8f0", border: "1px solid #475569", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                💡 Add Lambing Shed Lights
              </button>
              <button
                type="button"
                onClick={() => sendAiCustomizerPrompt("Add a smart switch for Field 3 Water Pump")}
                style={{ background: "#334155", color: "#e2e8f0", border: "1px solid #475569", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                💧 Add Field 3 Water Pump
              </button>
              <button
                type="button"
                onClick={() => sendAiCustomizerPrompt("Add a smart control button for Yard Entrance Gate")}
                style={{ background: "#334155", color: "#e2e8f0", border: "1px solid #475569", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                🚪 Add Yard Gate
              </button>
              <button
                type="button"
                onClick={() => sendAiCustomizerPrompt("Add a tracker for Feed Silo Level")}
                style={{ background: "#334155", color: "#e2e8f0", border: "1px solid #475569", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                🌾 Track Feed Silo Level
              </button>
            </div>

            {/* Chat History */}
            {aiChatHistory.length > 0 && (
              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px", maxHeight: "220px", overflowY: "auto", marginBottom: "12px", display: "grid", gap: "8px" }}>
                {aiChatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      background: msg.role === "user" ? "#0284c7" : "#334155",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      maxWidth: "85%",
                    }}
                  >
                    <strong>{msg.role === "user" ? "You" : "🤖 Gemini"}:</strong> {msg.text}
                  </div>
                ))}
              </div>
            )}

            {/* Input box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendAiCustomizerPrompt();
              }}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Turn on shed lights, add custom field label..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "white" }}
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                style={{ background: "#0284c7", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                {aiLoading ? "Thinking..." : "Send AI"}
              </button>
            </form>
          </div>

          {/* Smart Farm Devices Section */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#f8fafc" }}>⚡ Smart Farm Controls & Switches ({smartDevices.length})</h3>
              <button
                type="button"
                onClick={() => setShowManualDeviceForm((prev) => !prev)}
                style={{ background: "#334155", color: "#38bdf8", border: "1px solid #475569", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}
              >
                {showManualDeviceForm ? "✖ Close" : "➕ Add Switch Manually"}
              </button>
            </div>

            {showManualDeviceForm && (
              <form onSubmit={addManualDevice} style={{ background: "#1e293b", padding: "12px", borderRadius: "8px", marginBottom: "16px", display: "grid", gap: "10px", maxWidth: "450px" }}>
                <input required type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Device Name (e.g. Barn Lights)" />
                <div style={{ display: "flex", gap: "10px" }}>
                  <select value={manualIcon} onChange={(e) => setManualIcon(e.target.value)} style={{ padding: "8px" }}>
                    <option value="💡">💡 Light</option>
                    <option value="🔌">🔌 Plug / Switch</option>
                    <option value="💧">💧 Water / Pump</option>
                    <option value="🚪">🚪 Gate / Door</option>
                    <option value="🌾">🌾 Silo / Feed</option>
                    <option value="📹">📹 Camera</option>
                  </select>
                  <input type="text" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} placeholder="Location (e.g. Yard)" style={{ flex: 1 }} />
                </div>
                <input type="url" value={manualEndpoint} onChange={(e) => setManualEndpoint(e.target.value)} placeholder="Optional Webhook / Device URL (HTTP endpoint)" />
                <button type="submit" style={{ background: "#10b981", color: "white", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "bold" }}>
                  Save Smart Switch
                </button>
              </form>
            )}

            {smartDevices.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No smart devices added yet. Use the AI Chat above to add your first smart switch!</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {smartDevices.map((dev) => (
                  <div
                    key={dev.id}
                    style={{
                      background: dev.state === "on" ? "linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)" : "#1e293b",
                      border: dev.state === "on" ? "2px solid #38bdf8" : "1px solid #334155",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "1.8rem" }}>{dev.icon || "💡"}</span>
                        <h4 style={{ margin: "4px 0 2px 0", color: "#f8fafc" }}>{dev.name}</h4>
                        {dev.location && <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>📍 {dev.location}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSmartDevice(dev.id)}
                        style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "1rem" }}
                        title="Remove Device"
                      >
                        🗑️
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSmartDevice(dev.id)}
                      style={{
                        background: dev.state === "on" ? "#10b981" : "#475569",
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {dev.state === "on" ? "🟢 ON (Tap to Turn Off)" : "⚪ OFF (Tap to Turn On)"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reported Bugs & Feature Ideas */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, color: "#ef4444" }}>🐛 Field Bug Reports & Ideas ({devNotes.length})</h3>
              <button
                type="button"
                onClick={() => {
                  const next = !showDevNotes;
                  setShowDevNotes(next);
                  if (next) loadDevNotes();
                }}
                style={{ background: "#334155", color: "#e2e8f0", border: "1px solid #475569", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}
              >
                {showDevNotes ? "▲ Hide Reports" : "▼ View Field Reports"}
              </button>
            </div>

            {showDevNotes && (
              <div>
                {devNotes.length === 0 ? (
                  <p style={{ color: "#94a3b8" }}>No field reports submitted yet. Use the red 🐛 button in the top navigation bar to log bug reports from your phone.</p>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {devNotes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "10px",
                          padding: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ background: note.kind === "bug" ? "#dc2626" : "#0284c7", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                              {note.kind === "bug" ? "BUG" : note.kind === "feature" ? "IDEA" : "TWEAK"}
                            </span>
                            <strong style={{ color: "#f8fafc" }}>{note.title}</strong>
                            {note.screen && <span style={{ color: "#64748b", fontSize: "0.8rem" }}>({note.screen})</span>}
                          </div>
                          {note.details && <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: "4px 0" }}>{note.details}</p>}
                          <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                            Reported by {note.reportedBy || "David"} on {new Date(note.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteDevNote(note.id)}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}
                          title="Mark Resolved & Delete"
                        >
                          ✔ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SettingsSection>
      )}

      <SettingsSection
        title="🔐 Password"
        open={showPassword}
        onToggle={() => setShowPassword((open) => !open)}
      >
        <p style={{ color: "#aaa" }}>Change the password for {user || "your account"}.</p>
        <form onSubmit={changePassword} style={{ display: "grid", gap: "10px", maxWidth: "420px" }}>
          <input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" />
          <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" autoComplete="new-password" />
          <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
          <button type="submit">Change password</button>
        </form>
        {passwordMessage && <p style={{ color: passwordMessage.includes("successfully") ? "#8bc34a" : "#ff8a80" }}>{passwordMessage}</p>}
        {user === "David" && (
          <form onSubmit={resetAccountPassword} style={{ display: "grid", gap: "10px", maxWidth: "420px", marginTop: "24px" }}>
            <h3 style={{ margin: 0 }}>Reset another password</h3>
            <select value={resetUser} onChange={(event) => setResetUser(event.target.value)}>
              <option value="Gemma">Gemma</option>
              <option value="David">David</option>
            </select>
            <input required minLength={8} type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="New password" autoComplete="new-password" />
            <input required minLength={8} type="password" value={confirmResetPassword} onChange={(event) => setConfirmResetPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
            <button type="submit">Reset password</button>
          </form>
        )}
        {resetMessage && <p style={{ color: resetMessage.includes("reset") ? "#8bc34a" : "#ff8a80" }}>{resetMessage}</p>}
      </SettingsSection>

      <SettingsSection
        title="Full Click Log"
        open={showClickLog}
        onToggle={() => {
          const nextOpen = !showClickLog;
          setShowClickLog(nextOpen);
          if (nextOpen) loadClickEvents();
        }}
      >
        {clickLogMessage && <p style={{ color: "#ff8a80" }}>{clickLogMessage}</p>}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {["David", "Gemma"].map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => {
                  setClickLogUser(person);
                  loadClickEvents(person);
                }}
                style={{
                  background: clickLogUser === person ? "#03a9f4" : "#2b2b2b",
                  color: clickLogUser === person ? "#06121a" : "#f8fafc",
                  border: "1px solid #03a9f4",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {person}'s history
              </button>
            ))}
          </div>
        {clickEvents.length === 0 ? (
            <p style={{ color: "#aaa" }}>No clicks have been logged for {clickLogUser} yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px", maxWidth: "760px" }}>
            {clickEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "#2b2b2b",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: 0,
                }}
              >
                <span style={{ color: "#aaa", overflowWrap: "anywhere" }}>
                  {new Date(`${event.clickedAt}Z`).toLocaleString()}
                  <br />
                  {event.screen || "Unknown screen"} | {event.target || "Unknown element"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="EID Cymru Holdings"
        open={showEidCymru}
        onToggle={() => setShowEidCymru((open) => !open)}
      >
        {holdings.map((holding) => (
          <form
            key={holding.farm}
            onSubmit={(event) => {
              event.preventDefault();
              saveHolding(holding.farm, event.currentTarget.cph.value);
            }}
            style={{ display: "flex", gap: "10px", marginBottom: "10px", maxWidth: "520px" }}
          >
            <label style={{ minWidth: "110px", alignSelf: "center" }}>{holding.farm}</label>
            <input
              name="cph"
              required
              defaultValue={holding.cph}
              placeholder="CPH number"
              style={{ flex: 1 }}
            />
            <button type="submit">Save</button>
          </form>
        ))}
        {holdingMessage && <p style={{ color: holdingMessage.includes("saved") ? "#8bc34a" : "#ff8a80" }}>{holdingMessage}</p>}
      </SettingsSection>

      <SettingsSection
        title="🌱 Fields"
        open={showFields}
        onToggle={() => setShowFields((open) => !open)}
      >
        <input
          value={newField}
          onChange={(e) =>
            setNewField(e.target.value)
          }
          placeholder="Field name..."
        />
        <input
  value={fieldSize}
  onChange={(e) =>
    setFieldSize(e.target.value)
  }
  placeholder="Field size (acres)..."
  style={{
    marginLeft: "10px",
  }}
/>
        <input
          value={fieldParcelNumber}
          onChange={(e) => setFieldParcelNumber(e.target.value)}
          placeholder="Parcel number..."
          style={{ marginLeft: "10px" }}
        />

        <button
          onClick={addField}
          style={{
            marginLeft: "10px",
          }}
        >
          Add Field
        </button>

        <div
          style={{
            marginTop: "20px",
          }}
        >
{fields.map((field) => (
  <div
    key={field.id}
    style={{
      background: "#2b2b2b",
      padding: "10px",
      borderRadius: "8px",
      marginBottom: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
<span>
  🌱 {field.name}
  <br />
  📏 {field.size || 0} acres
  <br />
  🧾 Parcel: {field.parcelNumber || "-"}
  <br />
  🗺️ Position:{" "}
  {field.position || "-"}
</span>

<button
  onClick={async () => {
    const newName = prompt(
      "Field name:",
      field.name
    );

    if (newName === null) return;

    const newSize = prompt(
      "Field size (acres):",
      field.size || ""
    );

    if (newSize === null) return;

    const newParcelNumber = prompt(
      "Parcel number:",
      field.parcelNumber || ""
    );

    if (newParcelNumber === null) return;

    const newPosition = prompt(
      "Map position (1-4):",
      field.position || ""
    );

    if (newPosition === null) return;

    await fetch(`${API}/fields/${field.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: newName,
          size: Number(newSize),
          parcelNumber: newParcelNumber,
          position: Number(
            newPosition
          ),
        }),
      }
    );

    loadFields();
  }}
>
  ⚙️ Edit Field
</button>
  </div>
))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="� Chickens"
        open={showChickens}
        onToggle={() => setShowChickens((open) => !open)}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center", maxWidth: "320px" }}>
          <input
            type="number"
            min="0"
            value={chickenCountInput}
            onChange={(e) => setChickenCountInput(e.target.value)}
            placeholder="Number of chickens..."
            style={{ flex: 1 }}
          />
          <button onClick={saveChickenCount} disabled={savingChickenCount}>
            Save
          </button>
        </div>
        <p style={{ color: "#aaa", marginTop: "10px" }}>
          Currently {chickenCount} chicken{chickenCount === 1 ? "" : "s"}.
        </p>
        {chickenMessage && (
          <p style={{ color: chickenMessage.startsWith("Saved") ? "#8bc34a" : "#ff8a80" }}>
            {chickenMessage}
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="�💉 Medicines"
        open={showMedicines}
        onToggle={() => setShowMedicines((open) => !open)}
      >
  <input
    value={newMedicine}
    onChange={(e) =>
      setNewMedicine(e.target.value)
    }
    placeholder="Medicine name..."
  />
  <input
  value={doseRate}
  onChange={(e) =>
    setDoseRate(e.target.value)
  }
  placeholder="Dose rate..."
/>

<input
  value={withdrawalDays}
  onChange={(e) =>
    setWithdrawalDays(
      e.target.value
    )
  }
  placeholder="Withdrawal days..."
/>

<input
  value={administrationMethod}
  onChange={(e) =>
    setAdministrationMethod(
      e.target.value
    )
  }
  placeholder="Administration..."
/>

<input
  value={bottleVolumeMl}
  onChange={(e) =>
    setBottleVolumeMl(e.target.value)
  }
  placeholder="Bottle volume (ml)..."
  type="number"
  min="0.01"
  step="0.01"
/>

<input
  value={bottleCost}
  onChange={(e) =>
    setBottleCost(e.target.value)
  }
  placeholder="Bottle cost (£)..."
  type="number"
  min="0"
  step="0.01"
/>

  <button
    onClick={addMedicine}
    style={{
      marginLeft: "10px",
    }}
  >
    Add Medicine
  </button>

  <div
    style={{
      marginTop: "20px",
    }}
  >
    {medicines.map((medicine) => (
      <div
        key={medicine.id}
        style={{
          background: "#2b2b2b",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "10px",
        }}
      >
<div>
  <strong>
    💉 {medicine.name}
  </strong>

  <div>
    Dose: {medicine.doseRate}
  </div>

  <div>
    Withdrawal:
    {" "}
    {medicine.withdrawalDays}
    {" "}days
  </div>

  <div>
    Method:
    {" "}
    {medicine.administrationMethod}
  </div>
  <div>
    Bottle: {medicine.bottleVolumeMl || 0} ml for £{medicine.bottleCost || 0}
    <br />
    Cost per ml: £{Number(medicine.costPerMl || 0).toFixed(4)}
  </div>
  <button
  onClick={async () => {
    const newName = prompt(
      "Medicine name:",
      medicine.name
    );

    if (newName === null) return;

    const newDoseRate = prompt(
      "Dose rate:",
      medicine.doseRate || ""
    );

    if (newDoseRate === null) return;

    const newWithdrawal = prompt(
      "Withdrawal days:",
      medicine.withdrawalDays || ""
    );

    if (newWithdrawal === null) return;

    const newMethod = prompt(
      "Administration method:",
      medicine.administrationMethod || ""
    );

    if (newMethod === null) return;

    const newBottleVolume = prompt(
      "Bottle volume (ml):",
      medicine.bottleVolumeMl || ""
    );

    if (newBottleVolume === null) return;

    const newBottleCost = prompt(
      "Bottle cost (£):",
      medicine.bottleCost || ""
    );

    if (newBottleCost === null) return;

    await fetch(`${API}/medicines/${medicine.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: newName,
          doseRate: newDoseRate,
          withdrawalDays: Number(
            newWithdrawal
          ),
          administrationMethod:
            newMethod,
          bottleVolumeMl: Number(newBottleVolume) || 0,
          bottleCost: Number(newBottleCost) || 0,
        }),
      }
    );

    loadMedicines();
  }}
  style={{
    marginTop: "10px",
  }}
>
  ⚙️ Edit Medicine
</button>
</div>      </div>
    ))}
  </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, open, onToggle, children }) {
  return (
    <div
      style={{
        background: "var(--settings-surface)",
        borderRadius: "12px",
        marginBottom: "20px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          border: "none",
          color: "#03a9f4",
          padding: "20px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span style={{ color: "#aaa" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}
