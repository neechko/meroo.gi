import { NativeModules } from 'react-native';
import { supabase } from './supabase';

function resolveGoApiUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_GO_API_URL || process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (envUrl && !envUrl.includes('10.0.2.2') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL && scriptURL.includes('://')) {
    const host = scriptURL.split('://')[1]?.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'http://' + host + ':8080';
    }
  }
  return (envUrl || 'http://10.0.2.2:8080').replace(/\/$/, '');
}

export const GO_API_BASE_URL = resolveGoApiUrl();

async function getValidAccessToken(forceRefresh = false): Promise<string | undefined> {
  if (forceRefresh) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token;
  }
  const { data } = await supabase.auth.getSession();
  const sess = data.session;
  if (!sess) return undefined;

  const nowSec = Math.floor(Date.now() / 1000);
  if (sess.expires_at && sess.expires_at - nowSec < 60) {
    const refreshed = await supabase.auth.refreshSession();
    return refreshed.data.session?.access_token || sess.access_token;
  }
  return sess.access_token;
}

async function goFetch<T>(path: string, init: RequestInit = {}, timeoutMs = 15000, isRetry = false): Promise<T> {
  const token = await getValidAccessToken(isRetry);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GO_API_BASE_URL + path, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(init.headers || {}),
      },
    });

    if (res.status === 401 && !isRetry) {
      clearTimeout(timer);
      return goFetch<T>(path, init, timeoutMs, true);
    }

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { error: text };
    }

    if (!res.ok) {
      throw new Error(json?.error || 'Permintaan gagal (' + res.status + ')');
    }
    return json as T;
  } catch (err: any) {
    if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('canceled')) {
      throw new Error('Koneksi ke Go API (' + GO_API_BASE_URL + ') timeout. Pastikan server Go berjalan.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const goApi = {
  resolveIdentifier: (identifier: string) =>
    goFetch<{ email: string }>('/v1/auth/resolve-identifier', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),
  getMe: () => goFetch<{ user_id: string; role: 'consumer' | 'worker' | 'admin'; profile: any }>('/v1/me'),
  updateMyProfile: (body: { full_name?: string; username?: string; contact_info?: string; avatar_url?: string }) =>
    goFetch('/v1/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  cancelOrder: (orderId: string, reason: string) =>
    goFetch('/v1/orders/' + orderId + '/cancel', { method: 'POST', body: JSON.stringify({ reason }) }),
  getReceipt: (orderId: string) => goFetch<any>('/v1/orders/' + orderId + '/receipt'),
  saveCredentials: (orderId: string, body: { game_uid: string; login_identifier: string; password: string }) =>
    goFetch('/v1/orders/' + orderId + '/credentials', { method: 'POST', body: JSON.stringify(body) }),
  getCredentials: (orderId: string) => goFetch<any>('/v1/orders/' + orderId + '/credentials'),
  requestVerificationCode: (orderId: string) =>
    goFetch('/v1/orders/' + orderId + '/credentials/verification', {
      method: 'POST',
      body: JSON.stringify({ action: 'request_code' }),
    }),
  submitVerificationCode: (orderId: string, code: string) =>
    goFetch('/v1/orders/' + orderId + '/credentials/verification', {
      method: 'POST',
      body: JSON.stringify({ action: 'submit_code', code }),
    }),
  listChecklists: (orderId: string, date: string) =>
    goFetch<any[]>('/v1/orders/' + orderId + '/checklists?date=' + encodeURIComponent(date)),
  createChecklist: (
    orderId: string,
    body: { task_date: string; cadence: string; task_key: string; task_label: string; target_detail?: string }
  ) => goFetch('/v1/orders/' + orderId + '/checklists', { method: 'POST', body: JSON.stringify(body) }),
  toggleChecklist: (itemId: string, isDone: boolean) =>
    goFetch('/v1/checklists/' + itemId, { method: 'PATCH', body: JSON.stringify({ is_done: isDone }) }),
  postProgress: (orderId: string, body: { percentage: number; notes: string; screenshot_url?: string }) =>
    goFetch<{ status: string; current_percentage: number }>('/v1/orders/' + orderId + '/progress', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  editProgress: (orderId: string, progressId: string, percentage: number, notes: string) =>
    goFetch('/v1/orders/' + orderId + '/progress/' + progressId, {
      method: 'PATCH',
      body: JSON.stringify({ percentage, notes }),
    }),
  getWorkerCandidates: (orderId: string) => goFetch<any[]>('/v1/admin/orders/' + orderId + '/worker-candidates'),
  assignWorker: (orderId: string, workerId?: string) =>
    goFetch('/v1/admin/orders/' + orderId + '/assign', {
      method: 'POST',
      body: JSON.stringify(workerId ? { worker_id: workerId } : {}),
    }),
  getFinanceSummary: () => goFetch<any>('/v1/admin/finance/summary'),
  updateFinanceSettings: (body: { worker_share_pct: number; admin_share_pct: number; studio_treasury_pct: number }) =>
    goFetch('/v1/admin/finance/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  listAdminUsers: () => goFetch<any[]>('/v1/admin/users'),
  updateUserRole: (userId: string, role: 'consumer' | 'worker' | 'admin') =>
    goFetch('/v1/admin/users/' + userId + '/role', { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserAccount: (
    userId: string,
    body: {
      role?: 'consumer' | 'worker' | 'admin';
      full_name?: string;
      username?: string;
      email?: string;
      password?: string;
      seniority_level?: string;
      max_capacity?: number;
    }
  ) => goFetch('/v1/admin/users/' + userId + '/account', { method: 'PATCH', body: JSON.stringify(body) }),
  listWorkerInvites: () => goFetch<any[]>('/v1/admin/workers/invites'),
  inviteWorker: (body: { email: string; seniority_level: string; max_capacity: number }) =>
    goFetch('/v1/admin/workers/invite', { method: 'POST', body: JSON.stringify(body) }),
  deleteService: (serviceId: string) => goFetch('/v1/admin/services/' + serviceId, { method: 'DELETE' }),
  updateReview: (reviewId: string, body: { rating?: number; comment?: string }) =>
    goFetch('/v1/admin/reviews/' + reviewId, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteReview: (reviewId: string) => goFetch('/v1/admin/reviews/' + reviewId, { method: 'DELETE' }),
};
