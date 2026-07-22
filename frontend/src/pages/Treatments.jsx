import { useEffect, useState } from "react";

export default function Treatments() {
  const [groupName, setGroupName] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [treatments, setTreatments] = useState([]);
  const [withdrawalDays, setWithdrawalDays] =
  useState("");

const [cost, setCost] =
  useState("");

  function loadTreatments() {
    fetch(
      "https://wern-villa-api.onrender.com/treatments"
    )
      .then((response) => response.json())
      .then((data) => {
        setTreatments(data);
      });
  }

  useEffect(() => {
    loadTreatments();
  }, []);

  function saveTreatment() {
    if (!groupName || !treatment) {
      return;
    }

    fetch(
      "https://wern-villa-api.onrender.com/treatments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  groupName,
  treatment,
  treatmentDate:
    new Date().toLocaleDateString(),
  withdrawalDays,
  cost,
  notes,
  administeredBy:
    localStorage.getItem("user"),
}),
      }
    ).then(() => {
      setGroupName("");
      setTreatment("");
      setNotes("");
      loadTreatments();
    });
  }

  return (
    <div>
<h1
  style={{
    color: "#03a9f4",
    marginBottom: "20px",
  }}
>
  💉 Treatments
</h1>
      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          placeholder="Group or Animal"
          value={groupName}
          onChange={(e) =>
            setGroupName(e.target.value)
          }
        />

        <br />
        <br />

        <input
          placeholder="Treatment"
          value={treatment}
          onChange={(e) =>
            setTreatment(e.target.value)
          }
        />
<input
  placeholder="Cost (£)"
  type="number"
  value={cost}
  onChange={(e) =>
    setCost(e.target.value)
  }
/>

<br />
<br />

<input
  placeholder="Withdrawal Days"
  type="number"
  value={withdrawalDays}
  onChange={(e) =>
    setWithdrawalDays(e.target.value)
  }
/>
        <br />
        <br />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
        />

        <br />
        <br />

        <button onClick={saveTreatment}>
          Save Treatment
        </button>
      </div>

      <h2>History</h2>

      {treatments.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#1f1f1f",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "10px",
          }}
        >
          <strong>{item.treatment}</strong>

          <br />

          Group: {item.groupName}

          <br />

          Date: {item.treatmentDate}

          <br />

          Administered By: {item.administeredBy}

          {item.notes && (
            <>
              <br />
              Notes: {item.notes}
            </>
          )}
        </div>
      ))}
    </div>
  );
}