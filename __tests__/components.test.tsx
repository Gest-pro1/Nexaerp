import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureCard from '@/app/components/FeatureCard';
import Modal from '@/app/components/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Mock Next/Image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

// Mock Next/Navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/Admin',
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Frontend Component Unit Tests', () => {
  describe('FeatureCard Component', () => {
    const mockCard = {
      title: 'PDV Frente de Caixa',
      desc: 'Venda rápido e sem travar.',
      icon: '/PDV.svg',
      modalText: 'Detalhes completos do PDV.',
    };

    it('renders card title and description correctly', () => {
      const handleSaibaMais = vi.fn();
      render(<FeatureCard card={mockCard} onSaibaMais={handleSaibaMais} />);

      expect(screen.getByText('PDV Frente de Caixa')).toBeInTheDocument();
      expect(screen.getByText('Venda rápido e sem travar.')).toBeInTheDocument();
    });

    it('calls onSaibaMais when Saiba Mais button is clicked', () => {
      const handleSaibaMais = vi.fn();
      render(<FeatureCard card={mockCard} onSaibaMais={handleSaibaMais} />);

      const button = screen.getByText('Saiba Mais');
      fireEvent.click(button);

      expect(handleSaibaMais).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('Modal Component', () => {
    const mockContent = {
      title: 'Controle de Estoque',
      icon: '/controle-Estoque.svg',
      modalText: 'Visão total do seu inventário.',
    };

    it('does not render when open is false', () => {
      const { container } = render(
        <Modal open={false} content={mockContent} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal title and content when open is true', () => {
      render(<Modal open={true} content={mockContent} onClose={vi.fn()} />);

      expect(screen.getByText('Controle de Estoque')).toBeInTheDocument();
      expect(screen.getByText('Visão total do seu inventário.')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<Modal open={true} content={mockContent} onClose={handleClose} />);

      const closeButtons = screen.getAllByRole('button');
      // The "✕" button or "Fechar"
      const fecharBtn = screen.getByText('Fechar');
      fireEvent.click(fecharBtn);

      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Card UI Component', () => {
    it('renders card with header, title and content correctly', () => {
      render(
        <Card className="test-card">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Conteúdo de teste</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Título do Card')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo de teste')).toBeInTheDocument();
    });
  });
});
