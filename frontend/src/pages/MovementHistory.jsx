import { useEffect, useState } from "react";

export default function MovementHistory() {
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    fetch("https://wern-villa-api.onrender.com/movements")
      .then((response) => response.json())
      .then((data) => {
        setMovements(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>📜 Movement History</h1>

      {movements.length === 0 ? (
        <p>No movements recorded.</p>
      ) : (
        <div>
          {movements.map((move) => (
            <div
              key={move.id}
              style={{
                background: "#1f1f1f",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "10px",
                border: "1px solid #333",
              }}
            >
              <strong>
                {move.number} sheep
              </strong>

              <br />

              {move.fromLocation}
              {" → "}
              {move.toLocation}

              <br />

              {move.moveDate}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}