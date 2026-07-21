export default function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#2b2b2b",
        borderRadius: "16px",
        padding: "20px",
        minWidth: "180px",
        color: "white",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid #404040",
      }}
    >
      <div
        style={{
          fontSize: "0.9rem",
          color: "#a0a0a0",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#03a9f4",
        }}
      >
        {value}
      </div>
    </div>
  );
}