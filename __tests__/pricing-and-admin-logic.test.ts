import { describe, it, expect } from 'vitest';

// Funções extraídas de lógica de negócios do Main.tsx e Admin/page.tsx para teste unitário
function formatPriceObject(precoStr: string, priceAnoStr?: string) {
  const clean = (precoStr || '').replace('R$', '').replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(clean);
  const mes = isNaN(val) ? precoStr : `R$${val.toFixed(2).replace('.', ',')}`;

  if (priceAnoStr) {
    return { Mês: mes, Ano: priceAnoStr };
  }
  const valAno = isNaN(val) ? 0 : val * 12 * 0.8;
  const ano = isNaN(val)
    ? precoStr
    : `R$ ${valAno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return { Mês: mes, Ano: ano };
}

function calculateMRR(empresas: Array<{ status: string; valor: string }>) {
  return empresas
    .filter((e) => e.status === 'ativa')
    .reduce((acc, emp) => {
      const valorNumerico = parseFloat(emp.valor.replace('R$ ', '').replace(',', '.'));
      return acc + (isNaN(valorNumerico) ? 0 : valorNumerico);
    }, 0);
}

function filterEmpresas(
  empresas: Array<{ nome: string; responsavel: string; email: string; status: string }>,
  searchTerm: string,
  statusFilter: string
) {
  return empresas.filter((emp) => {
    const matchSearch =
      emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || emp.status === statusFilter;
    return matchSearch && matchStatus;
  });
}

function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

describe('Business Logic & Admin Calculations', () => {
  describe('formatPriceObject', () => {
    it('calculates 20% annual discount correctly when priceAno is not provided', () => {
      const result = formatPriceObject('R$ 100,00');
      expect(result.Mês).toBe('R$100,00');
      // 100 * 12 * 0.8 = 960
      expect(result.Ano).toContain('960,00');
    });

    it('uses custom annual price when provided', () => {
      const result = formatPriceObject('R$ 129,90', 'R$ 1.247,04');
      expect(result.Mês).toBe('R$129,90');
      expect(result.Ano).toBe('R$ 1.247,04');
    });
  });

  describe('calculateMRR', () => {
    it('calculates total MRR only for active companies', () => {
      const empresas = [
        { status: 'ativa', valor: 'R$ 100,00' },
        { status: 'ativa', valor: 'R$ 200,50' },
        { status: 'bloqueado', valor: 'R$ 500,00' },
        { status: 'inativa', valor: 'R$ 300,00' },
      ];

      const mrr = calculateMRR(empresas);
      expect(mrr).toBe(300.5);
    });

    it('returns 0 when no companies are active', () => {
      const empresas = [{ status: 'inativa', valor: 'R$ 100,00' }];
      expect(calculateMRR(empresas)).toBe(0);
    });
  });

  describe('filterEmpresas', () => {
    const mockList = [
      { nome: 'Barbearia VIP', responsavel: 'Carlos', email: 'carlos@vip.com', status: 'ativa' },
      { nome: 'Padaria Central', responsavel: 'Maria', email: 'maria@padaria.com', status: 'bloqueado' },
      { nome: 'Restaurante Sabor', responsavel: 'Carlos Silva', email: 'sabor@rest.com', status: 'pendente' },
    ];

    it('filters by name/responsavel/email query', () => {
      const result = filterEmpresas(mockList, 'Carlos', 'todos');
      expect(result).toHaveLength(2);
    });

    it('filters by status', () => {
      const result = filterEmpresas(mockList, '', 'bloqueado');
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Padaria Central');
    });

    it('filters by both search query and status simultaneously', () => {
      const result = filterEmpresas(mockList, 'Carlos', 'pendente');
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Restaurante Sabor');
    });
  });

  describe('getInitials', () => {
    it('extracts two letter initials from full company/person name', () => {
      expect(getInitials('Bony Costa Barbearia')).toBe('BC');
      expect(getInitials('Nexaerp')).toBe('N');
      expect(getInitials('   Maria   Silva  ')).toBe('MS');
    });
  });
});
