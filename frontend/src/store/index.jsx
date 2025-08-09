import { createContext, useEffect, useState } from "react";

export const ContextMenuContext = createContext(undefined);

export const ContextMenuProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(null);
  const [clipBoard, setClipboard] = useState(null);
  const [analogData, setAnalogData] = useState([]);
  const [analogUnit, setAnalogUnit] = useState("V");
  const [memoryViewData, setMemoryViewData] = useState([]);
  const [tagViewData, setTagViewData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState("serial");
  const [selectedPort, setSelectedPort] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    dhcp: false,
    ip: "",
    netmask: "",
    gateway: "",
    dns: "",
    proxy: "",
    secondary_ip: "",
    global: "",
    modem: false,
  });
  const [infoDialog, setInfoDialog] = useState(null);
  const [socketAddress, setSocketAddress] = useState("");
  const [socketPort, setSocketPort] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  //Will remove this later
  const [dataTest, setDataTest] = useState("");

  const showMenu = (x, y, content) => {
    setPosition({ x, y });
    setContent(content);
    setIsVisible(true);
  };

  const hideMenu = () => {
    setIsVisible(false);
    setContent(null);
  };

  useEffect(() => {
    if (!isConnected) {
      setAnalogData([]);
      setMemoryViewData([]);
      setTagViewData([]);
    }
  }, [isConnected]);

  return (
    <ContextMenuContext.Provider
      value={{
        isVisible,
        position,
        content,
        clipBoard,
        showMenu,
        hideMenu,
        setClipboard,
        analogData,
        setAnalogData,
        memoryViewData,
        setMemoryViewData,
        tagViewData,
        setTagViewData,
        isConnected,
        setIsConnected,
        selectedPort,
        setSelectedPort,
        selectedConnection,
        setSelectedConnection,
        dataTest,
        setDataTest,
        isLogin,
        setIsLogin,
        role,
        setRole,
        formData,
        setFormData,
        infoDialog,
        setInfoDialog,
        socketAddress,
        setSocketAddress,
        socketPort,
        setSocketPort,
        isSocketConnected,
        setIsSocketConnected,
        analogUnit,
        setAnalogUnit,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};
