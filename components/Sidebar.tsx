import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`;

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-[#1a2632] border-r border-solid border-[#dbe0e6] dark:border-gray-800">
      <div className="p-6 flex flex-col gap-8 h-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#111418] dark:text-white text-base font-bold leading-none">
              {user.orgName || 'Buffet Staff'}
            </h1>
            <p className="text-[#617589] dark:text-gray-400 text-xs font-medium">{isAdmin ? 'Painel Admin' : 'Portal Equipe'}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <NavLink to="/dashboard" className={linkClass}>
            <span className="material-symbols-outlined text-[24px]">dashboard</span>
            <span className="text-sm font-semibold">Painel</span>
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            <span className="material-symbols-outlined text-[24px]">view_kanban</span>
            <span className="text-sm font-semibold">{isAdmin ? 'Funil de Vendas' : 'Oportunidades'}</span>
          </NavLink>
          <NavLink to="/deals/closed" className={linkClass}>
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
            <span className="text-sm font-semibold">Fechados / Agenda</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Gestão</p>
              <NavLink to="/staffing" className={linkClass}>
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="text-sm font-semibold">Equipe</span>
              </NavLink>
              <NavLink to="/financials" className={linkClass}>
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                <span className="text-sm font-semibold">Financeiro</span>
              </NavLink>

              <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
              <NavLink to="/settings" className={linkClass}>
                <span className="material-symbols-outlined text-[24px]">settings</span>
                <span className="text-sm font-semibold">Configurações</span>
              </NavLink>
            </>
          )}
        </nav>

        {isAdmin && (
          <Link to="/public-request" className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Formulário Público</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;