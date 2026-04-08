export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

    if (envUrl) {
        return envUrl;
    }

    if (typeof window !== 'undefined') {
        return `${window.location.origin.replace(/\/+$/, '')}/api`;
    }

    return 'http://localhost:5000/api';
};

const getBackendUrl = () => {
    // Use dedicated backend URL for images if set, otherwise derive from API URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, '');

    if (backendUrl) {
        return backendUrl;
    }

    // Fallback: derive from API URL by removing /api
    let baseUrl = getApiBaseUrl();

    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }

    return baseUrl.replace(/\/+$/, '');
};

const getServerRoot = () => {
    let baseUrl = getApiBaseUrl();

    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }

    return baseUrl.replace(/\/+$/, '');
};

export const getImageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path; // Already absolute

    path = path.replace(/\\/g, '/').trim();

    // Normalize any existing uploads path inside an absolute filesystem or relative path
    const uploadsIndex = path.toLowerCase().indexOf('uploads/');
    const cleanPath = uploadsIndex >= 0 ? path.slice(uploadsIndex) : path;

    const normalizedPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    const backendUrl = getBackendUrl();

    return `${backendUrl}/${normalizedPath}`;
};
