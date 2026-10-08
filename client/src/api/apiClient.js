const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('stockflow_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  const hybridResponse = {
    ok: response.ok,
    status: response.status,
    message: data.message || 'An error occurred',
    json: async () => data,
    ...data
  };

  // Return the hybrid response for BOTH success and failure
  // This allows components to manually check res.ok and res.status 
  return hybridResponse;
};
