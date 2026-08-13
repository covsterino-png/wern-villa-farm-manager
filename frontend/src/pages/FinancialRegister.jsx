import { useEffect, useState } from "react";
import { API } from "../api";

const FINANCE_USERS = ["David", "Gemma"];

const getDefaultPayee = (activeUser) =>
  activeUser === "David" ? "Gemma" : "David";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 600;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", 0.3);
      };
    };
  });
};

export default function FinancialRegister({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    transDate: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    payer: user === "Gemma" ? "Gemma" : "David",
    payee: getDefaultPayee(user),
    shared: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

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

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      payer: user === "Gemma" ? "Gemma" : "David",
      payee: getDefaultPayee(user),
    }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        transDate: form.transDate,
        description: form.description,
        amount: Number(form.amount),
        payer: FINANCE_USERS.includes(form.payer) ? form.payer : (user === "Gemma" ? "Gemma" : "David"),
        payee: FINANCE_USERS.includes(form.payee) ? form.payee : getDefaultPayee(user),
        shared: form.shared ? 1 : 0,
      };

      if (receiptFile) {
        const compressedBlob = await compressImage(receiptFile);
        const formData = new FormData();
        formData.append("transDate", payload.transDate);
        formData.append("description", payload.description);
        formData.append("amount", payload.amount);
        formData.append("payer", payload.payer);
        formData.append("payee", payload.payee);
        formData.append("shared", payload.shared);
        formData.append("receipt", compressedBlob, receiptFile.name);

        await fetch(`${API}/transactions`, {
          method: "POST",
          body: formData,
        });
      } else {
        await fetch(`${API}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setForm({
        ...form,
        description: "",
        amount: "",
        payer: user === "Gemma" ? "Gemma" : "David",
        payee: getDefaultPayee(user),
      });
      setReceiptFile(null);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const settle = async (id) => {
    try {
      const target = transactions.find((t) => t.id === id);
      if (!target) return;

      const payload = {
        ...target,
        settled: true,
        amount: 0,
      };

      await fetch(`${API}/transactions/${id}/settle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const balances = (transactions || []).reduce((acc, t) => {
    if (t.settled) return acc;

    const payer = t.payer;
    const payee = t.payee;
    const amount = Number(t.amount) || 0;

    if (!payer || !payee || !FINANCE_USERS.includes(payer) || !FINANCE_USERS.includes(payee)) {
      return acc;
    }

    const owed = t.shared ? amount / 2 : amount;

    acc[payer] = (acc[payer] || 0) + owed;
    acc[payee] = (acc[payee] || 0) - owed;

    return acc;
  }, { David: 0, Gemma: 0 });

  const users = FINANCE_USERS.slice();

  const filteredTransactions = (selectedUser
    ? transactions.filter(
        (t) => !t.settled && (t.payer === selectedUser || t.payee === selectedUser)
      )
    : transactions.filter((t) => !t.settled));

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
        <h1 style={{ color: "#03a9f4" }}>💷 Finances</h1>

        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {users.length === 0 && <div>No balances yet</div>}
            {users.map((person) => {
              const amt = balances[person] || 0;
              return (
                <div
                  key={person}
                  style={{
                    background: "#1f1f1f",
                    padding: "12px",
                    borderRadius: "10px",
                    border: selectedUser === person ? "1px solid #03a9f4" : "1px solid #333",
                    cursor: "pointer",
                    minWidth: 180,
                  }}
                >
                  <div 
                    onClick={() => setDetailUser(person)}
                    style={{ fontWeight: "bold", color: selectedUser === person ? "#03a9f4" : "white", textDecoration: "underline" }}
                  >
                    {person}
                  </div>
                  <div style={{ marginTop: 6 }} onClick={() => setSelectedUser(person)}>
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

        {detailUser && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDetailUser(null)}
          >
            <div style={{
              background: "#1f1f1f",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #333",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, color: "#03a9f4" }}>{detailUser}'s Unsettled Transactions</h2>
              
              {(() => {
                const userTransactions = transactions.filter(
                  (t) => !t.settled && (t.payer === detailUser || t.payee === detailUser)
                );

                if (userTransactions.length === 0) {
                  return <p style={{ color: "#999" }}>No unsettled transactions</p>;
                }

                return userTransactions.map((t) => (
                  <div key={t.id} style={{
                    background: "#121212",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    border: "1px solid #333",
                  }}>
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{t.description || `Transaction #${t.id}`}</div>
                    <div style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "8px" }}>{t.transDate}</div>
                    <div style={{ fontSize: "0.9rem", marginBottom: "6px" }}>
                      <span>{t.payer}</span> → <span>{t.payee}</span>
                    </div>
                    <div style={{
                      fontWeight: "bold",
                      color: t.payer === detailUser ? "#4caf50" : "#ff9800",
                      fontSize: "1rem",
                    }}>
                      {t.payer === detailUser ? "Owed" : "Owes"}: £{(
                        t.shared ? Number(t.amount || 0) / 2 : Number(t.amount || 0)
                      ).toFixed(2)}
                      {t.shared && " (shared)"}
                    </div>
                    {t.receiptImageUrl && (
                      <div style={{ marginTop: "8px" }}>
                        <a href={t.receiptImageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#03a9f4", textDecoration: "underline", fontSize: "0.85rem" }}>
                          📷 View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                ));
              })()}

              <button
                onClick={() => setDetailUser(null)}
                style={{
                  width: "100%",
                  background: "#03a9f4",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginTop: "16px",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

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
              style={{
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "#121212",
                color: "white",
                width: 110,
                appearance: "textfield",
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
            />
            <select
              value={form.payer}
              onChange={(e) => setForm({ ...form, payer: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", width: 140 }}
            >
              {FINANCE_USERS.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
            <select
              value={form.payee}
              onChange={(e) => setForm({ ...form, payee: e.target.value })}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", width: 140 }}
            >
              {FINANCE_USERS.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#ccc" }}>
              <input
                type="checkbox"
                checked={form.shared}
                onChange={(e) => setForm({ ...form, shared: e.target.checked })}
              />
              Shared
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              style={{ padding: "8px", borderRadius: 8, border: "none", background: "#121212", color: "white", cursor: "pointer" }}
            />
            {receiptFile && <span style={{ color: "#4caf50", fontSize: "0.9rem" }}>✓ {receiptFile.name}</span>}

            <button type="submit" style={{ background: "#03a9f4", color: "white", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" }}>Add</button>
          </form>
        </div>

        <div>
          <h2 style={{ color: "#03a9f4", marginTop: 0 }}>Transactions</h2>

          {filteredTransactions.length === 0 && <p>No transactions yet.</p>}

          {filteredTransactions.map((t) => (
            <div key={t.id} style={{ background: "#1f1f1f", padding: "14px", borderRadius: "12px", marginBottom: "10px", border: "1px solid #333" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
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
                  {t.receiptImageUrl && (
                    <div style={{ marginTop: 12 }}>
                      <a href={t.receiptImageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#03a9f4", textDecoration: "underline", fontSize: "0.9rem" }}>
                        📷 View Receipt
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", minWidth: "120px" }}>
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
            </div>
          ))}
        </div>
  </div>
  );
}
