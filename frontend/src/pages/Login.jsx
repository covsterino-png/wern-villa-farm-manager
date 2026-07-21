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
  style={{
    ...buttonStyle,
    marginBottom: "10px",
  }}
  onClick={() => onLogin("David")}
>
  👨‍🌾 David
</button>

<button
  style={buttonStyle}
  onClick={() => onLogin("Gemma")}
>
  👩‍🌾 Gemma
</button>      </div>
    </div>
  );
}

export default Login;