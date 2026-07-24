export default function SheepDetail({
  sheep,
  onBack,
}) {
  return (
    <div>
      <button onClick={onBack}>
        ← Back
      </button>

      <h1>
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
          {sheep.eid ||
            "Not Tagged"}
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