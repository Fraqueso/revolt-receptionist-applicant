# N8N Webhook Troubleshooting Guide

## Quick Checklist

### 1. Verify N8N_WEBHOOK_URL is set in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Make sure `N8N_WEBHOOK_URL` exists
- Value should be: `https://YOURSUBDOMAIN.n8n.cloud/webhook/YOUR-WEBHOOK-ID`
- **NOT** `http://localhost:...` (won't work from Vercel!)

### 2. Verify N8N Webhook URL is Public
Your N8N webhook URL must be:
- ✅ HTTPS (not HTTP)
- ✅ Publicly accessible (not localhost)
- ✅ Production URL (no `-test` in path)

**Example of correct URL:**
```
https://yourname.n8n.cloud/webhook/abc123def456
```

**Example of WRONG URL (won't work):**
```
http://localhost:5678/webhook/abc123
https://localhost:5678/webhook/abc123
https://yourname.n8n.cloud/webhook-test/abc123
```

### 3. Check N8N Workflow is Activated
1. Open your n8n.cloud dashboard
2. Find your workflow
3. Make sure the **Activate** toggle is ON (green/blue)
4. If it's inactive, activate it and wait a few seconds

### 4. Check Vercel Logs
1. Go to Vercel Dashboard → Your Project
2. Click on **Deployments** tab
3. Click on your latest deployment
4. Click on **Functions** tab
5. Click on `api/contact`
6. Look at the **Logs** section

**What to look for:**
- `🔔 Forwarding to n8n webhook:` - Should show your webhook URL
- `✅ Successfully forwarded to n8n webhook` - Success!
- `❌ Error forwarding to n8n webhook:` - Error details
- `⚠️  N8N_WEBHOOK_URL not configured` - Missing env var

### 5. Test N8N Webhook Directly
Test your n8n webhook URL directly using curl or Postman:

```bash
curl -X POST https://YOURSUBDOMAIN.n8n.cloud/webhook/YOUR-WEBHOOK-ID \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","name":"Test User","email":"test@example.com"}'
```

**Expected results:**
- ✅ `200 OK` - Webhook is working
- ❌ `404 Not Found` - Workflow not activated or wrong URL
- ❌ `Connection refused` - URL is wrong or unreachable

### 6. Verify Environment Variable is Loaded
After adding/changing `N8N_WEBHOOK_URL` in Vercel:
- **You MUST redeploy** for changes to take effect
- Go to Deployments → Click "Redeploy" on latest deployment
- Or push a new commit to trigger a new deployment

## Common Issues & Fixes

### Issue: "N8N_WEBHOOK_URL not configured"
**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add `N8N_WEBHOOK_URL` with your n8n cloud webhook URL
3. Make sure to check **Production**, **Preview**, and **Development** environments
4. Redeploy your app

### Issue: "404 Not Found" from N8N
**Possible causes:**
1. Workflow not activated in n8n
2. Webhook URL changed (copy it again from n8n)
3. Using test URL instead of production URL

**Fix:**
1. Check n8n workflow is activated
2. Copy the production webhook URL again (no `-test`)
3. Update `N8N_WEBHOOK_URL` in Vercel
4. Redeploy

### Issue: "Connection refused" or "ECONNREFUSED"
**Cause:** Webhook URL is pointing to localhost or unreachable server

**Fix:**
1. Make sure you're using your n8n.cloud URL
2. Should be: `https://yourname.n8n.cloud/webhook/...`
3. NOT: `http://localhost:...` or any localhost URL

### Issue: Webhook works locally but not on Vercel
**Cause:** Environment variable not set in Vercel or pointing to localhost

**Fix:**
1. Check `N8N_WEBHOOK_URL` is set in Vercel (not just in local `.env`)
2. Make sure value is your n8n.cloud URL (not localhost)
3. Redeploy after setting/updating the env var

## Debugging Steps

### Step 1: Check Vercel Environment Variables
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Verify `N8N_WEBHOOK_URL` exists and has the correct value
4. Make sure it's enabled for **Production** environment

### Step 2: Check Vercel Function Logs
1. Deployments → Latest deployment → Functions → `api/contact` → Logs
2. Look for webhook-related messages
3. Check for error messages

### Step 3: Test Webhook URL Directly
Use curl to test if the webhook URL is working:
```bash
curl -X POST YOUR_N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","name":"Test"}'
```

### Step 4: Verify N8N Workflow
1. Open n8n.cloud
2. Check workflow is **activated**
3. Check **executions** tab - see if requests are coming through
4. Look for any errors in the execution logs

## Quick Test Script

Create a test file to verify your webhook:

```javascript
// test-webhook.js
const axios = require('axios');

const webhookUrl = 'https://YOURSUBDOMAIN.n8n.cloud/webhook/YOUR-ID';
const payload = {
  phone: '+1234567890',
  name: 'Test User',
  email: 'test@example.com',
};

axios.post(webhookUrl, payload, {
  headers: { 'Content-Type': 'application/json' }
})
  .then(res => console.log('✅ Success:', res.status))
  .catch(err => console.error('❌ Error:', err.message));
```

Run: `node test-webhook.js`

## Need More Help?

1. Check Vercel function logs for detailed error messages
2. Check n8n execution logs in n8n.cloud dashboard
3. Test the webhook URL directly with curl
4. Verify environment variables are set correctly in Vercel

