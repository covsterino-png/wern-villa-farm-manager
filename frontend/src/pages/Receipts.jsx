import { useState } from "react";

export default function Receipts() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);

  async function processReceipt() {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "receipt",
        file
      );

      const response = await fetch(
        "https://wern-villa-api.onrender.com/receipts/ocr",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setOcrText(data.rawText || "");
    } catch (err) {
      console.error(err);

      alert(
        "Failed to process receipt"
      );
    }

    setLoading(false);
  }

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
        Take a photo of a receipt and
        extract information automatically.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (
            e.target.files &&
            e.target.files.length > 0
          ) {
            setFile(
              e.target.files[0]
            );
          }
        }}
      />

      {file && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <p>
            ✅ Selected:
            {" "}
            {file.name}
          </p>

          <button
            onClick={
              processReceipt
            }
            disabled={loading}
            style={{
              background:
                "#03a9f4",
              color: "white",
              border: "none",
              padding:
                "12px 20px",
              borderRadius:
                "8px",
              cursor:
                "pointer",
            }}
          >
            {loading
              ? "Processing..."
              : "🔍 Process Receipt"}
          </button>
        </div>
      )}

      {ocrText && (
        <div
          style={{
            marginTop: "30px",
            background:
              "#1f1f1f",
            padding: "20px",
            borderRadius:
              "12px",
            whiteSpace:
              "pre-wrap",
          }}
        >
          <h2>OCR Result</h2>

          {ocrText}
        </div>
      )}
    </div>
  );
}