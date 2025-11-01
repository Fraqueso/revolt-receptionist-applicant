# Setting Up GitHub → Vercel Automatic Deployments

## Problem
When you push code to GitHub, Vercel doesn't automatically deploy because the GitHub repository isn't connected to your Vercel project.

## Solution: Connect GitHub Repo to Vercel

### Option 1: Via Vercel Dashboard (Recommended - Easiest)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Find your project: `react-app` (in `fraquesos-projects`)

2. **Connect GitHub Repository:**
   - Click on your project
   - Go to **Settings** → **Git**
   - Under **Git Repository**, click **Connect Git Repository**
   - Select GitHub and authorize Vercel
   - Choose your repository: `Fraqueso/revolt-receptionist-applicant`
   - Select the branch: `main`
   - Click **Connect**

3. **Enable Automatic Deployments:**
   - In the same **Git** settings page
   - Enable **Automatic deployments from Git**
   - Vercel will now automatically deploy when you push to GitHub!

### Option 2: Via Vercel CLI

If you prefer using the CLI:

```bash
# Link the project to GitHub (if not already linked)
vercel link --yes

# This will prompt you to:
# - Select a scope (your team)
# - Select a project (react-app)
# - Link to a Git repository (you'll need to provide the repo URL)
```

However, **Option 1 (Dashboard) is easier** because it handles the GitHub OAuth and repository selection automatically.

## After Connecting

Once connected:
- ✅ Every `git push` to `main` will trigger a new deployment
- ✅ You'll see deployment status in Vercel dashboard
- ✅ You'll see deployment status badges in GitHub (if enabled)

## Verify It's Working

1. Make a small change to any file
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Check Vercel dashboard - you should see a new deployment starting automatically!

## Troubleshooting

**"I don't see the Connect Git Repository button"**
- Make sure you're the project owner or have admin permissions
- Try refreshing the page

**"GitHub isn't listed as an option"**
- You may need to install the Vercel GitHub app
- Go to: https://github.com/apps/vercel
- Click "Install" and authorize it

**"Deployments still aren't automatic"**
- Check Settings → Git → Production Branch (should be `main`)
- Check Settings → Git → Automatic deployments (should be enabled)
- Make sure you're pushing to the correct branch (`main`)

## Current Status

Based on your setup:
- ✅ Vercel project exists: `react-app`
- ✅ GitHub repo exists: `Fraqueso/revolt-receptionist-applicant`
- ❌ **Not connected** - You need to connect them in Vercel dashboard

Once connected, future pushes will automatically deploy! 🚀

