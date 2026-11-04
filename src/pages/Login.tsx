import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    const user = login(username, password);
    if (user) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-2xl shadow-yellow-500/20 mb-4">
            <span className="text-3xl font-bold text-black">MK</span>
          </div>
          <h1 className="text-2xl font-bold text-yellow-400">Mr Ketan Fashion Store</h1>
          <p className="text-gray-400 mt-1">Inventory Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20"
            >
              Sign In
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Admin:</span> admin / admin123</p>
              <p><span className="font-medium">Employee:</span> employee / emp123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2024 Mr Ketan Fashion Store. All rights reserved.
        </p>
      </div>
    </div>
  );
}
