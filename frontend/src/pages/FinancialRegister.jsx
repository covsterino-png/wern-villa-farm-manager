import { useEffect, useState } from "react";
import { API } from "../api";

export default function FinancialRegister({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    transDate: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    payer: user || "",
    payee: "",
    shared: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API}/transactions`);
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      setForm({ ...form, description: "", amount: "", payee: "" });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const settle = async (id) => {
    try {
      await fetch(`${API}/transactions/${id}/settle`, {
        method: "PUT",
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  // compute balances between people based on shared transactions
  const balances = transactions.reduce((acc, t) => {
    const payer = t.payer || "Unknown";
    const payee = t.payee;
    const amount = Number(t.amount) || 0;

    if (!payee) return acc;

    const owed = t.shared ? amount / 2 : amount;

    acc[payer] = (acc[payer] || 0) + owed;
    acc[payee] = (acc[payee] || 0) - owed;

    return acc;
  }, {});

  const users = Object.keys(balances).sort((a, b) => Math.abs(balances[a]) - Math.abs(balances[b]));

  const filteredTransactions = selectedUser
    ? transactions.filter(
        (t) => t.payer === selectedUser || t.payee === selectedUser
      )
    : transactions;

  return (
    <div>
      <h2>Financial Register</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>Balances</strong>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {users.length === 0 && <div>No balances yet</div>}
          {users.map((person) => {
            const amt = balances[person] || 0;
            return (
              <button
                key={person}
                onClick={() => setSelectedUser(person)}
                style={{
                  background: selectedUser === person ? "#03a9f4" : "#2b2b2b",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {person}: {amt >= 0 ? "is owed " : "owes "}
                £{Math.abs(amt).toFixed(2)}
              </button>
            );
          })}

          {selectedUser && (
            <button
              onClick={() => setSelectedUser(null)}
              style={{ background: "#444", color: "white", border: "none", padding: "8px", borderRadius: 8 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <form onSubmit={submit} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="date"
            value={form.transDate}
            onChange={(e) => setForm({ ...form, transDate: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            placeholder="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            placeholder="Payer"
            value={form.payer}
            onChange={(e) => setForm({ ...form, payer: e.target.value })}
          />
          <input
            placeholder="Payee"
            value={form.payee}
            onChange={(e) => setForm({ ...form, payee: e.target.value })}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.shared}
              onChange={(e) => setForm({ ...form, shared: e.target.checked })}
            />
            Shared
          </label>

          <button type="submit">Add</button>
        </div>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Payer</th>
            <th>Payee</th>
            <th>Split</th>
            <th>Shared</th>
            <th>Settled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #222" }}>
              <td>{t.transDate}</td>
              <td>{t.description}</td>
              <td>£{Number(t.amount).toFixed(2)}</td>
              <td>{t.payer}</td>
              <td>{t.payee}</td>
              <td>
                {t.payee ? (
                  t.shared ? (
                    <>
                      {t.payer}: £{(Number(t.amount) / 2).toFixed(2)} / {t.payee}: £{(Number(t.amount) / 2).toFixed(2)}
                    </>
                  ) : (
                    <>
                      {t.payer}: £{Number(t.amount).toFixed(2)} / {t.payee}: £0.00
                    </>
                  )
                ) : (
                  "-"
                )}
              </td>
              <td>{t.shared ? "Yes" : "No"}</td>
              <td>{t.settled ? "Yes" : "No"}</td>
              <td>
                {!t.settled && (
                  <button onClick={() => settle(t.id)}>Settle</button>
                )}
                {selectedUser && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#ccc" }}>
                    {selectedUser === t.payer && <span>Paid (you paid)</span>}
                    {selectedUser === t.payee && <span>Owes / was charged</span>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
