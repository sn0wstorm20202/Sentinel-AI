import axios from 'axios';

/** The single key under which a bearer token is stored, read and cleared. */
export const TOKEN_KEY = 'sentinel_token';

// Create a generic Axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT (mock implementation for now)
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    /*
     * A 401 clears the stored token and nothing else.
     *
     * This used to remove `'token'` — a key nothing ever wrote, since the
     * request interceptor above reads `'sentinel_token'` — and then hard-
     * navigate to `/login`, a route that does not exist in this app. So the one
     * path that was supposed to recover from an expired session instead threw
     * away the user's place and landed them on a 404, while leaving the bad
     * token in storage to fail the same way again.
     *
     * The backend's `verify_token` is a permissive placeholder that never
     * rejects, so a 401 here means a proxy or gateway refused the call, not
     * that a session lapsed. Rejecting lets the calling screen render its own
     * error state, which is the only place with enough context to explain it.
     */
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);
