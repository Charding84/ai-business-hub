# AI Command Center

**Unified Platform Control for All Your AI Subscriptions**

A powerful, centralized dashboard to manage and access all your AI platforms from one place. Built with Hono and deployed on Cloudflare Pages.

---

## 🌐 Live URLs

- **Sandbox Preview**: https://3000-ioz1tbzpww2oi2oeleilw-c81df28e.sandbox.novita.ai
- **Production** (after deployment): `https://ai-command-center.pages.dev`

---

## ✨ Currently Completed Features

### 🎯 Core Functionality
- ✅ **13 AI Platforms Integrated** - Complete access list from November 15, 2025
- ✅ **80+ AI Models** - Comprehensive model database across all platforms
- ✅ **Real-time Search** - Instant search across platforms, models, and capabilities
- ✅ **Category Filtering** - Filter by LLM/Chat, Design, Productivity, and more
- ✅ **Detailed Platform View** - Modal with full specifications and features

### 💎 UI/UX Features
- ✅ Modern dark theme with purple/pink gradient accents
- ✅ Responsive grid layout (mobile, tablet, desktop)
- ✅ Smooth animations and hover effects
- ✅ Custom scrollbars and loading states
- ✅ Statistics dashboard with key metrics
- ✅ Badge system for pricing, API access, categories

### 🔧 Technical Features
- ✅ RESTful API backend with Hono
- ✅ Static file serving from Cloudflare Workers
- ✅ JSON data management with structured platform info
- ✅ CORS enabled for cross-origin requests
- ✅ PM2 process management for development

---

## 📊 Functional Entry URIs

### API Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/platforms` | GET | Get all platforms | - |
| `/api/platforms/:id` | GET | Get specific platform | `id` (integer) |
| `/api/categories` | GET | Get all categories with counts | - |
| `/api/search` | GET | Search platforms | `q` (string, min 2 chars) |
| `/api/stats` | GET | Get platform statistics | - |
| `/` | GET | Main dashboard UI | - |

### Example API Responses

**GET /api/stats**
```json
{
  "success": true,
  "stats": {
    "totalPlatforms": 13,
    "paidPlatforms": 6,
    "freePlatforms": 7,
    "withApiAccess": 10,
    "totalModels": 80,
    "categories": [...]
  }
}
```

**GET /api/search?q=gpt**
```json
{
  "success": true,
  "query": "gpt",
  "total": 3,
  "results": [...]
}
```

---

## 🚀 Features Not Yet Implemented

### Phase 2 - Enhanced Functionality
- ⏳ **Favorites System** - Save favorite platforms locally
- ⏳ **Platform Launch Links** - Direct links to each platform's dashboard
- ⏳ **Usage Tracking** - Track which platforms you use most
- ⏳ **Cost Calculator** - Calculate total monthly subscription costs
- ⏳ **Comparison Tool** - Side-by-side platform comparison

### Phase 3 - Advanced Features
- ⏳ **API Key Management** - Store and manage API keys securely (using Cloudflare KV)
- ⏳ **Usage Analytics** - Track API usage across platforms
- ⏳ **Quick Actions** - One-click access to common tasks
- ⏳ **Custom Notes** - Add personal notes to each platform
- ⏳ **Notification System** - Alerts for platform updates

### Phase 4 - Integrations
- ⏳ **OAuth Integration** - Single sign-on for supported platforms
- ⏳ **Unified Chat Interface** - Chat with multiple AI models from one interface
- ⏳ **Browser Extension** - Quick access from any webpage
- ⏳ **Mobile App** - Native iOS/Android apps

---

## 🎯 Recommended Next Steps

1. **Deploy to Cloudflare Pages** 
   - Set up Cloudflare API key
   - Deploy to production environment
   - Get permanent public URL

2. **Add Favorites System**
   - Implement localStorage for browser-side persistence
   - Add "favorite" toggle to each platform card
   - Create dedicated favorites view

3. **Integrate Direct Launch Links**
   - Add actual platform URLs to data
   - Implement "Launch Platform" button functionality
   - Add SSO where available

4. **Implement Cost Calculator**
   - Sum up all paid subscriptions
   - Show total monthly/annual costs
   - Highlight cost savings opportunities

5. **Add Usage Analytics**
   - Track platform clicks and views
   - Show most-used platforms
   - Suggest underutilized subscriptions

---

## 📁 Data Architecture

### Platform Data Model
```typescript
{
  id: number,
  name: string,
  full_name: string,
  pricing: string | null,
  category: string,
  capabilities: string[],
  models: string[],
  api_access: boolean,
  details: string[]
}
```

### Categories
- **LLM / Chat AI** (3 platforms) - GPT, Claude, Perplexity
- **Design / Creative** (3 platforms) - Adobe, Canva, Affinity
- **Productivity / Cloud** (2 platforms) - Microsoft 365, Google One
- **AI Aggregator** (2 platforms) - Magai, GenSpark
- **AI Platform** (3 platforms) - Pixel, Vector, Layout Studio

### Storage Services
- **Static JSON** - Platform data stored in `platforms_data.json`
- **No Database** - Current version uses static data
- **Future**: Cloudflare KV for user preferences, favorites, notes

---

## 🛠️ Tech Stack

- **Backend**: Hono (lightweight edge framework)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Deployment**: Cloudflare Pages/Workers
- **Build Tool**: Vite
- **Process Manager**: PM2 (development)
- **Icons**: Font Awesome 6
- **HTTP Client**: Axios

---

## 🚦 Deployment Status

### Current Status: ✅ Active (Development)

- **Environment**: Sandbox
- **URL**: https://3000-ioz1tbzpww2oi2oeleilw-c81df28e.sandbox.novita.ai
- **Server**: Running via PM2
- **Port**: 3000
- **Last Updated**: 2025-11-16

### Production Deployment Steps

```bash
# 1. Build the project
npm run build

# 2. Deploy to Cloudflare Pages
npm run deploy:prod

# 3. Get public URL
# Output: https://ai-command-center.pages.dev
```

---

## 💻 Development

### Local Setup
```bash
# Install dependencies
npm install

# Build for development
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Test
npm run test
```

### Available Scripts
- `npm run dev` - Vite dev server
- `npm run build` - Build for production
- `npm run deploy:prod` - Deploy to Cloudflare Pages
- `npm run clean-port` - Kill process on port 3000
- `npm run test` - Test local server

---

## 📊 Platform Summary

### By Pricing
- **Paid Platforms**: 6
- **Free Platforms**: 7
- **Total Value**: $600+/month

### By API Access
- **With API**: 10 platforms
- **Without API**: 3 platforms

### Top Platforms
1. **GPT-5.1 Pro** - $200/month - Most advanced OpenAI reasoning
2. **Claude Pro** - $20/month - 200K context, state-of-the-art coding
3. **Perplexity Pro** - $20/month - 600+ searches/day, real-time research
4. **Adobe Firefly Pro** - $19.99/month - Unlimited generations (promo)
5. **Magai Pro** - $19/month - 50+ models with context-switching
6. **GenSpark Plus** - FREE - Unlimited multi-model access

---

## 🎨 Design Features

- **Color Scheme**: Dark theme with purple (#8b5cf6) and pink (#ec4899) gradients
- **Typography**: Inter font family
- **Components**: Cards, badges, modals, tabs, stats dashboard
- **Animations**: Hover effects, smooth transitions, loading states
- **Responsive**: Mobile-first design, 3 breakpoints (sm, md, lg)

---

## 📝 User Guide

### How to Use

1. **Browse Platforms** - View all 13 AI platforms in card layout
2. **Search** - Type in search bar to find specific platforms, models, or features
3. **Filter by Category** - Click category tabs to filter platforms
4. **View Details** - Click any platform card to see full specifications
5. **Quick Stats** - Check dashboard for total platforms, models, and pricing

### Tips
- Use search for quick access to specific models (e.g., "GPT-5.1", "Claude")
- Filter by category to focus on specific use cases
- Click platform cards for detailed feature lists
- Check API badge to see which platforms offer programmatic access

---

## 🔐 Security & Privacy

- No user data collected
- No authentication required (public dashboard)
- No external API calls (all data static)
- No cookies or tracking
- Platform data refreshed manually

---

## 📞 Support

For issues or feature requests:
- Check API endpoints with `/api/stats`
- Verify PM2 status: `pm2 list`
- Check logs: `pm2 logs ai-command-center --nostream`
- Restart: `pm2 restart ai-command-center`

---

## 📄 License

Private project for personal use.

---

**Built with ❤️ using Hono + Cloudflare Pages**

*Last updated: November 16, 2025*
