export default function FarmMap() {
  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        🗺️ Wern Villa Farm Map
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: "15px",
          maxWidth: "1000px",
        }}
      >
        <FieldCard
          name="🏠 Home & Yard"
          colour="#607d8b"
        />

        <FieldCard
          name="🌱 Field 2"
          colour="#4caf50"
        />

        <FieldCard
          name="🌱 Field 4"
          colour="#4caf50"
        />

        <div />

        <FieldCard
          name="🌱 Field 1"
          colour="#4caf50"
        />

        <div />

        <FieldCard
          name="🌱 Field 3"
          colour="#4caf50"
        />
      </div>
    </div>
  );
}

function FieldCard({
  name,
  colour,
}) {
  return (
    <div
      style={{
        background: "#1f1f1f",
        border: `2px solid ${colour}`,
        borderRadius: "16px",
        padding: "25px",
        minHeight: "140px",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: colour,
        }}
      >
        {name}
      </h3>

      <p>⚪ Empty</p>

      <p>🐑 0 Sheep</p>
    </div>
  );
}