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
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        🧾 Receipts
      </h1>

      <p>
        Take a photo of a receipt and extract
        information automatically.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) =>
          setFile(e.target.files[0])
        }
        style={{
          marginTop: "20px",
          marginBottom: "20px",
        }}
      />

      {file && (
        <div>
          <p>
            ✅ Selected: {file.name}
          </p>

          {URL.createObjectURL(file)}            alt="Receipt"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "12px",
              border: "1px solid #444",
              marginTop: "10px",
            }}
          
        </div>
      )}
    </div>
  );
}