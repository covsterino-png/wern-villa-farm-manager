import { useEffect, useState } from "react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  function loadTasks() {
    fetch("https://wern-villa-api.onrender.com/tasks")
      .then((response) => response.json())
      .then((data) => {
        setTasks(data);
      });
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function addTask() {
    if (!newTask.trim()) {
      return;
    }

    fetch("https://wern-villa-api.onrender.com/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: newTask,
        createdBy: localStorage.getItem("user"),
      }),
    }).then(() => {
      setNewTask("");
      loadTasks();
    });
  }

  function completeTask(id) {
    fetch(
      `https://wern-villa-api.onrender.com/tasks/${id}/complete`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completedBy: localStorage.getItem("user"),
        }),
      }
    ).then(() => {
      loadTasks();
    });
  }

  return (
    <div>
<h1
  style={{
    color: "#03a9f4",
    marginBottom: "20px",
  }}
>
  📋 Tasks test
</h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
        }}
      >
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter task..."
          style={{
            padding: "10px",
            width: "70%",
            marginRight: "10px",
          }}
        />

        <button onClick={addTask}>
          Add Task
        </button>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            background: "#1f1f1f",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "10px",
            border: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div>
              {task.completed ? "✅" : "□"} {task.task}
            </div>

            <div
              style={{
                color: "#888",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              Created by: {task.createdBy || "Unknown"}

              {task.completedBy && (
                <div>
                  Completed by: {task.completedBy}
                </div>
              )}
            </div>
          </div>

          {!task.completed && (
            <button
              onClick={() => completeTask(task.id)}
            >
              Complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}