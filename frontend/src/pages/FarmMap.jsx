import { useEffect, useState } from "react";
import { API } from "../api";

export default function FarmMap() {
  const [fieldStatus, setFieldStatus] =
    useState([]);

  useEffect(() => {
    fetch(`${API}/field-status`)
      .then((res) => res.json())
      .then((data) => setFieldStatus(data))
      .catch(console.error);
  }, []);

  const field1 = fieldStatus.find(
    (f) => Number(f.position) === 1
  );

  const field2 = fieldStatus.find(
    (f) => Number(f.position) === 2
  );

  const field3 = fieldStatus.find(
    (f) => Number(f.position) === 3
  );

  const field4 = fieldStatus.find(
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

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        🗺️ Wern Villa Farm
      </h1>

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
          <FieldCard
            name="🏠 Home & Yard"
            colour="#607d8b"
            sheep="-"
            height="65px"
            building
          />

          <div />
        </div>
      </div>
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
  building,
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

      {building ? (
        <div>Buildings</div>
      ) : (
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
      )}
    </div>
  );
}