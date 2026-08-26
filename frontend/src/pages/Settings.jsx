import { useEffect, useState } from "react";
import { API, fetchJson } from "../api";

export default function Settings({ user }) {
const [fields, setFields] = useState([]);
const [newField, setNewField] = useState("");
const [fieldSize, setFieldSize] =  useState("");
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
const [showFields, setShowFields] = useState(false);
const [showMedicines, setShowMedicines] = useState(false);
const [holdings, setHoldings] = useState([]);
const [showEidCymru, setShowEidCymru] = useState(false);
const [holdingMessage, setHoldingMessage] = useState("");
const [lastAccessEvents, setLastAccessEvents] = useState([]);
const [showLastAccess, setShowLastAccess] = useState(false);
const [lastAccessMessage, setLastAccessMessage] = useState("");

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

  async function loadLastAccessEvents() {
    setLastAccessMessage("");
    try {
      setLastAccessEvents(await fetchJson("/app-open-events"));
    } catch (error) {
      setLastAccessMessage(error.message);
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
})
      }
    ).then(() => {
      setNewField("");
      setFieldSize("");
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
        title="Last App Access"
        open={showLastAccess}
        onToggle={() => {
          const nextOpen = !showLastAccess;
          setShowLastAccess(nextOpen);
          if (nextOpen) loadLastAccessEvents();
        }}
      >
        {lastAccessMessage && <p style={{ color: "#ff8a80" }}>{lastAccessMessage}</p>}
        {lastAccessEvents.length === 0 ? (
          <p style={{ color: "#aaa" }}>No app access has been logged yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px", maxWidth: "560px" }}>
            {lastAccessEvents.map((event) => (
              <div
                key={event.userName}
                style={{
                  background: "#2b2b2b",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <strong>{event.userName}</strong>
                <span style={{ color: "#aaa", textAlign: "right" }}>
                  {new Date(`${event.openedAt}Z`).toLocaleString()}
                  <br />
                  {event.lastScreen || "Unknown screen"}
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
        title="💉 Medicines"
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
        background: "#1f1f1f",
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
