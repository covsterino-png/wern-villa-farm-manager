function Login({ onLogin }) {
  const buttonStyle = {
    background: "#03a9f4",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "10px",
    cursor: "pointer",
    minHeight: "50px",
    width: "100%",
    fontWeight: "bold",
    fontSize: "16px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "320px",
          background: "#1f1f1f",
          padding: "30px",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            marginBottom: "10px",
          }}
        >
          🐑
        </div>

        <h1
          style={{
            margin: 0,
            color: "#03a9f4",
          }}
        >
          Wern Villa
        </h1>

        <div
          style={{
            color: "#aaa",
            marginTop: "8px",
            marginBottom: "25px",
          }}
        >
          Gemma & David's Farm Manager
        </div>

        <p
          style={{
            marginBottom: "20px",
          }}
        >
          Who's using the farm manager?
        </p>

        <button
          style={{
            ...buttonStyle,
            marginBottom: "10px",
          }}
          onClick={() => onLogin("David")}
        >
          🚜 David
        </button>

        <button
          style={buttonStyle}
          onClick={() => onLogin("Gemma")}
        >
          🐑 Gemma
        </button>
      </div>
    </div>
  );
}

export default Login;