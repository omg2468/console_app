export default function Main({ onLoginOut }) {
  return (
    <div className='flex flex-col items-start justify-center min-h-screen bg-gray-100'>
      <div className='p-2 flex gap-1'>
        <button className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'>
          New Project
        </button>
        <button className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'>
          Save Project
        </button>
        <button className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'>
          Save As Project
        </button>
        <button className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'>
          Import Project
        </button>
        <button
          className='rounded-md bg-white border border-gray-300 px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:border-blue-400 transition-colors'
          onClick={onLoginOut}
        >
          Log Out
        </button>
      </div>
      <div className='flex-1'>
        
      </div>
    </div>
  );
}
