export default function Calendar() {
  const today = new Date();

  const month = today.toLocaleString(
    "default",
    {
      month: "long",
    }
  );

  const year = today.getFullYear();

  const firstDay = new Date(
    year,
    today.getMonth(),
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    today.getMonth() + 1,
    0
  ).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
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
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          {month} {year}
        </h2>

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
          {days.map((day, index) => (
            <div
              key={index}
              style={{
                background: "#2b2b2b",
                minHeight: "70px",
                borderRadius: "10px",
                padding: "8px",
                textAlign: "right",
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}