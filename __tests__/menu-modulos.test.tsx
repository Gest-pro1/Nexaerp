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

  it('renders module page with authorized access header and subscribed module', () => {
    render(<MenuModulosPage />);

    expect(screen.getByRole('heading', { name: /acesso autorizado/i })).toBeInTheDocument();
    expect(screen.getAllByText(/bares e restaurantes/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/liberado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acessar módulo bares e restaurantes/i })).toBeInTheDocument();
  });

  it('shows other modules as Inacessível when switching to Todos os Módulos', () => {
    render(<MenuModulosPage />);

    const allModulesTab = screen.getByRole('button', { name: /todos os módulos/i });
    fireEvent.click(allModulesTab);

    expect(screen.getByText(/lojas e varejo/i)).toBeInTheDocument();
    expect(screen.getByText(/mercados e padarias/i)).toBeInTheDocument();
    expect(screen.getByText(/salões e barbearias/i)).toBeInTheDocument();

    const inaccessibleBadges = screen.getAllByText(/inacessível/i);
    expect(inaccessibleBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('displays lock notice when clicking on an inaccessible module', () => {
    render(<MenuModulosPage />);

    const allModulesTab = screen.getByRole('button', { name: /todos os módulos/i });
    fireEvent.click(allModulesTab);

    const retailModule = screen.getByText(/lojas e varejo/i);
    fireEvent.click(retailModule);

    expect(screen.getByText(/módulo inacessível/i)).toBeInTheDocument();
    expect(screen.getByText(/está inacessível/i)).toBeInTheDocument();
  });

  it('opens module workspace with stats and operations when clicking access button', () => {
    render(<MenuModulosPage />);

    const accessButton = screen.getByRole('button', { name: /acessar módulo bares e restaurantes/i });
    fireEvent.click(accessButton);

    expect(screen.getByRole('heading', { name: /painel de gestão: bares e restaurantes/i })).toBeInTheDocument();
    expect(screen.getByText(/métricas do módulo/i)).toBeInTheDocument();
    expect(screen.getByText(/mapa de mesas/i)).toBeInTheDocument();
    expect(screen.getByText(/painel cozinha \(kds\)/i)).toBeInTheDocument();
  });
});
