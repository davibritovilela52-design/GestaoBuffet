import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { useOutletContext } from 'react-router-dom';
import CreateUserModal from '../components/CreateUserModal';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useOutletContext<{ user: User }>();

  const loadUsers = async () => {
    if (user.role === UserRole.ADMIN) {
      const data = await dataService.getUsers();
      setUsers(data);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  const toggleStatus = async (id: string) => {
      try {
        await dataService.toggleUserStatus(id, user);
        loadUsers();
      } catch (e: any) {
          alert(e.message);
      }
  };

  if (user.role !== UserRole.ADMIN) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shield_person</span>
              <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
              <p className="text-gray-500">Apenas administradores podem gerenciar a equipe.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black">Gestão de Equipe</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 transition-colors text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
                <span className="material-symbols-outlined">add</span>
                Adicionar Colaborador
            </button>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-6 py-4 text-xs uppercase text-gray-500">Colaborador</th>
                        <th className="px-6 py-4 text-xs uppercase text-gray-500">Função</th>
                        <th className="px-6 py-4 text-xs uppercase text-gray-500">Avaliação</th>
                        <th className="px-6 py-4 text-xs uppercase text-gray-500">Status</th>
                        <th className="px-6 py-4 text-xs uppercase text-right text-gray-500">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 bg-cover border border-gray-200" style={{backgroundImage: `url(${u.avatarUrl})`}}></div>
                                    <div>
                                        <p className="font-bold text-sm">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {u.role === 'ADMIN' ? (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-100">
                                  <span className="material-symbols-outlined text-[14px]">verified_user</span> Admin
                                </span>
                              ) : (
                                <span className="text-gray-600">Colaborador</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-yellow-500 flex items-center gap-1">
                              {u.rating ? (
                                <>
                                  <span className="material-symbols-outlined text-sm filled">star</span>
                                  {u.rating}
                                </>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {u.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => toggleStatus(u.id)} className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full" title="Alternar Status">
                                    <span className="material-symbols-outlined">toggle_{u.status === 'ACTIVE' ? 'on' : 'off'}</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <CreateUserModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadUsers}
          currentUser={user}
        />
    </div>
  );
}