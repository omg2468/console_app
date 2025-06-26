import { useContext, useEffect, useRef, useState } from "react";
import { ContextMenuContext } from "../store";

const ContextMenu = () => {
  const context = useContext(ContextMenuContext);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (context?.isVisible && menuRef.current) {
      // Lấy kích thước menu
      const menuRect = menuRef.current.getBoundingClientRect();
      let { x, y } = context.position || { x: 0, y: 0 };

      // Điều chỉnh nếu vượt phải hoặc dưới màn hình
      if (x + menuRect.width > window.innerWidth) {
        x = window.innerWidth - menuRect.width - 8;
      }
      if (y + menuRect.height > window.innerHeight) {
        y = window.innerHeight - menuRect.height - 8;
      }
      setMenuPos({ top: y, left: x });
    }
  }, [context?.isVisible, context?.position, context?.content]);

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

  const { hideMenu, content } = context;

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
      style={{ top: menuPos.top, left: menuPos.left }}
      onClick={hideMenu}
      ref={menuRef}
    >
      {content.map((option, index) => (
        <li
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (!!option?.disabled) return;
            handleClick(option.action);
          }}
          className={`px-3 py-1.5 cursor-pointer ${
            !!option?.disabled ? "text-gray-400" : "hover:bg-gray-100"
          } `}
        >
          {option.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
