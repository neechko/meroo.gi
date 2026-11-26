export class MerooApiClient {
  constructor(
    private baseUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request gagal (${res.status})`);
    }
    return data as T;
  }

  getMe() {
    return this.request<{ user_id: string; role: 'consumer' | 'worker' | 'admin'; role_label: string; profile: any }>('/v1/me');
  }
  cancelOrder(orderId: string, reason?: string) {
    return this.request('/v1/orders/' + orderId + '/cancel', { method: 'POST', body: JSON.stringify({ reason }) });
  }
  getReceipt(orderId: string) {
    return this.request('/v1/orders/' + orderId + '/receipt');
  }
  saveCredentials(orderId: string, payload: { game_uid: string; login_identifier: string; password: string }) {
    return this.request('/v1/orders/' + orderId + '/credentials', { method: 'POST', body: JSON.stringify(payload) });
  }
  getCredentials(orderId: string) {
    return this.request('/v1/orders/' + orderId + '/credentials');
  }
  requestVerificationCode(orderId: string) {
    return this.request('/v1/orders/' + orderId + '/credentials/verification', { method: 'POST', body: JSON.stringify({ action: 'request' }) });
  }
  submitVerificationCode(orderId: string, code: string) {
    return this.request('/v1/orders/' + orderId + '/credentials/verification', { method: 'POST', body: JSON.stringify({ action: 'submit', code }) });
  }
  listChecklists(orderId: string, date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<any[]>('/v1/orders/' + orderId + '/checklists' + qs);
  }
  createChecklist(orderId: string, payload: { task_date?: string; cadence: string; task_key: string; task_label: string; target_detail?: string }) {
    return this.request('/v1/orders/' + orderId + '/checklists', { method: 'POST', body: JSON.stringify(payload) });
  }
  toggleChecklist(itemId: string, is_done: boolean, target_detail?: string) {
    return this.request('/v1/checklists/' + itemId, { method: 'PATCH', body: JSON.stringify({ is_done, target_detail }) });
  }
  editProgress(orderId: string, progressId: string, percentage: number, notes: string) {
    return this.request(`/v1/orders/${orderId}/progress/${progressId}`, { method: 'PATCH', body: JSON.stringify({ percentage, notes }) });
  }
  getWorkerCandidates(orderId: string) {
    return this.request<any[]>(`/v1/admin/orders/${orderId}/worker-candidates`);
  }
  assignWorker(orderId: string, worker_id?: string) {
    return this.request(`/v1/admin/orders/${orderId}/assign`, { method: 'POST', body: JSON.stringify({ worker_id: worker_id || '' }) });
  }
  getFinanceSummary() {
    return this.request<any>('/v1/admin/finance/summary');
  }
  updateFinanceSettings(payload: { worker_share_pct: number; admin_share_pct: number; studio_treasury_pct: number }) {
    return this.request('/v1/admin/finance/settings', { method: 'PATCH', body: JSON.stringify(payload) });
  }
  updateUserRole(userId: string, role: 'consumer' | 'worker' | 'admin') {
    return this.request(`/v1/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }
  deleteService(serviceId: string) {
    return this.request(`/v1/admin/services/${serviceId}`, { method: 'DELETE' });
  }
  updateReview(reviewId: string, rating: number, comment: string) {
    return this.request(`/v1/admin/reviews/${reviewId}`, { method: 'PATCH', body: JSON.stringify({ rating, comment }) });
  }
  deleteReview(reviewId: string) {
    return this.request(`/v1/admin/reviews/${reviewId}`, { method: 'DELETE' });
  }
}
