import { useEffect, useState } from "react";
import { API } from "../api";

export default function Feed() {
  const [groups, setGroups] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    groupNames: [],
    feedType: "",
    feedDate: new Date().toISOString().split("T")[0],
    totalCost: "",
    notes: "",
  });

  const load = () => {
    fetch(`${API}/feed-records`)
      .then((res) => res.json())
      .then(setRecords);
  };

  useEffect(() => {
    // Use the real flock register (same list sheep are assigned to via
    // SheepRegister/SheepDetail/MoveGroup) so names always match sheep.groupName.
    fetch(`${API}/flock-register`)
      .then((res) => res.json())
      .then((data) => {
        setGroups(data);
      });
    load();
  }, []);

  const save = async () => {
    if (form.groupNames.length === 0 || !form.feedType.trim() || !(Number(form.totalCost) >= 0)) {
      alert("Enter the flock, feed type, and total cost.");
      return;
    }

    const response = await fetch(`${API}/feed-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalCost: Number(form.totalCost),
        recordedBy: localStorage.getItem("user"),
      }),
    });

    if (!response.ok) {
      alert("The feed record could not be saved.");
      return;
    }

    setForm((current) => ({
      ...current,
      feedType: "",
      totalCost: "",
      notes: "",
    }));
    load();
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1 style={{ color: "#03a9f4" }}>🌾 Flock Feed</h1>
      <p style={{ color: "#aaa" }}>
        Record the flock&apos;s total feed cost once. The cost is allocated per sheep using the flock size at the time of entry.
      </p>
      <div style={{ background: "#1f1f1f", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <strong>Flocks included</strong>
          {groups.map((group) => (
            <label key={group.id} style={{ display: "block", marginTop: "8px" }}>
              <input
                type="checkbox"
                checked={form.groupNames.includes(group.name)}
                onChange={(e) => setForm({
                  ...form,
                  groupNames: e.target.checked
                    ? [...form.groupNames, group.name]
                    : form.groupNames.filter((name) => name !== group.name),
                })}
              />{" "}{group.name}
            </label>
          ))}
        </div>
        <input placeholder="Feed type or description" value={form.feedType} onChange={(e) => setForm({ ...form, feedType: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
        <input type="date" value={form.feedDate} onChange={(e) => setForm({ ...form, feedDate: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
        <input type="number" min="0" step="0.01" placeholder="Total flock cost (£)" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", minHeight: "70px", padding: "10px", marginBottom: "10px" }} />
        <button onClick={save} style={{ background: "#4caf50", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px" }}>
          Record Flock Feed
        </button>
      </div>
      <h2>Feed history</h2>
      {records.map((record) => (
        <div key={record.id} style={{ background: "#1f1f1f", padding: "14px", borderRadius: "10px", marginBottom: "10px" }}>
          <strong>{record.feedType}</strong><br />
          Flocks: {record.groupName}<br />
          Date: {record.feedDate}<br />
          Total: £{Number(record.totalCost || 0).toFixed(2)}<br />
          Approx. per sheep: £{Number(record.costPerSheep || 0).toFixed(2)} ({record.sheepCount} sheep)
          {record.notes && <><br />Notes: {record.notes}</>}
        </div>
      ))}
    </div>
  );
}
