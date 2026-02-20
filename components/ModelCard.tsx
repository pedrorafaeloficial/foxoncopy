import React from 'react';
import { ScriptModel } from '../types';
import { Video, BookOpen, Coffee, Sparkles, Edit, Trash2, ArrowRight, Flame } from 'lucide-react';

interface ModelCardProps {
  model: ScriptModel;
  role: 'ADMIN' | 'CLIENT';
  onSelect: (model: ScriptModel) => void;
  onEdit?: (model: ScriptModel) => void;
  onDelete?: (id: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, role, onSelect, onEdit, onDelete }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'book': return <BookOpen className="w-6 h-6" />;
      case 'coffee': return <Coffee className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'fire': return <Flame className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-fox-600/50 transition-all hover:shadow-xl hover:shadow-fox-900/10 group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-lg text-fox-500 group-hover:bg-fox-600 group-hover:text-white transition-colors">
          {getIcon(model.icon)}
        </div>
        {role === 'ADMIN' && (
          <div className="flex space-x-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(model); }}
              className="p-1.5 text-slate-500 hover:text-fox-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(model.id); }}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{model.name}</h3>
      <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-3">{model.description}</p>

      <button
        onClick={() => onSelect(model)}
        className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all ${
          role === 'CLIENT' 
            ? 'bg-slate-800 hover:bg-fox-600 text-white hover:shadow-lg hover:shadow-fox-600/20' 
            : 'bg-slate-800/50 text-slate-400 cursor-default'
        }`}
        disabled={role === 'ADMIN'}
      >
        {role === 'CLIENT' ? (
          <>
            Usar Modelo <ArrowRight className="w-4 h-4 ml-2" />
          </>
        ) : (
          <span className="text-xs uppercase tracking-wide">Apenas Visualização</span>
        )}
      </button>
    </div>
  );
};