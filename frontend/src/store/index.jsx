import { createContext, useState } from "react";

export const ContextMenuContext = createContext(undefined);

export const ContextMenuProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(null);
  const [clipBoard, setClipboard] = useState(null);
  const [analogData, setAnalogData] = useState([]);
  const [memoryViewData, setMemoryViewData] = useState([]);
  const [tagViewData, setTagViewData] = useState([]);

  const showMenu = (x, y, content) => {
    setPosition({ x, y });
    setContent(content);
    setIsVisible(true);
  };

  const hideMenu = () => {
    setIsVisible(false);
    setContent(null);
  };

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
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};
