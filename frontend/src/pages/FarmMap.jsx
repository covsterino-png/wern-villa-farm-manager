import { useEffect, useState } from "react";
import { API } from "../api";
import { WERN_VILLA_BUILDINGS } from "./outbuildingsData";

export default function FarmMap({ onOpenOutbuildings }) {
  const [fieldStatus, setFieldStatus] =
    useState([]);
  const [farm, setFarm] = useState("Gellidywyll");

  useEffect(() => {
    fetch(`${API}/field-status`)
      .then((res) => res.json())
      .then((data) => setFieldStatus(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fieldsForFarm = fieldStatus.filter(
    (f) => (f.farm || "Gellidywyll") === farm
  );

  const grazingFields = fieldsForFarm.filter(
    (f) => (f.type || "field") !== "building"
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
        {grazingFields.length} fields · 🐑 {totalSheepOnFarm} sheep
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
            onClick={() => onOpenOutbuildings?.()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenOutbuildings?.();
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
              <span>▶</span>
            </div>

            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
              {WERN_VILLA_BUILDINGS.length} buildings · 🐑 {sheepInBuildings}
            </div>
          </div>

          <div />
        </div>
      </div>
      ) : grazingFields.length === 0 ? (
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
          {grazingFields.map((field) => (
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