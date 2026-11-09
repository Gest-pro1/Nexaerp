import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuModulosPage from '@/app/menu-modulos/page';
import * as authModule from '@/lib/auth';

// Mock Next/Image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

const mockPush = vi.fn();

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/menu-modulos',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

describe('MenuModulosPage Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.spyOn(authModule, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authModule, 'getUser').mockReturnValue({
      id: 'usr_1',
      email: 'cliente@restaurante.com',
      role: 'cliente',
      empresa_id: 'emp_123',
      tipo_negocio: 'bares',
      status: 'ativa',
      empresa: {
        razao_social: 'Bar e Restaurante Bom Sabor',
      },
    });
    vi.spyOn(authModule, 'getUserModule').mockReturnValue('bares-restaurantes');
    vi.spyOn(authModule, 'getUserStatus').mockReturnValue('ativa');
  });

  it('renders module selection page and pre-selects the user module', () => {
    render(<MenuModulosPage />);

    expect(screen.getByRole('heading', { name: /login realizado!/i })).toBeInTheDocument();
    expect(screen.getByText(/selecione o módulo para acessar:/i)).toBeInTheDocument();

    const radioBares = screen.getByDisplayValue('bares-restaurantes') as HTMLInputElement;
    expect(radioBares).toBeChecked();
    expect(screen.getByRole('button', { name: /acessar painel/i })).toBeInTheDocument();
  });

  it('renders all four ERP segment modules with descriptions', () => {
    render(<MenuModulosPage />);

    expect(screen.getByText(/lojas e varejo/i)).toBeInTheDocument();
    expect(screen.getByText(/bares e restaurantes/i)).toBeInTheDocument();
    expect(screen.getByText(/salões e barbearias/i)).toBeInTheDocument();
    expect(screen.getByText(/mercados e padarias/i)).toBeInTheDocument();
  });

  it('allows switching module selection before accessing the panel', () => {
    render(<MenuModulosPage />);

    const radioMercados = screen.getByDisplayValue('mercados-padarias') as HTMLInputElement;
    fireEvent.click(radioMercados);

    expect(radioMercados).toBeChecked();
  });

  it('navigates to /modulos/:id when clicking Acessar Painel', () => {
    render(<MenuModulosPage />);

    const accessButton = screen.getByRole('button', { name: /acessar painel/i });
    fireEvent.click(accessButton);

    expect(mockPush).toHaveBeenCalledWith('/modulos/bares-restaurantes');
  });
});
