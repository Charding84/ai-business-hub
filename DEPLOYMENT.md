# Deployment Guide - AI Command Center

## 🚀 Quick Deployment to Cloudflare Pages

### Prerequisites
- Cloudflare account
- Cloudflare API key (get from Deploy tab)
- GitHub account (optional, for version control)

---

## Option 1: Direct Cloudflare Pages Deployment

### Step 1: Setup Cloudflare Authentication
```bash
# This configures your Cloudflare API token
# Run this in the AI Developer sandbox
```

The system will call `setup_cloudflare_api_key` to configure authentication.

### Step 2: Create Cloudflare Pages Project
```bash
cd /home/user/webapp

# Create the project (uses 'main' branch as production)
npx wrangler pages project create ai-command-center \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### Step 3: Deploy
```bash
# Build and deploy
npm run deploy:prod

# You'll receive:
# Production URL: https://ai-command-center.pages.dev
# Branch URL: https://main.ai-command-center.pages.dev
```

### Step 4: Verify Deployment
```bash
# Test production endpoint
curl https://ai-command-center.pages.dev/api/stats

# Should return:
# {"success":true,"stats":{...}}
```

---

## Option 2: Deploy via GitHub + Cloudflare Pages

### Step 1: Setup GitHub Environment
```bash
# This configures git and GitHub CLI authentication
# Run this in the AI Developer sandbox
```

The system will call `setup_github_environment` to configure authentication.

### Step 2: Push to GitHub
```bash
cd /home/user/webapp

# Create GitHub repository (if needed)
gh repo create ai-command-center --public --source=. --remote=origin

# Or connect to existing repo
git remote add origin https://github.com/YOUR_USERNAME/ai-command-center.git

# Push code
git push -u origin main
```

### Step 3: Connect Cloudflare Pages to GitHub

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages** → **Create Application** → **Pages**
3. Connect to GitHub repository `ai-command-center`
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Click **Save and Deploy**

### Step 4: Wait for Deployment
Cloudflare will automatically:
- Install dependencies
- Build the project
- Deploy to edge network
- Provide production URL

---

## 🔧 Configuration

### wrangler.jsonc
Already configured with optimal settings:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ai-command-center",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist"
}
```

### Environment Variables
No environment variables required - all data is static.

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Cloudflare Pages
```bash
# Add your domain
npx wrangler pages domain add yourdomain.com --project-name ai-command-center

# Cloudflare will provide DNS records to configure
```

Or via Dashboard:
1. Go to your Pages project
2. **Custom domains** tab
3. Click **Set up a custom domain**
4. Follow DNS configuration instructions

---

## 📊 Deployment Verification Checklist

After deployment, verify:

- [ ] Main page loads: `https://ai-command-center.pages.dev`
- [ ] API endpoints work:
  - [ ] `/api/platforms` - Returns 13 platforms
  - [ ] `/api/stats` - Returns statistics
  - [ ] `/api/categories` - Returns 5 categories
  - [ ] `/api/search?q=gpt` - Returns search results
- [ ] Static assets load: `/static/app.js`
- [ ] Search functionality works
- [ ] Category filters work
- [ ] Platform detail modals open
- [ ] Responsive design works on mobile

---

## 🔄 Continuous Deployment

With GitHub integration:
1. Make changes locally
2. Commit: `git commit -am "Update features"`
3. Push: `git push origin main`
4. Cloudflare automatically rebuilds and deploys

---

## 🛠️ Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build

# If successful, deployment should work
```

### API Returns 404
- Verify `platforms_data.json` exists in project root
- Check build output includes JSON file
- Ensure Hono routes are correct

### Static Files Not Loading
- Verify files are in `public/static/` directory
- Check `serveStatic` configuration in `src/index.tsx`
- Ensure build output includes public files

### Wrangler Commands Fail
```bash
# Verify authentication
npx wrangler whoami

# If not authenticated, run setup again
# setup_cloudflare_api_key
```

---

## 📈 Performance Optimization

### Already Implemented
- ✅ Vite build optimization
- ✅ Cloudflare Workers edge deployment
- ✅ Static asset caching
- ✅ Minimal bundle size (~90KB)
- ✅ CDN delivery for JS libraries

### Future Optimizations
- Implement service worker for offline access
- Add image optimization
- Enable HTTP/3
- Configure caching headers

---

## 🔐 Security Considerations

### Current Setup
- No authentication required (public dashboard)
- No user data stored
- No external API calls
- CORS enabled for all origins

### If Adding User Features
- Use Cloudflare KV for session storage
- Implement JWT authentication
- Add rate limiting
- Restrict CORS to specific domains

---

## 💰 Cost Estimate

### Cloudflare Pages Free Tier
- ✅ 500 builds/month
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 100 custom domains

**Current app**: Well within free tier limits

### Paid Tier ($20/month)
- Advanced features
- More builds
- Analytics
- Preview environments

**Not needed** for this application.

---

## 📞 Support Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Hono Documentation**: https://hono.dev
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** - Verify all features work in production
2. **Share URL** - Give access to team members
3. **Monitor usage** - Check Cloudflare analytics
4. **Plan Phase 2** - Implement favorites, cost calculator, etc.
5. **Gather feedback** - Get user input for improvements

---

**Deployment Status**: Ready to deploy ✅

**Estimated deployment time**: 2-5 minutes

**Last updated**: November 16, 2025
