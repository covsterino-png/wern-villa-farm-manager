import { useEffect, useState } from "react";
export default function FarmMap() {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/fields"
    )
      .then((res) => res.json())
      .then((data) => setFields(data))
      .catch(console.error);
  }, []);  return (
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
{fields.map((field) => (
  <FieldCard
    key={field.id}
    name={`🌱 ${field.name}`}
    colour="#43a047"
    sheep="0 Sheep"
    status="⚪ Empty"
    height="120px"
  />
))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "12px",
            marginTop: "-112px",
          }}
        >
          <FieldCard
            name="🏠 Home & Yard"
            colour="#607d8b"
            sheep="-"
            status="Buildings"
            height="90px"
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
  status,
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
        cursor: "pointer",
      }}
    >
      <strong>{name}</strong>

      <div>
        <div>{status}</div>
        <div>🐑 {sheep}</div>
      </div>
    </div>
  );
}