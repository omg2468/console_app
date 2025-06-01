import { useState, useEffect } from "react";
import "./App.css";
import Main from "./screens/Main";
import Login from "./screens/login";

function App() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Check sessionStorage instead of localStorage
  useEffect(() => {
    const savedUserData = sessionStorage.getItem('userData');
    const savedLoginStatus = sessionStorage.getItem('isLoggedIn');
    
    if (savedLoginStatus === 'true' && savedUserData) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(savedUserData));
      setCurrentScreen("main");
    }
  }, []);

  const navigateToMain = (username) => {
    const userData = { username, loginTime: new Date().toISOString() };
    
    setIsLoggedIn(true);
    setUserData(userData);
    setCurrentScreen("main");
    
    // Save to sessionStorage instead of localStorage
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userData', JSON.stringify(userData));
  };

  const navigateToLogin = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setCurrentScreen("login");
    
    // Clear sessionStorage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userData');
  };

  console.log("Current screen:", currentScreen);
  return (
    <div id="App">
      {currentScreen === "login" && <Login onLoginSuccess={navigateToMain} />}
      {currentScreen === "main" && <Main onLogout={navigateToLogin} userData={userData} />}
    </div>
  );
}

export default App;
