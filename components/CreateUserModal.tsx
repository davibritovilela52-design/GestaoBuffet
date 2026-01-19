import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { dataService } from '../services/dataService';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, currentUser }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.EMPLOYEE
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a default avatar based on name using a public service or placeholder
      const encodedName = encodeURIComponent(formData.name);
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff`;

      await dataService.addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: UserStatus.ACTIVE,
        avatarUrl: avatarUrl,
        rating: 5.0 // Default starting rating
      }, currentUser);

      onSuccess();
      onClose();
      // Reset form
      setFormData({ name: '', email: '', password: '', role: UserRole.EMPLOYEE });
    } catch (error: any) {
      alert("Erro ao criar usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Usuário</h2>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para adicionar à equipe.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          
          {/* Name & Email */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Ana Clara"
                className="w-full rounded-lg border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email Corporativo</label>
              <input 
                required
                type="email" 
                placeholder="ana.clara@buffet.com"
                className="w-full rounded-lg border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Nível de Acesso</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.role === UserRole.EMPLOYEE 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="role" 
                  className="sr-only"
                  checked={formData.role === UserRole.EMPLOYEE}
                  onChange={() => setFormData({...formData, role: UserRole.EMPLOYEE})}
                />
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mb-3 ${
                   formData.role === UserRole.EMPLOYEE ? 'border-primary' : 'border-gray-300'
                }`}>
                  {formData.role === UserRole.EMPLOYEE && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Colaborador</span>
                <span className="text-xs text-gray-500 mt-1 leading-snug">Acesso operacional a eventos e tarefas diárias.</span>
              </label>

              <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.role === UserRole.ADMIN 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="role" 
                  className="sr-only"
                  checked={formData.role === UserRole.ADMIN}
                  onChange={() => setFormData({...formData, role: UserRole.ADMIN})}
                />
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mb-3 ${
                   formData.role === UserRole.ADMIN ? 'border-primary' : 'border-gray-300'
                }`}>
                  {formData.role === UserRole.ADMIN && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Administrador</span>
                <span className="text-xs text-gray-500 mt-1 leading-snug">Acesso total ao sistema, financeiro e usuários.</span>
              </label>
            </div>
          </div>

          {/* Password */}
          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Senha Temporária</label>
             <div className="relative">
                <input 
                  required
                  type="text" 
                  placeholder="Defina uma senha inicial"
                  className="w-full rounded-lg border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 p-3 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <span className="material-symbols-outlined absolute right-3 top-3 text-gray-400 text-sm">lock</span>
             </div>
             <p className="text-[11px] text-gray-400 mt-2">O usuário será solicitado a alterar a senha no primeiro acesso.</p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
             <button 
               type="button"
               onClick={onClose}
               className="px-6 py-3 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={loading}
               className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
             >
               {loading ? 'Salvando...' : 'Criar Usuário'}
               {!loading && <span className="material-symbols-outlined text-sm">check</span>}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}