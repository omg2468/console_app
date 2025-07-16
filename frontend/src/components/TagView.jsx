import React, { useContext, useState, useEffect } from "react";
import { ContextMenuContext } from "../store";

import {
  ReadTagView,
  StopReadTagView,
} from "../../wailsjs/go/control/ControlService";

import { ReadTagView as ReadTagViewWS } from "../../wailsjs/go/workspace/WorkspaceService";

const TagView = () => {
  const [display, setDisplay] = useState(false);
  const [loadingPos, setLoadingPos] = useState(0);
  const barWidth = 40;

  const context = useContext(ContextMenuContext);
  const data = context.tagViewData || [];

  useEffect(() => {
    if (!data?.length) return;
    const interval = setInterval(() => {
      setLoadingPos((prev) => (prev >= 100 ? -loadingPos : prev + 1));
    }, 15);
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="flex flex-col items-start justify-start p-2 w-full h-full">
      <p className="text-md font-semibold">TAG VIEW</p>

      <div className="flex flex-row items-center justify-center gap-1 mb-2">
        <input
          disabled={!context.isConnected}
          type="checkbox"
          className="custom"
          checked={display}
          onChange={(e) => {
            const checked = e.target.checked;

            if (checked) {
              if (context.selectedConnection === "serial") {
                ReadTagView();
              } else if (context.selectedConnection === "ethernet") {
                ReadTagViewWS(
                  context.socketAddress,
                  context.socketPort,
                  "enable"
                );
              }
            } else {
              if (context.selectedConnection === "serial") {
                StopReadTagView();
              } else if (context.selectedConnection === "ethernet") {
                ReadTagViewWS(
                  context.socketAddress,
                  context.socketPort,
                  "disable"
                );
              }
            }

            setDisplay(checked);
          }}
        />

        <span>Display value</span>
        <div className="w-[100px] h-2 bg-gray-200 rounded overflow-hidden relative">
          <div
            className="absolute h-full bg-blue-500 rounded transition-all"
            style={{
              width: `${data?.length ? barWidth : 0}%`,
              left: `${loadingPos}%`,
              transition: "left 0.01s linear",
              display: display && data?.length ? "block" : "none",
            }}
          />
        </div>
      </div>

      <div className="border flex-1 w-full">
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
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-right">ID</th>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1 text-right">Value</th>
                <th className="border px-2 py-1">Unit</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {display &&
                data.map((tag) => (
                  <tr key={tag.id}>
                    <td className="border px-2 py-1 text-right">{tag.id}</td>
                    <td className="border px-2 py-1">{tag.name}</td>
                    <td className="border px-2 py-1 text-right">
                      {tag.value.toFixed(2)}
                    </td>
                    <td className="border px-2 py-1">{tag.unit}</td>
                    <td className="border px-2 py-1">{tag.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TagView;
