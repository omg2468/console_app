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
  const [selectedPort, setSelectedPort] = useState("");

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
        dataTest,
        setDataTest
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};
