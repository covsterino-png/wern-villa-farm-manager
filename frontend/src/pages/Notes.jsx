import { useEffect, useState } from "react";
import { API, fetchJson } from "../api";

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

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  async function load() {
    try {
      const data = await fetchJson("/notes");
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function send(path, options) {
    const res = await fetch(`${API}${path}`, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function createNote() {
    if (!title.trim()) {
      alert("Give it a title first.");
      return;
    }

    setSaving(true);
    try {
      await send("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, kind }),
      });
      setTitle("");
      setBody("");
      setKind("note");
      setShowForm(false);
      await load();
    } catch (error) {
      alert(`Could not save. ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(note) {
    if (!editTitle.trim()) {
      alert("Give it a title first.");
      return;
    }

    try {
      await send(`/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      setEditing(null);
      await load();
    } catch (error) {
      alert(`Could not save. ${error.message}`);
    }
  }

  async function deleteNote(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    try {
      await send(`/notes/${note.id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      alert(`Could not delete. ${error.message}`);
    }
  }

  async function addItem(note) {
    const text = (newItemText[note.id] || "").trim();
    if (!text) return;

    try {
      await send(`/notes/${note.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setNewItemText((prev) => ({ ...prev, [note.id]: "" }));
      await load();
    } catch (error) {
      alert(`Could not add item. ${error.message}`);
    }
  }

  async function toggleItem(item) {
    try {
      await send(`/note-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
      await load();
    } catch (error) {
      alert(`Could not update item. ${error.message}`);
    }
  }

  async function deleteItem(item) {
    try {
      await send(`/note-items/${item.id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      alert(`Could not delete item. ${error.message}`);
    }
  }

  return (
    <div>
      <h1 style={{ color: "#03a9f4" }}>📝 Notes &amp; Lists</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          ...buttonStyle,
          background: showForm ? "#777" : "#4caf50",
          marginBottom: "16px",
        }}
      >
        {showForm ? "✖ Cancel" : "➕ New"}
      </button>

      {showForm && (
        <div style={panelStyle}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={inputStyle}
          >
            <option value="note">📝 Note</option>
            <option value="list">✅ Checklist</option>
          </select>

          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={inputStyle}
          />

          {kind === "note" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your note..."
              rows={4}
              style={inputStyle}
            />
          )}

          <button onClick={createNote} disabled={saving} style={buttonStyle}>
            {saving ? "Saving..." : "Save"}
          </button>

          {kind === "list" && (
            <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
              Add items to the checklist once it's created.
            </small>
          )}
        </div>
      )}

      {loading ? (
        <div style={panelStyle}>Loading...</div>
      ) : notes.length === 0 ? (
        <div style={{ ...panelStyle, color: "#aaa" }}>
          Nothing yet. Create a note or a checklist to get started.
        </div>
      ) : (
        notes.map((note) => {
          const doneCount = note.items.filter((item) => item.done).length;

          return (
            <div key={note.id} style={panelStyle}>
              {editing === note.id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={inputStyle}
                  />

                  {note.kind === "note" && (
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={4}
                      style={inputStyle}
                    />
                  )}

                  <button onClick={() => saveEdit(note)} style={buttonStyle}>
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    style={{ ...buttonStyle, background: "#555", marginLeft: "8px" }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <strong style={{ fontSize: "1.1rem" }}>
                      {note.kind === "list" ? "✅" : "📝"} {note.title}
                    </strong>

                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setEditing(note.id);
                          setEditTitle(note.title);
                          setEditBody(note.body || "");
                        }}
                        style={{ ...buttonStyle, background: "#555", padding: "6px 10px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(note)}
                        style={{ ...buttonStyle, background: "#f44336", padding: "6px 10px" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {note.kind === "note" && note.body && (
                    <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
                      {note.body}
                    </p>
                  )}

                  {note.kind === "list" && (
                    <>
                      <div style={{ color: "#aaa", margin: "8px 0" }}>
                        {doneCount} of {note.items.length} done
                      </div>

                      {note.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "6px 0",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(item.done)}
                            onChange={() => toggleItem(item)}
                            style={{ width: "20px", height: "20px", flexShrink: 0 }}
                          />
                          <span
                            style={{
                              flex: 1,
                              textDecoration: item.done ? "line-through" : "none",
                              color: item.done ? "#777" : "white",
                              overflowWrap: "break-word",
                              minWidth: 0,
                            }}
                          >
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteItem(item)}
                            style={{
                              background: "transparent",
                              color: "#f44336",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1.1rem",
                              flexShrink: 0,
                            }}
                          >
                            ✖
                          </button>
                        </div>
                      ))}

                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <input
                          value={newItemText[note.id] || ""}
                          onChange={(e) =>
                            setNewItemText((prev) => ({
                              ...prev,
                              [note.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addItem(note);
                          }}
                          placeholder="Add an item"
                          style={{ ...inputStyle, marginBottom: 0 }}
                        />
                        <button
                          onClick={() => addItem(note)}
                          style={{ ...buttonStyle, flexShrink: 0 }}
                        >
                          Add
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}