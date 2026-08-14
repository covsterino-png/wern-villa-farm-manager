import { useEffect, useRef, useState } from "react";
import SheepDetail from "./SheepDetail";

function normalizeEid(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export default function SheepRegister() {
  const [sheep, setSheep] = useState([]);

  const [name, setName] = useState("");
  const [eid, setEid] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [mother, setMother] = useState("");
  const [showAddSheep, setShowAddSheep] =
  useState(false);
  const [father, setFather] = useState("");
  const [motherId, setMotherId] = useState("");
  const [selectedSheep, setSelectedSheep] =
  useState(null);
  const [fatherId, setFatherId] = useState("");

  const [groupName, setGroupName] =
    useState("");

  const [currentField, setCurrentField] =
    useState("");

  const [status, setStatus] =
    useState("Active");

  const [notes, setNotes] = useState("");

  const [groups, setGroups] = useState([]);
  const [fields, setFields] = useState([]);
  const [allSheep, setAllSheep] =
    useState([]);
  const [eidSearch, setEidSearch] = useState("");
  const [eidMessage, setEidMessage] = useState("");
  const eidLookupTimer = useRef(null);
    const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#1f1f1f",
  color: "white",
  boxSizing: "border-box",
};

const cardStyle = {
  background: "#2b2b2b",
  padding: "20px",
  borderRadius: "12px",
  maxWidth: "700px",
  margin: "0 auto 30px auto",
};

  function loadSheep() {
    fetch(
      "https://wern-villa-api.onrender.com/sheep"
    )
      .then((res) => res.json())
      .then((data) => {
        setSheep(data);
        setAllSheep(data);
      });
  }

  function loadGroups() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register"
    )
      .then((res) => res.json())
      .then((data) => setGroups(data));
  }

  function loadFields() {
    fetch(
      "https://wern-villa-api.onrender.com/fields"
    )
      .then((res) => res.json())
      .then((data) => setFields(data));
  }

  useEffect(() => {
    loadSheep();
    loadGroups();
    loadFields();
    return () => clearTimeout(eidLookupTimer.current);
  }, []);

  function addSheep() {
    fetch(
      "https://wern-villa-api.onrender.com/sheep",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          eid,
          sex,
          dob,
          groupName,
          mother,
          motherId,
          father,
          fatherId,
          currentField,
          status,
          notes,
        }),
      }
    ).then(() => {
      setName("");
      setEid("");
      setSex("");
      setDob("");
      setMother("");
      setFather("");
      setMotherId("");
      setFatherId("");
      setGroupName("");
      setCurrentField("");
      setStatus("Active");
      setNotes("");
      setShowAddSheep(false);

      loadSheep();
    });
  }

  function findByEid(event) {
    event.preventDefault();
    lookupEid(eidSearch);
  }

  function lookupEid(value) {
    const scannedEid = normalizeEid(value);
    if (!scannedEid) {
      setEidMessage("Enter or scan an EID first.");
      return;
    }

    const match = allSheep.find(
      (animal) => normalizeEid(animal.eid) === scannedEid
    );

    if (match) {
      setEidMessage(`Found ${match.name || "sheep"}.`);
      setSelectedSheep(match);
      return;
    }

    setEid(scannedEid);
    setShowAddSheep(true);
    setEidMessage("No sheep found. Complete the form to add this EID.");
  }

  function handleEidChange(event) {
    const value = event.target.value;
    setEidSearch(value);
    clearTimeout(eidLookupTimer.current);

    const normalized = normalizeEid(value);
    if (normalized.length === 10 || normalized.length === 15) {
      eidLookupTimer.current = setTimeout(() => lookupEid(value), 400);
    }
  }

if (selectedSheep) {
  return (
    <SheepDetail
      sheep={selectedSheep}
      onBack={() =>
        setSelectedSheep(null)
      }
    />
  );
}
return (
<div
  style={{
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  }}
>
  <h1
    style={{
      color: "#03a9f4",
    }}
  >
    🐑 Sheep Register
  </h1>

  <div style={{ ...cardStyle, border: "1px solid #03a9f4" }}>
    <h2 style={{ marginTop: 0, color: "#03a9f4" }}>Scan or search EID</h2>
    <form onSubmit={findByEid} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        autoFocus
        style={{ ...inputStyle, flex: "1 1 220px", marginBottom: 0 }}
        value={eidSearch}
        onChange={handleEidChange}
        placeholder="Scan EID or type tag number"
        inputMode="numeric"
        aria-label="Scan or search EID"
      />
      <button
        type="submit"
        style={{ background: "#03a9f4", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
      >
        Find sheep
      </button>
    </form>
    {eidMessage && <p style={{ marginBottom: 0, color: eidMessage.startsWith("Found") ? "#8bc34a" : "#ffcc80" }}>{eidMessage}</p>}
  </div>

  <div style={cardStyle}>
    <button
      onClick={() =>
        setShowAddSheep(!showAddSheep)
      }
      style={{
        background: "#4caf50",
        color: "white",
        border: "none",
        padding: "14px",
        borderRadius: "10px",
        width: "100%",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "1rem",
        marginBottom: "15px",
      }}
    >
      {showAddSheep
        ? "➖ Hide Add Sheep Form"
        : "➕ Add Sheep"}
    </button>

    {showAddSheep && (
      <>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Name"
        />

        <input
          style={inputStyle}
          value={eid}
          onChange={(e) =>
            setEid(e.target.value)
          }
          placeholder="EID"
        />

        <select
          style={inputStyle}
          value={sex}
          onChange={(e) =>
            setSex(e.target.value)
          }
        >
          <option value="">
            Select Sex
          </option>

          <option value="Ewe">
            Ewe
          </option>

          <option value="Ram">
            Ram
          </option>
        </select>

        <input
          style={inputStyle}
          type="date"
          value={dob}
          onChange={(e) =>
            setDob(e.target.value)
          }
        />

        <input
          style={inputStyle}
          list="mother-list"
          value={mother}
          onChange={(e) => {
            setMother(
              e.target.value
            );

            const match =
              allSheep.find(
                (s) =>
                  s.name ===
                  e.target.value
              );

            setMotherId(
              match
                ? match.id
                : ""
            );
          }}
          placeholder="Mother"
        />

        <datalist id="mother-list">
          {allSheep.map((s) => (
            <option
              key={s.id}
              value={s.name}
            />
          ))}
        </datalist>

        <input
          style={inputStyle}
          list="father-list"
          value={father}
          onChange={(e) => {
            setFather(
              e.target.value
            );

            const match =
              allSheep.find(
                (s) =>
                  s.name ===
                  e.target.value
              );

            setFatherId(
              match
                ? match.id
                : ""
            );
          }}
          placeholder="Father"
        />

        <datalist id="father-list">
          {allSheep.map((s) => (
            <option
              key={s.id}
              value={s.name}
            />
          ))}
        </datalist>

        <select
          style={inputStyle}
          value={groupName}
          onChange={(e) =>
            setGroupName(
              e.target.value
            )
          }
        >
          <option value="">
            Select Group
          </option>

          {groups.map((group) => (
            <option
              key={group.id}
              value={group.name}
            >
              {group.name}
            </option>
          ))}
        </select>

        <select
          style={inputStyle}
          value={currentField}
          onChange={(e) =>
            setCurrentField(
              e.target.value
            )
          }
        >
          <option value="">
            Select Field
          </option>

          {fields.map((field) => (
            <option
              key={field.id}
              value={field.name}
            >
              {field.name}
            </option>
          ))}
        </select>

        <button
          onClick={addSheep}
          style={{
            background:
              "#4caf50",
            color: "white",
            border: "none",
            padding: "14px",
            borderRadius: "10px",
            width: "100%",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          ✅ Add Sheep
        </button>
      </>
    )}
  </div>
        <div
        style={{
          marginTop: "20px",
        }}
      >
        {sheep.map((animal) => (
<div
  key={animal.id}
  onClick={() =>
    setSelectedSheep(animal)
  }
  style={{
    background: "#2b2b2b",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "10px",
    cursor: "pointer",
  }}
>            <h3>
              🐑 {animal.name}
            </h3>

            <div>
              Sex: {animal.sex}
            </div>

            <div>
              Group:{" "}
              {animal.groupName}
            </div>

            <div>
              Field:{" "}
              {animal.currentField}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}