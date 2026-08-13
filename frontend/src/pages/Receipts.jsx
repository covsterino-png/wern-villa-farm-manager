import { useState, useEffect } from "react";
import { API } from "../api";

export default function Receipts() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] =
  useState([]);
  const [selectedReceipt, setSelectedReceipt] =
  useState(null);
  const [error, setError] = useState("");

function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      const maxWidth = 600;

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height =
          (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.3
      );
    };

    img.src =
      URL.createObjectURL(file);
  });
}

  useEffect(() => {
    fetch(`${API}/receipts`)
      .then((res) => res.json())
      .then((data) => {
        setReceipts(data);
      })
      .catch(console.error);
  }, []);

 async function loadReceipt(id) {
  const response = await fetch(
    `${API}/receipts/${id}`
  );

  const data = await response.json();

  setSelectedReceipt(data.receipt);
} 
  async function processReceipt() {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
const compressedFile =
  await resizeImage(file);

const formData = new FormData();

formData.append(
  "receipt",
  compressedFile,
  file.name
);
      const response = await fetch(
        `${API}/receipts/ocr`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Receipt processing failed");
      }

      setOcrText(data.rawText || "");
      const receiptResponse = await fetch(`${API}/receipts/${data.receiptId}`);
      const receiptData = await receiptResponse.json();
      setSelectedReceipt(receiptData.receipt);
      const historyResponse = await fetch(`${API}/receipts`);
      setReceipts(await historyResponse.json());
      setFile(null);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to process receipt");
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

      {error && <p style={{ color: "#ff8a80" }}>{error}</p>}

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

          <img
            src={URL.createObjectURL(file)}
            alt="Selected receipt"
            style={{
              display: "block",
              maxWidth: "min(100%, 420px)",
              maxHeight: "360px",
              objectFit: "contain",
              marginBottom: "16px",
              borderRadius: "8px",
            }}
          />

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
      <div
  style={{
    marginTop: "30px",
  }}
>
    {selectedReceipt && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
    }}
  >
    <h2>🧾 Receipt Details</h2>

    {selectedReceipt.imageUrl && (
      <img
        src={selectedReceipt.imageUrl}
        alt="Receipt"
        style={{
          display: "block",
          maxWidth: "min(100%, 520px)",
          maxHeight: "520px",
          objectFit: "contain",
          marginBottom: "16px",
          borderRadius: "8px",
        }}
      />
    )}

    <p>
      Date:
      {" "}
      {selectedReceipt.createdDate}
    </p>

    <pre
      style={{
        whiteSpace: "pre-wrap",
      }}
    >
      {selectedReceipt.rawText}
    </pre>
  </div>
)}
  <h2
    style={{
      color: "#03a9f4",
    }}
  >
    📜 Receipt History
  </h2>

  {receipts.length === 0 ? (
    <p>No receipts yet.</p>
  ) : (
receipts.map((receipt) => (
  <div
    key={receipt.id}
    onClick={() => loadReceipt(receipt.id)}
            style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "10px",
          border: "1px solid #333",
        }}
      >
       {receipt.imageUrl && (
  <a
    href={receipt.imageUrl}
    target="_blank"
    rel="noreferrer"
    style={{
      color: "#2563eb",
      textDecoration: "underline",
      display: "block",
      marginTop: "8px",
    }}
  >
    View Receipt
  </a>
)} 
<strong>
  {receipt.supplier ||
    `Receipt #${receipt.id}`}
</strong>

<br />

<small>
  {receipt.createdDate}
</small>

{receipt.total && (
  <p>
    £{receipt.total}
  </p>
)}
        <p
          style={{
            whiteSpace: "pre-wrap",
            marginTop: "10px",
          }}
        >
          {receipt.rawText}
        </p>
      </div>
    ))
  )}
</div>
    </div>
  );
}