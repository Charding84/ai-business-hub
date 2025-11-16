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
                        primary: '#8b5cf6',
                        secondary: '#ec4899',
                        dark: '#0f172a',
                        darker: '#020617'
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        .gradient-text {
            background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.3);
        }
        
        .glow {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
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
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
            border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .platform-card {
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .category-badge {
            background: rgba(139, 92, 246, 0.2);
            color: #a78bfa;
        }
        
        .api-badge {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
        }
        
        .price-badge {
            background: rgba(236, 72, 153, 0.2);
            color: #f472b6;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
            width: 8px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
        }
    </style>
</head>
<body class="bg-darker text-gray-100 min-h-screen">
    <!-- Header -->
    <header class="bg-dark border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-lg">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center glow">
                        <i class="fas fa-robot text-2xl text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold gradient-text">AI Command Center</h1>
                        <p class="text-sm text-gray-400">Unified Platform Control</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div id="statsPreview" class="hidden md:flex items-center space-x-6 text-sm">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-server text-purple-400"></i>
                            <span class="text-gray-400">Platforms: <span id="totalPlatforms" class="text-white font-semibold">0</span></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-brain text-pink-400"></i>
                            <span class="text-gray-400">Models: <span id="totalModels" class="text-white font-semibold">0</span></span>
                        </div>
                    </div>
                    
                    <button id="refreshBtn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <!-- Search Bar -->
        <div class="mb-8">
            <div class="relative max-w-2xl mx-auto">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Search platforms, models, capabilities..." 
                    class="w-full px-6 py-4 bg-dark border border-purple-500/30 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 transition-all"
                />
                <i class="fas fa-search absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
        </div>

        <!-- Stats Dashboard -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stats will be loaded here -->
        </div>

        <!-- Filter Tabs -->
        <div class="mb-8">
            <div class="flex flex-wrap gap-2" id="filterTabs">
                <button class="filter-tab active px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold transition-all" data-category="all">
                    <i class="fas fa-th mr-2"></i>All Platforms
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
    <div id="platformModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
        <div class="bg-dark border border-purple-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div class="p-6 border-b border-purple-500/20">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 id="modalTitle" class="text-2xl font-bold gradient-text mb-2"></h2>
                        <div id="modalBadges" class="flex flex-wrap gap-2"></div>
                    </div>
                    <button id="closeModal" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            <div id="modalContent" class="p-6 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-custom"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
