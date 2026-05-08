const AUTH_API = process.env.REACT_APP_AUTH_API || 'http://localhost:8001';
const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || 'http://localhost:8002';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const resp = await fetch(url, { ...options, headers });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!resp.ok) {
    const msg = data && data.error ? data.error : `Request failed (${resp.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---------- Auth ----------
export const authApi = {
  login: (username, password) =>
    request(`${AUTH_API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username, password) =>
    request(`${AUTH_API}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  verify: () => request(`${AUTH_API}/auth/verify`),
};

// ---------- Images ----------
export const imageApi = {
  list: () => request(`${AUTH_API}/images`),
  get: (id) => request(`${AUTH_API}/images/${id}`),
  popularTags: (limit = 10) =>
    request(`${AUTH_API}/images/tags/popular?limit=${limit}`),
  upload: (formData) =>
    request(`${AUTH_API}/images`, { method: 'POST', body: formData }),
  delete: (id) => request(`${AUTH_API}/images/${id}`, { method: 'DELETE' }),
};

// ---------- Comments ----------
export const commentApi = {
  list: (imageId) =>
    request(`${INTERACTION_API}/comments?image_id=${encodeURIComponent(imageId)}`),
  add: (imageId, text) =>
    request(`${INTERACTION_API}/comments`, {
      method: 'POST',
      body: JSON.stringify({ image_id: imageId, text }),
    }),
};

// ---------- Ratings ----------
export const ratingApi = {
  get: (imageId) =>
    request(`${INTERACTION_API}/ratings?image_id=${encodeURIComponent(imageId)}`),
  set: (imageId, value) =>
    request(`${INTERACTION_API}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ image_id: imageId, value }),
    }),
};

// ---------- Search ----------
export const searchApi = {
  query: ({ q, location, tag } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (location) params.set('location', location);
    if (tag) params.set('tag', tag);
    return request(`${INTERACTION_API}/search?${params.toString()}`);
  },
};
