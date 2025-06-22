import "./App.css";
import { useState } from "react";
import Login from "./screens/Login";
import Main from "./screens/Main";
import ContextMenu from "./components/ContextMenu";
import Modal from "./components/Modal";
import ConnectComponent from "./components/Connect";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Arrow state: only "not connected" and "connected"
  const arrowState = isConnected ? "connected" : "not-connected";
  
  return (
    <div id='App'>
      {!isLoggedIn ? (
        <div className='flex items-center justify-center min-h-screen bg-gray-100'>
          <div className="hidden md:flex flex-row items-center justify-center w-full h-full">
            <ConnectComponent onConnected={() => setIsConnected(true)}/>
            <span
              className={`
                text-5xl mx-4 my-4 md:my-0 transition-all duration-500
                ${arrowState === "not-connected" ? "text-gray-300 animate-pulse" : ""}
                ${arrowState === "connected" ? "text-green-500 animate-arrow-glow" : ""}
              `}
              style={{
                filter: arrowState === "connected" ? "drop-shadow(0 0 8px #22c55e)" : undefined,
                transition: "color 0.3s, filter 0.3s"
              }}
            >
              &#8594;
            </span>
            <div className={`${isConnected ? "" : "pointer-events-none opacity-50"} h-full`}>
              <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            </div>
          </div>
          {/* Mobile: overlay login on connect, login zIndex thấp hơn connect khi chưa connect */}
          <div className="relative flex md:hidden w-full h-full items-center justify-center">
            <div className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-500"
                 style={{zIndex: isConnected ? 20 : 5, pointerEvents: isConnected ? "auto" : "none"}}>
              <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            </div>
            <div className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-500"
                 style={{zIndex: isConnected ? 10 : 30, pointerEvents: isConnected ? "none" : "auto"}}>
              <ConnectComponent onConnected={() => setIsConnected(true)} />
            </div>
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

/* Add this to your App.css or global CSS for custom animation */
/*
@keyframes arrow-glow {
  0%, 100% { text-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e; }
  50% { text-shadow: 0 0 16px #22c55e, 0 0 32px #22c55e; }
}
.animate-arrow-glow {
  animation: arrow-glow 1.2s infinite alternate;
}
*/
