const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
      fetchAPI<{ access_token: string; user: { id: string; email: string; role: string; empresa_id: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
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
    update: (id: string, data: any) => fetchAPI<any>(`/planos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  },
};
