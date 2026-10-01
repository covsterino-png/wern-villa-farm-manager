import { useEffect, useRef, useState } from "react";
import SheepDetail from "./SheepDetail";
import { submitWrite } from "../offlineQueue";
import { getEidFormats } from "../eidUtils";

function normalizeEid(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

// Two EIDs match if either their hex or their ISO decimal form is identical.
function eidsMatch(a, b) {
  if (!a || !b) return false;
  const formatsA = getEidFormats(a);
  const formatsB = getEidFormats(b);
  return (
    (formatsA.hex && formatsB.hex && formatsA.hex === formatsB.hex) ||
    (formatsA.iso && formatsB.iso && formatsA.iso === formatsB.iso)
  );
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
  const [showSearch, setShowSearch] = useState(false);
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
    submitWrite(
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
      },
      `Add sheep ${name || eid}`
    ).then(async (res) => {
      const data = await res.json().catch(() => ({}));
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

      if (data.queued) {
        setEidMessage("Saved offline — will sync automatically once you're back online.");
      } else {
        loadSheep();
      }
    });
  }

  function findByEid(event) {
    event.preventDefault();
    lookupEid(eidSearch);
  }

  function lookupEid(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      setEidMessage("Enter or scan an EID or name first.");
      return;
    }

    const scannedEid = normalizeEid(value);
    const lowerName = trimmed.toLowerCase();

    const eidMatch = allSheep.find(
      (animal) => scannedEid && eidsMatch(animal.eid, value)
    );
    const nameMatches = allSheep.filter(
      (animal) => (animal.name || "").toLowerCase() === lowerName
    );
    const match = eidMatch || (nameMatches.length === 1 ? nameMatches[0] : null);

    if (match) {
      setEidMessage(`Found ${match.name || match.eid}.`);
      setSelectedSheep(match);
      return;
    }

    const looksLikeEid = /^[0-9]+$/.test(scannedEid) && scannedEid.length >= 6;
    if (looksLikeEid) {
      setEid(scannedEid);
      setShowAddSheep(true);
      setEidMessage("No sheep found. Complete the form to add this EID.");
      return;
    }

    const partialCount = allSheep.filter((animal) =>
      (animal.name || "").toLowerCase().includes(lowerName)
    ).length;
    setEidMessage(
      partialCount > 0
        ? `${partialCount} sheep match "${trimmed}" below.`
        : `No sheep found matching "${trimmed}".`
    );
  }

  function handleEidChange(event) {
    const value = event.target.value;
    setEidSearch(value);
    clearTimeout(eidLookupTimer.current);

    const normalized = normalizeEid(value);
    if (normalized.length === 12 || normalized.length === 15) {
      eidLookupTimer.current = setTimeout(() => lookupEid(value), 400);
    }
  }

  const searchTerm = eidSearch.trim().toLowerCase();
  const visibleSheep = searchTerm
    ? sheep.filter((animal) => {
        if ((animal.name || "").toLowerCase().includes(searchTerm)) return true;
        const animalFormats = getEidFormats(animal.eid);
        const normalizedAnimalEid = normalizeEid(animal.eid);
        const normalizedSearchTerm = normalizeEid(eidSearch);
        return (
          normalizedAnimalEid.includes(normalizedSearchTerm) ||
          (animalFormats.hex && animalFormats.hex.includes(normalizedSearchTerm)) ||
          (animalFormats.iso && animalFormats.iso.includes(normalizedSearchTerm))
        );
      })
    : sheep;

if (selectedSheep) {
  return (
    <SheepDetail
      sheep={selectedSheep}
      onSelectSheep={setSelectedSheep}
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

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      maxWidth: "700px",
      margin: "0 auto 15px auto",
    }}
  >
    <button
      type="button"
      onClick={() => setShowSearch((prev) => !prev)}
      aria-label={showSearch ? "Hide search" : "Show search"}
      aria-expanded={showSearch}
      style={{
        background: showSearch ? "#03a9f4" : "#2b2b2b",
        color: "white",
        border: "1px solid #03a9f4",
        borderRadius: "8px",
        width: "44px",
        height: "44px",
        fontSize: "1.2rem",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      🔍
    </button>
    {!showSearch && (
      <span style={{ color: "#999" }}>Tap to scan or search sheep</span>
    )}
  </div>

  {showSearch && (
  <div style={{ ...cardStyle, border: "1px solid #03a9f4" }}>
    <h2 style={{ marginTop: 0, color: "#03a9f4" }}>Scan or search EID</h2>
    <form onSubmit={findByEid} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        autoFocus
        style={{ ...inputStyle, flex: "1 1 220px", marginBottom: 0 }}
        value={eidSearch}
        onChange={handleEidChange}
        placeholder="Scan EID or type name/tag number"
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
  )}

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
          placeholder="EID (scan hex or type ISO)"
        />
        {(() => {
          const { hex, iso } = getEidFormats(eid);
          return hex && iso ? (
            <p style={{ marginTop: "-8px", color: "#999" }}>
              Hex: {hex} &nbsp;|&nbsp; ISO: {iso}
            </p>
          ) : null;
        })()}

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
        {searchTerm && (
          <p style={{ color: "#999" }}>
            {visibleSheep.length} of {sheep.length} sheep match "{eidSearch}"
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "8px",
          }}
        >
        {visibleSheep.map((animal) => (
<div
  key={animal.id}
  onClick={() =>
    setSelectedSheep(animal)
  }
  style={{
    background: "#2b2b2b",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "center",
  }}
>
            <div style={{ fontWeight: "bold" }}>
              🐑 {animal.name || getEidFormats(animal.eid).iso || animal.eid || "Unnamed"}
            </div>
            {animal.name && (
              <div style={{ color: "#999", fontSize: "0.85rem" }}>
                {getEidFormats(animal.eid).iso || animal.eid}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}