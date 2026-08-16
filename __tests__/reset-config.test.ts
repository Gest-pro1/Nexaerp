import { describe, it, expect } from 'vitest';
// @ts-ignore
import {
  validarForcaSenha,
  validarConfirmacaoSenha,
  validarResetSenha,
  getMensagemForcaSenha,
} from '@/app/login/reset-password/resetConfig.js';

describe('app/login/reset-password/resetConfig - Validações de Senha', () => {
  describe('validarForcaSenha', () => {
    it('deve avaliar todos os requisitos de segurança', () => {
      const forte = 'Senha@123';
      const requisitos = validarForcaSenha(forte);
      expect(requisitos.minimo8Caracteres).toBe(true);
      expect(requisitos.temMaiuscula).toBe(true);
      expect(requisitos.temMinuscula).toBe(true);
      expect(requisitos.temNumero).toBe(true);
      expect(requisitos.temEspecial).toBe(true);
    });

    it('deve identificar requisitos não atendidos', () => {
      const fraca = 'senha';
      const requisitos = validarForcaSenha(fraca);
      expect(requisitos.minimo8Caracteres).toBe(false);
      expect(requisitos.temMaiuscula).toBe(false);
      expect(requisitos.temMinuscula).toBe(true);
      expect(requisitos.temNumero).toBe(false);
      expect(requisitos.temEspecial).toBe(false);
    });
  });

  describe('validarConfirmacaoSenha', () => {
    it('deve retornar true quando senhas são idênticas', () => {
      expect(validarConfirmacaoSenha('Senha@123', 'Senha@123')).toBe(true);
    });

    it('deve retornar false quando senhas diferem', () => {
      expect(validarConfirmacaoSenha('Senha@123', 'OutraSenha@123')).toBe(false);
    });
  });

  describe('validarResetSenha', () => {
    it('deve retornar valido = true para senha forte confirmada', () => {
      const res = validarResetSenha('SenhaForte@2025', 'SenhaForte@2025');
      expect(res.valido).toBe(true);
      expect(res.erros).toHaveLength(0);
      expect(res.senhasConferem).toBe(true);
    });

    it('deve retornar erros quando a senha for fraca', () => {
      const res = validarResetSenha('123', '123');
      expect(res.valido).toBe(false);
      expect(res.erros.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando as senhas não conferem', () => {
      const res = validarResetSenha('SenhaForte@2025', 'OutraSenha@2025');
      expect(res.valido).toBe(false);
      expect(res.senhasConferem).toBe(false);
      expect(res.erros).toContain('As senhas não conferem.');
    });

    it('deve retornar erro para senha vazia', () => {
      const res = validarResetSenha('', '');
      expect(res.valido).toBe(false);
      expect(res.erros).toContain('A senha não pode estar vazia.');
    });
  });

  describe('getMensagemForcaSenha', () => {
    it('deve classificar senha como forte quando atende 5/5 requisitos', () => {
      const forca = {
        minimo8Caracteres: true,
        temMaiuscula: true,
        temMinuscula: true,
        temNumero: true,
        temEspecial: true,
      };
      const msg = getMensagemForcaSenha(forca);
      expect(msg.mensagem).toBe('Senha forte');
      expect(msg.cor).toBe('text-green-600');
    });

    it('deve classificar como média se atender pelo menos 3 requisitos', () => {
      const forca = {
        minimo8Caracteres: true,
        temMaiuscula: true,
        temMinuscula: true,
        temNumero: false,
        temEspecial: false,
      };
      const msg = getMensagemForcaSenha(forca);
      expect(msg.mensagem).toBe('Senha média');
      expect(msg.cor).toBe('text-yellow-600');
    });

    it('deve classificar como fraca se atender menos de 3 requisitos', () => {
      const forca = {
        minimo8Caracteres: false,
        temMaiuscula: false,
        temMinuscula: true,
        temNumero: false,
        temEspecial: false,
      };
      const msg = getMensagemForcaSenha(forca);
      expect(msg.mensagem).toBe('Senha fraca');
      expect(msg.cor).toBe('text-red-600');
    });
  });
});
