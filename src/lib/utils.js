export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already absolute

    // Fix backslashes for Windows compatibility
    path = path.replace(/\\/g, '/');

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Get base URL and remove /api if present (since uploads are usually served from root)
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // If baseUrl ends with /api, remove it to get the server root
    // Example: http://localhost:5000/api -> http://localhost:5000
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }

    // Ensure baseUrl doesn't end with slash
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    return `${baseUrl}/${cleanPath}`;
};
