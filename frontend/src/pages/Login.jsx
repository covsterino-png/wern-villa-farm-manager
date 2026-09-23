import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { apiFetch, readJsonResponse } from "../api";

function Login({ onLogin }) {
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [username, setUsername] = useState("David");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(null);
  const [setupMode, setSetupMode] = useState(false);
  const [setupKey, setSetupKey] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("authToken", data.token);
      if (isLocalDevelopment) {
        onLogin(data.user, data.token);
        return;
      }
      setAuthenticated(data);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function setupPasswordForUser(event) {
    event.preventDefault();
    if (setupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: setupPassword, setupKey }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "Could not set password");
      setSetupMode(false);
      setSetupKey("");
      setSetupPassword("");
      setConfirmPassword("");
      setError("Password set. You can now sign in.");
    } catch (setupError) {
      setError(setupError.message);
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPasskey() {
    setBusy(true);
    setError("");
    try {
      const optionsResponse = await apiFetch("/auth/passkey/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const options = await readJsonResponse(optionsResponse);
      if (!optionsResponse.ok) throw new Error(options.error || "No passkey is registered for this user");
      const response = await startAuthentication({ optionsJSON: options });
      const verifyResponse = await apiFetch("/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, response }),
      });
      const data = await readJsonResponse(verifyResponse);
      if (!verifyResponse.ok) throw new Error(data.error || "Passkey login failed");
      onLogin(data.user, data.token);
    } catch (passkeyError) {
      setError(passkeyError.name === "NotAllowedError" ? "Passkey sign-in was cancelled." : passkeyError.message);
    } finally {
      setBusy(false);
    }
  }

  async function registerPasskey() {
    setBusy(true);
    setError("");
    try {
      const optionsResponse = await apiFetch("/auth/passkey/register/options", { method: "POST" });
      const options = await readJsonResponse(optionsResponse);
      if (!optionsResponse.ok) throw new Error(options.error || "Could not start device setup");
      const response = await startRegistration({ optionsJSON: options });
      const verifyResponse = await apiFetch("/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const data = await readJsonResponse(verifyResponse);
      if (!verifyResponse.ok) throw new Error(data.error || "Could not register this device");
      onLogin(authenticated.user, authenticated.token);
    } catch (passkeyError) {
      setError(passkeyError.name === "NotAllowedError" ? "Device setup was cancelled." : passkeyError.message);
    } finally {
      setBusy(false);
    }
  }
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

        {authenticated ? (
          <>
            <p>Signed in as {authenticated.user}. Set up this device for faster sign-in.</p>
            <button type="button" disabled={busy} onClick={registerPasskey} style={{ ...buttonStyle, marginBottom: "10px" }}>{busy ? "Setting up..." : "Use biometrics / device PIN"}</button>
            <button type="button" disabled={busy} onClick={() => onLogin(authenticated.user, authenticated.token)} style={{ ...buttonStyle, background: "#555" }}>Continue without setup</button>
          </>
        ) : setupMode ? <form onSubmit={setupPasswordForUser}>
        <p>Set the first password for {username}.</p>
        <input required type="password" value={setupKey} onChange={(event) => setSetupKey(event.target.value)} placeholder="Setup key" autoComplete="off" style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "8px", boxSizing: "border-box" }} />
        <input required minLength={8} type="password" value={setupPassword} onChange={(event) => setSetupPassword(event.target.value)} placeholder="New password" autoComplete="new-password" style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "8px", boxSizing: "border-box" }} />
        <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" autoComplete="new-password" style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "8px", boxSizing: "border-box" }} />
        {error && <p style={{ color: "#ff8a80" }}>{error}</p>}
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Saving..." : "Set password"}</button>
        <button type="button" disabled={busy} onClick={() => { setSetupMode(false); setError(""); }} style={{ ...buttonStyle, marginTop: "10px", background: "#555" }}>Back to sign in</button>
        </form> : <form onSubmit={submit}>
        <p
          style={{
            marginBottom: "20px",
          }}
        >
          Who's using the farm manager?
        </p>

        <select value={username} onChange={(event) => setUsername(event.target.value)} style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "8px" }}>
          <option value="David">🚜 David</option>
          <option value="Gemma">🐑 Gemma</option>
        </select>
        <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" style={{ width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "8px", boxSizing: "border-box" }} />
        {error && <p style={{ color: "#ff8a80" }}>{error}</p>}
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Signing in..." : "Sign in"}</button>
        {!isLocalDevelopment && <button type="button" disabled={busy} onClick={signInWithPasskey} style={{ ...buttonStyle, marginTop: "10px", background: "#555" }}>Sign in with device</button>}
        <button type="button" disabled={busy} onClick={() => { setSetupMode(true); setError(""); }} style={{ ...buttonStyle, marginTop: "10px", background: "transparent", border: "1px solid #555" }}>Set up a password</button>
        </form>}
      </div>
    </div>
  );
}

export default Login;