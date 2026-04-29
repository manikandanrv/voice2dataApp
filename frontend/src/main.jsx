import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor for Authentication
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;

  let url = typeof resource === 'string' ? resource : resource.url;
  const isApiCall = url.startsWith(apiUrl);

  if (token && isApiCall) {
    if (typeof resource === 'string') {
      config = config || {};
      config.headers = config.headers || {};

      if (config.headers instanceof Headers) {
        if (!config.headers.has('Authorization')) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      } else {
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } else {
      // resource is a Request object
      if (!resource.headers.has('Authorization')) {
        resource.headers.set('Authorization', `Bearer ${token}`);
      }
    }
  }

  const response = await originalFetch(resource, config);

  // Handle session expiration
  if (response.status === 401 && isApiCall && !url.includes('/api/auth/login')) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
