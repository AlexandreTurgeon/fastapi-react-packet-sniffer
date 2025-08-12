# Deployment Guide

This guide provides step-by-step instructions for deploying the Packet Sniffer application to production.

## Backend Deployment (Render/Railway)

### Option 1: Render

1. **Create a new Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name**: `packet-sniffer-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty (or set to `backend` if needed)

3. **Environment Variables**
   - `PORT`: Will be auto-assigned by Render
   - `HOST`: `0.0.0.0`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Note the generated URL (e.g., `https://your-app.onrender.com`)

### Option 2: Railway

1. **Create a new project**
   - Go to [Railway Dashboard](https://railway.app/)
   - Click "New Project" and select "Deploy from GitHub repo"
   - Connect your repository

2. **Configure the service**
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   - `PORT`: Auto-assigned by Railway
   - `HOST`: `0.0.0.0`

4. **Deploy**
   - Railway will automatically detect the Python project
   - Deploy and note the generated URL

## Frontend Deployment (Vercel)

1. **Create a new project**
   - Go to [Vercel Dashboard](https://vercel.com/)
   - Click "New Project" and import your GitHub repository

2. **Configure the project**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**
   - `VITE_API_URL`: Your backend URL (e.g., `https://your-app.onrender.com`)
   - `VITE_WS_URL`: Your backend WebSocket URL (e.g., `wss://your-app.onrender.com`)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your frontend will be available at the generated Vercel URL

## Production Considerations

### Security
- **Packet Capture**: Note that packet capture requires elevated privileges and may not work in cloud environments
- **CORS**: Update CORS settings in `backend/main.py` to only allow your frontend domain
- **Authentication**: Consider adding authentication for production use
- **HTTPS**: Both Render and Vercel provide HTTPS by default

### Environment Variables
Create a `.env` file for local development:

```bash
# Backend (.env in backend directory)
PORT=8000
HOST=0.0.0.0

# Frontend (.env in frontend directory)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### WebSocket Configuration
For production WebSocket connections:
- Use `wss://` instead of `ws://` for secure connections
- Ensure your backend supports WebSocket upgrades over HTTPS

### Monitoring
- Set up logging for both backend and frontend
- Monitor packet capture performance
- Set up alerts for service availability

## Troubleshooting

### Common Issues

1. **Packet Capture Not Working**
   - Cloud environments typically don't allow raw packet capture
   - Consider using a VPS or dedicated server for packet capture
   - Test with mock data for demonstration purposes

2. **WebSocket Connection Issues**
   - Ensure CORS is properly configured
   - Check that the WebSocket URL uses the correct protocol (ws/wss)
   - Verify the backend is accessible from the frontend domain

3. **Build Failures**
   - Check that all dependencies are properly specified
   - Ensure Python and Node.js versions are compatible
   - Review build logs for specific error messages

### Local Testing
Before deploying, test locally:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Support
For deployment issues:
- Check the platform-specific documentation
- Review build logs for error messages
- Ensure all environment variables are properly set
- Verify network connectivity between services
