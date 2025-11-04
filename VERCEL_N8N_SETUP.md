# Vercel + N8N Setup Guide

## ✅ What's Already Configured

Your app is already set up correctly for Vercel deployment with N8N integration:

1. **✅ Serverless Function**: You have `api/contact.js` that acts as a proxy to N8N
   - This avoids CORS issues (as ChatGPT recommended)
   - Already uses `N8N_WEBHOOK_URL` environment variable
   - Handles rate limiting, validation, and error handling

2. **✅ Vercel Configuration**: `vercel.json` rewrites `/api/contact` → `/api/contact.js`

3. **✅ React App Configuration**: `src/config.js` uses relative paths in production
   - In production: `API_BASE_URL = ''` (relative to same domain)
   - Perfect for Vercel - no CORS, no cross-domain issues

4. **✅ No localhost dependencies**: The React app doesn't hardcode localhost URLs

## 🎯 What You Need To Do

### Step 1: Host N8N Publicly (Choose One)

**Option A: n8n Cloud (Easiest)**
1. Sign up at [n8n.cloud](https://n8n.io/cloud/)
2. You'll get a URL like: `https://YOURSUBDOMAIN.n8n.cloud`
3. Done! No server setup needed.

**Option B: Self-Host N8N** (Cheaper, more control)
- Use Railway, Render, Fly.io, or a VPS
- Requires Postgres database
- Environment variables needed:
  ```
  N8N_HOST=api.yourdomain.com
  N8N_PROTOCOL=https
  WEBHOOK_URL=https://api.yourdomain.com
  N8N_ENCRYPTION_KEY=<random 32+ char string>
  ```

### Step 2: Create Webhook in N8N

1. Open your n8n workflow (in n8n Cloud or your self-hosted instance)
2. Add or select a **Webhook** trigger node
3. Configure as **POST** webhook
4. **Activate the workflow** (important!)
5. Copy the **production webhook URL** (no `-test` in path)
   - Looks like: `https://YOURSUBDOMAIN.n8n.cloud/webhook/abc123`
   - Or: `https://api.yourdomain.com/webhook/abc123`

### Step 3: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:

   **Required:**
   ```
   Name: N8N_WEBHOOK_URL
   Value: https://YOURSUBDOMAIN.n8n.cloud/webhook/YOUR-WEBHOOK-ID
   Environment: Production, Preview, Development (check all)
   ```

   **Optional (for extra security):**
   ```
   Name: API_KEY
   Value: your-secret-api-key-minimum-32-characters
   Environment: Production, Preview, Development (check all)
   ```

   ```
   Name: ALLOWED_ORIGINS
   Value: https://your-app.vercel.app
   Environment: Production
   ```

4. **Redeploy** your app after adding env vars:
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment
   - Or push a new commit

### Step 4: Verify It Works

1. **Test N8N webhook directly:**
   ```bash
   curl -X POST https://YOURSUBDOMAIN.n8n.cloud/webhook/YOUR-WEBHOOK-ID \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   - Should return 200 OK
   - If 404: workflow not activated or URL wrong
   - Check n8n execution logs

2. **Test via your Vercel app:**
   - Visit your deployed app
   - Fill out the contact form
   - Submit
   - Check n8n execution logs - you should see the data

## 🔐 Security Recommendations

### 1. Protect Your Webhook (if receiving third-party webhooks)

Add an HTTP Request node after the webhook in n8n:

```javascript
// Use Switch node to check for secret header
if ($input.header['x-api-key'] !== 'your-secret-key') {
  return { error: 'Unauthorized' };
}
```

Or use an IF node to validate before processing.

### 2. Use API Key Authentication (Optional)

Your serverless function already supports `API_KEY`. To enable:

1. Set `API_KEY` in Vercel environment variables
2. Update `src/config.js`:
   ```javascript
   export const API_KEY = process.env.REACT_APP_API_KEY;
   ```
3. Update `src/App.js` (line ~685):
   ```javascript
   const response = await axios.post(`${API_BASE_URL}/api/contact`, payload, {
     headers: {
       'Content-Type': 'application/json',
       'x-api-key': API_KEY, // Add this
     },
     timeout: 30000,
   });
   ```

**Note**: This is optional since the webhook is already server-side and not directly exposed to browsers.

## 🔧 Fix: Running React Locally but Backend on Vercel

**The Problem:** If you're running the React app locally (`localhost:3000`) but your backend API is on Vercel, you'll get errors trying to connect to `localhost:3001` which doesn't exist.

**The Solution:** Point your local React app to your Vercel deployment:

1. **Create a `.env` file** in your project root (if it doesn't exist):
   ```bash
   # In your project root
   touch .env
   ```

2. **Add your Vercel URL to `.env`:**
   ```env
   REACT_APP_API_URL=https://your-app.vercel.app
   ```
   Replace `your-app.vercel.app` with your actual Vercel deployment URL.

3. **Restart your React dev server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm start
   ```

4. **Verify it's working:**
   - The React app should now call `https://your-app.vercel.app/api/contact` instead of `localhost:3001`
   - Test the contact form - it should work even when your computer is sleeping!

**Note:** 
- When you deploy to Vercel, it automatically uses relative paths (no env var needed)
- The `.env` file is gitignored, so it won't be committed
- Each developer needs their own `.env` file pointing to the Vercel deployment

## 🐛 Troubleshooting

### N8N not receiving data

1. **Check Vercel logs:**
   - Go to Vercel dashboard → Deployments → Select deployment → Functions → `api/contact`
   - Look for error messages

2. **Check N8N webhook URL:**
   - Verify `N8N_WEBHOOK_URL` is set correctly in Vercel
   - Must be HTTPS (not HTTP or localhost)
   - Must be the production URL (no `-test` in path)

3. **Check N8N workflow:**
   - Is the workflow **activated**? (Toggle in n8n UI)
   - Check n8n execution logs for errors
   - Verify webhook path/ID hasn't changed

4. **Test webhook directly:**
   ```bash
   curl -X POST YOUR_N8N_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890","name":"Test"}'
   ```

### CORS errors (shouldn't happen)

- Your setup uses server-side proxy (`api/contact.js`), so CORS shouldn't be an issue
- If you see CORS errors, check `ALLOWED_ORIGINS` in Vercel env vars

### 404 errors

- **From Vercel**: Check `vercel.json` has correct rewrite rule
- **From N8N**: Workflow not activated or webhook URL wrong

### Environment variables not working

- **After adding env vars, you MUST redeploy** (they're injected at build/deploy time)
- Check env var names match exactly (case-sensitive)
- Check you selected correct environments (Production/Preview/Development)

### 400 Error: Can't connect to localhost:3000 or localhost:3001

**Symptoms:**
- Error: "Network error - cannot connect to server at http://localhost:3001"
- Error: "Couldn't connect to localhost:3000"
- Happens when your computer is off or asleep

**Cause:**
- Your React app is running locally (`localhost:3000`)
- It's trying to connect to `localhost:3001` (default in development)
- But your backend is on Vercel, not running locally

**Fix:**
1. Create `.env` file in project root:
   ```env
   REACT_APP_API_URL=https://your-app.vercel.app
   ```
2. Replace `your-app.vercel.app` with your actual Vercel URL
3. Restart React dev server: `npm start`
4. Your app will now connect to Vercel instead of localhost

**Why this works:**
- Vercel is always online (doesn't depend on your computer)
- The API works even when your computer is sleeping
- The `.env` file is gitignored, so it stays local to your machine

## 📋 Quick Checklist

- [ ] N8N hosted publicly (n8n Cloud or self-hosted)
- [ ] Webhook created in N8N workflow
- [ ] Workflow **activated** in N8N
- [ ] Copied production webhook URL (no `-test`)
- [ ] Set `N8N_WEBHOOK_URL` in Vercel environment variables
- [ ] Redeployed app after setting env vars
- [ ] Tested webhook directly with curl
- [ ] Tested contact form on deployed app
- [ ] Verified data appears in n8n execution logs

## 🎉 Summary

**Your app architecture is already correct!** You just need to:

1. **Host N8N publicly** (n8n Cloud is easiest)
2. **Set `N8N_WEBHOOK_URL` in Vercel** to your public N8N webhook URL
3. **Redeploy** after setting env vars

That's it! The serverless function proxy (`api/contact.js`) handles everything else - no CORS issues, no client-side exposure of webhook URLs, secure and scalable.

