export default function SheepDetail({
  sheep,
  onBack,
}) {
  return (
    <div>
<button
  onClick={onBack}
  style={{
    background: "#03a9f4",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "20px",
  }}
>
  ← Breeding Ewes
</button>
<h1
  style={{
    color: "#03a9f4",
  }}
>
  🐑 {sheep.name}
</h1>
      <div
        style={{
          background: "#2b2b2b",
          padding: "15px",
          borderRadius: "10px",
          marginTop: "20px",
        }}
      >
        <p>
          <strong>Sex:</strong>{" "}
          {sheep.sex}
        </p>

        <p>
<strong>EID:</strong>{" "}
{sheep.eid || "Not Tagged Yet"}
        </p>

        <p>
          <strong>DOB:</strong>{" "}
          {sheep.dob ||
            "Unknown"}
        </p>

        <p>
          <strong>Mother:</strong>{" "}
          {sheep.mother ||
            "Unknown"}
        </p>

        <p>
          <strong>Group:</strong>{" "}
          {sheep.groupName}
        </p>

        <p>
          <strong>Field:</strong>{" "}
          {sheep.currentField}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {sheep.status}
        </p>

        <p>
          <strong>Notes:</strong>{" "}
          {sheep.notes ||
            "None"}
        </p>
      </div>
    </div>
  );
}