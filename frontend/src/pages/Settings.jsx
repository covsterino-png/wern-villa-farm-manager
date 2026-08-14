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
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordMessage, setPasswordMessage] = useState("");

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

useEffect(() => {
  loadFields();
  loadMedicines();
}, []);
function addMedicine() {
  if (!newMedicine.trim()) return;

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
})
}).then(() => {
  setNewMedicine("");
  setDoseRate("");
  setWithdrawalDays("");
  setAdministrationMethod("");
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

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
      </div>

      <div style={{ background: "#1f1f1f", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
        <h2 style={{ color: "#03a9f4" }}>🔐 Password</h2>
        <p style={{ color: "#aaa" }}>Change the password for {user || "your account"}.</p>
        <form onSubmit={changePassword} style={{ display: "grid", gap: "10px", maxWidth: "420px" }}>
          <input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" />
          <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" autoComplete="new-password" />
          <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
          <button type="submit">Change password</button>
        </form>
        {passwordMessage && <p style={{ color: passwordMessage.includes("successfully") ? "#8bc34a" : "#ff8a80" }}>{passwordMessage}</p>}
      </div>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2
          style={{
            color: "#03a9f4",
          }}
        >
          🌱 Fields
        </h2>

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
          <div
  style={{
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
  }}
>
  <h2
    style={{
      color: "#03a9f4",
    }}
  >
    💉 Medicines
  </h2>

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
</div>
        </div>
      </div>
    </div>
  );
}