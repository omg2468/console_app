import React, { createContext, useState, ReactNode, MouseEvent } from 'react';

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  content: ReactNode | null;
  clipBoard: string | null;
  setClipboard?: (value: string | null) => void;
  showMenu: (x: number, y: number, content: ReactNode) => void;
  hideMenu: () => void;
}

export const ContextMenuContext = createContext<ContextMenuState | undefined>(undefined);

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState<ReactNode | null>(null);
  const [clipBoard, setClipboard] = useState<string | null>(null);

  const showMenu = (x: number, y: number, content: ReactNode) => {
    setPosition({ x, y });
    setContent(content);
    setIsVisible(true);
  };

  const hideMenu = () => {
    setIsVisible(false);
    setContent(null);
  };

  return (
    <ContextMenuContext.Provider value={{ isVisible, position, content, clipBoard, showMenu, hideMenu, setClipboard }}>
      {children}
    </ContextMenuContext.Provider>
  );
};
