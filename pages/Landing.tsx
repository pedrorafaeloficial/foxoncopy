import React, { useState } from 'react';
import { User, AlertCircle, KeyRound, Loader2, PenTool, Eye, EyeOff } from 'lucide-react';
import * as storageService from '../services/storage';

interface LandingProps {
  onLoginSuccess: (role: 'ADMIN' | 'CLIENT', remember: boolean) => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingStatus('Autenticando...');

    try {
      // 1. Initialize DB Connection (loads default clients if needed)
      await storageService.connectDatabase();
      
      // 2. Check Admin Credentials (Hardcoded for this system as requested)
      if (username === 'admin' && password === 'admin') {
        setLoadingStatus('Carregando Painel Admin...');
        await new Promise(resolve => setTimeout(resolve, 500));
        onLoginSuccess('ADMIN', rememberMe);
        return;
      }

      // 3. Check Client Credentials (From Storage)
      const clients = await storageService.getClients();
      const validClient = clients.find(
        c => c.username === username && c.password === password
      );

      if (validClient) {
        setLoadingStatus('Carregando Estúdio...');
        await new Promise(resolve => setTimeout(resolve, 500));
        onLoginSuccess('CLIENT', rememberMe);
      } else {
        setError('Usuário ou senha incorretos.');
        setIsLoading(false);
      }

    } catch (e) {
      console.error(e);
      setError('Erro de conexão ou dados inválidos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 animate-fade-in">
      
      {/* Header Section */}
      <div className="text-center mb-12 relative z-10 flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-fox-600/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="mb-8 p-5 bg-gradient-to-br from-fox-500 to-fox-600 rounded-2xl shadow-2xl shadow-fox-500/20 animate-fade-in-up">
          <PenTool className="h-12 w-12 text-white" strokeWidth={2} />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
          Criador de Roteiros Virais
        </h1>
        <p className="text-xl md:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-fox-400 to-fox-200">
          Exclusivo para Clientes FoxOn
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-fox-900/20 relative overflow-hidden">
        
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:border-fox-500 focus:ring-1 focus:ring-fox-500 outline-none transition-all placeholder-slate-600"
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-10 text-white focus:border-fox-500 focus:ring-1 focus:ring-fox-500 outline-none transition-all placeholder-slate-600"
                placeholder="Digite sua senha"
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

          <div className="flex items-center space-x-3 py-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fox-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                rememberMe ? 'bg-fox-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`${
                  rememberMe ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span 
              className="text-sm font-medium text-slate-400 cursor-pointer select-none hover:text-slate-300" 
              onClick={() => setRememberMe(!rememberMe)}
            >
              Continuar conectado
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] shadow-lg bg-gradient-to-r from-fox-600 to-fox-500 hover:from-fox-500 hover:to-fox-400 shadow-fox-600/20 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {loadingStatus}
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};