import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PaymentPage from '@/app/payment/page';
import { api } from '@/lib/api';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
};
let mockSearchParams = new URLSearchParams();

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => mockRouter,
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    pagamentos: {
      getCheckoutInfo: vi.fn(() => Promise.resolve({ success: true, jaPago: false, bloqueada: false, plano: {} })),
      consultarStatusPix: vi.fn(() => Promise.resolve({ paymentId: 'pay_1', status: 'PENDING', isApproved: false, isExpired: false })),
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

  it('Redirects immediately to /register when empresaId is missing in URL', async () => {
    mockSearchParams = new URLSearchParams();

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register');
    });
    expect(api.pagamentos.getCheckoutInfo).not.toHaveBeenCalled();
  });

  it('Fetches and displays real verified data from backend', async () => {
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

  it('Redirects when company is already paid / active', async () => {
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

  it('Redirects when company is blocked / suspended', async () => {
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

  it('Redirects to /register if backend returns error', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000999');

    vi.mocked(api.pagamentos.getCheckoutInfo).mockImplementationOnce(() =>
      Promise.reject(new Error('Empresa não encontrada para este checkout.'))
    );

    render(<PaymentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/register');
    });
  });

  it('Does not show fake PIX QR code before generating official Asaas charge and verifies payment before redirecting', async () => {
    mockSearchParams = new URLSearchParams('empresaId=e0000000-0000-0000-0000-000000000001');

    vi.mocked(api.pagamentos.create).mockResolvedValueOnce({
      success: true,
      message: 'PIX gerado',
      paymentId: 'pay_asaas_123',
      pix: {
        copiaECola: '00020101021226830014br.gov.bcb.pix2561asaas-oficial',
        qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    });

    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Padaria Segura LTDA')).toBeInTheDocument();
    });

    // Switch to PIX tab
    fireEvent.click(screen.getByText('Pix'));

    // Before generating PIX, QR Code image and "Copiar Chave" must NOT be rendered
    expect(screen.queryByAltText('QR Code PIX')).not.toBeInTheDocument();
    expect(screen.queryByText(/Copiar Chave/i)).not.toBeInTheDocument();
    expect(screen.getByText('Gerar Cobrança PIX Oficial →')).toBeInTheDocument();

    // Generate official Asaas PIX
    fireEvent.click(screen.getByText('Gerar Cobrança PIX Oficial →'));

    await waitFor(() => {
      expect(screen.getByAltText('QR Code PIX')).toBeInTheDocument();
      expect(screen.getByText('00020101021226830014br.gov.bcb.pix2561asaas-oficial')).toBeInTheDocument();
      expect(screen.getByText('Já realizei o pagamento →')).toBeInTheDocument();
    });

    // Click "Já realizei o pagamento →" while payment is still pending
    fireEvent.click(screen.getByText('Já realizei o pagamento →'));

    await waitFor(() => {
      expect(api.pagamentos.consultarStatusPix).toHaveBeenCalledWith('pay_asaas_123');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
