import { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChangePassword, setIsChangePassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo: chỉ cần có username và password là cho đăng nhập
    if (username && password) {
      setError("");
      onLoginSuccess();
    } else {
      setError("Vui lòng nhập đầy đủ thông tin.");
    }
  };

  return (

      <div className='flex flex-col items-center justify-center min-w-[384px] min-h-[420px] bg-white p-8 rounded-lg shadow-md h-full  w-full max-w-sm'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Login</h1>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div >
            <label htmlFor='username' className='block text-gray-700 mb-1'>
              Username
            </label>
            <input
              type='text'
              id='username'
              className='w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div >
            <label htmlFor='password' className='block text-gray-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              id='password'
              className='w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className='block text-blue-400 text-sm  mb-1 text-right cursor-pointer'>
            Porgot password
          </div>
          {error && <div className='text-red-500 text-sm'>{error}</div>}
          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'
          >
            Login
          </button>
        </form>
      </div>

  );
}
