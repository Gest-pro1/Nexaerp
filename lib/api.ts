const getApiBase = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://nexaerp-backend-production.up.railway.app/api';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, '');
};

const API_BASE = getApiBase();

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nexaerp_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro de conexão' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  return response.json();
}

// Auth
export const api = {
  auth: {
    login: (email: string, senha: string) =>
      fetchAPI<{
        access_token: string;
        primeiroAcessoObrigatorio?: boolean;
        force_password_change?: boolean;
        password_status?: string;
        message?: string;
        user: {
          id: string;
          email: string;
          role: string;
          empresa_id: string;
          tipo_negocio?: string;
          modulo?: string;
          status?: string;
          empresa?: any;
          first_access_required?: boolean;
          primeiroAcessoObrigatorio?: boolean;
          [key: string]: any;
        };
      }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    primeiroAcesso: (data: { email: string; senhaAtual: string; novaSenha: string; confirmarNovaSenha: string }) =>
      fetchAPI<{ success: boolean; message: string; access_token: string; user: any }>('/auth/primeiro-acesso', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) =>
      fetchAPI<{ success: boolean; empresaId: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (email: string) =>
      fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (data: { token: string; novaSenha: string; confirmarSenha: string }) =>
      fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),
    me: () =>
      fetchAPI<any>('/auth/me'),
  },
  empresas: {
    list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      return fetchAPI<{ data: any[]; total: number; page: number; totalPages: number }>(`/empresas?${query}`);
    },
    get: (id: string) => fetchAPI<any>(`/empresas/${id}`),
    update: (id: string, data: any) => fetchAPI<any>(`/empresas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<any>(`/empresas/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) => fetchAPI<any>(`/empresas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  planos: {
    list: () => fetchAPI<any[]>('/planos'),
    get: (id: string) => fetchAPI<any>(`/planos/${id}`),
    create: (data: any) => fetchAPI<any>('/planos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<any>(`/planos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<any>(`/planos/${id}`, { method: 'DELETE' }),
    sync: (planos: any[]) => fetchAPI<any>('/planos/sync', { method: 'POST', body: JSON.stringify({ planos }) }),
  },
  pagamentos: {
    create: (data: { empresaId: string; metodo: string; cardName?: string; cardNumber?: string; expiryDate?: string; cvv?: string }) =>
      fetchAPI<{ success: boolean; message: string }>('/pagamentos', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      return fetchAPI<any>(`/pagamentos?${query}`);
    },
  },
  admin: {
    stats: () => fetchAPI<any>('/admin/stats'),
    getConfiguracoes: () => fetchAPI<any>('/admin/configuracoes'),
    salvarConfiguracoes: (data: any) => fetchAPI<any>('/admin/configuracoes', { method: 'PUT', body: JSON.stringify(data) }),
    testarGateway: (data: { gateway: string; chave1?: string; chave2?: string; publicKey?: string; accessToken?: string }) =>
      fetchAPI<any>('/admin/gateway/validar', { method: 'POST', body: JSON.stringify(data) }),
  },
};
