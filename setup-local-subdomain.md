# 🌐 Local Subdomain Setup Guide

## Step 1: Configure Windows Hosts File

### Location of Hosts File:
```
C:\Windows\System32\drivers\etc\hosts
```

### How to Edit Hosts File:

1. **Open Command Prompt as Administrator**
   - Press `Win + R`, type `cmd`
   - Press `Ctrl + Shift + Enter` (to run as admin)

2. **Open Hosts File**
   ```cmd
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. **Add These Lines to the Hosts File:**
   ```
   # Banglay IELTS Local Development
   127.0.0.1 blog.localhost
   127.0.0.1 banglayielts.localhost
   ```

4. **Save and Close**
   - Press `Ctrl + S` to save
   - Close Notepad

### Alternative Method (Using PowerShell):

1. **Open PowerShell as Administrator**
2. **Run this command:**
   ```powershell
   Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "`n127.0.0.1 blog.localhost`n127.0.0.1 banglayielts.localhost"
   ```

## Step 2: Verify Configuration

### Test the Setup:
1. **Start your servers:**
   ```bash
   # Backend (in one terminal)
   cd backend && npm start

   # Frontend (in another terminal) 
   cd frontend && npm start
   ```

2. **Test URLs:**
   - Main Site: `http://localhost:3000`
   - Blog Subdomain: `http://blog.localhost:3000`

## Step 3: Expected Behavior

### Main Domain (localhost:3000):
- ✅ Shows main website with hero section
- ✅ Blog link redirects to `blog.localhost:3000`
- ✅ Admin panel accessible at `/admin`

### Blog Subdomain (blog.localhost:3000):
- ✅ Shows blog-specific layout
- ✅ Direct blog post URLs: `blog.localhost:3000/post-slug`
- ✅ Categories: `blog.localhost:3000/categories`
- ✅ "Home" button redirects to main site

## Step 4: Troubleshooting

### If blog.localhost doesn't work:

1. **Clear DNS Cache:**
   ```cmd
   ipconfig /flushdns
   ```

2. **Restart Browser**
   - Close all browser windows
   - Reopen browser
   - Try again

3. **Check Hosts File:**
   ```cmd
   type C:\Windows\System32\drivers\etc\hosts
   ```

4. **Verify No Firewall Blocking:**
   - Check Windows Firewall
   - Ensure port 3000 is allowed

### Common Issues:

- **"Site can't be reached"**: Check hosts file syntax
- **CORS errors**: Verify backend CORS configuration
- **Redirect loops**: Clear browser cache/cookies

## Step 5: Production Deployment

### For Production (banglayielts.com):

1. **DNS Configuration:**
   ```
   Type: A Record
   Name: blog
   Value: [Your Server IP]
   TTL: 300
   ```

2. **Server Configuration (Nginx):**
   ```nginx
   # Main site
   server {
       listen 80;
       server_name banglayielts.com www.banglayielts.com;
       # ... main site config
   }

   # Blog subdomain
   server {
       listen 80;
       server_name blog.banglayielts.com;
       # ... blog site config
   }
   ```

3. **SSL Certificates:**
   ```bash
   # Get certificates for both domains
   certbot --nginx -d banglayielts.com -d www.banglayielts.com -d blog.banglayielts.com
   ```

## Step 6: Update Your Frontend URLs

### In your React components, use:
```javascript
// Redirect to blog
window.location.href = 'http://blog.localhost:3000';

// Production
window.location.href = 'https://blog.banglayielts.com';
```

### Use the subdomain utilities:
```javascript
import { redirectToBlog, redirectToMain } from './utils/subdomain';

// Redirect to blog with post slug
redirectToBlog('post-slug');

// Redirect to main site
redirectToMain();
```

## Testing Checklist:

- [ ] Hosts file configured correctly
- [ ] DNS cache cleared
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] `localhost:3000` shows main site
- [ ] `blog.localhost:3000` shows blog site
- [ ] Navigation between sites works
- [ ] API calls work from subdomain
- [ ] CORS configured properly

## Need Help?

If you encounter issues:
1. Check the browser developer console for errors
2. Verify network requests in the Network tab
3. Ensure both servers are running
4. Try incognito/private browsing mode