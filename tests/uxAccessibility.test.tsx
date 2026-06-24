import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import PublicForm from '../pages/PublicForm';
import Register from '../pages/Register';
import Sidebar from '../components/Sidebar';
import { UserRole } from '../types';

const authState = vi.hoisted(() => ({
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
  needsOnboarding: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../services/dataService', () => ({
  dataService: {
    createPublicLead: vi.fn(),
    createLead: vi.fn(),
  },
}));

describe('UX and accessibility guardrails', () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.needsOnboarding = false;
    authState.login.mockReset();
    authState.register.mockReset();
    authState.logout.mockReset();
    authState.refreshUser.mockReset();
  });

  it('validates login fields before calling the auth service', () => {
    authState.login.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(authState.login).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe seu email.');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('maps backend login errors to a user-facing Portuguese message', async () => {
    authState.login.mockRejectedValueOnce(new Error('Invalid login credentials'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'cliente@teste.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senhaerrada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha inválidos.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Invalid login credentials');
  });

  it('exposes accessible register fields with browser autofill hints', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Confirmar Senha')).toHaveAttribute('autocomplete', 'new-password');

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Nome é obrigatório.');
  });

  it('shows a clear invalid public request link state', () => {
    render(
      <MemoryRouter>
        <PublicForm />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Link de solicitação inválido' })).toBeInTheDocument();
    expect(screen.getByText(/Peça ao buffet um novo link de orçamento/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/');
  });

  it('does not render dead public links on the landing page', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(document.querySelectorAll('a[href="#"]')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('keeps sidebar navigation named when labels are visually hidden', () => {
    authState.user = {
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@teste.com',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      avatarUrl: '',
      orgName: 'Buffet Teste',
      orgSlug: 'buffet-teste',
    };

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const navigation = screen.getByRole('navigation');
    const links = within(navigation).getAllByRole('link');
    expect(links.every(link => link.hasAttribute('aria-label'))).toBe(true);
  });

  it('does not load Tailwind from the runtime CDN in production HTML', () => {
    const html = readFileSync('index.html', 'utf-8');
    expect(html).not.toContain('cdn.tailwindcss.com');
  });
});
