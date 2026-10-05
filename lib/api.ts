export const getApiBase = () => {
  let url = (process.env.NEXT_PUBLIC_API_URL || 'https://api.nexaerp.com.br/api').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Remove any trailing auth routes mistakenly included in the env variable
  url = url.replace(/\/auth(\/.*)?$/, '');
  // Guarantee the base URL ends with /api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE = getApiBase();

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token =
      localStorage.getItem('nexaerp_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )nexaerp_token=([^;]+)'));
      if (match) token = decodeURIComponent(match[2]);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fullUrl: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else {
    let cleanEndpoint = endpoint.trim();
    if (cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.substring(4);
    } else if (cleanEndpoint.startsWith('api/')) {
      cleanEndpoint = cleanEndpoint.substring(3);
    }
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
    fullUrl = `${API_BASE}${cleanEndpoint}`;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro de conexão' }));
    const errorMsg = Array.isArray(error?.message)
      ? error.message.join(', ')
      : typeof error?.message === 'string'
      ? error.message
      : error?.error || `Erro ${response.status}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = error;
    throw err;
  }

  return response.json();
}

// Auth
export const api = {
  auth: {
    login: (
      emailOrData: string | { email: string; senha?: string; password?: string },
      maybeSenha?: string
    ) => {
      let email = '';
      let senha = '';
      if (typeof emailOrData === 'object' && emailOrData !== null) {
        email = emailOrData.email || '';
        senha = emailOrData.senha || emailOrData.password || '';
      } else {
        email = emailOrData || '';
        senha = maybeSenha || '';
      }

      return fetchAPI<{
        access_token: string;
        token?: string;
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
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), senha }),
      });
    },
    primeiroAcesso: (data: { email: string; senhaAtual: string; novaSenha: string; confirmarNovaSenha: string }) =>
      fetchAPI<{ success: boolean; message: string; access_token: string; user: any }>('/auth/primeiro-acesso', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: any) =>
      fetchAPI<{
        success: boolean;
        empresaId: string;
        id?: string;
        empresa?: any;
        user?: any;
        access_token?: string;
        token?: string;
        message?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    forgotPassword: (email: string) =>
      fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }),
    resetPassword: (data: { token: string; novaSenha: string; confirmarSenha: string }) =>
      fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),
    me: (tokenOverride?: string) => {
      const options: RequestInit = { method: 'GET' };
      if (tokenOverride) {
        options.headers = {
          Authorization: `Bearer ${tokenOverride}`,
        };
      }
      return fetchAPI<{
        user?: any;
        id?: string;
        email?: string;
        role?: string;
        empresa_id?: string;
        tipo_negocio?: string;
        modulo?: string;
        status?: string;
        [key: string]: any;
      }>('/auth/me', options);
    },
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
    list: () => fetchAPI<any[]>('/planos', { cache: 'no-store' }),
    get: (id: string) => fetchAPI<any>(`/planos/${encodeURIComponent(id)}`, { cache: 'no-store' }),
    create: (data: any) => fetchAPI<any>('/planos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<any>(`/planos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<any>(`/planos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    sync: (planos: any[]) => fetchAPI<any>('/planos/sync', { method: 'POST', body: JSON.stringify({ planos }) }),
  },
  pagamentos: {
    getCheckoutInfo: (empresaId: string) => fetchAPI<any>(`/pagamentos/checkout/${empresaId}`),
    create: (
      data: { empresaId: string; metodo: string; cardName?: string; cardNumber?: string; expiryDate?: string; cvv?: string },
      idempotencyKey?: string,
    ) =>
      fetchAPI<{ success: boolean; message: string; pix?: any; status?: string; isApproved?: boolean }>('/pagamentos', {
        method: 'POST',
        headers: idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined,
        body: JSON.stringify(data),
      }),
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
    testarGateway: (data: { gateway: string; chave1?: string; chave2?: string; publicKey?: string; accessToken?: string; sandbox?: boolean }) =>
      fetchAPI<any>('/admin/gateway/validar', { method: 'POST', body: JSON.stringify(data) }),
    getPublicConfig: () => fetchAPI<any>('/configuracoes/public'),
  },
};
