export default function Calendar() {
const [currentDate, setCurrentDate] =
  useState(new Date());
const month =
  currentDate.toLocaleString(
    "default",
    {
      month: "long",
    }
  );

const year =
  currentDate.getFullYear();
    const currentDay = new Date().getDate();

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
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
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
>
  ◀
</button>
  <h2
    style={{
      color: "#fff",
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
          {days.map((day, index) => (
            <div
              key={index}
              style={{
background:
  day === currentDay
    ? "#03a9f4"
    : "#2b2b2b",

    minHeight: "70px",
                borderRadius: "10px",
                padding: "8px",
                textAlign: "right",
                color:
  day === currentDay
    ? "white"
    : "white",
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