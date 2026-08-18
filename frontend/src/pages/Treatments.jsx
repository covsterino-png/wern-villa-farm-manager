import { useEffect, useState } from "react";
import { submitWrite } from "../offlineQueue";

export default function Treatments() {
  const [groupName, setGroupName] = useState("");
  const [careType, setCareType] = useState("Injection");
  const [medicine, setMedicine] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [notes, setNotes] = useState("");
  const [treatments, setTreatments] = useState([]);
  const [syncMessage, setSyncMessage] = useState("");

  const [withdrawalDays, setWithdrawalDays] =
    useState("");

  const [groups, setGroups] = useState([]);

  const [medicines, setMedicines] = useState([]);

  const selectedMedicineRecord = medicines.find(
    (item) => item.name === medicine
  );
  const calculatedCost = Number(volumeMl || 0) *
    Number(selectedMedicineRecord?.costPerMl || 0);

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
          setMedicine(data[0].name);
        }
      });
  }, []);

  function saveTreatment() {
    if (!groupName || (careType !== "Footbath" && !medicine)) {
      return;
    }

    if (careType === "Injection" && !(Number(volumeMl) > 0)) {
      alert("Enter the total injected volume in ml.");
      return;
    }

    if (careType === "Injection" && !(Number(selectedMedicineRecord?.costPerMl) >= 0)) {
      alert("Set the medicine cost per ml in Settings first.");
      return;
    }

    const treatment = careType === "Footbath"
      ? careType
      : `${careType}: ${medicine}`;

    submitWrite(
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
          volumeMl: careType === "Injection" ? Number(volumeMl) : null,
          cost: calculatedCost,
          notes,
          administeredBy:
            localStorage.getItem("user"),
        }),
      },
      `Treatment: ${treatment} for ${groupName}`
    ).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      setNotes("");
      setWithdrawalDays("");
      setVolumeMl("");
      if (data.queued) {
        setSyncMessage("Saved offline — will sync automatically once you're back online.");
      } else {
        setSyncMessage("");
        loadTreatments();
      }
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
        💉 Whole Flock Care
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

        <label>Whole-flock care</label>

        <br />
        <br />

        <select
          value={careType}
          onChange={(e) =>
            setCareType(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
          }}
        >
          <option value="Injection">Injection</option>
          <option value="Worming">Worming</option>
          <option value="Footbath">Footbath</option>
          <option value="Other">Other</option>
        </select>

        <br />
        <br />

        {careType !== "Footbath" && (
          <>
            <label>Medicine or product</label>

            <br />
            <br />

            <select
              value={medicine}
              onChange={(e) =>
                setMedicine(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
              }}
            >
              <option value="">
                Select medicine or product
              </option>
              {medicines.map((item) => (
                <option
                  key={item.id}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <br />
            <br />
          </>
        )}

        {careType === "Injection" && (
          <>
            <label>Total injected volume for this flock (ml)</label>

            <br />
            <br />

            <input
              placeholder="Total volume (ml)"
              type="number"
              min="0.01"
              step="0.01"
              value={volumeMl}
              onChange={(e) =>
                setVolumeMl(e.target.value)
              }
            />

            <br />
            <br />
          </>
        )}

        {careType === "Injection" && (
          <div style={{ color: "#aaa", marginBottom: "16px" }}>
            Calculated flock cost: £{calculatedCost.toFixed(2)}
          </div>
        )}

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
          Record Flock Care
        </button>
        {syncMessage && <p style={{ color: "#ffcc80" }}>{syncMessage}</p>}
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
    🐑 Animal: {item.sheepName}
    <br />
  </>
) : (
  <>
    👥 Group: {item.groupName}
    <br />
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

          {item.volumeMl != null && (
            <>
              <br />
              Volume: {item.volumeMl} ml
            </>
          )}

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