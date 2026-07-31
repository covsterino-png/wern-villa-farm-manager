import { useState, useEffect } from "react";

export default function Receipts() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] =
  useState([]);
  const [selectedReceipt, setSelectedReceipt] =
  useState(null);

const [receiptItems, setReceiptItems] =
  useState([]);
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
    fetch(
      "https://wern-villa-api.onrender.com/receipts"
    )
      .then((res) => res.json())
      .then((data) => {
        setReceipts(data);
      })
      .catch(console.error);
  }, []);

 async function loadReceipt(id) {
  const response = await fetch(
    `https://wern-villa-api.onrender.com/receipts/${id}`
  );

  const data = await response.json();

  setSelectedReceipt(data.receipt);
  setReceiptItems(data.items);
} 
  async function processReceipt() {
    if (!file) return;

    setLoading(true);

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
        <strong>
          Receipt #{receipt.id}
        </strong>

        <br />

        <small>
          {receipt.createdDate}
        </small>

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