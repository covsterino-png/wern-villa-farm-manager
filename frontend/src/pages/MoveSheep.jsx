import { useState } from "react";

export default function MoveSheep({
  farmData,
  setFarmData,
  movements,
  setMovements,
}) {
  const [number, setNumber] = useState("");

  const [fromLocation, setFromLocation] =
    useState("Gellidywyll");

  const [toLocation, setToLocation] =
    useState("Wern Villa");

  function moveSheep() {
    const qty = parseInt(number);

    if (!qty || qty <= 0) {
      return;
    }

    if (fromLocation === toLocation) {
      alert(
        "From and To locations must be different."
      );
      return;
    }

    setMovements([
      ...movements,
      {
        number: qty,
        from: fromLocation,
        to: toLocation,
        date: new Date().toLocaleDateString(),
      },
    ]);

    fetch(
      "https://wern-villa-api.onrender.com/movements",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          number: qty,
          fromLocation,
          toLocation,
          moveDate:
            new Date().toLocaleDateString(),
          movedBy:
            localStorage.getItem("user"),
        }),
      }
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        console.log(
          "Movement Saved",
          data
        );
      })
      .catch((error) => {
        console.error(error);
      });

    setNumber("");
  }

  return (
    <div>
      <h1>🚜 Move Sheep</h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "500px",
        }}
      >
        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <label>
            From:
          </label>

          <br />

          <select
            value={fromLocation}
            onChange={(e) =>
              setFromLocation(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "10px",
            }}
          >
            <option>
              Gellidywyll
            </option>
            <option>
              Wern Villa
            </option>
          </select>
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <label>To:</label>

          <br />

          <select
            value={toLocation}
            onChange={(e) =>
              setToLocation(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "10px",
            }}
          >
            <option>
              Wern Villa
            </option>
            <option>
              Gellidywyll
            </option>
          </select>
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <label>
            Number of Sheep:
          </label>

          <br />

          <input
            type="number"
            value={number}
            onChange={(e) =>
              setNumber(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "10px",
            }}
          />
        </div>

        <button
          onClick={moveSheep}
        >
          Move Sheep
        </button>
      </div>
    </div>
  );
}