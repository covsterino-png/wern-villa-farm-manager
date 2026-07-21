function Login({ onLogin }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "300px",
          background: "#1f1f1f",
          padding: "30px",
          borderRadius: "12px",
        }}
      >
        <h2>🐑 Wern Villa</h2>

        <p>Who's using the farm manager?</p>

        <button
const buttonStyle = {
  background: "#2b2b2b",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "10px",
  cursor: "pointer",
  minHeight: "50px",
  width: "100%",
  fontWeight: "bold",
  transition: "0.2s",
};          onClick={() => onLogin("David")}
        >
          David
        </button>

        <button
const buttonStyle = {
  background: "#2b2b2b",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "10px",
  cursor: "pointer",
  minHeight: "50px",
  width: "100%",
  fontWeight: "bold",
  transition: "0.2s",
};          onClick={() => onLogin("Gemma")}
        >
          Gemma
        </button>
      </div>
    </div>
  );
}

export default Login;