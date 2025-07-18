import "./App.css";
import { useState, useEffect } from "react";
import Login from "./screens/Login";
import Main from "./screens/Main";
import ContextMenu from "./components/ContextMenu";
import Modal from "./components/Modal";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const preventZoom = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const preventKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventZoom, { passive: false });
    window.addEventListener("keydown", preventKeys);

    return () => {
      window.removeEventListener("wheel", preventZoom);
      window.removeEventListener("keydown", preventKeys);
    };
  }, []);

  return (
    <div id="App">
      {!isLoggedIn ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="flex flex-row items-center justify-center w-full h-full">
            <Login onLoginSuccess={() => setIsLoggedIn(true)} />
          </div>
        </div>
      ) : (
        <>
          <Main onLoginOut={() => setIsLoggedIn(false)} />
          <ContextMenu />
          <Modal />
        </>
      )}
    </div>
  );
}

export default App;
