import React, { useState } from "react";

const Main = ({ onLogout, userData }) => {
  return (
    <div className='w-full h-screen bg-[#D4F6FF] flex flex-col justify-start items-start p-6'>
      {/* Header with menu items */}
      <div className='flex gap-6 mb-8 w-full'>
        <button className='px-6 py-3 bg-white text-black rounded-lg shadow-md font-medium hover:bg-gray-50 hover:shadow-lg transition-all duration-200'>
          New Project
        </button>
        <button className='px-6 py-3 bg-white text-black rounded-lg shadow-md font-medium hover:bg-gray-50 hover:shadow-lg transition-all duration-200'>
          Save Project
        </button>
        <button className='px-6 py-3 bg-white text-black rounded-lg shadow-md font-medium hover:bg-gray-50 hover:shadow-lg transition-all duration-200'>
          Save As Project
        </button>
        <button className='px-6 py-3 bg-white text-black rounded-lg shadow-md font-medium hover:bg-gray-50 hover:shadow-lg transition-all duration-200'>
          Import Project
        </button>

        {/* User info and logout */}
        <div className='ml-auto flex items-center gap-4'>
          {userData && (
            <span className='text-black font-medium'>Welcome, {userData.username}!</span>
          )}
          <button
            onClick={onLogout}
            className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium'
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className='flex-1 w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200'>
        <div className='h-full flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-6xl mb-6'>🚀</div>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
              Ready to start your project?
            </h2>
            <p className='text-gray-600 mb-8 max-w-md'>
              Create a new project or load an existing one to begin working on your amazing ideas.
            </p>
            <div className='flex gap-4 justify-center'>
              <button className='px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md'>
                Create New Project
              </button>
              <button className='px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors'>
                Browse Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
