import React, { useContext, useState, useEffect } from "react";
import { ContextMenuContext } from "../store";

import {
  ReadMemoryView,
  StopReadMemoryView,
} from "../../wailsjs/go/control/ControlService";

const MemoryView = () => {
  const [display, setDisplay] = useState(false);
  const [loadingPos, setLoadingPos] = useState(0);
  const [precision, setPrecision] = useState(2);
  const barWidth = 40;

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
            {memory && display ? memory[idx]?.toFixed(precision) : "-"}
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

  useEffect(() => {
    if (!memory?.length) return;
    const interval = setInterval(() => {
      setLoadingPos((prev) => (prev >= 100 ? -loadingPos : prev + 1));
    }, 15);
    return () => clearInterval(interval);
  }, [memory]);

  return (
    <div className="flex flex-col items-start justify-start p-2 w-full h-full">
      <div className="flex flex-row justify-between items-center w-full mb-2">
        <div>
          <p className="text-md font-semibold">MEMORY VIEW</p>
        </div>
        <div className="flex flex-row items-center gap-1">
          <div>Precision</div>
          <input
            type="number"
            className="w-12 px-1 py-0.5 text-sm border border-gray-300 rounded"
            value={precision}
            min={1}
            max={6}
            step={1}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 && val <= 6) {
                setPrecision(val);
              } else if (e.target.value === "") {
                setPrecision("");
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-start gap-1 w-full">
        <input
          disabled={!context.isConnected}
          type="checkbox"
          className="custom"
          checked={display}
          onChange={(e) => {
            if (e.target.checked) {
              ReadMemoryView();
            } else {
              StopReadMemoryView();
            }
            setDisplay(e.target.checked);
          }}
        />
        <span className="text-sm">Display memory value</span>
        <div className="w-[100px] h-2 bg-gray-200 rounded overflow-hidden relative">
          <div
            className="absolute h-full bg-blue-500 rounded transition-all"
            style={{
              width: `${memory?.length ? barWidth : 0}%`,
              left: `${loadingPos}%`,
              transition: "left 0.01s linear",
              display: display && memory?.length ? "block" : "none",
            }}
          />
        </div>
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
          <table className="w-full text-xs border-collapse">
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
