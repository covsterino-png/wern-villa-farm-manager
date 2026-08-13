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
      const rows = Array.isArray(data) ? data : data?.rows || [];
      setTransactions(rows);
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
  const balances = (transactions || []).reduce((acc, t) => {
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
    <div style={{ padding: "20px", color: "white" }}>
        <h1 style={{ color: "#03a9f4" }}>💷 Finances</h1>

        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {users.length === 0 && <div>No balances yet</div>}
            {users.map((person) => {
              const amt = balances[person] || 0;
              return (
                <div
                  key={person}
                  onClick={() => setSelectedUser(person)}
                  style={{
                    background: "#1f1f1f",
                    padding: "12px",
                    borderRadius: "10px",
                    border: selectedUser === person ? "1px solid #03a9f4" : "1px solid #333",
                    cursor: "pointer",
                    minWidth: 180,
                  }}
                >
                  <div style={{ fontWeight: "bold", color: selectedUser === person ? "#03a9f4" : "white" }}>{person}</div>
                  <div style={{ marginTop: 6 }}>
                    {amt === 0 ? (
                      <span style={{ color: "#999" }}>Settled</span>
                    ) : amt > 0 ? (
                      <span style={{ color: "#4caf50" }}>Owed £{Math.abs(amt).toFixed(2)}</span>
                    ) : (
                      <span style={{ color: "#ff9800" }}>Owes £{Math.abs(amt).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {selectedUser && (
              <div
                onClick={() => setSelectedUser(null)}
                style={{
                  background: "#2b2b2b",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #333",
                  cursor: "pointer",
                }}
              >
                Clear
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "#2b2b2b", padding: "14px", borderRadius: "12px", marginBottom: 16 }}>
          <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="date"
              value={form.transDate}
              onChange={(e) => setForm({ ...form, transDate: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white" }}
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", minWidth: 220 }}
            />
            <input
              placeholder="Amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", width: 110 }}
            />
            <input
              placeholder="Payer"
              value={form.payer}
              onChange={(e) => setForm({ ...form, payer: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", width: 140 }}
            />
            <input
              placeholder="Payee"
              value={form.payee}
              onChange={(e) => setForm({ ...form, payee: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", width: 140 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#ccc" }}>
              <input
                type="checkbox"
                checked={form.shared}
                onChange={(e) => setForm({ ...form, shared: e.target.checked })}
              />
              Shared
            </label>

            <button type="submit" style={{ background: "#03a9f4", color: "white", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" }}>Add</button>
          </form>
        </div>

        <div>
          <h2 style={{ color: "#03a9f4", marginTop: 0 }}>Transactions</h2>

          {filteredTransactions.length === 0 && <p>No transactions yet.</p>}

          {filteredTransactions.map((t) => (
            <div key={t.id} style={{ background: "#1f1f1f", padding: "14px", borderRadius: "12px", marginBottom: "10px", border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>{t.description || `Transaction #${t.id}`}</div>
                <div style={{ color: "#999", marginTop: 6 }}>{t.transDate}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <div>Paid by: <strong style={{ color: "white" }}>{t.payer}</strong></div>
                  {t.payee && (
                    <div>
                      Owes: <strong style={{ color: "white" }}>{t.payee}</strong> — {t.shared ? `£${(Number(t.amount || 0) / 2).toFixed(2)} each` : `£${(Number(t.amount) || 0).toFixed(2)}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.05rem" }}>£{(Number(t.amount) || 0).toFixed(2)}</div>
                <div style={{ marginTop: 8 }}>
                  {!t.settled ? (
                    <button onClick={() => settle(t.id)} style={{ background: "#03a9f4", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Settle</button>
                  ) : (
                    <span style={{ color: "#4caf50", fontWeight: "bold" }}>Settled</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
  </div>
  );
}
