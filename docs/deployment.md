# AdForge AI - Deployment Guide

## Production Environment Requirements
- Linux container runtime (Ubuntu 22.04+ or Alpine with glibc)
- Node.js 20+
- FFmpeg (`apt-get install -y ffmpeg`)
- Persistent volume mounted at `/data/storage`
- Environment variables:
  - `PORT=3000`
  - `GEMINI_API_KEY=<your-key>`
  - `NODE_ENV=production`

## Building and Running
```bash
# 1. Install dependencies
npm install

# 2. Build the frontend client bundle
npm run build

# 3. Launch full-stack production server
npm run start
```

## Docker Container Deployment
```bash
docker build -t adforge-ai .
docker run -p 3000:3000 -e GEMINI_API_KEY="..." adforge-ai
```
