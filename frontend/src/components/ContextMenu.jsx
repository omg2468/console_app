import React from "react";

const ContextMenu = ({ x, y, visible, options = [], onSelect, onClose }) => {
  if (!visible) return null;

  const handleClick = (action) => {
    onSelect(action);
    onClose();
  };

  return (
    <ul
      className="absolute bg-white border border-gray-300 shadow-md min-w-[160px] text-sm rounded z-[1000] py-1"
      style={{ top: y, left: x }}
    >
      {options.map((option, index) => (
        <li
          key={index}
          onClick={() => handleClick(option.action)}
          className="px-3 py-1.5 cursor-pointer hover:bg-gray-100"
        >
          {option.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
