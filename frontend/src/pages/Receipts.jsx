export default function Receipts() {
  return (
    <div>
      <h1>🧾 Receipts</h1>

      <p>
        Take a photo of a receipt and extract
        information automatically.
      </p>
    </div>
  );
}
import { useState } from "react";

export default function Receipts() {
  const [file, setFile] = useState(null);

  return (
    <div>
      <h1>🧾 Receipts</h1>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) =>
          setFile(e.target.files[0])
        }
      />

      {file && (
        <p>
          Selected: {file.name}
        </p>
      )}
    </div>
  );
}