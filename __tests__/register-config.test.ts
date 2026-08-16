import { describe, it, expect } from 'vitest';
// @ts-ignore
import {
  validarCPF,
  validarCNPJ,
  validarEmail,
  validarTelefone,
  validarNome,
  validarCadastro,
} from '@/app/register/config.js';

describe('app/register/config - Validações de Formulário', () => {
  describe('validarCPF', () => {
    it('deve validar CPFs válidos conhecidos', () => {
      expect(validarCPF('52998224725')).toBe(true);
      expect(validarCPF('529.982.247-25')).toBe(true);
    });

    it('deve rejeitar CPFs com tamanho incorreto', () => {
      expect(validarCPF('123456789')).toBe(false);
      expect(validarCPF('123456789012')).toBe(false);
    });

    it('deve rejeitar CPFs com dígitos repetidos (ex: 111.111.111-11)', () => {
      expect(validarCPF('00000000000')).toBe(false);
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('99999999999')).toBe(false);
    });

    it('deve rejeitar CPFs com dígitos verificadores inválidos', () => {
      expect(validarCPF('12345678900')).toBe(false);
    });
  });

  describe('validarCNPJ', () => {
    it('deve validar CNPJs válidos', () => {
      // CNPJ válido de teste: 11.222.333/0001-81
      expect(validarCNPJ('11222333000181')).toBe(true);
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('deve rejeitar CNPJs com tamanho incorreto', () => {
      expect(validarCNPJ('112223330001')).toBe(false);
      expect(validarCNPJ('1122233300018199')).toBe(false);
    });

    it('deve rejeitar CNPJs repetidos (ex: 00.000.000/0000-00)', () => {
      expect(validarCNPJ('00000000000000')).toBe(false);
      expect(validarCNPJ('11111111111111')).toBe(false);
    });

    it('deve rejeitar CNPJs com dígitos verificadores incorretos', () => {
      expect(validarCNPJ('11222333000100')).toBe(false);
    });
  });

  describe('validarEmail', () => {
    it('deve aceitar emails válidos', () => {
      expect(validarEmail('usuario@empresa.com.br')).toBe(true);
      expect(validarEmail('teste.dev@dominio.com')).toBe(true);
    });

    it('deve rejeitar emails com formato inválido', () => {
      expect(validarEmail('emailinvalido')).toBe(false);
      expect(validarEmail('email@semdominio')).toBe(false);
      expect(validarEmail('@semusuario.com')).toBe(false);
      expect(validarEmail('')).toBe(false);
    });
  });

  describe('validarTelefone', () => {
    it('deve aceitar telefones nos formatos válidos brasileiros', () => {
      expect(validarTelefone('(11) 99999-9999')).toBe(true);
      expect(validarTelefone('(83) 98888-7777')).toBe(true);
      expect(validarTelefone('(11) 3333-4444')).toBe(true);
    });

    it('deve rejeitar telefones inválidos', () => {
      expect(validarTelefone('123')).toBe(false);
      expect(validarTelefone('abcdefghij')).toBe(false);
    });
  });

  describe('validarNome', () => {
    it('deve aceitar nomes válidos com 3 ou mais caracteres', () => {
      expect(validarNome('Ana Silva')).toBe(true);
      expect(validarNome('Carlos')).toBe(true);
    });

    it('deve rejeitar nomes curtos ou com números', () => {
      expect(validarNome('Jo')).toBe(false);
      expect(validarNome('João 123')).toBe(false);
    });
  });

  describe('validarCadastro', () => {
    it('deve retornar valido = true quando todos os campos são válidos', () => {
      const payload = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '11.222.333/0001-81',
        telefone: '(11) 99999-9999',
        cep: '01001-000',
        estado: 'SP',
        cidade: 'São Paulo',
        nomeCompleto: 'João da Silva',
        cpf: '529.982.247-25',
        email: 'joao@empresa.com.br',
      };

      const res = validarCadastro(payload);
      expect(res.valido).toBe(true);
      expect(res.erros).toHaveLength(0);
    });

    it('deve acumular mensagens de erro para campos inválidos ou vazios', () => {
      const payloadInvalido = {
        razaoSocial: '',
        cnpj: '123',
        telefone: '',
        cep: '123',
        estado: '',
        cidade: '',
        nomeCompleto: 'A',
        cpf: '123',
        email: 'invalid',
      };

      const res = validarCadastro(payloadInvalido);
      expect(res.valido).toBe(false);
      expect(res.erros.length).toBeGreaterThanOrEqual(9);
    });
  });
});
