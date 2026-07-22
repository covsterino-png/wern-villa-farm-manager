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
          maxWidth: "1200px",
          height: "700px",
          backgroundImage: `url(${mapImage})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          borderRadius: "20px",
          overflow: "hidden",
          margin: "0 auto",
        }}
      >
        <FieldMarker
          title="🏠 Home & Yard"
          top="62%"
          left="12%"
        />

        <FieldMarker
          title="🌱 Field 1"
          top="72%"
          left="32%"
        />

        <FieldMarker
          title="🌱 Field 2"
          top="38%"
          left="34%"
        />

        <FieldMarker
          title="🌱 Field 3"
          top="42%"
          left="58%"
        />

        <FieldMarker
          title="🌱 Field 4"
          top="30%"
          left="83%"
        />
      </div>
    </div>
  );
}

function FieldMarker({
  title,
  top,
  left,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: "translate(-50%, -50%)",
        background: "rgba(0,0,0,0.85)",
        padding: "12px",
        borderRadius: "12px",
        border: "2px solid #03a9f4",
        color: "white",
        minWidth: "120px",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <strong>{title}</strong>

      <br />

      ⚪ Empty

      <br />

      🐑 0 Sheep
    </div>
  );
}