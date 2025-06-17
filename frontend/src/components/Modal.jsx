import { useState } from "react";

const Modal = ({ isOpen }) => {
  const [input, setInput] = useState("");
  if (!isOpen) return null;
  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'
      onClick={() => setShowModal({ show: false, action: null })}
      style={{ zIndex: 1000 }}
    >
      <div
        className='bg-white p-6 rounded-lg shadow-lg w-[300px] max-h-[90vh] overflow-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type='text'
          className='w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className='flex flex-row justify-around'>
          <button
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            onClick={() => handleAction(showModal.action, input)}
          >
            Save
          </button>
          <button
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            onClick={() => setShowModal({ show: false, action: null })}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
