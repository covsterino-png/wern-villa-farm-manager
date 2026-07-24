import { useEffect, useState } from "react";

export default function FlockGroupDetail({
  groupName,
  onBack,
}) {
  const [sheep, setSheep] = useState([]);

  useEffect(() => {
    fetch(
      `https://wern-villa-api.onrender.com/sheep/group/${groupName}`
    )
      .then((res) => res.json())
      .then((data) => setSheep(data));
  }, [groupName]);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          marginBottom: "20px",
        }}
      >
        ← Back
      </button>

      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 {groupName}
      </h1>

      <div
        style={{
          marginBottom: "20px",
          fontSize: "18px",
        }}
      >
        Total Sheep: {sheep.length}
      </div>

      {sheep.length === 0 ? (
        <div>
          No sheep currently assigned to
          this group.
        </div>
      ) : (
        sheep.map((animal) => (
          <div
            key={animal.id}
            style={{
              background: "#2b2b2b",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              🐑 {animal.name}
            </h3>

            <div>
              Sex: {animal.sex}
            </div>

            <div>
              EID:{" "}
              {animal.eid ||
                "Not Tagged"}
            </div>

            <div>
              Field:{" "}
              {animal.currentField ||
                "Unknown"}
            </div>

            <div>
              Mother:{" "}
              {animal.mother ||
                "Unknown"}
            </div>

            <div>
              Status:{" "}
              {animal.status ||
                "Active"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}