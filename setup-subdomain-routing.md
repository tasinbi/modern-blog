# 🌐 Subdomain Routing Setup Guide

## Current Structure vs Desired Structure

### Current (localhost:3000/blogs/blogname)
- Main site: `localhost:3000`
- Blog: `localhost:3000/blogs`
- Individual post: `localhost:3000/blogs/blogname`

### Desired (blog.localhost/blogname)
- Main site: `localhost:3000` or `banglayielts.localhost`
- Blog: `blog.localhost`
- Individual post: `blog.localhost/blogname`

### Production (blog.banglayielts.com/blogname)
- Main site: `banglayielts.com`
- Blog: `blog.banglayielts.com`
- Individual post: `blog.banglayielts.com/blogname`

## Implementation Steps

### 1. Frontend Configuration
- Create subdomain detection logic
- Update React Router configuration
- Handle subdomain-specific layouts

### 2. Backend Configuration
- Update CORS settings for subdomains
- Add subdomain handling middleware
- Configure API endpoints

### 3. Local Development Setup
- Configure hosts file
- Set up local subdomain routing
- Test subdomain functionality

### 4. Production Deployment
- DNS configuration
- Server configuration (Nginx/Apache)
- SSL certificate setup

## Files to Modify
- `frontend/src/App.js` - Router configuration
- `frontend/src/utils/subdomain.js` - Subdomain detection
- `backend/server.js` - CORS and subdomain handling
- `hosts` file - Local development
- Production server configuration files