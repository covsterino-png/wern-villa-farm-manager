export default function FarmMap() {
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
          name="🌱 5 Acre Field"
          colour="#2e7d32"
          sheep="0 Sheep"
          status="⚪ Empty"
          height="90px"
        />

        <FieldCard
          name="🌱 4 Acre Field"
          colour="#388e3c"
          sheep="0 Sheep"
          status="⚪ Empty"
          height="90px"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "12px",
          }}
        >
          <FieldCard
            name="🌱 Paddock"
            colour="#66bb6a"
            sheep="0 Sheep"
            status="⚪ Empty"
            height="180px"
          />

          <FieldCard
            name="🌱 Pond Field"
            colour="#43a047"
            sheep="0 Sheep"
            status="⚪ Empty"
            height="280px"
          />
        </div>

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