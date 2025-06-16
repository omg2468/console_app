import React, { useContext, useState } from "react";
import { ContextMenuContext } from "../store";

const MemoryView = () => {
  const [display, setDisplay] = useState(false);

  const context = useContext(ContextMenuContext);

  const memory = context.memoryViewData;

  const totalRegisters = 256;
  const columns = 8;
  const rows = Math.ceil(totalRegisters / (columns / 2));
  const colArrays = [];
  for (let col = 0; col < columns / 2; col++) {
    colArrays[col] = [];
    for (let row = 0; row < rows; row++) {
      const idx = col * rows + row;
      if (idx < totalRegisters) {
        colArrays[col].push(idx);
      }
    }
  }
  const tableRows = [];
  for (let row = 0; row < rows; row++) {
    const cells = [];
    for (let col = 0; col < columns / 2; col++) {
      const idx = colArrays[col][row];
      if (idx !== undefined) {
        cells.push(
          <td key={`reg-${col}-${row}`} className="border px-2 py-1 text-right">
            {`Reg${idx}`}
          </td>
        );
        cells.push(
          <td key={`val-${col}-${row}`} className="border px-2 py-1 ">
            {memory && display ? memory[idx] : "-"}
          </td>
        );
      } else {
        cells.push(<td key={`reg-empty-${col}-${row}`} className="border" />);
        cells.push(<td key={`val-empty-${col}-${row}`} className="border" />);
      }
    }
    tableRows.push(<tr key={row}>{cells}</tr>);
  }

  const header = [];
  for (let i = 0; i < columns / 2; i++) {
    header.push(
      <th key={`hreg-${i}`} className="border bg-gray-100 px-2 py-1">
        Register
      </th>
    );
    header.push(
      <th key={`hval-${i}`} className="border bg-gray-100 px-2 py-1">
        Value
      </th>
    );
  }

  return (
    <div className="flex flex-col items-start justify-start p-2 w-full h-full">
      <p className="text-md font-semibold">MEMORY VIEW</p>
      <div className="flex flex-row items-center justify-center gap-1">
        <input
          type="checkbox"
          className="custom"
          checked={display}
          onChange={() => setDisplay(!display)}
        />
        <span>Display memory value</span>
      </div>
      <div
        className="border flex-1 w-full"
        style={{ minHeight: 0, height: "1px" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {header.map((cell, idx) => (
                  <th
                    key={cell.key}
                    className={cell.props.className}
                    style={{
                      ...cell.props.style,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      background: "#f3f4f6",
                      marginTop: 0,
                      boxShadow: "0 2px 2px -2px #ccc",
                      // Thêm chiều cao cho header để không che row đầu tiên
                      height: "32px",
                    }}
                  >
                    {cell.props.children}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Thêm padding-top cho hàng đầu tiên để tránh bị che */}
              {tableRows.length > 0 &&
                React.cloneElement(tableRows[0], {
                  style: { ...tableRows[0].props.style, height: "36px" },
                })}
              {tableRows.slice(1)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemoryView;
