// Thin fetch wrapper: always sends cookies (for the httponly session cookie),
// attaches the CSRF token header on every mutating request, and times out
// instead of hanging forever if the backend is unreachable (misconfigured
// CORS, wrong proxy target, server not running, etc).

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
const TIMEOUT_MS = 30000;

let csrfToken = null;
let csrfBootstrapPromise = null;
const pendingGetRequests = new Map();

export function setCsrfToken(token) {
  csrfToken = token;
}

async function send(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  let data;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include', // send the httponly session cookie
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    data = await res.json().catch((error) => {
      if (error.name === 'AbortError') throw error;
      return {};
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    // Covers CORS rejections, DNS failures, "backend not running" — the
    // browser reports all of these as a generic network error with no
    // further detail, so the message has to stay generic too.
    throw new Error('Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = send('/csrf_token.php')
      .then((data) => {
        if (!data.csrf_token) throw new Error('Could not initialize request security. Please reload and try again.');
        setCsrfToken(data.csrf_token);
        return data.csrf_token;
      })
      .finally(() => { csrfBootstrapPromise = null; });
  }
  return csrfBootstrapPromise;
}

function request(path, options = {}) {
  const method = options.method || 'GET';
  const key = method === 'GET' ? `${path}|${csrfToken || ''}` : null;
  if (key && pendingGetRequests.has(key)) return pendingGetRequests.get(key);

  const pending = (async () => {
    if (path !== '/csrf_token.php') await ensureCsrfToken();
    return send(path, options);
  })();

  if (!key) return pending;
  pendingGetRequests.set(key, pending);
  return pending.finally(() => {
    if (pendingGetRequests.get(key) === pending) pendingGetRequests.delete(key);
  });
}

export const api = {
  bootstrap: () => request('/csrf_token.php'),
  register: (payload) => request('/register.php', { method: 'POST', body: payload }),
  verifyEmail: (email, passcode) => request('/verify_email.php', { method: 'POST', body: { email, passcode } }),
  resendVerification: (email) => request('/resend_verification.php', { method: 'POST', body: { email } }),
  login: async (payload) => {
    try {
      return await request('/login.php', { method: 'POST', body: payload });
    } catch (error) {
      if (error.status !== 403) throw error;
      setCsrfToken(null);
      return request('/login.php', { method: 'POST', body: payload });
    }
  },
  logout: () => request('/logout.php', { method: 'POST' }),
  requestPasswordReset: (email) => request('/request_password_reset.php', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/reset_password.php', { method: 'POST', body: { token, password } }),
  products: () => request('/products.php'),
  episodes: () => request('/episodes.php'),
  checkout: (items) => request('/checkout.php', { method: 'POST', body: { items } }),
  myOrders: () => request('/my_orders.php'),
  saveOrderAddress: (orderId, address) => request('/save_order_address.php', { method: 'POST', body: { order_id: orderId, address } }),
  uploadProof: (orderId, file) => {
    const form = new FormData();
    form.append('order_id', String(orderId));
    form.append('proof', file);
    return request('/upload_proof.php', { method: 'POST', body: form, isForm: true });
  },
  adminOrders: (status) => request(`/admin/orders.php${status ? `?status=${status}` : ''}`),
  adminVerifyOrder: (orderId, decision) =>
    request('/admin/verify_order.php', { method: 'POST', body: { order_id: orderId, decision } }),
  adminProofImageUrl: (proofId) => `${API_BASE}/admin/proof_image.php?proof_id=${proofId}`,
  adminEpisodes: () => request('/admin/episodes.php'),
  adminCreateEpisode: (payload) => request('/admin/create_episode.php', { method: 'POST', body: payload }),
  adminDeleteEpisode: (id) => request('/admin/delete_episode.php', { method: 'POST', body: { id } }),
  adminProducts: () => request('/admin/products.php'),
  adminCreateProduct: (formData) => request('/admin/create_product.php', { method: 'POST', body: formData, isForm: true }),
  adminUpdateStock: (variantId, stock) => request('/admin/update_stock.php', { method: 'POST', body: { variant_id: variantId, stock } }),
};

export function centsToRands(cents) {
  return `R${(cents / 100).toFixed(2)}`;
}
