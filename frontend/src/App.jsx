import "./App.css";
import { useState } from "react";
import Login from "./screens/Login";
import Main from "./screens/Main";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div id="App">
      {!isLoggedIn ? (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <Main onLoginOut={() => setIsLoggedIn(false)}/>
      )}
    </div>
  );
}

export default App;
