import { useEffect, useState } from "react";
import SheepDetail from "./SheepDetail";

export default function FlockGroupDetail({
  groupName,
  onBack,
}) {
  const [sheep, setSheep] =
    useState([]);
    const [
  selectedSheep,
  setSelectedSheep,
] = useState(null);

  function loadSheep() {
    fetch(
      `https://wern-villa-api.onrender.com/sheep/group/${groupName}`
    )
      .then((res) => res.json())
      .then((data) => setSheep(data));
  }

  useEffect(() => {
    loadSheep();
  }, [groupName]);
  if (selectedSheep) {
  return (
    <SheepDetail
      sheep={selectedSheep}
      onBack={() =>
        setSelectedSheep(null)
      }
    />
  );
}

  return (
    <div>
      <button onClick={onBack}>
        ← Back
      </button>

      <h1>
        🐑 {groupName}
      </h1>

      <h3>
        Total Sheep: {sheep.length}
      </h3>

      {sheep.length === 0 && (
        <div>
          No sheep assigned to this
          group yet.
        </div>
      )}

      {sheep.map((animal) => (
<div
  key={animal.id}
  onClick={() =>
    setSelectedSheep(animal)
  }
  style={{
    background: "#2b2b2b",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "10px",
    cursor: "pointer",
  }}
>
            🐑 {animal.name}
        </div>
      ))}
    </div>
  );
}