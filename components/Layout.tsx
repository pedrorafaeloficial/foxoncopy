import React, { ReactNode } from 'react';
import { LogOut, Database, PenTool } from 'lucide-react';
import { DB_CONFIG } from '../services/storage';

interface LayoutProps {
  children: ReactNode;
  activeRole?: 'ADMIN' | 'CLIENT';
  onHome: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRole, onHome, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-fox-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer group" onClick={onHome}>
              <div className="mr-3 p-2 bg-gradient-to-br from-fox-500 to-fox-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                <PenTool className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fox-400 to-white">
                  FoxOn Copy
                </h1>
                {activeRole && (
                  <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
                    {activeRole === 'ADMIN' ? 'Administrador' : 'Estúdio de Criação'}
                  </span>
                )}
              </div>
            </div>

            {activeRole && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-fox-400 hover:bg-slate-900 rounded-full transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {children}
      </main>

      <footer className="border-t border-slate-900 mt-auto py-8 text-center text-slate-600 text-xs">
        <p className="mb-2">&copy; {new Date().getFullYear()} FoxOn Copy. Powered by Gemini.</p>
        <div className="flex justify-center items-center space-x-2 text-slate-700">
           <Database className={`w-3 h-3 ${DB_CONFIG.isConnected ? 'text-green-600' : 'text-slate-700'}`} />
           <span>
             DB: {DB_CONFIG.isConnected ? 'foxon-db (Conectado)' : 'Armazenamento Local (Desconectado)'}
           </span>
        </div>
      </footer>
    </div>
  );
};