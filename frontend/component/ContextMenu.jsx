import React from "react";

const ContextMenu = ({ x, y, visible, options = [], onSelect, onClose }) => {
  if (!visible) return null;

  const handleClick = (action) => {
    onSelect(action);
    onClose();
  };

  return (
    <ul className="context-menu" style={{ top: y, left: x }}>
      {options.map((option, index) => (
        <li key={index} onClick={() => handleClick(option.action)}>
          {option.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
