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

  const [groups, setGroups] = useState([]);

  const [medicines, setMedicines] = useState([]);

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

    fetch(
      "https://wern-villa-api.onrender.com/flock-groups"
    )
      .then((response) => response.json())
      .then((data) => {
        setGroups(data);

        if (data.length > 0) {
          setGroupName(data[0].name);
        }
      });

    fetch(
      "https://wern-villa-api.onrender.com/medicines"
    )
      .then((response) => response.json())
      .then((data) => {
        setMedicines(data);

        if (data.length > 0) {
          setTreatment(data[0].name);
        }
      });
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
          "Content-Type":
            "application/json",
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
      setNotes("");
      setCost("");
      setWithdrawalDays("");
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
        <label>Group</label>

        <br />
        <br />

        <select
          value={groupName}
          onChange={(e) =>
            setGroupName(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
          }}
        >
          {groups.map((group) => (
            <option
              key={group.id}
              value={group.name}
            >
              {group.name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <label>Medicine</label>

        <br />
        <br />

        <select
          value={treatment}
          onChange={(e) =>
            setTreatment(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
          }}
        >
          {medicines.map((medicine) => (
            <option
              key={medicine.id}
              value={medicine.name}
            >
              {medicine.name}
            </option>
          ))}
        </select>

        <br />
        <br />

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
            setWithdrawalDays(
              e.target.value
            )
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

      <h2
        style={{
          color: "#03a9f4",
        }}
      >
        History
      </h2>

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
<strong>
  {item.treatment}
</strong>

<br />

{item.sheepName ? (
  <>
    🐑 {item.sheepName}
  </>
) : (
  <>
    👥 Group: {item.groupName}
  </>
)}

<br />
          <br />

          Date: {item.treatmentDate}

          <br />

          Cost: £{item.cost}

          <br />

          Withdrawal Days:{" "}
          {item.withdrawalDays}

          <br />

          Administered By:{" "}
          {item.administeredBy}

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