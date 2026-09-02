import { describe, it, expect, vi } from 'vitest';
// @ts-ignore
import {
  validateEmail,
  isButtonEnabled,
  handleSubmit,
  emailRegex,
} from '@/app/login/forgot-password/config.js';

describe('app/login/forgot-password/config - Validações de Recuperação de Senha', () => {
  it('emailRegex deve validar formato básico de email', () => {
    expect(emailRegex.test('usuario@dominio.com')).toBe(true);
    expect(emailRegex.test('invalido')).toBe(false);
  });

  it('validateEmail deve retornar true apenas para emails válidos', () => {
    expect(validateEmail('admin@nexaerp.com.br')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('enables button only for valid email', () => {
    expect(isButtonEnabled('admin@nexaerp.com.br')).toBe(true);
    expect(isButtonEnabled('invalido')).toBe(false);
  });

  it('handleSubmit deve logar sucesso para email válido', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSubmit('teste@dominio.com');
    expect(consoleSpy).toHaveBeenCalledWith('✓ Email enviado com sucesso!');
    consoleSpy.mockRestore();
  });

  it('handleSubmit deve logar erro para email inválido', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSubmit('invalido');
    expect(consoleSpy).toHaveBeenCalledWith('Email inválido! Por favor, insira um email válido.');
    consoleSpy.mockRestore();
  });
});
