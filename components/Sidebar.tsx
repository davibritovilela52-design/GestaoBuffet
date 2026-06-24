import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Sidebar = () => {
  const { user } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl ${
      isActive
        ? 'sidebar-link-active'
        : 'text-[#617589] dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/10 hover:border-gray-200/70 dark:hover:border-white/10'
    }`;

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;
  const eventsLabel = isAdmin ? 'Funil de Vendas' : 'Oportunidades';

  return (
    <aside className="app-sidebar w-72 flex flex-col">
      <div className="p-6 flex flex-col gap-8 h-full">
        <div className="flex items-center gap-3">
          <div className="brand-mark rounded-2xl p-2.5 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div className="brand-copy flex flex-col">
            <h1 className="font-display text-[#111418] dark:text-white text-lg font-black leading-none">
              {user.orgName || 'Buffet Staff'}
            </h1>
            <p className="sidebar-meta text-[#617589] dark:text-gray-400 text-xs font-bold">
              {isAdmin ? 'Painel Admin' : 'Portal Equipe'}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <NavLink to="/dashboard" className={linkClass} aria-label="Painel">
            <span className="material-symbols-outlined text-[24px]">dashboard</span>
            <span className="sidebar-label text-sm font-bold">Painel</span>
          </NavLink>
          <NavLink to="/events" className={linkClass} aria-label={eventsLabel}>
            <span className="material-symbols-outlined text-[24px]">view_kanban</span>
            <span className="sidebar-label text-sm font-bold">{eventsLabel}</span>
          </NavLink>
          <NavLink to="/deals/closed" className={linkClass} aria-label="Fechados e agenda">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
            <span className="sidebar-label text-sm font-bold">Fechados / Agenda</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
              <p className="sidebar-section px-3 text-xs font-black text-gray-400 uppercase">Gestão</p>
              <NavLink to="/staffing" className={linkClass} aria-label="Equipe">
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="sidebar-label text-sm font-bold">Equipe</span>
              </NavLink>
              <NavLink to="/financials" className={linkClass} aria-label="Financeiro">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                <span className="sidebar-label text-sm font-bold">Financeiro</span>
              </NavLink>

              <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
              <NavLink to="/settings" className={linkClass} aria-label="Configurações">
                <span className="material-symbols-outlined text-[24px]">settings</span>
                <span className="sidebar-label text-sm font-bold">Configurações</span>
              </NavLink>
            </>
          )}
        </nav>

        {isAdmin && (
          <Link
            to="/public-request"
            aria-label="Abrir formulário público"
            className="sidebar-cta btn-primary w-full text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Formulário Público</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
