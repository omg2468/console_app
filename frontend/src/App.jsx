import "./App.css";
import { useState } from "react";
import Login from "./screens/Login";
import Main from "./screens/Main";
import ContextMenu from "./components/ContextMenu";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <div id='App'>
      {!isLoggedIn ? (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <>
          <Main onLoginOut={() => setIsLoggedIn(false)} />
          <ContextMenu />
        </>
      )}
    </div>
  );
}

export default App;
