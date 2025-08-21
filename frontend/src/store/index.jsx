import { createContext, useEffect, useState } from "react";

export const ContextMenuContext = createContext(undefined);

export const ContextMenuProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(null);
  const [clipBoard, setClipboard] = useState(null);
  const [analogData, setAnalogData] = useState([]);
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
  });
  const [infoDialog, setInfoDialog] = useState(null);
  const [socketAddress, setSocketAddress] = useState("");
  const [socketPort, setSocketPort] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [changeMode, setChangeMode] = useState("");
  const [displayAnalogUnit, setDisplayAnalogUnit] = useState(false);
  const [displayMemoryView, setDisplayMemoryView] = useState(false);
  const [displayTagView, setDisplayTagView] = useState(false);

  // Control tab states
  const [digitalOutput, setDigitalOutput] = useState(Array(8).fill(false));
  const [dataCommand, setDataCommand] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("read_system_info");
  const [inputType, setInputType] = useState("text");

  // MemoryView tab states
  const [memoryPrecision, setMemoryPrecision] = useState(2);

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
        changeMode,
        setChangeMode,
        displayAnalogUnit,
        setDisplayAnalogUnit,
        displayMemoryView,
        setDisplayMemoryView,
        displayTagView,
        setDisplayTagView,
        // Control tab states
        digitalOutput,
        setDigitalOutput,
        dataCommand,
        setDataCommand,
        selectedCommand,
        setSelectedCommand,
        inputType,
        setInputType,
        // MemoryView tab states
        memoryPrecision,
        setMemoryPrecision,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};
