import { useEffect, useState } from "react";
import { API } from "../api";

function formatEids(value) {
  try {
    return JSON.parse(value || "[]").join(", ");
  } catch {
    return "Unable to read the saved EID list.";
  }
}

export default function MovementHistory() {
  const [movements, setMovements] = useState([]);
  const [submittingId, setSubmittingId] = useState(null);

  function loadMovements() {
    fetch(`${API}/movements`)
      .then((response) => response.json())
      .then((data) => {
        setMovements(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    loadMovements();
  }, []);

  async function submitToEidCymru(submissionId) {
    setSubmittingId(submissionId);
    try {
      const response = await fetch(`${API}/eid-cymru/submissions/${submissionId}/submit`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit movement");
      if (data.status === "submitted") {
        alert("Movement submitted to EID Cymru.");
      } else {
        alert(`EID Cymru could not accept the movement: ${data.error || "check the review details"}`);
      }
      loadMovements();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div>
<h1
  style={{
    color: "#03a9f4",
    marginBottom: "20px",
  }}
>
  📜 History
</h1>
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
                🐑 {move.number} sheep
              </strong>

              <br />

              {move.fromLocation}
              {" → "}
              {move.toLocation}

              <br />

              <span
                style={{
                  color: "#888",
                }}
              >
                {move.moveDate}
              </span>

              {move.movedBy && (
                <>
                  <br />

                  <span
                    style={{
                      color: "#03a9f4",
                    }}
                  >
                    Moved by: {move.movedBy}
                  </span>
                </>
              )}

              {move.eidCymruStatus && (
                <>
                  <br />

                  <span
                    style={{
                      color:
                        move.eidCymruStatus === "submitted"
                          ? "#4caf50"
                          : move.eidCymruStatus === "blocked"
                            ? "#ff9800"
                            : "#ffeb3b",
                    }}
                  >
                    EID Cymru: {move.eidCymruStatus}
                  </span>

                  {move.eidCymruError && (
                    <small style={{ display: "block", color: "#aaa" }}>
                      {move.eidCymruError}
                    </small>
                  )}

                  {move.eidCymruStatus === "review" && (
                    <>
                      <details style={{ marginTop: "8px" }}>
                        <summary>Review sheep EIDs</summary>
                        <small style={{ display: "block", color: "#aaa", marginTop: "6px" }}>
                          {formatEids(move.eidCymruAnimalEids)}
                        </small>
                      </details>
                      <button
                        type="button"
                        onClick={() => submitToEidCymru(move.eidCymruSubmissionId)}
                        disabled={submittingId === move.eidCymruSubmissionId}
                        style={{ display: "block", marginTop: "10px" }}
                      >
                        {submittingId === move.eidCymruSubmissionId
                          ? "Submitting..."
                          : "Submit to EID Cymru"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}