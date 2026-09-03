import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PaymentPage from '@/app/payment/page';
import { api } from '@/lib/api';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    pagamentos: {
      getCheckoutInfo: vi.fn(() => Promise.resolve({ success: true, jaPago: false, bloqueada: false, plano: {} })),
      create: vi.fn(() => Promise.resolve({ success: true })),
    },
    planos: {
      list: vi.fn(() => Promise.resolve([])),
    },
  },
}));

describe('Payment Guard & Checkout Security Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(api.pagamentos.getCheckoutInfo).mockImplementation(() =>
      Promise.resolve({
        success: true,
        empresaId: 'e0000000-0000-0000-0000-000000000001',
        razaoSocial: 'Padaria Segura LTDA',
        status: 'pendente',
        jaPago: false,
        bloqueada: false,
        plano: {
          id: 'p1',
          nome: 'Nexa Pro Completo',
          tipoPlano: 'Mensal',
          valor: 199.0,
          valorFormatado: 'R$ 199,00',
          recursos: ['Notas Ilimitadas', 'Gestão de Estoque'],
        },
      })
    );
  });

  it('?? GUARD: Redirects immediately to /register when empresaId is missing in URL', async () => {
    mockSearchParams = new URLSearchParams();

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register');
    });
    expect(api.pagamentos.getCheckoutInfo).not.toHaveBeenCalled();
  });

  it('?? CHECKOUT: Fetches and displays real verified data from backend', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000001');

    render(<PaymentPage />);

    await waitFor(() => {
      expect(api.pagamentos.getCheckoutInfo).toHaveBeenCalledWith('e0000000-0000-0000-0000-000000000001');
      expect(screen.getByText('Padaria Segura LTDA')).toBeInTheDocument();
      expect(screen.getByText('Nexa Pro Completo')).toBeInTheDocument();
      expect(screen.getByText('R$ 199,00')).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('?? GUARD: Redirects when company is already paid / active', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000002');

    vi.mocked(api.pagamentos.getCheckoutInfo).mockImplementationOnce(() =>
      Promise.resolve({
        success: true,
        empresaId: 'e0000000-0000-0000-0000-000000000002',
        razaoSocial: 'Empresa Ativa LTDA',
        status: 'ativa',
        jaPago: true,
        bloqueada: false,
        plano: {
          id: 'p1',
          nome: 'Nexa Start',
          tipoPlano: 'Mensal',
          valor: 99.0,
          valorFormatado: 'R$ 99,00',
        },
      })
    );

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/payment/sucesso?plan=Nexa%20Start')
      );
    });
  });

  it('?? GUARD: Redirects when company is blocked / suspended', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000003');

    vi.mocked(api.pagamentos.getCheckoutInfo).mockImplementationOnce(() =>
      Promise.resolve({
        success: false,
        empresaId: 'e0000000-0000-0000-0000-000000000003',
        razaoSocial: 'Empresa Suspensa LTDA',
        status: 'SUSPENDED',
        jaPago: false,
        bloqueada: true,
        message: 'Esta conta encontra-se suspensa ou bloqueada. Entre em contato com o suporte do NexaERP para regularização.',
      })
    );

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('?? GUARD: Redirects to /register if backend returns error', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000999');

    vi.mocked(api.pagamentos.getCheckoutInfo).mockImplementationOnce(() =>
      Promise.reject(new Error('Empresa não encontrada para este checkout.'))
    );

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register');
    });
  });
});
