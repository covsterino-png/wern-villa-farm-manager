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
          position: "relative",
          maxWidth: "1000px",
          height: "600px",
          background: "#1f1f1f",
          borderRadius: "20px",
          overflow: "hidden",
          border: "2px solid #333",
        }}
      >
        <FieldBlock
          name="🏠 Home & Yard"
          top="55%"
          left="5%"
          width="18%"
          height="18%"
          colour="#607d8b"
        />

        <FieldBlock
          name="🌱 Field 1"
          top="55%"
          left="25%"
          width="35%"
          height="30%"
          colour="#4caf50"
        />

        <FieldBlock
          name="🌱 Field 2"
          top="20%"
          left="20%"
          width="25%"
          height="25%"
          colour="#4caf50"
        />

        <FieldBlock
          name="🌱 Field 3"
          top="20%"
          left="48%"
          width="22%"
          height="55%"
          colour="#4caf50"
        />

        <FieldBlock
          name="🌱 Field 4"
          top="15%"
          left="72%"
          width="23%"
          height="45%"
          colour="#4caf50"
        />
      </div>
    </div>
  );
}

function FieldBlock({
  name,
  top,
  left,
  width,
  height,
  colour,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        background: `${colour}22`,
        border: `3px solid ${colour}`,
        borderRadius: "12px",
        padding: "10px",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          color: colour,
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        {name}
      </div>

      <div>⚪ Empty</div>
      <div>🐑 0 Sheep</div>
    </div>
  );
}