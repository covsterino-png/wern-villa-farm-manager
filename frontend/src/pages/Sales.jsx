import { useEffect, useState } from "react";
import { API, fetchJson } from "../api";

const SALE_TYPES = [
  { value: "livestock", label: "🐑 Livestock" },
  { value: "meat", label: "🥩 Meat boxes" },
  { value: "logs", label: "🪵 Logs" },
  { value: "other", label: "📦 Other" },
];

const typeLabel = (value) =>
  SALE_TYPES.find((type) => type.value === value)?.label || value;

const panelStyle = {
  background: "#1f1f1f",
  padding: "16px",
  borderRadius: "12px",
  marginBottom: "16px",
  textAlign: "left",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #777",
  boxSizing: "border-box",
  marginBottom: "10px",
};

const buttonStyle = {
  background: "#03a9f4",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [totalsByType, setTotalsByType] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [saleType, setSaleType] = useState("livestock");
  const [saleDate, setSaleDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [allSheep, setAllSheep] = useState([]);
  const [sheepQuery, setSheepQuery] = useState("");
  const [linkedSheep, setLinkedSheep] = useState(null);

  async function load() {
    try {
      const data = await fetchJson("/sales");
      setSales(data.sales || []);
      setTotalsByType(data.totalsByType || {});
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showForm || allSheep.length > 0) return;

    fetch(`${API}/sheep`)
      .then((res) => res.json())
      .then((data) => setAllSheep(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [showForm]);

  function resetForm() {
    setShowForm(false);
    setSaleType("livestock");
    setSaleDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setQuantity("1");
    setUnitPrice("");
    setCustomer("");
    setNotes("");
    setSheepQuery("");
    setLinkedSheep(null);
  }

  async function saveSale() {
    if (!saleDate) {
      alert("Choose a sale date.");
      return;
    }
    if (!(Number(unitPrice) >= 0) || unitPrice === "") {
      alert("Enter a price.");
      return;
    }
    if (saleType === "livestock" && !linkedSheep) {
      alert("Choose which sheep was sold.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleType,
          saleDate,
          description,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice),
          customer,
          sheepId: linkedSheep?.id || null,
          notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }

      resetForm();
      await load();
    } catch (error) {
      alert(`Could not save this sale. ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSale(sale) {
    if (!window.confirm(`Delete this £${Number(sale.total).toFixed(2)} sale?`))
      return;

    try {
      const res = await fetch(`${API}/sales/${sale.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await load();
    } catch (error) {
      alert(`Could not delete. ${error.message}`);
    }
  }

  const query = sheepQuery.trim().toLowerCase();
  const sheepMatches =
    query.length === 0
      ? []
      : allSheep
          .filter((item) =>
            `${item.name ?? ""} ${item.eid ?? ""} ${item.groupName ?? ""}`
              .toLowerCase()
              .includes(query)
          )
          .slice(0, 8);

  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const canLinkSheep = saleType === "livestock" || saleType === "meat";

  return (
    <div>
      <h1 style={{ color: "#03a9f4" }}>💷 Sales &amp; Income</h1>

      <div style={panelStyle}>
        <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#4caf50" }}>
          £{total.toFixed(2)}
        </div>
        <div style={{ color: "#aaa", marginBottom: "8px" }}>Total recorded income</div>

        {SALE_TYPES.filter((type) => totalsByType[type.value]).map((type) => (
          <div key={type.value} style={{ color: "#ddd" }}>
            {type.label} £{Number(totalsByType[type.value]).toFixed(2)}
          </div>
        ))}
      </div>

      <button
        onClick={() => (showForm ? resetForm() : setShowForm(true))}
        style={{
          ...buttonStyle,
          background: showForm ? "#777" : "#4caf50",
          marginBottom: "16px",
        }}
      >
        {showForm ? "✖ Cancel" : "➕ Record a sale"}
      </button>

      {showForm && (
        <div style={panelStyle}>
          <select
            value={saleType}
            onChange={(e) => {
              setSaleType(e.target.value);
              if (e.target.value === "logs" || e.target.value === "other") {
                setLinkedSheep(null);
                setSheepQuery("");
              }
            }}
            style={inputStyle}
          >
            {SALE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {canLinkSheep && (
            <>
              {linkedSheep ? (
                <div style={{ marginBottom: "10px" }}>
                  🐑 <strong>{linkedSheep.name}</strong>
                  {linkedSheep.eid && (
                    <small style={{ color: "#aaa" }}> · {linkedSheep.eid}</small>
                  )}
                  <button
                    onClick={() => {
                      setLinkedSheep(null);
                      setSheepQuery("");
                    }}
                    style={{
                      ...buttonStyle,
                      background: "#555",
                      padding: "4px 10px",
                      marginLeft: "10px",
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={sheepQuery}
                    onChange={(e) => setSheepQuery(e.target.value)}
                    placeholder={
                      saleType === "livestock"
                        ? "Which sheep? Search name or EID"
                        : "Link to an animal (optional)"
                    }
                    style={inputStyle}
                  />

                  {sheepMatches.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setLinkedSheep(item)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "#2b2b2b",
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        marginBottom: "6px",
                      }}
                    >
                      🐑 {item.name}
                      {item.eid && (
                        <small style={{ color: "#aaa" }}> · {item.eid}</small>
                      )}
                    </button>
                  ))}
                </>
              )}
            </>
          )}

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              saleType === "logs"
                ? "e.g. Load of seasoned logs"
                : saleType === "meat"
                ? "e.g. Half lamb box"
                : "Description"
            }
            style={inputStyle}
          />

          <label style={{ display: "block", color: "#aaa", marginBottom: "4px" }}>
            Sale date
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ width: "50%" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px" }}>
                Quantity
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ width: "50%" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px" }}>
                Price each (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ color: "#4caf50", fontWeight: "bold", marginBottom: "10px" }}>
            Total: £{lineTotal.toFixed(2)}
          </div>

          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Sold to (optional)"
            style={inputStyle}
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            style={inputStyle}
          />

          <button
            onClick={saveSale}
            disabled={saving}
            style={{ ...buttonStyle, background: "#4caf50", width: "100%" }}
          >
            {saving ? "Saving..." : "Save sale"}
          </button>

          {saleType === "livestock" && (
            <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
              The sheep will be marked as Sold.
            </small>
          )}
        </div>
      )}

      {loading ? (
        <div style={panelStyle}>Loading...</div>
      ) : sales.length === 0 ? (
        <div style={{ ...panelStyle, color: "#aaa" }}>
          No sales recorded yet.
        </div>
      ) : (
        sales.map((sale) => (
          <div key={sale.id} style={panelStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <strong>
                  {sale.description || typeLabel(sale.saleType)}
                </strong>
                <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                  {typeLabel(sale.saleType)} · {sale.saleDate}
                </div>
                {sale.sheepName && (
                  <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                    🐑 {sale.sheepName}
                  </div>
                )}
                {sale.customer && (
                  <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                    To: {sale.customer}
                  </div>
                )}
                {Number(sale.quantity) !== 1 && (
                  <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                    {sale.quantity} × £{Number(sale.unitPrice).toFixed(2)}
                  </div>
                )}
                {sale.notes && (
                  <div style={{ color: "#ccc", fontSize: "0.85rem" }}>
                    {sale.notes}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    color: "#4caf50",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  £{Number(sale.total).toFixed(2)}
                </div>
                <button
                  onClick={() => deleteSale(sale)}
                  style={{
                    ...buttonStyle,
                    background: "#f44336",
                    padding: "4px 10px",
                    marginTop: "6px",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
