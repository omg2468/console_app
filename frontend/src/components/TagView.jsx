import React from "react";

const TagView = () => {
  // Tạo dữ liệu mẫu: 6 hàng, 5 cột (cột đầu là index)
  const rows = 6;
  const cols = 5;
  const data = Array.from({ length: rows }, (_, rowIdx) =>
    Array.from({ length: cols }, (_, colIdx) =>
      colIdx === 0 ? rowIdx : `Value${rowIdx}-${colIdx}`
    )
  );

  return (
    <div className="flex flex-col items-start justify-start p-2 w-full h-full">
      <p className="text-md font-semibold">TAG VIEW</p>
      <div className='flex flex-row items-center justify-center gap-1'>
        <input type='checkbox' className='custom' checked readOnly />
        <span>Display value</span>
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
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="border px-2 py-1"
                      style={{
                        background: colIdx === 0 ? "#f3f4f6" : undefined,
                        textAlign: colIdx === 0 ? "right" : "left",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
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