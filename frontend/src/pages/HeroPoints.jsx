import { useEffect, useState } from "react";
import { fetchJson } from "../api";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#2b2b2b",
  color: "white",
};

const panelStyle = {
  background: "#1f1f1f",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
};

export default function HeroPoints({ user }) {
  const [data, setData] = useState({ balance: 0, entries: [], rewards: [], redemptions: [] });
  const [points, setPoints] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState("");
  const [editingReward, setEditingReward] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setData(await fetchJson("/hero-points"));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveEntry(event) {
    event.preventDefault();
    const path = editingEntry ? `/hero-points/${editingEntry.id}` : "/hero-points";
    try {
      await fetchJson(path, {
        method: editingEntry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, description, entryDate }),
      });
      setPoints("");
      setDescription("");
      setEntryDate(new Date().toISOString().slice(0, 10));
      setEditingEntry(null);
      setMessage("Points saved");
      await load();
    } catch (error) { setMessage(error.message); }
  }

  async function addReward(event) {
    event.preventDefault();
    try {
      await fetchJson(editingReward ? `/hero-rewards/${editingReward.id}` : "/hero-rewards", {
        method: editingReward ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rewardName, cost: rewardCost }),
      });
      setRewardName("");
      setRewardCost("");
      setEditingReward(null);
      setMessage("Reward added");
      await load();
    } catch (error) { setMessage(error.message); }
  }

  async function redeem(reward) {
    if (!window.confirm(`Request ${reward.name} for ${reward.cost} points?`)) return;
    try {
      await fetchJson(`/hero-rewards/${reward.id}/redeem`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestDate, deliveryDate: deliveryDate || null }) });
      setMessage("Redemption requested");
      setRequestDate(new Date().toISOString().slice(0, 10));
      setDeliveryDate("");
      await load();
    } catch (error) { setMessage(error.message); }
  }

  async function completeRedemption(redemption) {
    if (!window.confirm(`Mark ${redemption.rewardName} as complete?`)) return;
    try {
      await fetchJson(`/hero-redemptions/${redemption.id}/complete`, { method: "PUT" });
      setMessage("Redemption marked complete");
      await load();
    } catch (error) { setMessage(error.message); }
  }

  function entryList(title, entries, emptyMessage) {
    return (
      <div style={panelStyle}>
        <h2>{title}</h2>
        {entries.length === 0 && <p style={{ color: "#aaa" }}>{emptyMessage}</p>}
        {entries.map((entry) => (
          <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderBottom: "1px solid #444", padding: "10px 0", flexWrap: "wrap" }}>
            <span>{entry.description}<br /><small style={{ color: "#aaa" }}>{entry.createdBy} • {entry.createdDate}</small></span>
            <span style={{ color: Number(entry.points) >= 0 ? "#8bc34a" : "#ff8a80", fontWeight: "bold" }}>
              {Number(entry.points) >= 0 ? "+" : ""}{entry.points}
              {user === "David" && Number(entry.points) > 0 && <button onClick={() => { setEditingEntry(entry); setPoints(entry.points); setDescription(entry.description); setEntryDate(entry.createdDate?.slice(0, 10)); }} style={{ marginLeft: "8px" }}>Edit</button>}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ color: "#03a9f4" }}>Hero Points</h1>
      <div style={{ ...panelStyle, textAlign: "center", border: "1px solid #03a9f4" }}>
        <div style={{ color: "#aaa" }}>Current balance</div>
        <div style={{ color: "#03a9f4", fontSize: "3rem", fontWeight: "bold" }}>{data.balance}</div>
        <div>points</div>
      </div>

      <div style={panelStyle}>
        <h2>{editingEntry ? "Edit points" : "Add Hero Points"}</h2>
        {!editingEntry && <p style={{ color: "#aaa" }}>Add points immediately with a reason. David can edit entries later.</p>}
        <form onSubmit={saveEntry} style={{ display: "grid", gap: "10px", maxWidth: "520px" }}>
          <input required min="1" step="1" type="number" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Points" style={inputStyle} />
          <input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Reason or description" style={inputStyle} />
          <label>Date added<input required type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} style={inputStyle} /></label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit">{editingEntry ? "Save changes" : "Add points"}</button>
            {editingEntry && <button type="button" onClick={() => { setEditingEntry(null); setPoints(""); setDescription(""); }}>Cancel</button>}
          </div>
        </form>
        <p style={{ color: "#aaa" }}>{user} is recording this entry.</p>
      </div>

      <div style={panelStyle}>
        <h2>Request Hero Points Redemption</h2>
        <p style={{ color: "#aaa" }}>Choose a reward from the price list. The request stays pending until David marks it complete.</p>
        <div style={{ display: "grid", gap: "10px", maxWidth: "520px", marginBottom: "12px" }}>
          <label>Request date<input required type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} style={inputStyle} /></label>
          <label>Reward delivery date<input required type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} style={inputStyle} /></label>
        </div>
        {data.rewards.length === 0 && <p style={{ color: "#aaa" }}>No rewards have been added yet.</p>}
        <div style={{ display: "grid", gap: "10px" }}>
          {data.rewards.map((reward) => (
            <div key={reward.id} style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #444", padding: "10px 0", flexWrap: "wrap" }}>
              <span>{reward.name} <strong style={{ color: "#03a9f4" }}>{reward.cost} points</strong></span>
              <div style={{ display: "flex", gap: "8px" }}><button onClick={() => redeem(reward)}>Request redemption</button>{user === "David" && <button onClick={() => { setEditingReward(reward); setRewardName(reward.name); setRewardCost(reward.cost); }}>Edit list item</button>}</div>
            </div>
          ))}
        </div>
        {user === "David" && <form onSubmit={addReward} style={{ display: "grid", gap: "10px", maxWidth: "520px", marginTop: "20px" }}><h3>{editingReward ? "Edit price list item" : "Add reward to price list"}</h3><input required value={rewardName} onChange={(event) => setRewardName(event.target.value)} placeholder="Reward name" style={inputStyle} /><input required min="1" step="1" type="number" value={rewardCost} onChange={(event) => setRewardCost(event.target.value)} placeholder="Cost in points" style={inputStyle} /><div style={{ display: "flex", gap: "8px" }}><button type="submit">{editingReward ? "Save reward" : "Add reward"}</button>{editingReward && <button type="button" onClick={() => { setEditingReward(null); setRewardName(""); setRewardCost(""); }}>Cancel</button>}</div></form>}
      </div>

      <div style={panelStyle}>
        <h2>Mark as Complete</h2>
        {data.redemptions.filter((item) => item.status === "requested").length === 0 && <p style={{ color: "#aaa" }}>No pending redemption requests.</p>}
        {data.redemptions.filter((item) => item.status === "requested").map((redemption) => (
          <div key={redemption.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", borderBottom: "1px solid #444", padding: "10px 0", flexWrap: "wrap" }}>
            <span>{redemption.rewardName} <strong style={{ color: "#03a9f4" }}>{redemption.cost} points</strong><br /><small style={{ color: "#aaa" }}>Requested by {redemption.requestedBy} • Requested {redemption.requestedDate}{redemption.deliveryDate ? ` • Deliver by ${redemption.deliveryDate}` : ""}</small></span>
            {user === "David" && <button onClick={() => completeRedemption(redemption)}>Mark as complete</button>}
          </div>
        ))}
      </div>

      {entryList("Requested", data.entries.filter((entry) => Number(entry.points) > 0), "No points requested yet.")}
      {entryList("Redeemed", data.entries.filter((entry) => Number(entry.points) < 0), "No points redeemed yet.")}
      {message && <p style={{ color: "#ffcc80" }}>{message}</p>}
    </div>
  );
}
