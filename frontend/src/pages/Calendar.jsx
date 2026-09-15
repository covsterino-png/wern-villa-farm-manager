import { useState, useEffect, useRef } from "react";
import { API, fetchJson } from "../api";

export default function Calendar() {
  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [selectedDay, setSelectedDay] =
    useState(null);

    const [showAddEvent, setShowAddEvent] =
  useState(false);

const [newEvent, setNewEvent] =
  useState({
    title: "",
    eventDate: "",
    category: "Farm",
    notes: "",

    notifyDavid: true,
    notifyGemma: false,

    reminderDate: "",
    reminderTime: "",
  });


  const [events, setEvents] =
    useState([]);

  const [eventDays, setEventDays] =
    useState([]);
const [editingEventId, setEditingEventId] =
  useState(null);
const selectedDayRef = useRef(null);
const loadEvents = () => {
  fetchJson("/calendar-events")
    .then((data) => {
      setEvents(data);

      const days = data
        .filter((event) => {
          const d = new Date(event.date);

          return (
            d.getMonth() ===
              currentDate.getMonth() &&
            d.getFullYear() ===
              currentDate.getFullYear()
          );
        })
        .map((event) =>
          new Date(event.date).getDate()
        );

      setEventDays(days);
    });
};

useEffect(() => {
  loadEvents();
}, [currentDate]);

useEffect(() => {
  if (selectedDay && selectedDayRef.current) {
    selectedDayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [selectedDay]);
  const actualToday = new Date();

  const month =
    currentDate.toLocaleString(
      "default",
      {
        month: "long",
      }
    );

  const year =
    currentDate.getFullYear();

  const firstDay = new Date(
    year,
    currentDate.getMonth(),
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

for (
  let day = 1;
  day <= daysInMonth;
  day++
) {
  days.push(day);
}

const saveEvent = async () => {
  if (editingEventId) {
      await fetch(`${API}/manual-calendar-events/${editingEventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent }),
      });
  } else {
    await fetch(`${API}/manual-calendar-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEvent, createdBy: "David" }),
    });
  }

  setShowAddEvent(false);
  setEditingEventId(null);

  setNewEvent({
    title: "",
    eventDate: "",
    category: "Farm",
    notes: "",
    notifyDavid: true,
    notifyGemma: false,
    reminderDate: "",
    reminderTime: "",
  });

  loadEvents();
};

const editEvent = async (id) => {
  // fetch manual events to get full record (notify/reminder fields)
  const data = await fetchJson("/manual-calendar-events");

  const ev = data.find((r) => r.id === id);

  if (!ev) return;

  setEditingEventId(id);
  setNewEvent({
    title: ev.title || "",
    eventDate: ev.eventDate || "",
    category: ev.category || "Farm",
    notes: ev.notes || "",
    notifyDavid: !!ev.notifyDavid,
    notifyGemma: !!ev.notifyGemma,
    reminderDate: ev.reminderDate || "",
    reminderTime: ev.reminderTime || "",
  });

  setShowAddEvent(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const deleteEvent = async (id) => {
  if (!window.confirm("Delete this event?")) return;

  try {
    const res = await fetch(`${API}/manual-calendar-events/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Delete failed (${res.status})`);
    }
    loadEvents();
  } catch (error) {
    alert(`Could not delete this event. ${error.message}`);
  }
};

return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        📅 Calendar
      </h1>
      <button
  onClick={() => setShowAddEvent(true)}
  style={{
    background: "#03a9f4",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px",
  }}
>
  ➕ Add Event
</button>

{showAddEvent && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "20px",
    }}
  >
    <h3>Add Event</h3>

    <input
      placeholder="Title"
      value={newEvent.title}
      onChange={(e) =>
        setNewEvent({
          ...newEvent,
          title: e.target.value,
        })
      }
      style={{
        width: "100%",
        marginBottom: "10px",
        padding: "10px",
      }}
    />

    <input
      type="date"
      value={newEvent.eventDate}
      onChange={(e) =>
        setNewEvent({
          ...newEvent,
          eventDate: e.target.value,
        })
      }
      style={{
        width: "100%",
        marginBottom: "10px",
        padding: "10px",
      }}
    />

    <select
      value={newEvent.category}
      onChange={(e) =>
        setNewEvent({
          ...newEvent,
          category: e.target.value,
        })
      }
      style={{
        width: "100%",
        marginBottom: "10px",
        padding: "10px",
      }}
    >
      <option>Farm</option>
      <option>Vehicle</option>
      <option>Property</option>
      <option>Finance</option>
      <option>Personal</option>
    </select>

    <textarea
      placeholder="Notes"
      value={newEvent.notes}
      onChange={(e) =>
        setNewEvent({
          ...newEvent,
          notes: e.target.value,
        })
      }
      style={{
        width: "100%",
        minHeight: "80px",
        marginBottom: "10px",
        padding: "10px",
      }}
    />
    <label>
  <input
    type="checkbox"
    checked={newEvent.notifyDavid}
    onChange={(e) =>
      setNewEvent({
        ...newEvent,
        notifyDavid: e.target.checked,
      })
    }
  />
  Notify David
</label>

<br />

<label>
  <input
    type="checkbox"
    checked={newEvent.notifyGemma}
    onChange={(e) =>
      setNewEvent({
        ...newEvent,
        notifyGemma: e.target.checked,
      })
    }
  />
  Notify Gemma
</label>
<input
  type="date"
  value={newEvent.reminderDate}
  onChange={(e) =>
    setNewEvent({
      ...newEvent,
      reminderDate: e.target.value,
    })
  }
  style={{
    width: "100%",
    marginTop: "10px",
    marginBottom: "10px",
    padding: "10px",
  }}
/>
<input
  type="time"
  value={newEvent.reminderTime}
  onChange={(e) =>
    setNewEvent({
      ...newEvent,
      reminderTime: e.target.value,
    })
  }
  style={{
    width: "100%",
    marginBottom: "10px",
    padding: "10px",
  }}
/>

    <button
      onClick={saveEvent}
      style={{
        background: "#4caf50",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Save Event
    </button>
  </div>
)}
      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              )
            }
            style={{
              background: "#2b2b2b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ◀
          </button>

          <h2
            style={{
              color: "#ffffff",
              margin: 0,
              fontSize: "1.8rem",
            }}
          >
            {month} {year}
          </h2>

          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              )
            }
            style={{
              background: "#2b2b2b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ▶
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7, 1fr)",
            gap: "8px",
            marginBottom: "10px",
            textAlign: "center",
            fontWeight: "bold",
            color: "#03a9f4",
          }}
        >
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7, 1fr)",
            gap: "8px",
          }}
        >
          {days.map((day, index) => {
            const isToday =
              day &&
              day ===
                actualToday.getDate() &&
              currentDate.getMonth() ===
                actualToday.getMonth() &&
              currentDate.getFullYear() ===
                actualToday.getFullYear();

            const hasEvent =
              day &&
              eventDays.includes(day);

            return (
              <div
                key={index}
                onClick={() =>
                  day &&
                  setSelectedDay(day)
                }
                style={{
                  background:
                    isToday
                      ? "#03a9f4"
                      : "#2b2b2b",

                  minHeight: "70px",

                  borderRadius:
                    "10px",

                  padding: "8px",

                  textAlign:
                    "right",

                  color: "white",

                  position:
                    "relative",

                  cursor:
                    day
                      ? "pointer"
                      : "default",
                }}
              >
                {day}

                {hasEvent && (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius:
                        "50%",
                      background:
                        "#ff9800",
                      position:
                        "absolute",
                      bottom: "8px",
                      left: "8px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

{selectedDay && (
  <div
    ref={selectedDayRef}
    style={{
      marginTop: "20px",
      background: "#2b2b2b",
      padding: "15px",
      borderRadius: "10px",
      color: "white",
    }}
  >
    <h3>
      Events on {selectedDay} {month}
    </h3>

    {events
      .filter((event) => {
        const d = new Date(event.date);

        return (
          d.getDate() === selectedDay &&
          d.getMonth() ===
            currentDate.getMonth() &&
          d.getFullYear() ===
            currentDate.getFullYear()
        );
      })
      .map((event, index) => (
        <div
          key={index}
          style={{
            marginBottom: "12px",
            padding: "10px",
            background: "#1f1f1f",
            borderRadius: "8px",
          }}
        >
          {event.type === "withdrawal" ? (
            <>
              <div>
                ⚠️ Withdrawal Ends
              </div>

              <div>
                🐑 {event.sheepName}
              </div>

              <div>
                💉 {event.treatment}
              </div>
            </>
          ) : (
<>
  <div>
    📅 {event.title}
  </div>

  <div>
    📂 {event.category}
  </div>

  {event.notes && (
    <div>
      📝 {event.notes}
    </div>
  )}

  <button
    onClick={() =>
      deleteEvent(event.id)
    }
    style={{
      marginTop: "10px",
      background: "#d32f2f",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "6px 10px",
      cursor: "pointer",
    }}
  >
    🗑 Delete
  </button>
  <button
    onClick={() => editEvent(event.id)}
    style={{
      marginTop: "10px",
      marginLeft: "8px",
      background: "#1976d2",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "6px 10px",
      cursor: "pointer",
    }}
  >
    ✏️ Edit
  </button>
</>
          )}
        </div>
      ))}
  </div>
)}      </div>
    </div>
  );
}