import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeModuleId, getUserModule, setUserModule, getUserStatus, saveAuth, logout, getUser, getRole } from '@/lib/auth';

describe('Modules & Authentication Logic Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('normalizeModuleId', () => {
    it('normalizes retail variants to lojas-varejo', () => {
      expect(normalizeModuleId('lojas')).toBe('lojas-varejo');
      expect(normalizeModuleId('lojas-varejo')).toBe('lojas-varejo');
      expect(normalizeModuleId('Varejo')).toBe('lojas-varejo');
      expect(normalizeModuleId('Loja de Roupas')).toBe('lojas-varejo');
    });

    it('normalizes bar and restaurant variants to bares-restaurantes', () => {
      expect(normalizeModuleId('bares')).toBe('bares-restaurantes');
      expect(normalizeModuleId('bares-restaurantes')).toBe('bares-restaurantes');
      expect(normalizeModuleId('Restaurante')).toBe('bares-restaurantes');
      expect(normalizeModuleId('Bar e Petiscaria')).toBe('bares-restaurantes');
    });

    it('normalizes salon and barbershop variants to saloes-barbearias', () => {
      expect(normalizeModuleId('saloes')).toBe('saloes-barbearias');
      expect(normalizeModuleId('saloes-barbearias')).toBe('saloes-barbearias');
      expect(normalizeModuleId('Barbearia')).toBe('saloes-barbearias');
      expect(normalizeModuleId('Salão de Beleza')).toBe('saloes-barbearias');
    });

    it('normalizes market and bakery variants to mercados-padarias', () => {
      expect(normalizeModuleId('mercados')).toBe('mercados-padarias');
      expect(normalizeModuleId('mercados-padarias')).toBe('mercados-padarias');
      expect(normalizeModuleId('Padaria Central')).toBe('mercados-padarias');
      expect(normalizeModuleId('Supermercado')).toBe('mercados-padarias');
    });

    it('handles empty or null values gracefully', () => {
      expect(normalizeModuleId(null)).toBe('');
      expect(normalizeModuleId(undefined)).toBe('');
      expect(normalizeModuleId('')).toBe('');
    });
  });

  describe('getUserModule and setUserModule', () => {
    it('stores and retrieves module in localStorage', () => {
      setUserModule('bares');
      expect(getUserModule()).toBe('bares-restaurantes');

      setUserModule('mercados-padarias');
      expect(getUserModule()).toBe('mercados-padarias');
    });

    it('prioritizes user object tipo_negocio from auth state', () => {
      saveAuth('token_123', {
        id: 'usr_1',
        email: 'cliente@loja.com',
        role: 'cliente',
        empresa_id: 'emp_1',
        tipo_negocio: 'saloes',
        status: 'ativa',
      });

      expect(getUserModule()).toBe('saloes-barbearias');
    });
  });

  describe('Authentication and Roles', () => {
    it('correctly reports role and authentication status', () => {
      expect(getUser()).toBeNull();
      expect(getRole()).toBeNull();

      saveAuth('jwt_token_sample', {
        id: 'admin_1',
        email: 'admin@gestpro.com',
        role: 'admin',
      });

      expect(getUser()?.email).toBe('admin@gestpro.com');
      expect(getRole()).toBe('admin');
      expect(getUserStatus()).toBe('ativa');

      logout();
      expect(getUser()).toBeNull();
      expect(getRole()).toBeNull();
    });
  });
});
