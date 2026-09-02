import { useEffect, useState } from "react";
import { API } from "../api";

const LAMBING_SHED = "Lambing Shed";

const BAYS = [
  "Bay 1",
  "Bay 2",
  "Bay 3",
  "Bay 4",
  "Bay 5",
  "Bay 6",
];

const WERN_VILLA_BUILDINGS = [LAMBING_SHED, ...BAYS];

const BAY_MERGE_KEY = "wernVillaBayMerges";

// Merges are stored as the split boundaries that remain open, e.g. [1,3] keeps
// Bay 1 | Bay 2 + Bay 3 | Bay 4 ... The stored value is the merged pairs.
function loadMerges() {
  try {
    const raw = localStorage.getItem(BAY_MERGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (i) => Number.isInteger(i) && i >= 0 && i < BAYS.length - 1
        )
      : [];
  } catch {
    return [];
  }
}

function buildBayGroups(merges) {
  const groups = [];
  let current = [BAYS[0]];

  for (let i = 1; i < BAYS.length; i++) {
    if (merges.includes(i - 1)) {
      current.push(BAYS[i]);
    } else {
      groups.push(current);
      current = [BAYS[i]];
    }
  }

  groups.push(current);
  return groups;
}

export default function FarmMap() {
  const [fieldStatus, setFieldStatus] =
    useState([]);
  const [farm, setFarm] = useState("Gellidywyll");
  const [yardOpen, setYardOpen] = useState(false);
  const [bayMerges, setBayMerges] = useState(loadMerges);
  const [editingBays, setEditingBays] = useState(false);

  useEffect(() => {
    localStorage.setItem(BAY_MERGE_KEY, JSON.stringify(bayMerges));
  }, [bayMerges]);

  const toggleMerge = (boundary) => {
    setBayMerges((current) =>
      current.includes(boundary)
        ? current.filter((i) => i !== boundary)
        : [...current, boundary].sort((a, b) => a - b)
    );
  };

  useEffect(() => {
    fetch(`${API}/field-status`)
      .then((res) => res.json())
      .then((data) => setFieldStatus(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fieldsForFarm = fieldStatus.filter(
    (f) => (f.farm || "Gellidywyll") === farm
  );

  const field1 = fieldsForFarm.find(
    (f) => Number(f.position) === 1
  );

  const field2 = fieldsForFarm.find(
    (f) => Number(f.position) === 2
  );

  const field3 = fieldsForFarm.find(
    (f) => Number(f.position) === 3
  );

  const field4 = fieldsForFarm.find(
    (f) => Number(f.position) === 4
  );

  const getColour = (field) => {
    if (!field) return "#555";

    if (field.occupied) {
      return "#2196f3";
    }

    if (field.daysEmpty >= 30) {
      return "#4caf50";
    }

    if (field.daysEmpty >= 14) {
      return "#ff9800";
    }

    return "#f44336";
  };

  const buildings = WERN_VILLA_BUILDINGS.map((name) => {
    const match = fieldsForFarm.find(
      (f) => (f.name || "").trim().toLowerCase() === name.toLowerCase()
    );

    return {
      name,
      sheep: Number(match?.sheepCount) || 0,
      groups: match?.groups ?? [],
    };
  });

  const sheepFor = (name) =>
    buildings.find((b) => b.name === name)?.sheep ?? 0;

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
  }));

  const yardUnits = [
    {
      bays: [LAMBING_SHED],
      label: LAMBING_SHED,
      sheep: sheepFor(LAMBING_SHED),
    },
    ...bayGroups,
  ];

  const sheepInBuildings = buildings.reduce(
    (total, b) => total + b.sheep,
    0
  );

  const totalSheepOnFarm = fieldsForFarm.reduce(
    (total, field) => total + (Number(field.sheepCount) || 0),
    0
  );

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "12px",
        }}
      >
        🗺️ {farm}
      </h1>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "8px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {["Gellidywyll", "Wern Villa"].map((option) => (
          <button
            key={option}
            onClick={() => setFarm(option)}
            style={{
              background: farm === option ? "#03a9f4" : "#2b2b2b",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: farm === option ? "bold" : "normal",
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <div style={{ color: "#aaa", marginBottom: "16px" }}>
        {fieldsForFarm.length} fields · 🐑 {totalSheepOnFarm} sheep
      </div>

      {farm === "Wern Villa" ? (
      <div
        style={{
          maxWidth: "550px",
          margin: "0 auto",
          display: "grid",
          gap: "12px",
        }}
      >
        <FieldCard
          name={`🌱 ${
            field1?.name || "Loading..."
          }`}
          colour={getColour(field1)}
          sheep={field1?.sheepCount ?? 0}
          groups={field1?.groups ?? []}
          occupied={field1?.occupied}
          daysEmpty={field1?.daysEmpty ?? 0}
          size={field1?.size ?? 0}
          height="120px"
        />

        <FieldCard
          name={`🌱 ${
            field2?.name || "Loading..."
          }`}
          colour={getColour(field2)}
          sheep={field2?.sheepCount ?? 0}
          groups={field2?.groups ?? []}
          occupied={field2?.occupied}
          daysEmpty={field2?.daysEmpty ?? 0}
          size={field2?.size ?? 0}
          height="120px"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <FieldCard
            name={`🌱 ${
              field3?.name || "Loading..."
            }`}
            colour={getColour(field3)}
            sheep={field3?.sheepCount ?? 0}
            groups={field3?.groups ?? []}
            occupied={field3?.occupied}
            daysEmpty={field3?.daysEmpty ?? 0}
            size={field3?.size ?? 0}
            height="168px"
          />

          <FieldCard
            name={`🌱 ${
              field4?.name || "Loading..."
            }`}
            colour={getColour(field4)}
            sheep={field4?.sheepCount ?? 0}
            groups={field4?.groups ?? []}
            occupied={field4?.occupied}
            daysEmpty={field4?.daysEmpty ?? 0}
            size={field4?.size ?? 0}
            height="280px"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "-112px",
          }}
        >
          <div
            onClick={() => setYardOpen((open) => !open)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setYardOpen((open) => !open);
              }
            }}
            style={{
              background: "#607d8b",
              borderRadius: "20px",
              padding: "16px",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <strong>🏠 Home & Yard</strong>
              <span>{yardOpen ? "▲" : "▼"}</span>
            </div>

            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
              {yardUnits.length} buildings · 🐑 {sheepInBuildings}
            </div>

            {yardOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: "12px",
                  display: "grid",
                  gap: "8px",
                }}
              >
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
                      style={{
                        background: unit.sheep > 0 ? "#2196f3" : "#455a64",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>🏚️ {unit.label}</span>

                      <span style={{ display: "flex", gap: "8px" }}>
                        {editingBays && unit.bays.length > 1 && (
                          <BayButton
                            label="Split"
                            onClick={() =>
                              setBayMerges((current) =>
                                current.filter(
                                  (i) =>
                                    i < BAYS.indexOf(unit.bays[0]) ||
                                    i >=
                                      BAYS.indexOf(
                                        unit.bays[unit.bays.length - 1]
                                      )
                                )
                              )
                            }
                          />
                        )}
                        <span>🐑 {unit.sheep}</span>
                      </span>
                    </div>

                    {editingBays &&
                      index > 0 &&
                      index < yardUnits.length - 1 && (
                        <BayButton
                          label="⇵ Merge with below"
                          block
                          onClick={() =>
                            toggleMerge(
                              BAYS.indexOf(unit.bays[unit.bays.length - 1])
                            )
                          }
                        />
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div />
        </div>
      </div>
      ) : fieldsForFarm.length === 0 ? (
        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
            color: "#aaa",
          }}
        >
          No fields recorded for {farm} yet. Add them on the Fields page.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              window.innerWidth < 768
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {fieldsForFarm.map((field) => (
            <FieldCard
              key={field.name}
              name={`🌱 ${field.name}`}
              colour={getColour(field)}
              sheep={field.sheepCount ?? 0}
              groups={field.groups ?? []}
              occupied={field.occupied}
              daysEmpty={field.daysEmpty ?? 0}
              size={field.size ?? 0}
              height="auto"
            />
          ))}
        </div>
      )}
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

function FieldCard({
  name,
  colour,
  sheep,
  groups,
  occupied,
  daysEmpty,
  size,
  height,
}) {
  return (
    <div
      style={{
        background: colour,
        borderRadius: "20px",
        padding: "16px",
        color: "white",
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <strong>{name}</strong>

      <div>
        <div>
          {occupied
            ? "🔵 Occupied"
            : "⚪ Empty"}
        </div>

        <div>
          🐑 {sheep} Sheep
        </div>

        <div>
          📏 {size} acres
        </div>

        {groups?.length > 0 && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "0.85rem",
            }}
          >
            {groups.map((group) => (
              <div key={group}>
                • {group}
              </div>
            ))}
          </div>
        )}

        {!occupied && (
          <div>
            🌱 {daysEmpty} Days Empty
          </div>
        )}
      </div>
    </div>
  );
}