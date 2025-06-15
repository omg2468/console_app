import React, { createContext, useState } from "react";

export const ContextMenuContext = createContext(undefined);

export const ContextMenuProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(null);
  const [clipBoard, setClipboard] = useState(null);

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
        setClipboard
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};
