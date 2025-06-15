import React, { useContext } from "react";
import { ContextMenuContext } from "../store";

const TagView = () => {
  const context = useContext(ContextMenuContext);
  const data = context.tagViewData || [];

  return (
    <div className="flex flex-col items-start justify-start p-2 w-full h-full">
      <p className="text-md font-semibold">TAG VIEW</p>

      <div className="flex flex-row items-center justify-center gap-1 mb-2">
        <input type="checkbox" className="custom" checked readOnly />
        <span>Display value</span>
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
          <table className="w-full text-sm border-collapse">
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
              {data.map((tag) => (
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
