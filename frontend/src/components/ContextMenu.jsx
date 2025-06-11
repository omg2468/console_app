import { useContext, useEffect, useRef } from "react";
import { ContextMenuContext } from "../store";

const ContextMenu = () => {
  const context = useContext(ContextMenuContext);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        context?.hideMenu();
      }
    };

    if (context?.isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [context?.isVisible]);

  if (!context || !context.isVisible) return null;

  const { position, hideMenu, content } = context;

  // Fix: Ensure content is an array before mapping
  if (!Array.isArray(content) || content.length === 0) return null;

  const handleClick = (action) => {
    if (typeof action === "function") {
      action();
    }
    hideMenu();
  };

  return (
    <ul
      className='absolute bg-white border border-gray-300 shadow-md min-w-[160px] text-sm rounded z-[1000] py-1'
      style={{ top: position.y, left: position.x }}
      onClick={hideMenu}
      ref={menuRef}
    >
      {content.map((option, index) => (
        <li
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(option.action);
          }}
          className='px-3 py-1.5 cursor-pointer hover:bg-gray-100'
        >
          {option.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
