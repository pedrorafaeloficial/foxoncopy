import React, { useState, useEffect } from 'react';
import { ScriptModel, ClientUser, ScriptModelField } from '../types';
import * as storageService from '../services/storage';
import { ModelCard } from '../components/ModelCard';
import { Plus, X, Save, AlertCircle, Loader2, Users, Wand2, Trash2, Building2, Copy, GripVertical, Type } from 'lucide-react';

type AdminTab = 'MODELS' | 'CLIENTS';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('MODELS');
  
  // Data State
  const [models, setModels] = useState<ScriptModel[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Model Editing State
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentModel, setCurrentModel] = useState<Partial<ScriptModel>>({});

  // Client Editing State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState<Partial<ClientUser>>({
    fullName: '',
    companyName: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [modelsData, clientsData] = await Promise.all([
      storageService.getModels(),
      storageService.getClients()
    ]);
    setModels(modelsData);
    setClients(clientsData);
    setIsLoading(false);
  };

  // --- MODEL HANDLERS ---

  const handleEditModel = (model: ScriptModel) => {
    setCurrentModel({ ...model, fields: model.fields || [] });
    setIsEditingModel(true);
  };

  const handleCreateModel = () => {
    setCurrentModel({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      systemInstruction: 'Você é um roteirista profissional para vídeos curtos...',
      promptTemplate: '', // Deprecated in UI
      fields: [
        { id: crypto.randomUUID(), label: 'Tema do Vídeo', type: 'textarea', required: true, placeholder: 'Sobre o que é o vídeo?' }
      ],
      icon: 'sparkles'
    });
    setIsEditingModel(true);
  };

  const handleAddField = () => {
    const newField: ScriptModelField = {
      id: crypto.randomUUID(),
      label: 'Novo Campo',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setCurrentModel(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleRemoveField = (id: string) => {
    setCurrentModel(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f.id !== id)
    }));
  };

  const handleUpdateField = (id: string, updates: Partial<ScriptModelField>) => {
    setCurrentModel(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      await storageService.deleteModel(id);
      loadData();
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentModel.id && currentModel.name && currentModel.systemInstruction) {
      setIsSaving(true);
      await storageService.saveModel(currentModel as ScriptModel);
      setIsSaving(false);
      setIsEditingModel(false);
      loadData();
    } else {
      alert('Por favor, preencha o Nome e as Instruções do Sistema.');
    }
  };

  // --- CLIENT HANDLERS ---

  const handleCreateClient = () => {
    setNewClient({
      fullName: '',
      companyName: '',
      username: '',
      password: ''
    });
    setIsAddingClient(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClient.username && newClient.password && newClient.fullName) {
      try {
        setIsSaving(true);
        const clientToSave: ClientUser = {
          id: crypto.randomUUID(),
          fullName: newClient.fullName!,
          companyName: newClient.companyName || '',
          username: newClient.username!,
          password: newClient.password!,
          createdAt: Date.now()
        };
        await storageService.saveClient(clientToSave);
        setIsSaving(false);
        setIsAddingClient(false);
        loadData();
      } catch (err: any) {
        alert(err.message || "Erro ao salvar cliente");
        setIsSaving(false);
      }
    } else {
      alert("Preencha todos os campos obrigatórios.");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja remover o acesso deste cliente?')) {
      await storageService.deleteClient(id);
      loadData();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4">
        <div className="mb-4 md:mb-0">
          <h2 className="text-3xl font-bold text-white">Painel Administrativo</h2>
          <p className="text-slate-400 mt-1">Gerencie a IA e os usuários da plataforma.</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => { setActiveTab('MODELS'); setIsEditingModel(false); setIsAddingClient(false); }}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'MODELS' 
                ? 'bg-fox-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Modelos de IA
          </button>
          <button
            onClick={() => { setActiveTab('CLIENTS'); setIsEditingModel(false); setIsAddingClient(false); }}
             className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
               activeTab === 'CLIENTS' 
                 ? 'bg-fox-600 text-white shadow-lg' 
                 : 'text-slate-400 hover:text-white hover:bg-slate-800'
             }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Clientes
          </button>
        </div>
      </div>

      {/* --- MODELS TAB CONTENT --- */}
      {activeTab === 'MODELS' && (
        <div className="space-y-6 animate-fade-in">
          {!isEditingModel && (
            <div className="flex justify-end">
              <button
                onClick={handleCreateModel}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-fox-600 text-white rounded-lg font-medium transition-colors border border-slate-700 hover:border-fox-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Modelo
              </button>
            </div>
          )}

          {isLoading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-10 h-10 text-fox-500 animate-spin" />
             </div>
          ) : isEditingModel ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {currentModel.id && models.find(m => m.id === currentModel.id) ? 'Editar Modelo' : 'Criar Novo Modelo'}
                </h3>
                <button onClick={() => setIsEditingModel(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveModel} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Modelo</label>
                    <input
                      type="text"
                      value={currentModel.name || ''}
                      onChange={e => setCurrentModel({ ...currentModel, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 focus:ring-1 focus:ring-fox-500 outline-none transition-all"
                      placeholder="Ex: Gerador de Ganchos Virais"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Ícone (Apenas Visual)</label>
                    <select
                      value={currentModel.icon || 'sparkles'}
                      onChange={e => setCurrentModel({ ...currentModel, icon: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                    >
                      <option value="sparkles">Brilho (Genérico)</option>
                      <option value="video">Câmera de Vídeo</option>
                      <option value="book">Livro (Educacional)</option>
                      <option value="coffee">Café (Lifestyle)</option>
                      <option value="fire">Fogo (Em Alta)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Descrição Curta</label>
                  <input
                    type="text"
                    value={currentModel.description || ''}
                    onChange={e => setCurrentModel({ ...currentModel, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none transition-all"
                    placeholder="Descreva brevemente o que este modelo faz para o cliente..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                     <label className="block text-sm font-bold text-fox-400 flex items-center">
                       <Type className="w-4 h-4 mr-2" />
                       Campos do Formulário (Cliente)
                     </label>
                     <button
                       type="button"
                       onClick={handleAddField}
                       className="text-xs flex items-center bg-slate-800 hover:bg-fox-600 hover:text-white text-slate-300 px-3 py-1.5 rounded transition-colors border border-slate-700"
                     >
                       <Plus className="w-3 h-3 mr-1" /> Adicionar Campo
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(currentModel.fields || []).map((field, index) => (
                      <div key={field.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-slate-700 transition-colors">
                        <div className="p-2 text-slate-600 cursor-move">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                          <div className="md:col-span-4">
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Nome do Campo</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-fox-500 outline-none"
                              placeholder="Ex: Tema do Vídeo"
                            />
                          </div>
                          
                          <div className="md:col-span-4">
                            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Placeholder (Dica)</label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-fox-500 outline-none"
                              placeholder="Ex: Descreva sobre o que..."
                            />
                          </div>

                          <div className="md:col-span-2">
                             <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Tipo</label>
                             <select
                                value={field.type}
                                onChange={(e) => handleUpdateField(field.id, { type: e.target.value as 'text' | 'textarea' })}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-fox-500 outline-none"
                             >
                               <option value="text">Texto Curto</option>
                               <option value="textarea">Texto Longo</option>
                             </select>
                          </div>

                          <div className="md:col-span-2 flex items-center pt-4 md:pt-0">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-700 text-fox-600 focus:ring-fox-500 bg-slate-900"
                              />
                              <span className="ml-2 text-sm text-slate-400">Obrigatório</span>
                            </label>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                          title="Remover Campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {(currentModel.fields || []).length === 0 && (
                      <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
                        Nenhum campo definido. O cliente verá apenas um campo de texto genérico.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                     <label className="block text-sm font-medium text-slate-400">Instrução do Sistema (Prompt Engineering)</label>
                     <span className="text-xs text-fox-400 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Define o comportamento da IA</span>
                  </div>
                  <textarea
                    value={currentModel.systemInstruction || ''}
                    onChange={e => setCurrentModel({ ...currentModel, systemInstruction: e.target.value })}
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-white font-mono text-sm focus:border-fox-500 outline-none transition-all resize-y"
                    placeholder="Você é um roteirista expert. Seu objetivo é..."
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Dica: Seja específico sobre o formato de saída, tom e restrições.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-6 py-3 bg-fox-600 hover:bg-fox-500 text-white rounded-lg font-bold shadow-lg shadow-fox-600/20 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSaving ? (
                      <>
                         <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" /> Salvar Modelo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  role="ADMIN"
                  onSelect={() => handleEditModel(model)}
                  onEdit={handleEditModel}
                  onDelete={handleDeleteModel}
                />
              ))}
              {models.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nenhum modelo encontrado. Crie o seu primeiro!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- CLIENTS TAB CONTENT --- */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-6 animate-fade-in">
           {!isAddingClient && (
            <div className="flex justify-end">
              <button
                onClick={handleCreateClient}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-fox-600 text-white rounded-lg font-medium transition-colors border border-slate-700 hover:border-fox-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Cliente
              </button>
            </div>
          )}

          {isAddingClient ? (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Cadastrar Novo Cliente</h3>
                <button onClick={() => setIsAddingClient(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-5">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
                   <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                      value={newClient.fullName}
                      onChange={e => setNewClient({...newClient, fullName: e.target.value})}
                      required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Empresa</label>
                   <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                      value={newClient.companyName}
                      onChange={e => setNewClient({...newClient, companyName: e.target.value})}
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Usuário de Acesso</label>
                    <input 
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                        value={newClient.username}
                        onChange={e => setNewClient({...newClient, username: e.target.value.toLowerCase().replace(/\s/g,'')})}
                        required
                        placeholder="ex: empresa123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
                    <input 
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-fox-500 outline-none"
                        value={newClient.password}
                        onChange={e => setNewClient({...newClient, password: e.target.value})}
                        required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-6 py-3 bg-fox-600 hover:bg-fox-500 text-white rounded-lg font-bold shadow-lg shadow-fox-600/20 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Criar Acesso'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
               {clients.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">Nenhum cliente cadastrado.</div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-400">
                     <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                       <tr>
                         <th className="px-6 py-4">Cliente</th>
                         <th className="px-6 py-4">Empresa</th>
                         <th className="px-6 py-4">Usuário</th>
                         <th className="px-6 py-4">Senha</th>
                         <th className="px-6 py-4 text-right">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                       {clients.map(client => (
                         <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4 font-medium text-white">{client.fullName}</td>
                           <td className="px-6 py-4 flex items-center gap-2">
                              {client.companyName && <Building2 className="w-3 h-3 text-slate-600" />}
                              {client.companyName || '-'}
                           </td>
                           <td className="px-6 py-4 font-mono text-fox-400 bg-slate-950/30 w-fit rounded px-2">{client.username}</td>
                           <td className="px-6 py-4 font-mono text-slate-600">{client.password}</td>
                           <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleDeleteClient(client.id)}
                               className="text-slate-500 hover:text-red-400 transition-colors"
                               title="Remover Acesso"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};