import React, { useState } from 'react';
import { FaGoogle, FaFacebook } from 'react-icons/fa'; // Icons for social login

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password); // Trigger login handler
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center y-10">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-orange-600">WebReich CRM</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Password</label>
            <div className="flex items-center justify-between">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <a href="#" className="text-sm text-orange-500 hover:text-orange-600 ml-2 mt-4">
              Forgot your password?
            </a>
          </div>

          {/* Remember Me */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-600">Remember me</label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
          >
            Sign in
          </button>
        </form>

        {/* Sign-up Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="text-orange-500 hover:text-orange-600">
              Sign up
            </a>
          </p>
        </div>

        {/* Social Login */}
        <div className="my-6">
          <div className="flex items-center justify-between">
            <span className="w-1/5 border-b"></span>
            <span className="text-sm text-gray-500">or</span>
            <span className="w-1/5 border-b"></span>
          </div>
          <div className="mt-4">
            <button className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition-colors">
              <FaGoogle className="text-red-500 mr-2" /> Sign in with Google
            </button>
            <button className="w-full mt-3 flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition-colors">
              <FaFacebook className="text-blue-600 mr-2" /> Sign in with Facebook
            </button>
          </div>
        </div>

        {/* Footer - Powered by WebReich */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <a href="#" className="text-orange-500 hover:text-orange-600">
              WebReich
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;