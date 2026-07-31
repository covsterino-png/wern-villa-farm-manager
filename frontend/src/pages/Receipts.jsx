import { useState } from "react";

export default function Receipts() {
  const [file, setFile] = useState(null);

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
      }}
    >
      <h1 style={{ color: "#03a9f4" }}>
        🧾 Receipts
      </h1>

      <p>
        Take a photo of a receipt and extract information automatically.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
          }
        }}
      />

      {file && (
        <div style={{ marginTop: "20px" }}>
          <p>✅ Selected: {file.name}</p>

          <button
            style={{
              background: "#03a9f4",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            🔍 Process Receipt
          </button>
        </div>
      )}
    </div>
  );
}