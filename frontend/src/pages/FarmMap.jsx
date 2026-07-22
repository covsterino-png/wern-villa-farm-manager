import mapImage from "../assets/wern-villa-map.png";

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
          width: "100%",
          maxWidth: "800px",
          height: "1400px",
          margin: "0 auto",
          backgroundImage: `url(${mapImage})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {/* 5 Acre Field */}

        <FieldArea
          title="🌱 5 Acre Field"
          top="3%"
          left="16%"
          width="68%"
          height="22%"
          colour="#4caf50"
        />

        {/* 4 Acre Field */}

        <FieldArea
          title="🌱 4 Acre Field"
          top="26%"
          left="16%"
          width="68%"
          height="23%"
          colour="#4caf50"
        />

        {/* Paddock */}

        <FieldArea
          title="🌱 Paddock"
          top="50%"
          left="16%"
          width="22%"
          height="20%"
          colour="#8bc34a"
        />

        {/* Pond Field */}

        <FieldArea
          title="🌱 Pond Field"
          top="50%"
          left="40%"
          width="44%"
          height="42%"
          colour="#66bb6a"
        />

        {/* Home & Yard */}

        <FieldArea
          title="🏠 Home & Yard"
          top="71%"
          left="16%"
          width="18%"
          height="14%"
          colour="#607d8b"
        />
      </div>
    </div>
  );
}

function FieldArea({
  title,
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
        background: `${colour}55`,
        border: `3px solid ${colour}`,
        borderRadius: "12px",
        padding: "10px",
        boxSizing: "border-box",
        color: "white",
        cursor: "pointer",
        backdropFilter: "blur(2px)",
      }}
    >
      <strong>{title}</strong>

      <br />
      <br />

      ⚪ Empty

      <br />

      🐑 0 Sheep
    </div>
  );
}