import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import ForgotPasswordPage from '@/app/login/forgot-password/page';
import { ResetPasswordContent } from '@/app/login/reset-password/page';
import { api } from '@/lib/api';
import * as authModule from '@/lib/auth';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

// Mock Next/Image
vi.mock('next/image', () => ({
  default: (props: any) => React.createElement('img', { ...props, alt: props.alt || '' }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      primeiroAcesso: vi.fn(),
      resetPassword: vi.fn(),
      forgotPassword: vi.fn(),
    },
  },
}));

describe('Unified Login & Access Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('renders login form properly', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite seu e-mail/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite sua senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('redirects client to /login/reset-password?primeiroAcesso=true on first login', async () => {
    vi.mocked(api.auth.login).mockResolvedValueOnce({
      primeiroAcessoObrigatorio: true,
      force_password_change: true,
      password_status: 'TEMPORARY',
      access_token: 'temp_token_123',
      user: {
        id: 'usr_new',
        email: 'novo.cliente@empresa.com',
        role: 'cliente',
        empresa_id: 'emp_new',
        tipo_negocio: 'bares',
        first_access_required: true,
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/digite seu e-mail/i), {
      target: { value: 'novo.cliente@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: 'SenhaTemp123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('novo.cliente@empresa.com', 'SenhaTemp123!');
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/login/reset-password?primeiroAcesso=true')
      );
    });
  });

  it('allows client to complete first access password change and redirects to /menu-modulos', async () => {
    mockSearchParams = new URLSearchParams({
      primeiroAcesso: 'true',
      email: 'novo.cliente@empresa.com',
      modulo: 'bares-restaurantes',
    });

    const saveAuthSpy = vi.spyOn(authModule, 'saveAuth');
    const setUserModuleSpy = vi.spyOn(authModule, 'setUserModule');

    vi.mocked(api.auth.primeiroAcesso).mockResolvedValueOnce({
      success: true,
      message: 'Senha alterada com sucesso!',
      access_token: 'new_active_token',
      user: {
        id: 'usr_new',
        email: 'novo.cliente@empresa.com',
        role: 'cliente',
        empresa_id: 'emp_new',
        tipo_negocio: 'bares-restaurantes',
        first_access_required: false,
      },
    });

    render(<ResetPasswordContent />);

    expect(screen.getByRole('heading', { name: /primeiro acesso · criar senha/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite a senha temporária recebida/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/digite a senha temporária recebida/i), {
      target: { value: 'SenhaTemp123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua nova senha/i), {
      target: { value: 'NovaSenhaForte@2026' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirme sua nova senha/i), {
      target: { value: 'NovaSenhaForte@2026' },
    });

    const submitBtn = screen.getByRole('button', { name: /salvar senha e acessar módulos/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.auth.primeiroAcesso).toHaveBeenCalledWith({
        email: 'novo.cliente@empresa.com',
        senhaAtual: 'SenhaTemp123!',
        novaSenha: 'NovaSenhaForte@2026',
        confirmarNovaSenha: 'NovaSenhaForte@2026',
      });
      expect(saveAuthSpy).toHaveBeenCalled();
      expect(setUserModuleSpy).toHaveBeenCalledWith('bares-restaurantes');
      expect(screen.getByRole('heading', { name: /senha definida com sucesso/i })).toBeInTheDocument();
    });

    const accessModulesBtn = screen.getByRole('button', { name: /acessar módulo contratado/i });
    fireEvent.click(accessModulesBtn);
    expect(mockPush).toHaveBeenCalledWith('/menu-modulos?modulo=bares-restaurantes');
  });

  it('redirects returning client with active password directly to /menu-modulos', async () => {
    vi.mocked(api.auth.login).mockResolvedValueOnce({
      primeiroAcessoObrigatorio: false,
      access_token: 'active_token_999',
      user: {
        id: 'usr_returning',
        email: 'cliente.antigo@empresa.com',
        role: 'cliente',
        empresa_id: 'emp_999',
        tipo_negocio: 'lojas-varejo',
        first_access_required: false,
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/digite seu e-mail/i), {
      target: { value: 'cliente.antigo@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: 'MinhaSenhaDefinitiva@2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/menu-modulos');
    });
  });

  it('redirects admin user to /Admin upon successful login', async () => {
    vi.mocked(api.auth.login).mockResolvedValueOnce({
      primeiroAcessoObrigatorio: false,
      access_token: 'fake_admin_token',
      user: {
        id: 'usr_admin',
        email: 'admin@nexaerp.com',
        role: 'admin',
        empresa_id: 'emp_admin',
        first_access_required: false,
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/digite seu e-mail/i), {
      target: { value: 'admin@nexaerp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: 'admin123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/Admin');
    });
  });

  it('handles forgot password request and reset password for renan.silva@nexaerp.com.br', async () => {
    vi.mocked(api.auth.forgotPassword).mockResolvedValueOnce({
      message: 'Se o email existir, instruções de recuperação foram enviadas.',
    } as any);

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText(/digite seu e-mail/i);
    fireEvent.change(emailInput, { target: { value: 'renan.silva@nexaerp.com.br' } });

    const submitBtn = screen.getByRole('button', { name: /enviar instruções/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.auth.forgotPassword).toHaveBeenCalledWith('renan.silva@nexaerp.com.br');
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/login/forgot-password/SenhaAlt?name=renan.silva%40nexaerp.com.br')
      );
    });

    // Agora simula o acesso ao link do e-mail com o token
    mockSearchParams = new URLSearchParams({
      token: 'tok_reset_renan_12345',
      email: 'renan.silva@nexaerp.com.br',
    });

    vi.mocked(api.auth.resetPassword).mockResolvedValueOnce({
      message: 'Senha redefinida com sucesso',
    } as any);

    render(<ResetPasswordContent />);

    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/digite sua nova senha/i), {
      target: { value: 'RenanForte@2026' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirme sua nova senha/i), {
      target: { value: 'RenanForte@2026' },
    });

    const resetBtn = screen.getByRole('button', { name: /redefinir senha/i });
    expect(resetBtn).not.toBeDisabled();
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(api.auth.resetPassword).toHaveBeenCalledWith({
        token: 'tok_reset_renan_12345',
        novaSenha: 'RenanForte@2026',
        confirmarSenha: 'RenanForte@2026',
      });
      expect(screen.getByRole('heading', { name: /senha alterada com sucesso/i })).toBeInTheDocument();
    });
  });
});
