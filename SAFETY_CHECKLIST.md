# 🔒 Safety Checklist Before Deployment

Follow this checklist to make sure you don't expose secrets or get hacked.

## ✅ BEFORE ANY COMMIT OR DEPLOYMENT

### 1. Check What You're Committing (IMPORTANT!)
```bash
git status
git diff
```
- ❌ **NEVER** commit files with `.env` in the name
- ❌ **NEVER** commit files with passwords, API keys, or secrets
- ❌ **NEVER** commit `node_modules/` folder (it's huge and unnecessary)

### 2. Verify .env is Protected
```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env
```
✅ Should show `.env` in the output

### 3. What Should Be in .gitignore (Your Protection List)
Your `.gitignore` should include:
- `.env` ← **YOUR SECRETS (webhook URLs, API keys)**
- `node_modules/` ← **Dependencies folder**
- `build/` ← **Build output**
- `.DS_Store` ← **Mac system files**

### 4. What's SAFE to Commit
✅ Source code files (`src/`, `public/`)
✅ Configuration files (`package.json`, `tailwind.config.js`)
✅ Documentation (`README.md`, `DEPLOYMENT.md`)
✅ `.env.example` (template without secrets)

## 🚨 DANGER SIGNS - Don't Commit If You See:

- Any file containing:
  - `N8N_WEBHOOK_URL=https://...` 
  - `API_KEY=...`
  - `ALLOWED_ORIGINS=...`
  - Any passwords or tokens

- If `git status` shows `.env`:
  ```bash
  # IMMEDIATELY run:
  git rm --cached .env
  # Then make sure .env is in .gitignore
  ```

## 🛡️ Security Features You Have

Your `server.js` already has these protections:
1. ✅ **Rate Limiting** - Blocks spam (5 requests per 15 min per IP)
2. ✅ **CORS Protection** - Only allows requests from your domain
3. ✅ **API Key** (optional) - Extra authentication layer
4. ✅ **Honeypot** - Catches bots automatically
5. ✅ **Input Validation** - Rejects bad data
6. ✅ **Request Size Limits** - Prevents huge payloads

## 📋 Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] `.env` is NOT committed (check `git status`)
- [ ] `.env` is in `.gitignore` 
- [ ] No secrets in any committed files
- [ ] You have your `.env` values written down somewhere safe
- [ ] You're ready to add environment variables in Vercel dashboard

## 🔐 Setting Up Vercel Safely

### Step 1: Deploy (Don't worry, this won't expose secrets)
```bash
npm i -g vercel
vercel
```
This just deploys your code - no secrets are exposed.

### Step 2: Add Secrets in Vercel Dashboard (Safe Way)
After deployment, go to Vercel dashboard → Your Project → Settings → Environment Variables

Add these there (NOT in code):
```
N8N_WEBHOOK_URL=https://your-webhook-url
API_KEY=your-secret-key (optional)
ALLOWED_ORIGINS=https://yourdomain.com (optional)
NODE_ENV=production
PORT=3001
```

**This is safe** - Vercel encrypts these and they're NOT in your code.

### Step 3: Verify Nothing Leaked
After pushing to GitHub, check your repo:
- Go to your GitHub repo
- Click "Settings" → "Security" → "Secret scanning"
- If anything shows up, that's a problem (but it shouldn't!)

## 🆘 If You Accidentally Committed Secrets

**If you already pushed secrets to GitHub:**

1. **Immediately** change your webhook URL in n8n
2. Generate a new API key
3. Remove the commit from history (if public repo, it's already exposed - just rotate keys)
4. Use `git filter-branch` or BFG Repo-Cleaner to remove secrets

**If repo is private:** Less urgent, but still rotate keys.

## ✅ Quick Safety Commands

```bash
# Check what you're about to commit
git status
git diff

# Check if .env is protected
cat .gitignore | grep .env

# See what files contain secrets (if you're paranoid)
git diff | grep -E "(webhook|API_KEY|password|secret)"
```

## 🎯 TL;DR - Golden Rules

1. **Never commit `.env`** - It has your secrets
2. **Always check `git status`** before committing
3. **Add secrets in Vercel dashboard**, not in code
4. **Your server.js already protects you** from hackers
5. **If you're unsure, don't commit it**

## 📚 What Each Security Feature Does

- **Rate Limiting**: "You're submitting too fast, slow down!" (stops bots)
- **CORS**: "You're not from my website, go away!" (blocks other sites)
- **API Key**: "Show me your ID first" (extra authentication)
- **Honeypot**: "If you filled this hidden field, you're a bot!" (catches bots)
- **Validation**: "This phone number is fake!" (checks data quality)

You're already pretty protected! Just don't commit your `.env` file.

