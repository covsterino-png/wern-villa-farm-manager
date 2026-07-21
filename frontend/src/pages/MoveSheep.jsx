import { useState } from "react";

export default function MoveSheep({
  farmData,
  setFarmData,
  movements,
  setMovements,
}) {
  const [number, setNumber] = useState("");

  function moveSheep() {
    const qty = parseInt(number);

    if (!qty || qty <= 0) {
      return;
    }

    setFarmData({
      ...farmData,

      locations: {
        wernVilla:
          farmData.locations.wernVilla + qty,

        gellidywyll:
          farmData.locations.gellidywyll - qty,
      },
    });

    setMovements([
      ...movements,

      {
        number: qty,
        from: "Gellidywyll",
        to: "Wern Villa",
        date: new Date().toLocaleDateString(),
      },
    ]);

    fetch("https://wern-villa-farm-manager.onrender.com/movements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: qty,
        fromLocation: "Gellidywyll",
        toLocation: "Wern Villa",
        moveDate: new Date().toLocaleDateString(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Movement Saved", data);
      })
      .catch((error) => {
        console.error(error);
      });

    setNumber("");
  }

  return (
    <div>
      <h1>🚜 Move Sheep</h1>

      <p>
        Move sheep from Gellidywyll to
        {" "}
        Wern Villa
      </p>

      <input
        type="number"
        value={number}
        onChange={(e) =>
          setNumber(e.target.value)
        }
      />

      <button onClick={moveSheep}>
        Move
      </button>
    </div>
  );
}