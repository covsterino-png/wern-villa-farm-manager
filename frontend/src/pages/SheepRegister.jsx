import { useEffect, useState } from "react";

export default function SheepRegister() {
  const [sheep, setSheep] = useState([]);

  const [name, setName] = useState("");
  const [eid, setEid] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [mother, setMother] = useState("");
  const [groupName, setGroupName] =
    useState("");
  const [currentField, setCurrentField] =
    useState("");
  const [status, setStatus] =
    useState("Active");
  const [notes, setNotes] = useState("");

  const [groups, setGroups] = useState([]);
  const [fields, setFields] = useState([]);

  function loadSheep() {
    fetch(
      "https://wern-villa-api.onrender.com/sheep"
    )
      .then((res) => res.json())
      .then((data) => setSheep(data));
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
      setGroupName("");
      setCurrentField("");
      setStatus("Active");
      setNotes("");

      loadSheep();
    });
  }

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 Sheep Register
      </h1>

      <input
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        placeholder="Name"
      />

      <input
        value={eid}
        onChange={(e) =>
          setEid(e.target.value)
        }
        placeholder="EID"
      />

      <select
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
        type="date"
        value={dob}
        onChange={(e) =>
          setDob(e.target.value)
        }
      />

      <input
        value={mother}
        onChange={(e) =>
          setMother(e.target.value)
        }
        placeholder="Mother"
      />

      <select
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

      <button onClick={addSheep}>
        Add Sheep
      </button>

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