const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BACKEND_URL = API_BASE_URL.replace('/api/v1', '');

export const getMediaUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
