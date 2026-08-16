import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import ForgotPasswordPage from '@/app/login/forgot-password/page';
import ResetPasswordPage from '@/app/login/reset-password/page';
import SucessoPage from '@/app/payment/sucesso/page';

// Mock Next/Image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Auth & Onboarding Pages Unit Tests', () => {
  it('renders LoginPage with email, password and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite seu e-mail/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite sua senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('renders ForgotPasswordPage with email input and disabled button initially', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { name: /esqueci minha senha/i })).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /enviar instruções/i });
    expect(button).toBeDisabled();
  });

  it('renders ResetPasswordPage with new password inputs', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite sua nova senha/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirme sua nova senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redefinir senha/i })).toBeInTheDocument();
  });

  it('renders SucessoPage with success status and step indicators', () => {
    render(<SucessoPage />);

    expect(screen.getByText(/pagamento confirmado/i)).toBeInTheDocument();
    expect(screen.getByText(/status da ativação/i)).toBeInTheDocument();
    expect(screen.getByText(/pagamento recebido/i)).toBeInTheDocument();
  });
});
