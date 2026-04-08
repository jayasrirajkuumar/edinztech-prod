# Production Deployment Guide

## Environment Variables Setup

For images to work correctly in production, you need to set the following environment variables in your frontend deployment:

### Required Variables

```bash
# Frontend domain (where your React app is deployed)
VITE_FRONTEND_URL=https://your-frontend-domain.com

# Backend API URL (where your Node.js server is deployed)
VITE_API_URL=https://your-backend-domain.com/api

# Backend domain for images and uploads (usually same as backend API without /api)
VITE_BACKEND_URL=https://your-backend-domain.com
```

### Example for Different Hosting Scenarios

#### Scenario 1: Frontend and Backend on Same Domain
```
VITE_FRONTEND_URL=https://myapp.com
VITE_API_URL=https://myapp.com/api
VITE_BACKEND_URL=https://myapp.com
```

#### Scenario 2: Frontend and Backend on Different Domains
```
VITE_FRONTEND_URL=https://frontend.myapp.com
VITE_API_URL=https://backend.myapp.com/api
VITE_BACKEND_URL=https://backend.myapp.com
```

### How to Set in Different Platforms

#### Vercel/Netlify (Frontend)
Add these as environment variables in your dashboard:
- `VITE_FRONTEND_URL`
- `VITE_API_URL`
- `VITE_BACKEND_URL`

#### Docker
Set them in your docker-compose.yml or Dockerfile:
```yaml
environment:
  - VITE_FRONTEND_URL=https://your-domain.com
  - VITE_API_URL=https://your-backend.com/api
  - VITE_BACKEND_URL=https://your-backend.com
```

#### Manual Build
Create a `.env.production` file with the variables, then build:
```bash
npm run build
```

### Verification

After deployment, check that images load by:
1. Opening browser dev tools (F12)
2. Going to Network tab
3. Looking for image requests to `https://your-backend-domain.com/uploads/...`

If images still don't load, verify:
- Backend server is running and serving `/uploads` route
- CORS is configured to allow your frontend domain
- SSL certificates are valid (if using HTTPS)