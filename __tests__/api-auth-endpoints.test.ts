import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, getApiBase } from '@/lib/api';

describe('API Auth Endpoints Configuration', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('normalizes getApiBase correctly across different URL variations', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.nexaerp.com.br';
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');

    process.env.NEXT_PUBLIC_API_URL = 'https://api.nexaerp.com.br/';
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');

    process.env.NEXT_PUBLIC_API_URL = 'https://api.nexaerp.com.br/api';
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');

    process.env.NEXT_PUBLIC_API_URL = 'https://api.nexaerp.com.br/api/';
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');

    process.env.NEXT_PUBLIC_API_URL = 'https://api.nexaerp.com.br/api/auth/login';
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');

    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBase()).toBe('https://api.nexaerp.com.br/api');
  });

  it('calls https://api.nexaerp.com.br/api/auth/login with correct method, headers and body', async () => {
    const mockResponse = {
      access_token: 'fake-jwt-token-123',
      user: {
        id: 'user-1',
        email: 'gestor@empresa.com.br',
        role: 'user',
        empresa_id: 'emp-1',
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.auth.login('gestor@empresa.com.br', 'senhaSegura123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe('https://api.nexaerp.com.br/api/auth/login');
    expect(options.method).toBe('POST');
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(options.body)).toEqual({
      email: 'gestor@empresa.com.br',
      senha: 'senhaSegura123',
    });
    expect(result.access_token).toBe('fake-jwt-token-123');
  });

  it('calls https://api.nexaerp.com.br/api/auth/register with correct method, headers and body', async () => {
    const registerPayload = {
      razaoSocial: 'Minha Empresa LTDA',
      cnpj: '11.222.333/0001-81',
      email: 'contato@empresa.com.br',
      telefone: '(11) 98765-4321',
      cep: '01001-000',
      rua: 'Praça da Sé',
      numero: '100',
      bairro: 'Sé',
      uf: 'SP',
      cidade: 'São Paulo',
      responsavelNome: 'João Silva',
      responsavelCpf: '123.456.789-00',
      tipoNegocio: 'lojas',
      planoId: 'plano-uuid-1234',
      tipoPlano: 'Mensal',
    };

    const mockResponse = {
      success: true,
      empresaId: 'emp-new-uuid',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.auth.register(registerPayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe('https://api.nexaerp.com.br/api/auth/register');
    expect(options.method).toBe('POST');
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(options.body)).toEqual(registerPayload);
    expect(result.empresaId).toBe('emp-new-uuid');
  });

  it('calls https://api.nexaerp.com.br/api/auth/me with Bearer token in Authorization header', async () => {
    localStorage.setItem('nexaerp_token', 'my-auth-token-xyz');

    const mockUser = {
      id: 'usr-1',
      email: 'user@nexaerp.com.br',
      role: 'admin',
      empresa_id: 'emp-1',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.auth.me();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe('https://api.nexaerp.com.br/api/auth/me');
    expect(options.method).toBe('GET');
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer my-auth-token-xyz',
    });
    expect(result.user.email).toBe('user@nexaerp.com.br');
  });

  it('handles API errors properly throwing error with message and status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: ['Email inválido', 'Senha deve ter pelo menos 6 caracteres'],
        error: 'Bad Request',
        statusCode: 400,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.auth.login('invalid', '123')).rejects.toMatchObject({
      message: 'Email inválido, Senha deve ter pelo menos 6 caracteres',
      status: 400,
    });
  });
});
