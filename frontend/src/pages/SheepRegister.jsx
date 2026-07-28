import { useEffect, useState } from "react";

export default function SheepRegister() {
  const [sheep, setSheep] = useState([]);

  const [name, setName] = useState("");
  const [eid, setEid] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [mother, setMother] = useState("");
  const [father, setFather] = useState("");
  const [motherId, setMotherId] = useState("");
  const [fatherId, setFatherId] = useState("");

  const [groupName, setGroupName] =
    useState("");

  const [currentField, setCurrentField] =
    useState("");

  const [status, setStatus] =
    useState("Active");

  const [notes, setNotes] = useState("");

  const [groups, setGroups] = useState([]);
  const [fields, setFields] = useState([]);
  const [allSheep, setAllSheep] =
    useState([]);
    const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#1f1f1f",
  color: "white",
  boxSizing: "border-box",
};

const cardStyle = {
  background: "#2b2b2b",
  padding: "20px",
  borderRadius: "12px",
  maxWidth: "700px",
  margin: "0 auto 30px auto",
};

  function loadSheep() {
    fetch(
      "https://wern-villa-api.onrender.com/sheep"
    )
      .then((res) => res.json())
      .then((data) => {
        setSheep(data);
        setAllSheep(data);
      });
  }

  function loadGroups() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register"
    )
      .then((res) => res.json())
      .then((data) => setGroups(data));
  }

  function loadFields() {
    fetch(
      "https://wern-villa-api.onrender.com/fields"
    )
      .then((res) => res.json())
      .then((data) => setFields(data));
  }

  useEffect(() => {
    loadSheep();
    loadGroups();
    loadFields();
  }, []);

  function addSheep() {
    fetch(
      "https://wern-villa-api.onrender.com/sheep",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          eid,
          sex,
          dob,
          groupName,
          mother,
          motherId,
          father,
          fatherId,
          currentField,
          status,
          notes,
        }),
      }
    ).then(() => {
      setName("");
      setEid("");
      setSex("");
      setDob("");
      setMother("");
      setFather("");
      setMotherId("");
      setFatherId("");
      setGroupName("");
      setCurrentField("");
      setStatus("Active");
      setNotes("");

      loadSheep();
    });
  }

return (
  <div
    style={{
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    }}
  >
          <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 Sheep Register
      </h1>
      <div style={cardStyle}>
  <h2
    style={{
      color: "#03a9f4",
      marginTop: 0,
    }}
  >
    ➕ Add Sheep
  </h2>

      <input
  style={inputStyle}
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        placeholder="Name"
      />

      <input
  style={inputStyle}
        value={eid}
        onChange={(e) =>
          setEid(e.target.value)
        }
        placeholder="EID"
      />

      <select
  style={inputStyle}
        value={sex}
        onChange={(e) =>
          setSex(e.target.value)
        }
      >
        <option value="">
          Select Sex
        </option>

        <option value="Ewe">
          Ewe
        </option>

        <option value="Ram">
          Ram
        </option>
      </select>

      <input
  style={inputStyle}
        type="date"
        value={dob}
        onChange={(e) =>
          setDob(e.target.value)
        }
      />

      <input
  style={inputStyle}
        list="mother-list"
        value={mother}
        onChange={(e) => {
          setMother(e.target.value);

          const match =
            allSheep.find(
              (s) =>
                s.name ===
                e.target.value
            );

          setMotherId(
            match ? match.id : ""
          );
        }}
        placeholder="Mother"
      />

      <datalist id="mother-list">
        {allSheep.map((s) => (
          <option
            key={s.id}
            value={s.name}
          />
        ))}
      </datalist>

      <input
  style={inputStyle}
        list="father-list"
        value={father}
        onChange={(e) => {
          setFather(e.target.value);

          const match =
            allSheep.find(
              (s) =>
                s.name ===
                e.target.value
            );

          setFatherId(
            match ? match.id : ""
          );
        }}
        placeholder="Father"
      />

      <datalist id="father-list">
        {allSheep.map((s) => (
          <option
            key={s.id}
            value={s.name}
          />
        ))}
      </datalist>

      <select
  style={inputStyle}
        value={groupName}
        onChange={(e) =>
          setGroupName(
            e.target.value
          )
        }
      >
        <option value="">
          Select Group
        </option>

        {groups.map((group) => (
          <option
            key={group.id}
            value={group.name}
          >
            {group.name}
          </option>
        ))}
      </select>

      <select
  style={inputStyle}
        value={currentField}
        onChange={(e) =>
          setCurrentField(
            e.target.value
          )
        }
      >
        <option value="">
          Select Field
        </option>

        {fields.map((field) => (
          <option
            key={field.id}
            value={field.name}
          >
            {field.name}
          </option>
        ))}
      </select>

<button
  onClick={addSheep}
  style={{
    background: "#4caf50",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    width: "100%",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
  }}
>
  ✅ Add Sheep
</button>

</div>
      <div
        style={{
          marginTop: "20px",
        }}
      >
        {sheep.map((animal) => (
          <div
            key={animal.id}
            style={{
              background: "#2b2b2b",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              🐑 {animal.name}
            </h3>

            <div>
              Sex: {animal.sex}
            </div>

            <div>
              Group:{" "}
              {animal.groupName}
            </div>

            <div>
              Field:{" "}
              {animal.currentField}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}