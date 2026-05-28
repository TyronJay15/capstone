/**
 * Central HTTP client for Grade Portal Django REST API.
 * Base URL: REACT_APP_API_BASE_URL (e.g. http://localhost:8000/api/v1)
 */

const DEFAULT_DEV_BASE = 'http://localhost:8000/api/v1';

export function getApiBaseUrl() {
  const base = (process.env.REACT_APP_API_BASE_URL || '').trim();
  if (base) {
    return base.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return DEFAULT_DEV_BASE;
  }
  return '';
}

function buildUrl(path) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken') || '';
}

/**
 * Attempt to refresh the JWT access token using the refresh token.
 */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(buildUrl('/auth/token/refresh/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token invalid, clear tokens
      clearAuthTokens();
      return false;
    }

    const data = await response.json();
    if (data.access) {
      setAccessToken(data.access);
      if (data.refresh) {
        setRefreshToken(data.refresh);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    clearAuthTokens();
    return false;
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = true, headers = {}, body, ...rest } = options;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  // Handle 401 Unauthorized — attempt token refresh
  if (response.status === 401 && auth && !path.includes('/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with new token
      const newToken = getAccessToken();
      const retryHeaders = {
        'Content-Type': 'application/json',
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };

      response = await fetch(buildUrl(path), {
        ...rest,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      data = null;
      const retryContentType = response.headers.get('content-type') || '';
      if (retryContentType.includes('application/json')) {
        data = await response.json();
      }
    }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      (typeof data?.errors === 'string' ? data.errors : null) ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};

export function getAccessToken() {
  return localStorage.getItem('accessToken') || '';
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

export function clearAuthTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
