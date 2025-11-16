import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import platformsDataRaw from '../platforms_data.json?raw'
import platformsUrlsRaw from '../platforms_urls.json?raw'
import platformCapabilitiesRaw from '../platform_capabilities.json?raw'

const platformsData = JSON.parse(platformsDataRaw)
const platformsUrls = JSON.parse(platformsUrlsRaw)
const platformCapabilities = JSON.parse(platformCapabilitiesRaw)

// Add URLs and capabilities to platform data
const enrichedPlatforms = platformsData.map(p => {
  const urlData = platformsUrls[p.id.toString()]
  const capData = platformCapabilities[p.id.toString()]
  return {
    ...p,
    url: urlData?.url || null,
    loginUrl: urlData?.loginUrl || null,
    description: urlData?.description || p.name,
    bestFor: capData?.bestFor || [],
    useCases: capData?.useCases || [],
    strengths: capData?.strengths || [],
    keywords: capData?.keywords || []
  }
})

const app = new Hono()

// Enable CORS for all routes
app.use('*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.get('/api/platforms', (c) => {
  return c.json({
    success: true,
    total: enrichedPlatforms.length,
    platforms: enrichedPlatforms
  })
})

app.get('/api/platforms/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const platform = enrichedPlatforms.find(p => p.id === id)
  
  if (!platform) {
    return c.json({ success: false, error: 'Platform not found' }, 404)
  }
  
  return c.json({ success: true, platform })
})

app.get('/api/categories', (c) => {
  const categories = [...new Set(enrichedPlatforms.map(p => p.category))]
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: enrichedPlatforms.filter(p => p.category === cat).length,
    platforms: enrichedPlatforms.filter(p => p.category === cat).map(p => ({
      id: p.id,
      name: p.name,
      pricing: p.pricing,
      url: p.url
    }))
  }))
  
  return c.json({
    success: true,
    categories: categoryCounts
  })
})

app.get('/api/search', (c) => {
  const query = c.req.query('q')?.toLowerCase() || ''
  
  if (!query) {
    return c.json({ success: false, error: 'Query parameter required' }, 400)
  }
  
  const results = enrichedPlatforms.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    p.models.some(m => m.toLowerCase().includes(query)) ||
    p.details.some(d => d.toLowerCase().includes(query))
  )
  
  return c.json({
    success: true,
    query,
    total: results.length,
    results
  })
})

app.get('/api/stats', (c) => {
  const totalPlatforms = enrichedPlatforms.length
  const paidPlatforms = enrichedPlatforms.filter(p => p.pricing).length
  const freePlatforms = enrichedPlatforms.filter(p => !p.pricing).length
  const withApiAccess = enrichedPlatforms.filter(p => p.api_access).length
  const totalModels = enrichedPlatforms.reduce((acc, p) => acc + p.models.length, 0)
  
  // Calculate total monthly cost
  const totalMonthlyCost = enrichedPlatforms
    .filter(p => p.pricing)
    .reduce((sum, p) => {
      const price = parseFloat(p.pricing.replace(/[^0-9.]/g, ''))
      return sum + (isNaN(price) ? 0 : price)
    }, 0)
  
  const categories = [...new Set(enrichedPlatforms.map(p => p.category))].map(cat => ({
    name: cat,
    count: enrichedPlatforms.filter(p => p.category === cat).length
  }))
  
  return c.json({
    success: true,
    stats: {
      totalPlatforms,
      paidPlatforms,
      freePlatforms,
      withApiAccess,
      totalModels,
      totalMonthlyCost,
      categories
    }
  })
})

// Smart recommendation API
app.get('/api/recommend', (c) => {
  const query = c.req.query('task')?.toLowerCase() || ''
  
  if (!query) {
    return c.json({ success: false, error: 'Task parameter required' }, 400)
  }
  
  // Search through capabilities
  const recommendations = enrichedPlatforms
    .map(platform => {
      let score = 0
      const matches = []
      
      // Check keywords
      platform.keywords?.forEach(keyword => {
        if (query.includes(keyword)) {
          score += 3
          matches.push(`Keyword: ${keyword}`)
        }
      })
      
      // Check bestFor
      platform.bestFor?.forEach(skill => {
        if (query.includes(skill.toLowerCase())) {
          score += 5
          matches.push(`Best for: ${skill}`)
        }
      })
      
      // Check useCases
      platform.useCases?.forEach(useCase => {
        if (query.includes(useCase.toLowerCase())) {
          score += 4
          matches.push(`Use case: ${useCase}`)
        }
      })
      
      return { platform, score, matches }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  
  return c.json({
    success: true,
    task: query,
    recommendations: recommendations.map(r => ({
      platform: r.platform,
      relevanceScore: r.score,
      matchReasons: r.matches
    }))
  })
})

// Main HTML page
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Command Center | Unified Platform Control</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#14b8a6',
                        secondary: '#06b6d4',
                        dark: '#0a0a0a',
                        darker: '#000000',
                        neonTeal: '#00ffd5',
                        neonCyan: '#00e5ff'
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.5px; }
        
        .gradient-text {
            background: linear-gradient(135deg, #00ffd5 0%, #00e5ff 50%, #14b8a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px rgba(0, 255, 213, 0.3);
        }
        
        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(20, 184, 166, 0.2);
        }
        
        .card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(0, 255, 213, 0.4), 
                        0 0 30px rgba(0, 255, 213, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border-color: rgba(0, 255, 213, 0.6);
        }
        
        .glow {
            box-shadow: 0 0 30px rgba(0, 255, 213, 0.6), 
                        0 0 60px rgba(0, 255, 213, 0.4),
                        inset 0 0 20px rgba(0, 255, 213, 0.2);
            border: 2px solid rgba(0, 255, 213, 0.5);
        }
        
        .glow-text {
            text-shadow: 0 0 20px rgba(0, 255, 213, 0.8),
                         0 0 40px rgba(0, 255, 213, 0.4),
                         0 0 60px rgba(0, 255, 213, 0.2);
        }
        
        .neon-border {
            border: 2px solid rgba(0, 255, 213, 0.3);
            box-shadow: 0 0 10px rgba(0, 255, 213, 0.2),
                        inset 0 0 10px rgba(0, 255, 213, 0.1);
        }
        
        .neon-border:hover {
            border-color: rgba(0, 255, 213, 0.8);
            box-shadow: 0 0 20px rgba(0, 255, 213, 0.5),
                        inset 0 0 20px rgba(0, 255, 213, 0.2);
        }
        
        .loading {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .stat-card {
            background: linear-gradient(135deg, rgba(0, 255, 213, 0.08) 0%, rgba(0, 229, 255, 0.08) 100%);
            border: 1px solid rgba(0, 255, 213, 0.3);
            box-shadow: 0 0 20px rgba(0, 255, 213, 0.1);
        }
        
        .platform-card {
            background: rgba(10, 10, 10, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 255, 213, 0.2);
        }
        
        .category-badge {
            background: rgba(0, 255, 213, 0.15);
            color: #00ffd5;
            border: 1px solid rgba(0, 255, 213, 0.3);
        }
        
        .api-badge {
            background: rgba(0, 229, 255, 0.15);
            color: #00e5ff;
            border: 1px solid rgba(0, 229, 255, 0.3);
        }
        
        .price-badge {
            background: rgba(20, 184, 166, 0.15);
            color: #14b8a6;
            border: 1px solid rgba(20, 184, 166, 0.3);
        }
        
        .scrollbar-custom::-webkit-scrollbar {
            width: 10px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(0, 255, 213, 0.05);
            border-radius: 5px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #00ffd5 0%, #00e5ff 100%);
            border-radius: 5px;
            border: 2px solid #000;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #00e5ff 0%, #14b8a6 100%);
            box-shadow: 0 0 10px rgba(0, 255, 213, 0.5);
        }
        
        .modal-overlay {
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
        }
        
        .pulse-glow {
            animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
            0%, 100% {
                box-shadow: 0 0 20px rgba(0, 255, 213, 0.4),
                            0 0 40px rgba(0, 255, 213, 0.2);
            }
            50% {
                box-shadow: 0 0 30px rgba(0, 255, 213, 0.6),
                            0 0 60px rgba(0, 255, 213, 0.4);
            }
        }
        
        .nike-button {
            background: linear-gradient(135deg, #00ffd5 0%, #00e5ff 100%);
            color: #000;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 0 20px rgba(0, 255, 213, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nike-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(0, 255, 213, 0.7),
                        0 10px 20px rgba(0, 0, 0, 0.5);
        }
    </style>
</head>
<body class="bg-black text-white min-h-screen" style="background: linear-gradient(to bottom, #000000 0%, #0a0a0a 100%);">
    <!-- Header -->
    <header class="bg-black border-b border-[#00ffd5]/30 sticky top-0 z-50 backdrop-blur-lg neon-border">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-14 h-14 bg-gradient-to-br from-[#00ffd5] to-[#00e5ff] rounded-2xl flex items-center justify-center glow pulse-glow">
                        <i class="fas fa-robot text-3xl text-black"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold gradient-text glow-text tracking-wide">AI COMMAND CENTER</h1>
                        <p class="text-sm text-[#00ffd5]/70 font-semibold tracking-wider">UNIFIED PLATFORM CONTROL</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div id="statsPreview" class="hidden md:flex items-center space-x-8 text-sm">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-server text-[#00ffd5] text-lg"></i>
                            <span class="text-gray-500">PLATFORMS: <span id="totalPlatforms" class="text-[#00ffd5] font-bold">0</span></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-brain text-[#00e5ff] text-lg"></i>
                            <span class="text-gray-500">MODELS: <span id="totalModels" class="text-[#00e5ff] font-bold">0</span></span>
                        </div>
                    </div>
                    
                    <button id="refreshBtn" class="nike-button px-6 py-2 rounded-lg transition-all">
                        <i class="fas fa-sync-alt mr-2"></i>REFRESH
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <!-- Search Bar -->
        <div class="mb-8">
            <div class="relative max-w-3xl mx-auto">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="SEARCH PLATFORMS, MODELS, CAPABILITIES..." 
                    class="w-full px-6 py-5 bg-black/80 border-2 border-[#00ffd5]/30 rounded-2xl focus:outline-none focus:border-[#00ffd5] focus:ring-4 focus:ring-[#00ffd5]/20 text-white placeholder-gray-600 transition-all font-semibold neon-border"
                />
                <i class="fas fa-search absolute right-6 top-1/2 transform -translate-y-1/2 text-[#00ffd5] text-xl"></i>
            </div>
        </div>

        <!-- Stats Dashboard -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stats will be loaded here -->
        </div>

        <!-- Filter Tabs -->
        <div class="mb-8">
            <div class="flex flex-wrap gap-3" id="filterTabs">
                <button class="filter-tab active nike-button px-8 py-3 rounded-xl font-bold transition-all tracking-wide" data-category="all">
                    <i class="fas fa-th mr-2"></i>ALL PLATFORMS
                </button>
            </div>
        </div>

        <!-- Platforms Grid -->
        <div id="platformsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Platforms will be loaded here -->
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="text-center py-20">
            <div class="inline-block">
                <i class="fas fa-robot text-6xl text-purple-500 loading"></i>
                <p class="mt-4 text-gray-400">Loading AI Platforms...</p>
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden text-center py-20">
            <i class="fas fa-search text-6xl text-gray-700 mb-4"></i>
            <p class="text-gray-400 text-lg">No platforms found matching your search.</p>
        </div>
    </main>

    <!-- Platform Detail Modal -->
    <div id="platformModal" class="modal-overlay fixed inset-0 hidden items-center justify-center z-50 p-4">
        <div class="bg-black border-2 border-[#00ffd5]/50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden glow">
            <div class="p-6 border-b-2 border-[#00ffd5]/30">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 id="modalTitle" class="text-3xl font-bold gradient-text glow-text mb-2"></h2>
                        <div id="modalBadges" class="flex flex-wrap gap-2"></div>
                    </div>
                    <button id="closeModal" class="text-[#00ffd5] hover:text-white transition-colors">
                        <i class="fas fa-times text-3xl"></i>
                    </button>
                </div>
            </div>
            <div id="modalContent" class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-custom bg-black/50"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
