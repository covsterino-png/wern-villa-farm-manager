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
          <p>Size: {file.size} bytes</p>
          <p>Type: {file.type}</p>
        </div>
      )}
    </div>
  );
}