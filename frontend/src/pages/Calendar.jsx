import { useState, useEffect } from "react";

export default function Calendar() {
  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [selectedDay, setSelectedDay] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [eventDays, setEventDays] =
    useState([]);

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/calendar-events"
    )
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);

        const days = data
          .filter((event) => {
            const d = new Date(
              event.date
            );

            return (
              d.getMonth() ===
                currentDate.getMonth() &&
              d.getFullYear() ===
                currentDate.getFullYear()
            );
          })
          .map((event) =>
            new Date(
              event.date
            ).getDate()
          );

        setEventDays(days);
      });
  }, [currentDate]);

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

        <div
          style={{
            marginTop: "20px",
            color: "white",
          }}
        >
          Selected Day: {selectedDay}
        </div>
      </div>
    </div>
  );
}