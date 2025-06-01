import { useState } from "react";
import { Greet } from "../../wailsjs/go/main/App";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateUsername = (e) => setUsername(e.target.value);
  const updatePassword = (e) => setPassword(e.target.value);

  function handleLogin() {
    if (!username.trim() || !password.trim()) {
      alert("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    Greet(username)
      .then((result) => {
        // Handle login result
        console.log(result);

        // Navigate to main screen after successful login
        if (onLoginSuccess) {
          onLoginSuccess(username);
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Login failed. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div id="input" className="content-main">
      <div className="login-form">
        <h2 className="login-title">Login</h2>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            onChange={updateUsername}
            autoComplete="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={username}
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            onChange={updatePassword}
            autoComplete="current-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
          />
        </div>
        <button
          className="btn login-btn"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </div>
    </div>
  );
}

export default Login;
