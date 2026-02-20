import React, { useState, useEffect } from 'react';
import { ScriptModel, UserInput, GeneratedScript } from '../types';
import * as storageService from '../services/storage';
import * as geminiService from '../services/gemini';
import { ModelCard } from '../components/ModelCard';
import { ArrowLeft, Wand2, Copy, Check, RotateCcw, Loader2, History, Download, FileText, Trash2, ShieldCheck, AlertTriangle, ArrowDown } from 'lucide-react';

type TabView = 'GENERATOR' | 'HISTORY';

export const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('GENERATOR');
  const [models, setModels] = useState<ScriptModel[]>([]);
  const [history, setHistory] = useState<GeneratedScript[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Generator State
  const [selectedModel, setSelectedModel] = useState<ScriptModel | null>(null);
  const [userInput, setUserInput] = useState<UserInput>({ topic: '', tone: 'Energético', additionalInfo: '', dynamicFields: {} });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    const [modelsData, historyData] = await Promise.all([
      storageService.getModels(),
      storageService.getHistory()
    ]);
    setModels(modelsData);
    setHistory(historyData);
    setIsLoadingData(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    setIsGenerating(true);
    setResult(null);
    setGenerationError(null);

    try {
      const script = await geminiService.generateScript(selectedModel, userInput);
      setResult(script);
      
      const newHistoryItem: GeneratedScript = {
        id: crypto.randomUUID(),
        content: script,
        timestamp: Date.now(),
        modelName: selectedModel.name,
        topic: userInput.topic
      };

      // Save to history and update local state
      await storageService.saveHistory(newHistoryItem);
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error(error);
      setGenerationError(error.message || "Algo deu errado ao conectar com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyTemplate = () => {
    if (selectedModel?.promptTemplate) {
      navigator.clipboard.writeText(selectedModel.promptTemplate);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    }
  };

  const handleUseTemplate = () => {
    if (selectedModel?.promptTemplate) {
      setUserInput({ ...userInput, topic: selectedModel.promptTemplate });
    }
  };

  const handleDownload = (script: GeneratedScript) => {
    const element = document.createElement("a");
    const file = new Blob([script.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    // Sanitize filename
    const filename = `Roteiro-${script.topic.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}-${new Date(script.timestamp).toISOString().split('T')[0]}.txt`;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handleDeleteHistory = async (id: string) => {
    if (confirm('Deseja remover este roteiro do seu histórico?')) {
      await storageService.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleBack = () => {
    setSelectedModel(null);
    setResult(null);
    setGenerationError(null);
    setUserInput({ topic: '', tone: 'Energético', additionalInfo: '', dynamicFields: {} });
  };

  // --- RENDER: GENERATOR VIEW (SELECTED MODEL) ---
  if (selectedModel && activeTab === 'GENERATOR') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <button 
          onClick={handleBack}
          className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Modelos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                {selectedModel.name}
              </h2>
              
              <div className="flex items-center space-x-2 text-xs text-fox-400 bg-fox-500/10 px-3 py-1.5 rounded-full w-fit mb-4 border border-fox-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Agente FoxOn (Configuração Protegida)</span>
              </div>

              <p className="text-sm text-slate-400 mb-6">{selectedModel.description}</p>
              
              {/* PROMPT TEMPLATE COPY AREA */}
              {selectedModel.promptTemplate && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template de Pedido</label>
                    <div className="flex space-x-2">
                      <button 
                        type="button"
                        onClick={handleUseTemplate}
                        className="text-xs flex items-center bg-fox-600/10 text-fox-500 hover:bg-fox-600/20 px-2 py-1 rounded transition-colors"
                        title="Preencher automaticamente no campo abaixo"
                      >
                        <ArrowDown className="w-3 h-3 mr-1" /> Usar
                      </button>
                      <button 
                        type="button"
                        onClick={handleCopyTemplate}
                        className="text-xs flex items-center bg-slate-800 text-slate-300 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                      >
                        {templateCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {templateCopied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 relative group">
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-words">{selectedModel.promptTemplate}</pre>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Copie o template acima, cole abaixo e preencha as informações.
                  </p>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* DYNAMIC FIELDS RENDERER */}
                {selectedModel.fields && selectedModel.fields.length > 0 ? (
                  <div className="space-y-4">
                    {selectedModel.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {field.label} {field.required && <span className="text-fox-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={userInput.dynamicFields?.[field.id] || ''}
                            onChange={e => setUserInput({
                              ...userInput,
                              dynamicFields: { ...userInput.dynamicFields, [field.id]: e.target.value }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none h-32 resize-none font-mono text-sm"
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        ) : (
                          <input
                            type="text"
                            value={userInput.dynamicFields?.[field.id] || ''}
                            onChange={e => setUserInput({
                              ...userInput,
                              dynamicFields: { ...userInput.dynamicFields, [field.id]: e.target.value }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none text-sm"
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* FALLBACK LEGACY INPUT */
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tema do Vídeo / Informações</label>
                    <textarea
                      value={userInput.topic}
                      onChange={e => setUserInput({...userInput, topic: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none h-48 resize-none font-mono text-sm"
                      placeholder={selectedModel.promptTemplate ? "Cole o template aqui e preencha..." : "Descreva seu pedido..."}
                      required
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tom de Voz</label>
                    <select
                      value={userInput.tone}
                      onChange={e => setUserInput({...userInput, tone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                    >
                      <option>Energético</option>
                      <option>Profissional</option>
                      <option>Engraçado</option>
                      <option>Inspirador</option>
                      <option>Sério</option>
                      <option>Casual</option>
                      <option>Polêmico</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Obs. Extras (Opcional)</label>
                    <input
                      type="text"
                      value={userInput.additionalInfo}
                      onChange={e => setUserInput({...userInput, additionalInfo: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none text-sm"
                      placeholder="Ex: Não use gírias, cite 'Link na Bio'..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-fox-600 to-fox-500 hover:from-fox-500 hover:to-fox-400 text-white rounded-lg font-bold shadow-lg shadow-fox-600/20 transition-all transform hover:scale-[1.02] flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" /> Gerar Roteiro
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                <h3 className="font-bold text-lg text-slate-200">Roteiro Gerado</h3>
                {result && (
                  <div className="flex space-x-2">
                     <button
                      onClick={handleGenerate}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                      title="Regenerar"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        copied 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-grow">
                {generationError ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
                    <h4 className="text-red-400 font-bold mb-2">Erro na Geração</h4>
                    <p className="text-red-300/80">{generationError}</p>
                  </div>
                ) : result ? (
                  <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-fox-100 max-w-none whitespace-pre-wrap font-sans text-base leading-relaxed">
                    {result}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                    {isGenerating ? (
                      <div className="text-center animate-pulse">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-fox-500" />
                        <p>A FoxOn IA está escrevendo seu roteiro...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Wand2 className="w-16 h-16 mx-auto mb-4" />
                        <p>Seu roteiro viral aparecerá aqui.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN DASHBOARD (TABS) ---
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Tab Navigation */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-1">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Estúdio de Criação</h2>
           <p className="text-slate-400">Gerencie e crie seus roteiros virais.</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`flex items-center pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'GENERATOR' 
                ? 'border-fox-500 text-white' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Criar Novo
          </button>
          <button
             onClick={() => setActiveTab('HISTORY')}
             className={`flex items-center pb-3 px-2 border-b-2 transition-colors ${
               activeTab === 'HISTORY' 
                 ? 'border-fox-500 text-white' 
                 : 'border-transparent text-slate-500 hover:text-slate-300'
             }`}
          >
            <History className="w-4 h-4 mr-2" />
            Meus Roteiros
          </button>
        </div>
      </div>

      {/* CONTENT: GENERATOR LIST */}
      {activeTab === 'GENERATOR' && (
        <>
          {isLoadingData ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-10 h-10 text-fox-500 animate-spin" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.length > 0 ? (
                models.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    role="CLIENT"
                    onSelect={setSelectedModel}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                  <div className="p-4 bg-slate-800 rounded-full mb-4">
                    <Wand2 className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Nenhum Modelo Disponível</h3>
                  <p className="text-slate-400 text-center max-w-md mt-2">
                    Parece que o administrador ainda não criou nenhum modelo de roteiro. 
                    Entre em contato com o suporte ou aguarde a atualização.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CONTENT: HISTORY LIST */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                <div className="flex-grow">
                   <div className="flex items-center mb-2">
                     <span className="bg-fox-600/20 text-fox-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mr-3">
                       {item.modelName || 'Modelo Desconhecido'}
                     </span>
                     <span className="text-slate-500 text-xs">
                       {new Date(item.timestamp).toLocaleDateString('pt-BR')} às {new Date(item.timestamp).toLocaleTimeString('pt-BR')}
                     </span>
                   </div>
                   <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.topic}</h3>
                   <p className="text-slate-400 text-sm line-clamp-2">{item.content.substring(0, 150)}...</p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleDownload(item)}
                    className="flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-fox-600 hover:text-white text-slate-300 rounded-lg transition-all w-full md:w-auto"
                    title="Baixar Arquivo"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar .txt
                  </button>
                  <button
                    onClick={() => handleDeleteHistory(item.id)}
                    className="flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
               <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-white">Histórico Vazio</h3>
               <p className="text-slate-500">Você ainda não gerou nenhum roteiro.</p>
               <button 
                 onClick={() => setActiveTab('GENERATOR')}
                 className="mt-4 text-fox-400 hover:text-fox-300 font-medium text-sm"
               >
                 Criar meu primeiro roteiro &rarr;
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper Icon for loading state
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
  </svg>
);