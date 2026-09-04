import { useEffect, useState } from "react";
import { API } from "../api";
import {
  LAMBING_SHED,
  BAYS,
  buildBayGroups,
  loadBayMerges,
  saveBayMerges,
} from "./outbuildingsData";

export default function Outbuildings({ onBack, onSelectBuilding }) {
  const [fieldStatus, setFieldStatus] = useState([]);
  const [bayMerges, setBayMerges] = useState(loadBayMerges);
  const [editingBays, setEditingBays] = useState(false);

  useEffect(() => {
    fetch(`${API}/field-status`)
      .then((res) => res.json())
      .then((data) => setFieldStatus(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    saveBayMerges(bayMerges);
  }, [bayMerges]);

  const toggleMerge = (boundary) => {
    setBayMerges((current) =>
      current.includes(boundary)
        ? current.filter((i) => i !== boundary)
        : [...current, boundary].sort((a, b) => a - b)
    );
  };

  const buildingsForFarm = fieldStatus.filter(
    (f) => (f.farm || "Gellidywyll") === "Wern Villa"
  );

  const sheepFor = (name) =>
    Number(
      buildingsForFarm.find(
        (f) => (f.name || "").trim().toLowerCase() === name.toLowerCase()
      )?.sheepCount
    ) || 0;

  const groupsFor = (names) => [
    ...new Set(
      names.flatMap((name) => {
        const match = buildingsForFarm.find(
          (f) => (f.name || "").trim().toLowerCase() === name.toLowerCase()
        );
        return match?.groups ?? [];
      })
    ),
  ];

  const bayGroups = buildBayGroups(bayMerges).map((bays) => ({
    bays,
    label:
      bays.length === 1
        ? bays[0]
        : `Bays ${bays[0].replace("Bay ", "")}–${bays[bays.length - 1].replace(
            "Bay ",
            ""
          )}`,
    sheep: bays.reduce((total, bay) => total + sheepFor(bay), 0),
    groups: groupsFor(bays),
  }));

  const yardUnits = [
    {
      bays: [LAMBING_SHED],
      label: LAMBING_SHED,
      sheep: sheepFor(LAMBING_SHED),
      groups: groupsFor([LAMBING_SHED]),
    },
    ...bayGroups,
  ];

  const sheepInBuildings = yardUnits.reduce(
    (total, unit) => total + unit.sheep,
    0
  );

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
          ← Farm Map
        </button>
        <h1 style={{ color: "#03a9f4", margin: 0 }}>🏠 Home & Yard</h1>
      </div>

      <div style={{ color: "#aaa", marginBottom: "16px" }}>
        {yardUnits.length} buildings · 🐑 {sheepInBuildings} sheep
      </div>

      <div style={{ display: "grid", gap: "8px", maxWidth: "550px" }}>
        <button
          onClick={() => setEditingBays((v) => !v)}
          style={{
            justifySelf: "start",
            background: editingBays ? "#03a9f4" : "#37474f",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          {editingBays ? "Done" : "Merge bays"}
        </button>

        {yardUnits.map((unit, index) => (
          <div key={unit.label}>
            <div
              onClick={() => !editingBays && onSelectBuilding?.(unit)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (!editingBays && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectBuilding?.(unit);
                }
              }}
              style={{
                background: unit.sheep > 0 ? "#2196f3" : "#455a64",
                borderRadius: "12px",
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.9rem",
                cursor: editingBays ? "default" : "pointer",
              }}
            >
              <span>
                🏚️ {unit.label}
                {unit.groups.length > 0 && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      opacity: 0.85,
                    }}
                  >
                    {unit.groups.join(", ")}
                  </span>
                )}
              </span>

              <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {editingBays && unit.bays.length > 1 && (
                  <BayButton
                    label="Split"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBayMerges((current) =>
                        current.filter(
                          (i) =>
                            i < BAYS.indexOf(unit.bays[0]) ||
                            i >= BAYS.indexOf(unit.bays[unit.bays.length - 1])
                        )
                      );
                    }}
                  />
                )}
                <span>🐑 {unit.sheep}</span>
                {!editingBays && <span>▶</span>}
              </span>
            </div>

            {editingBays && index > 0 && index < yardUnits.length - 1 && (
              <BayButton
                label="⇵ Merge with below"
                block
                onClick={() =>
                  toggleMerge(BAYS.indexOf(unit.bays[unit.bays.length - 1]))
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BayButton({ label, onClick, block }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#263238",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: block ? "4px 10px" : "2px 8px",
        margin: block ? "4px auto" : 0,
        display: block ? "block" : "inline-block",
        cursor: "pointer",
        fontSize: "0.75rem",
      }}
    >
      {label}
    </button>
  );
}
