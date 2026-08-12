import { useEffect, useState } from "react";
import { API } from "../api";
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
    fetch(`${API}/sheep/group/${groupName}`)
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

<h3
  style={{
    color: "#03a9f4",
  }}
>
  {sheep.length} Sheep
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
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "12px",
    cursor: "pointer",
    border: "1px solid #444",
    fontSize: "18px",
    fontWeight: "bold",
  }}
>
  🐑 {animal.name} →
</div>
      ))}
    </div>
  );
}