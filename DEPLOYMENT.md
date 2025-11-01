# Deployment Guide

This guide covers deploying your React app and protecting your webhook from abuse.

## Deployment Options

### Option 1: Deploy Both on Same Platform (Recommended)

#### **Vercel** (Easiest for React + API Routes)
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create API route:**
   - Create `api/contact.js` in your project root:
   ```javascript
   // Copy contents from server.js and adapt for serverless
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel dashboard:**
   - `N8N_WEBHOOK_URL`
   - `API_KEY` (optional, for extra security)
   - `ALLOWED_ORIGINS` (your domain, e.g., `https://yourdomain.com`)

#### **Netlify** (Good for React + Functions)
1. **Create Netlify function:**
   - Create `netlify/functions/contact.js`
   - Adapt `server.js` for Netlify Functions format

2. **Deploy:**
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```

### Option 2: Separate Frontend and Backend

#### Frontend (React App)

**Vercel/Netlify:**
```bash
# Build the app
npm run build

# Deploy the build folder
# Vercel: vercel --prod
# Netlify: netlify deploy --prod --dir=build
```

**Environment Variables:**
- `REACT_APP_API_URL` - Your backend API URL (e.g., `https://api.yourdomain.com`)

#### Backend (Express Server)

**Railway/Render/Heroku:**

1. **Railway:**
   - Connect your GitHub repo
   - Set `start` script to `node server.js`
   - Add environment variables

2. **Render:**
   - Create a new Web Service
   - Build command: (none, just Node)
   - Start command: `node server.js`

3. **Heroku:**
   ```bash
   # Install Heroku CLI
   heroku create your-app-name
   git push heroku main
   ```

**Environment Variables for Backend:**
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
PORT=3001
NODE_ENV=production
API_KEY=your-secret-api-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Option 3: Traditional VPS (DigitalOcean, AWS EC2, etc.)

1. **Install Node.js and PM2:**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 (process manager)
   npm install -g pm2
   ```

2. **Build and deploy:**
   ```bash
   # Build React app
   npm run build

   # Start backend with PM2
   pm2 start server.js --name "revolt-api"
   pm2 save
   pm2 startup
   ```

3. **Set up Nginx reverse proxy:**
   ```nginx
   # /etc/nginx/sites-available/your-site
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend (React build)
       location / {
           root /path/to/react-app/build;
           try_files $uri /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Security Configuration

### 1. Enable API Key Authentication (Recommended)

Add to your `.env` file:
```env
API_KEY=your-very-secret-api-key-minimum-32-characters
```

Update your frontend `src/config.js`:
```javascript
export const API_KEY = process.env.REACT_APP_API_KEY;
```

Update `src/App.js` to send API key:
```javascript
const response = await axios.post(`${API_BASE_URL}/api/contact`, payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY, // Add this
  },
  timeout: 30000,
});
```

### 2. Configure CORS Origins

In production, restrict CORS to your domain only:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Rate Limiting

The server includes rate limiting:
- **5 requests per 15 minutes per IP**
- Adjust in `server.js`:
  ```javascript
  const RATE_LIMIT_MAX_REQUESTS = 5; // Change this
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // Change this
  ```

### 4. Add Honeypot Field (Optional)

Add a hidden field to your form to catch bots:

In `src/App.js` ContactSlide:
```jsx
{/* Honeypot field - hidden from users */}
<input
  type="text"
  name="website"
  style={{ display: 'none' }}
  tabIndex="-1"
  autoComplete="off"
  value=""
  onChange={() => {}} // Do nothing if filled
/>
```

The server will automatically reject submissions that fill this field.

### 5. Additional Security Headers

Add to `server.js`:
```javascript
// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## Testing Your Deployment

1. **Test the API endpoint:**
   ```bash
   curl -X POST https://your-api.com/api/contact \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{"phone": "+1234567890", "name": "Test", "email": "test@example.com"}'
   ```

2. **Test rate limiting:**
   - Make 6 requests quickly
   - The 6th should return 429 (Too Many Requests)

3. **Test CORS:**
   - Try accessing from a different domain
   - Should be blocked if `ALLOWED_ORIGINS` is set

## Monitoring and Logging

Consider adding:
- **Error tracking:** Sentry, Rollbar
- **Logging:** Winston, Pino
- **Monitoring:** UptimeRobot, Pingdom

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with your production domain
- [ ] Set a strong `API_KEY` (32+ random characters)
- [ ] Update `REACT_APP_API_URL` in frontend to production API
- [ ] Enable HTTPS/SSL
- [ ] Test rate limiting
- [ ] Test CORS restrictions
- [ ] Verify n8n webhook URL is correct
- [ ] Set up error monitoring
- [ ] Set up uptime monitoring
- [ ] Review and adjust rate limits if needed

## Troubleshooting

### CORS errors in production
- Check `ALLOWED_ORIGINS` includes your exact domain (with https://)
- Ensure no trailing slashes

### API key not working
- Check both frontend and backend have the same key
- Verify header name is `X-API-Key`

### Rate limiting too strict
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW` in `server.js`

### n8n webhook not receiving data
- Check `N8N_WEBHOOK_URL` is set correctly
- Verify n8n workflow is activated
- Check server logs for errors

