const TOKEN_KEY = 'nexaerp_token';
const USER_KEY = 'nexaerp_user';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function saveAuth(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setCookie('nexaerp_token', token, 7); // 7 days
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  deleteCookie('nexaerp_token');
}

export function getRole(): string | null {
  const user = getUser();
  return user?.role || null;
}

export function normalizeModuleId(id?: string | null): string {
  if (!id) return '';
  const lower = String(id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (lower.includes('barbearia') || lower.includes('salao') || lower.includes('saloes') || lower.includes('estetica')) return 'saloes-barbearias';
  if (lower.includes('loja') || lower.includes('varejo')) return 'lojas-varejo';
  if (lower.includes('bar') || lower.includes('restaurante') || lower.includes('comida') || lower.includes('gastronomia')) return 'bares-restaurantes';
  if (lower.includes('mercado') || lower.includes('padaria') || lower.includes('mercearia') || lower.includes('supermercado')) return 'mercados-padarias';
  return lower;
}

export function getUserModule(): string | null {
  if (typeof window === 'undefined') return null;
  const user = getUser();
  const raw =
    user?.tipo_negocio ||
    user?.tipoNegocio ||
    user?.modulo ||
    user?.segmento ||
    user?.empresa?.tipo_negocio ||
    user?.empresa?.modulo ||
    localStorage.getItem('nexaerp_user_module') ||
    null;
  return raw ? normalizeModuleId(raw) : null;
}

export function setUserModule(module: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexaerp_user_module', normalizeModuleId(module));
}

export function getUserStatus(): string | null {
  const user = getUser();
  return user?.status || user?.empresa?.status || 'ativa';
}
