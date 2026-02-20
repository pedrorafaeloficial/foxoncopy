import React, { useState } from 'react';
import { ArrowLeft, Lock, User, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (role: 'ADMIN' | 'CLIENT') => void;
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
      // Logic to determine role based on credentials
      if (username === 'admin' && password === 'admin') {
        onLoginSuccess('ADMIN');
      } else if (username === 'client' && password === 'client') {
        onLoginSuccess('CLIENT');
      } else {
        setError('Invalid credentials. Please check the demo hint below.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-fox-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-fox-500">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Welcome Back
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Please enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:border-fox-500 focus:ring-1 focus:ring-fox-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-10 text-white focus:border-fox-500 focus:ring-1 focus:ring-fox-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] shadow-lg bg-fox-600 hover:bg-fox-500 shadow-fox-600/20 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 mb-3">DEMO ACCOUNTS</p>
            <div className="flex flex-col space-y-2">
              <div className="inline-block bg-slate-950/50 px-4 py-2 rounded border border-slate-800 text-xs text-slate-400 font-mono">
                <span className="text-fox-500 font-bold">ADMIN:</span> user: <span className="text-white">admin</span> / pass: <span className="text-white">admin</span>
              </div>
              <div className="inline-block bg-slate-950/50 px-4 py-2 rounded border border-slate-800 text-xs text-slate-400 font-mono">
                <span className="text-blue-500 font-bold">CLIENT:</span> user: <span className="text-white">client</span> / pass: <span className="text-white">client</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};