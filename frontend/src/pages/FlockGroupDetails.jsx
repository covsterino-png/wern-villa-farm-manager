import { useEffect, useState } from "react";

export default function FlockGroupDetail({
  groupName,
  onBack,
}) {
  const [sheep, setSheep] =
    useState([]);

  useEffect(() => {
    fetch(
      `https://wern-villa-api.onrender.com/sheep/group/${groupName}`
    )
      .then((res) => res.json())
      .then((data) => setSheep(data));
  }, [groupName]);

  return (
    <div>
      <button onClick={onBack}>
        ← Back
      </button>

      <h1>
        🐑 {groupName}
      </h1>

      <p>
        {sheep.length} Sheep
      </p>

      {sheep.map((animal) => (
        <div
          key={animal.id}
          style={{
            background: "#2b2b2b",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            🐑 {animal.name}
          </strong>

          <div>
            Sex: {animal.sex}
          </div>

          <div>
            Field:
            {" "}
            {animal.currentField}
          </div>
        </div>
      ))}
    </div>
  );
}