// Global state
let allPlatforms = [];
let currentFilter = 'all';
let searchQuery = '';
let favorites = [];
let recentActivity = [];
let quickLaunchPlatforms = [];
let products = [];
let bundles = [];
let captures = []; // NEW: Capture Library
let currentView = 'platforms'; // 'platforms', 'products', or 'captures'
let selectedProducts = []; // For bulk operations
let captureSearch = ''; // For capture search

// Load favorites from localStorage
function loadFavorites() {
    const saved = localStorage.getItem('ai_command_center_favorites');
    favorites = saved ? JSON.parse(saved) : [];
}

// Save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('ai_command_center_favorites', JSON.stringify(favorites));
}

// Load recent activity
function loadRecentActivity() {
    const saved = localStorage.getItem('ai_command_center_recent');
    recentActivity = saved ? JSON.parse(saved) : [];
}

// Save recent activity
function saveRecentActivity() {
    localStorage.setItem('ai_command_center_recent', JSON.stringify(recentActivity));
}

// Track platform launch
function trackPlatformLaunch(platformId) {
    const platform = allPlatforms.find(p => p.id === platformId);
    if (!platform) return;
    
    // Add to recent activity
    const activity = {
        platformId,
        platformName: platform.name,
        url: platform.url,
        timestamp: Date.now()
    };
    
    // Remove if already exists
    recentActivity = recentActivity.filter(a => a.platformId !== platformId);
    // Add to beginning
    recentActivity.unshift(activity);
    // Keep only last 10
    recentActivity = recentActivity.slice(0, 10);
    
    saveRecentActivity();
    updateQuickLaunchBar();
}

// Load quick launch platforms
function loadQuickLaunch() {
    const saved = localStorage.getItem('ai_command_center_quicklaunch');
    if (saved) {
        quickLaunchPlatforms = JSON.parse(saved);
    } else {
        // Default: Most common platforms
        quickLaunchPlatforms = [1, 2, 3, 4, 9, 6]; // GPT, Claude, Perplexity, Adobe, Canva, GenSpark
    }
}

// Save quick launch
function saveQuickLaunch() {
    localStorage.setItem('ai_command_center_quicklaunch', JSON.stringify(quickLaunchPlatforms));
}

// ==================== PRODUCT PIPELINE ====================

// Load products from localStorage
function loadProducts() {
    const saved = localStorage.getItem('ai_business_hub_products');
    products = saved ? JSON.parse(saved) : [];
}

// Save products to localStorage
function saveProducts() {
    localStorage.setItem('ai_business_hub_products', JSON.stringify(products));
}

// Add new product
function addProduct(productData) {
    const product = {
        id: Date.now(),
        name: productData.name,
        type: productData.type, // 'prompt', 'image', 'video', 'tool', 'template', 'course'
        status: productData.status || 'idea', // 'idea', 'in_progress', 'ready', 'listed'
        description: productData.description || '',
        aiTool: productData.aiTool || '', // Which AI was used
        aiToolId: productData.aiToolId || null,
        notes: productData.notes || '',
        price: productData.price || '',
        tags: productData.tags || [],
        files: productData.files || [],
        url: productData.url || '', // If listed, where?
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    products.push(product);
    saveProducts();
    return product;
}

// Update product
function updateProduct(productId, updates) {
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products[index] = {
            ...products[index],
            ...updates,
            updatedAt: Date.now()
        };
        saveProducts();
        return products[index];
    }
    return null;
}

// Delete product
function deleteProduct(productId) {
    products = products.filter(p => p.id !== productId);
    saveProducts();
}

// Get products by status
function getProductsByStatus(status) {
    return products.filter(p => p.status === status);
}

// Get products by type
function getProductsByType(type) {
    return products.filter(p => p.type === type);
}

// ==================== BUNDLES ====================

// Load bundles from localStorage
function loadBundles() {
    const saved = localStorage.getItem('ai_business_hub_bundles');
    bundles = saved ? JSON.parse(saved) : [];
}

// Save bundles to localStorage
function saveBundles() {
    localStorage.setItem('ai_business_hub_bundles', JSON.stringify(bundles));
}

// Create bundle
function createBundle(bundleData) {
    const bundle = {
        id: Date.now(),
        name: bundleData.name,
        type: bundleData.type,
        productIds: bundleData.productIds || [],
        description: bundleData.description || '',
        price: bundleData.price || '',
        individualPrice: bundleData.individualPrice || '',
        discount: bundleData.discount || '',
        status: bundleData.status || 'idea',
        url: bundleData.url || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    bundles.push(bundle);
    saveBundles();
    return bundle;
}

// Update bundle
function updateBundle(bundleId, updates) {
    const index = bundles.findIndex(b => b.id === bundleId);
    if (index !== -1) {
        bundles[index] = {
            ...bundles[index],
            ...updates,
            updatedAt: Date.now()
        };
        saveBundles();
        return bundles[index];
    }
    return null;
}

// Delete bundle
function deleteBundle(bundleId) {
    bundles = bundles.filter(b => b.id !== bundleId);
    saveBundles();
}

// Get bundle products
function getBundleProducts(bundleId) {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return [];
    return products.filter(p => bundle.productIds.includes(p.id));
}

// ==================== CAPTURE LIBRARY ====================

// Load captures from localStorage
function loadCaptures() {
    const saved = localStorage.getItem('ai_business_hub_captures');
    captures = saved ? JSON.parse(saved) : [];
}

// Save captures to localStorage
function saveCaptures() {
    localStorage.setItem('ai_business_hub_captures', JSON.stringify(captures));
}

// Add new capture
function addCapture(captureData) {
    const capture = {
        id: Date.now(),
        type: captureData.type, // 'text', 'image', 'video', 'link', 'code', 'conversation'
        title: captureData.title || 'Untitled Capture',
        content: captureData.content || '',
        platform: captureData.platform || 'Unknown', // Which AI platform
        platformId: captureData.platformId || null,
        url: captureData.url || '', // Original URL if applicable
        tags: captureData.tags || [],
        notes: captureData.notes || '',
        favorite: false,
        useCount: 0,
        usedIn: [], // Array of product IDs this was used in
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    captures.unshift(capture); // Add to beginning
    saveCaptures();
    return capture;
}

// Update capture
function updateCapture(captureId, updates) {
    const index = captures.findIndex(c => c.id === captureId);
    if (index !== -1) {
        captures[index] = {
            ...captures[index],
            ...updates,
            updatedAt: Date.now()
        };
        saveCaptures();
        return captures[index];
    }
    return null;
}

// Delete capture
function deleteCapture(captureId) {
    captures = captures.filter(c => c.id !== captureId);
    saveCaptures();
}

// Toggle capture favorite
function toggleCaptureFavorite(captureId) {
    const capture = captures.find(c => c.id === captureId);
    if (capture) {
        capture.favorite = !capture.favorite;
        capture.updatedAt = Date.now();
        saveCaptures();
    }
}

// Increment use count
function incrementCaptureUse(captureId, productId = null) {
    const capture = captures.find(c => c.id === captureId);
    if (capture) {
        capture.useCount++;
        if (productId && !capture.usedIn.includes(productId)) {
            capture.usedIn.push(productId);
        }
        capture.updatedAt = Date.now();
        saveCaptures();
    }
}

// Search captures
function searchCaptures(query) {
    if (!query) return captures;
    const lowerQuery = query.toLowerCase();
    return captures.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) ||
        c.content.toLowerCase().includes(lowerQuery) ||
        c.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        c.platform.toLowerCase().includes(lowerQuery)
    );
}

// Get captures by type
function getCapturesByType(type) {
    return captures.filter(c => c.type === type);
}

// Get favorite captures
function getFavoriteCaptures() {
    return captures.filter(c => c.favorite);
}

// Get captures by platform
function getCapturesByPlatform(platformId) {
    return captures.filter(c => c.platformId === platformId);
}

// ==================== WORKFLOW TEMPLATES ====================

const workflowTemplates = {
    'prompt-pack': {
        name: 'AI Prompt Pack',
        emoji: '💬',
        description: 'Create a collection of AI prompts',
        defaultType: 'prompt',
        suggestedAIs: [1, 2, 3], // GPT, Claude, Gemini
        fields: {
            count: { label: 'Number of Prompts', default: 10 },
            category: { label: 'Category', default: 'Social Media' },
            platform: { label: 'Platform', default: 'Instagram' }
        },
        pricing: {
            min: 4.99,
            max: 19.99,
            recommended: 9.99
        }
    },
    'social-media-set': {
        name: 'Social Media Content Set',
        emoji: '📱',
        description: 'Create graphics + captions bundle',
        defaultType: 'image',
        suggestedAIs: [9, 4, 1], // Canva, Adobe, GPT
        fields: {
            count: { label: 'Number of Posts', default: 30 },
            platform: { label: 'Platform', default: 'Instagram' },
            style: { label: 'Style', default: 'Modern' }
        },
        pricing: {
            min: 14.99,
            max: 49.99,
            recommended: 24.99
        }
    },
    'video-bundle': {
        name: 'Video Content Bundle',
        emoji: '🎥',
        description: 'Create video templates or clips',
        defaultType: 'video',
        suggestedAIs: [4, 9], // Adobe, Canva
        fields: {
            count: { label: 'Number of Videos', default: 5 },
            duration: { label: 'Duration', default: '15-30 sec' },
            platform: { label: 'Platform', default: 'TikTok/Reels' }
        },
        pricing: {
            min: 19.99,
            max: 79.99,
            recommended: 39.99
        }
    },
    'template-collection': {
        name: 'Template Collection',
        emoji: '📄',
        description: 'Create design or document templates',
        defaultType: 'template',
        suggestedAIs: [9, 4], // Canva, Adobe
        fields: {
            count: { label: 'Number of Templates', default: 20 },
            category: { label: 'Category', default: 'Business' },
            format: { label: 'Format', default: 'Canva' }
        },
        pricing: {
            min: 9.99,
            max: 39.99,
            recommended: 19.99
        }
    },
    'tool-kit': {
        name: 'Digital Tool Kit',
        emoji: '🔧',
        description: 'Create tools, scripts, or utilities',
        defaultType: 'tool',
        suggestedAIs: [5, 1, 2], // Cursor, GPT, Claude
        fields: {
            count: { label: 'Number of Tools', default: 5 },
            language: { label: 'Language', default: 'JavaScript' },
            purpose: { label: 'Purpose', default: 'Automation' }
        },
        pricing: {
            min: 14.99,
            max: 99.99,
            recommended: 49.99
        }
    },
    'mini-course': {
        name: 'Mini Course',
        emoji: '🎓',
        description: 'Create educational content',
        defaultType: 'course',
        suggestedAIs: [1, 2, 4], // GPT, Claude, Adobe
        fields: {
            modules: { label: 'Number of Modules', default: 5 },
            duration: { label: 'Total Duration', default: '2 hours' },
            topic: { label: 'Topic', default: 'AI Skills' }
        },
        pricing: {
            min: 29.99,
            max: 199.99,
            recommended: 79.99
        }
    }
};

// Check if platform is favorite
function isFavorite(platformId) {
    return favorites.includes(platformId);
}

// Toggle favorite
function toggleFavorite(platformId) {
    if (isFavorite(platformId)) {
        favorites = favorites.filter(id => id !== platformId);
    } else {
        favorites.push(platformId);
    }
    saveFavorites();
    renderPlatforms(currentFilter === 'favorites' ? getFavorites() : filterPlatforms());
}

// Get favorite platforms
function getFavorites() {
    return allPlatforms.filter(p => isFavorite(p.id));
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    loadRecentActivity();
    loadQuickLaunch();
    loadProducts();
    loadBundles();
    loadCaptures();
    loadPlatforms();
    setupEventListeners();
    renderQuickLaunchBar();
    setupSmartAssistant();
    setupProductPipelineButton();
    setupCaptureLibraryButton();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('refreshBtn').addEventListener('click', loadPlatforms);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('platformModal').addEventListener('click', (e) => {
        if (e.target.id === 'platformModal') closeModal();
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load platforms from API
async function loadPlatforms() {
    try {
        showLoading();
        const [platformsRes, statsRes, categoriesRes] = await Promise.all([
            axios.get('/api/platforms'),
            axios.get('/api/stats'),
            axios.get('/api/categories')
        ]);

        allPlatforms = platformsRes.data.platforms;
        
        renderStats(statsRes.data.stats);
        renderFilterTabs(categoriesRes.data.categories);
        renderPlatforms(allPlatforms);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading platforms:', error);
        hideLoading();
        showError('Failed to load platforms. Please try again.');
    }
}

// Render statistics
function renderStats(stats) {
    document.getElementById('totalPlatforms').textContent = stats.totalPlatforms;
    document.getElementById('totalModels').textContent = stats.totalModels;
    
    const statsHTML = `
        <div class="stat-card rounded-xl p-6 card-hover cursor-pointer">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-server text-3xl text-[#00ffd5]"></i>
                <span class="text-3xl font-bold text-white">${stats.totalPlatforms}</span>
            </div>
            <p class="text-gray-400 text-sm font-semibold">Total Platforms</p>
        </div>
        
        <div class="stat-card rounded-xl p-6 card-hover cursor-pointer">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-brain text-3xl text-[#00e5ff]"></i>
                <span class="text-3xl font-bold text-white">${stats.totalModels}</span>
            </div>
            <p class="text-gray-400 text-sm font-semibold">AI Models</p>
        </div>
        
        <div class="stat-card rounded-xl p-6 card-hover cursor-pointer">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-dollar-sign text-3xl text-green-400"></i>
                <span class="text-3xl font-bold text-white">${stats.paidPlatforms}</span>
            </div>
            <p class="text-gray-400 text-sm font-semibold">Paid Plans</p>
        </div>
        
        <div class="stat-card rounded-xl p-6 card-hover cursor-pointer">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-gift text-3xl text-blue-400"></i>
                <span class="text-3xl font-bold text-white">${stats.freePlatforms}</span>
            </div>
            <p class="text-gray-400 text-sm font-semibold">Free Access</p>
        </div>
    `;
    
    document.getElementById('statsContainer').innerHTML = statsHTML;
}

// Render filter tabs
function renderFilterTabs(categories) {
    const allTabHTML = `
        <button class="filter-tab active px-6 py-3 rounded-xl bg-[#14b8a6] text-white font-semibold transition-all" data-category="all">
            <i class="fas fa-th mr-2"></i>All Platforms
        </button>
    `;
    
    const favoritesTabHTML = `
        <button class="filter-tab px-6 py-3 rounded-xl bg-dark border border-[#00ffd5]/30 text-gray-300 hover:bg-[#14b8a6]/20 hover:text-white font-semibold transition-all" data-category="favorites">
            <i class="fas fa-heart mr-2"></i>Favorites <span class="ml-2 text-xs opacity-75">(${favorites.length})</span>
        </button>
    `;
    
    const categoryTabsHTML = categories.map(cat => `
        <button class="filter-tab px-6 py-3 rounded-xl bg-dark border border-[#00ffd5]/30 text-gray-300 hover:bg-[#14b8a6]/20 hover:text-white font-semibold transition-all" data-category="${cat.name}">
            <i class="${getCategoryIcon(cat.name)} mr-2"></i>${cat.name} <span class="ml-2 text-xs opacity-75">(${cat.count})</span>
        </button>
    `).join('');
    
    document.getElementById('filterTabs').innerHTML = allTabHTML + favoritesTabHTML + categoryTabsHTML;
    
    // Add click listeners
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => {
                t.classList.remove('active', 'bg-[#14b8a6]', 'text-white');
                t.classList.add('bg-dark', 'border', 'border-[#00ffd5]/30', 'text-gray-300');
            });
            tab.classList.add('active', 'bg-[#14b8a6]', 'text-white');
            tab.classList.remove('bg-dark', 'border', 'border-[#00ffd5]/30', 'text-gray-300');
            
            currentFilter = tab.dataset.category;
            if (currentFilter === 'favorites') {
                renderPlatforms(getFavorites());
            } else {
                filterPlatforms();
            }
        });
    });
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'LLM / Chat AI': 'fas fa-comments',
        'Design / Creative': 'fas fa-palette',
        'Productivity / Cloud': 'fas fa-cloud',
        'AI Aggregator': 'fas fa-layer-group',
        'AI Platform': 'fas fa-microchip'
    };
    return icons[category] || 'fas fa-star';
}

// Handle search
async function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    
    if (searchQuery.length >= 2) {
        try {
            const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            renderPlatforms(response.data.results);
        } catch (error) {
            console.error('Search error:', error);
        }
    } else if (searchQuery.length === 0) {
        filterPlatforms();
    }
}

// Filter platforms
function filterPlatforms() {
    let filtered = allPlatforms;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    renderPlatforms(filtered);
}

// Render platforms
function renderPlatforms(platforms) {
    const container = document.getElementById('platformsContainer');
    
    if (platforms.length === 0) {
        container.innerHTML = '';
        document.getElementById('emptyState').classList.remove('hidden');
        return;
    }
    
    document.getElementById('emptyState').classList.add('hidden');
    
    const platformsHTML = platforms.map(platform => `
        <div class="platform-card rounded-xl p-6 card-hover relative">
            <button onclick="event.stopPropagation(); toggleFavorite(${platform.id})" class="absolute top-4 right-4 text-2xl transition-all hover:scale-110" title="${isFavorite(platform.id) ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fa${isFavorite(platform.id) ? 's' : 'r'} fa-heart text-${isFavorite(platform.id) ? 'pink' : 'gray'}-400"></i>
            </button>
            
            <div class="flex items-start justify-between mb-4 pr-10">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">${platform.name}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="badge category-badge">
                            <i class="${getCategoryIcon(platform.category)} mr-1"></i>
                            ${platform.category}
                        </span>
                        ${platform.pricing ? `<span class="badge price-badge">${platform.pricing}</span>` : '<span class="badge bg-gray-700 text-gray-300">FREE</span>'}
                        ${platform.api_access ? '<span class="badge api-badge"><i class="fas fa-code mr-1"></i>API</span>' : ''}
                    </div>
                </div>
            </div>
            
            ${platform.models.length > 0 ? `
                <div class="mb-4">
                    <p class="text-xs text-gray-500 uppercase font-semibold mb-2">
                        <i class="fas fa-brain mr-1"></i>Models (${platform.models.length})
                    </p>
                    <div class="space-y-1">
                        ${platform.models.slice(0, 3).map(model => `
                            <p class="text-sm text-gray-400 line-clamp-1">• ${model}</p>
                        `).join('')}
                        ${platform.models.length > 3 ? `<p class="text-xs text-[#00ffd5]">+${platform.models.length - 3} more</p>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="flex gap-2 pt-4 border-t border-[#00ffd5]/20">
                ${platform.url ? `
                    <button onclick="event.stopPropagation(); launchPlatform('${platform.url}', ${platform.id})" class="flex-1 px-4 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white text-sm font-semibold transition-all">
                        <i class="fas fa-rocket mr-2"></i>Launch
                    </button>
                ` : ''}
                <button onclick="showPlatformDetail(${platform.id})" class="flex-1 px-4 py-2 bg-dark border border-[#00ffd5]/30 hover:bg-[#14b8a6]/20 rounded-lg text-[#00ffd5] text-sm font-semibold transition-all">
                    <i class="fas fa-info-circle mr-2"></i>Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = platformsHTML;
}

// Launch platform
function launchPlatform(url, platformId) {
    if (platformId) {
        trackPlatformLaunch(platformId);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Show platform detail modal
function showPlatformDetail(platformId) {
    const platform = allPlatforms.find(p => p.id === platformId);
    if (!platform) return;
    
    document.getElementById('modalTitle').textContent = platform.name;
    
    const badges = `
        <span class="badge category-badge">
            <i class="${getCategoryIcon(platform.category)} mr-1"></i>
            ${platform.category}
        </span>
        ${platform.pricing ? `<span class="badge price-badge">${platform.pricing}</span>` : '<span class="badge bg-gray-700 text-gray-300">FREE</span>'}
        ${platform.api_access ? '<span class="badge api-badge"><i class="fas fa-code mr-1"></i>API Available</span>' : ''}
    `;
    document.getElementById('modalBadges').innerHTML = badges;
    
    let contentHTML = '';
    
    // Models section
    if (platform.models.length > 0) {
        contentHTML += `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-brain text-[#00ffd5] mr-2"></i>
                    AI Models (${platform.models.length})
                </h3>
                <div class="grid gap-2">
                    ${platform.models.map(model => `
                        <div class="bg-darker border border-[#00ffd5]/20 rounded-lg p-3">
                            <p class="text-gray-300">${model}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Details section
    if (platform.details.length > 0) {
        contentHTML += `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-list text-[#00e5ff] mr-2"></i>
                    Features & Details (${platform.details.length})
                </h3>
                <div class="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
                    ${platform.details.map(detail => `
                        <div class="flex items-start space-x-2 text-gray-300">
                            <i class="fas fa-check-circle text-green-400 mt-1 flex-shrink-0"></i>
                            <p class="text-sm">${detail}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Quick links
    contentHTML += `
        <div class="bg-darker border border-[#00ffd5]/20 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                <i class="fas fa-external-link-alt text-blue-400 mr-2"></i>
                Quick Actions
            </h4>
            <div class="flex flex-wrap gap-2">
                ${platform.url ? `
                    <button onclick="launchPlatform('${platform.url}', ${platform.id})" class="px-4 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white text-sm font-semibold transition-all">
                        <i class="fas fa-rocket mr-2"></i>Launch Platform
                    </button>
                ` : ''}
                <button onclick="toggleFavorite(${platform.id}); showPlatformDetail(${platform.id})" class="px-4 py-2 bg-${isFavorite(platform.id) ? 'pink' : 'gray'}-600 hover:bg-${isFavorite(platform.id) ? 'pink' : 'gray'}-700 rounded-lg text-white text-sm font-semibold transition-all">
                    <i class="fa${isFavorite(platform.id) ? 's' : 'r'} fa-heart mr-2"></i>${isFavorite(platform.id) ? 'Remove from' : 'Add to'} Favorites
                </button>
                <button onclick="sharePlatform(${platform.id})" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition-all">
                    <i class="fas fa-share-alt mr-2"></i>Share
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = contentHTML;
    document.getElementById('platformModal').classList.remove('hidden');
    document.getElementById('platformModal').classList.add('flex');
}

// Close modal
function closeModal() {
    document.getElementById('platformModal').classList.add('hidden');
    document.getElementById('platformModal').classList.remove('flex');
}

// Loading states
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('platformsContainer').innerHTML = '';
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

// Show error
function showError(message) {
    const container = document.getElementById('platformsContainer');
    container.innerHTML = `
        <div class="col-span-full text-center py-20">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <p class="text-gray-400 text-lg">${message}</p>
        </div>
    `;
}

// Share platform
function sharePlatform(platformId) {
    const platform = allPlatforms.find(p => p.id === platformId);
    if (!platform) return;
    
    const shareText = `Check out ${platform.name}!${platform.url ? '\n\n' + platform.url : ''}`;
    const shareUrl = window.location.href;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: platform.name,
            text: shareText,
            url: platform.url || shareUrl
        }).then(() => {
            console.log('Successfully shared');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share method
function fallbackShare(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        alert(`Share this:\n\n${text}`);
    });
}

// Render Quick Launch Bar
function renderQuickLaunchBar() {
    const container = document.getElementById('quickLaunchBar');
    if (!container) {
        // Create quick launch bar
        const bar = document.createElement('div');
        bar.id = 'quickLaunchBar';
        bar.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-dark/90 backdrop-blur-lg border border-[#00ffd5]/30 rounded-2xl p-3 shadow-2xl z-50 flex gap-2';
        bar.innerHTML = '<div class="flex gap-2" id="quickLaunchButtons"></div>';
        document.body.appendChild(bar);
    }
    
    updateQuickLaunchBar();
}

// Update Quick Launch Bar
function updateQuickLaunchBar() {
    const container = document.getElementById('quickLaunchButtons');
    if (!container) return;
    
    const buttons = quickLaunchPlatforms
        .map(id => allPlatforms.find(p => p.id === id))
        .filter(p => p && p.url)
        .slice(0, 6)
        .map(platform => `
            <button onclick="launchPlatform('${platform.url}', ${platform.id})" 
                    class="group relative px-4 py-3 bg-gradient-to-br from-[#14b8a6]/20 to-[#00e5ff]/20 hover:from-[#14b8a6] hover:to-[#00e5ff] rounded-xl transition-all hover:scale-110 border border-[#00ffd5]/30"
                    title="${platform.name}">
                <i class="${getCategoryIcon(platform.category)} text-white text-lg"></i>
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-dark/90 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${platform.name.split(/[($]/)[0].trim()}
                </div>
            </button>
        `).join('');
    
    container.innerHTML = buttons || '<p class="text-gray-500 text-sm px-4">Click hearts to add platforms here</p>';
}

// Setup Smart Assistant
function setupSmartAssistant() {
    // Add smart assistant button to header if not exists
    const header = document.querySelector('header .container');
    if (!header) return;
    
    const existingBtn = document.getElementById('smartAssistantBtn');
    if (existingBtn) return;
    
    const btnContainer = header.querySelector('.flex.items-center.space-x-4');
    if (!btnContainer) return;
    
    const smartBtn = document.createElement('button');
    smartBtn.id = 'smartAssistantBtn';
    smartBtn.className = 'px-4 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white font-semibold transition-all';
    smartBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Ask AI CSO';
    smartBtn.onclick = showSmartAssistant;
    
    btnContainer.insertBefore(smartBtn, btnContainer.firstChild);
}

// Show Smart Assistant
function showSmartAssistant() {
    const modal = document.getElementById('platformModal');
    const title = document.getElementById('modalTitle');
    const badges = document.getElementById('modalBadges');
    const content = document.getElementById('modalContent');
    
    title.textContent = '🧠 AI Business CSO - Smart Platform Assistant';
    badges.innerHTML = '<span class="badge bg-gradient-to-r from-[#14b8a6] to-[#00e5ff] text-white"><i class="fas fa-robot mr-1"></i>Powered by AI</span>';
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-br from-[#0a0a0a]/20 to-[#0a0a0a]/20 border border-[#00ffd5]/30 rounded-xl p-6">
                <h3 class="text-xl font-bold text-white mb-3 flex items-center">
                    <i class="fas fa-question-circle text-[#00ffd5] mr-2"></i>
                    What do you need to do?
                </h3>
                <p class="text-gray-400 mb-4">Tell me your task and I'll recommend the best AI platform</p>
                
                <div class="relative">
                    <input 
                        type="text" 
                        id="assistantInput" 
                        placeholder="e.g., I need to code a website, create a logo, write an email..." 
                        class="w-full px-6 py-4 bg-darker border border-[#00ffd5]/30 rounded-xl focus:outline-none focus:border-[#00ffd5] focus:ring-2 focus:ring-[#00ffd5]/20 text-white placeholder-gray-500"
                    />
                    <button onclick="getRecommendation()" class="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-paper-plane mr-2"></i>Ask
                    </button>
                </div>
            </div>
            
            <div id="recommendationResults"></div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-darker border border-[#00ffd5]/20 rounded-xl p-4">
                    <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-clock text-blue-400 mr-2"></i>
                        Recent Activity
                    </h4>
                    <div id="recentActivityList" class="space-y-2">
                        ${recentActivity.slice(0, 5).map(activity => {
                            const platform = allPlatforms.find(p => p.id === activity.platformId);
                            if (!platform) return '';
                            return `
                                <button onclick="launchPlatform('${activity.url}', ${activity.platformId})" class="w-full text-left px-3 py-2 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 rounded-lg transition-all">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-300">${platform.name.split(/[($]/)[0].trim()}</span>
                                        <span class="text-xs text-gray-500">${getTimeAgo(activity.timestamp)}</span>
                                    </div>
                                </button>
                            `;
                        }).join('') || '<p class="text-gray-500 text-sm">No recent activity</p>'}
                    </div>
                </div>
                
                <div class="bg-darker border border-[#00ffd5]/20 rounded-xl p-4">
                    <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-dollar-sign text-green-400 mr-2"></i>
                        Cost Overview
                    </h4>
                    <div id="costOverview">
                        <div class="text-3xl font-bold text-white mb-2" id="totalCost">$0</div>
                        <p class="text-sm text-gray-400 mb-3">Total Monthly Spend</p>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Paid Platforms:</span>
                                <span class="text-white" id="paidCount">0</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Free Platforms:</span>
                                <span class="text-white" id="freeCount">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-darker border border-[#00ffd5]/20 rounded-xl p-4">
                <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                    <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
                    Quick Examples
                </h4>
                <div class="flex flex-wrap gap-2">
                    <button onclick="document.getElementById('assistantInput').value='I need to write code'; getRecommendation()" class="px-4 py-2 bg-[#14b8a6]/20 hover:bg-[#14b8a6] rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Write code
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to create images'; getRecommendation()" class="px-4 py-2 bg-[#14b8a6]/20 hover:bg-[#14b8a6] rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Create images
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to do research'; getRecommendation()" class="px-4 py-2 bg-[#14b8a6]/20 hover:bg-[#14b8a6] rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Do research
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to design a presentation'; getRecommendation()" class="px-4 py-2 bg-[#14b8a6]/20 hover:bg-[#14b8a6] rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Make presentation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Load cost data
    axios.get('/api/stats').then(response => {
        const stats = response.data.stats;
        document.getElementById('totalCost').textContent = `$${stats.totalMonthlyCost.toFixed(2)}`;
        document.getElementById('paidCount').textContent = stats.paidPlatforms;
        document.getElementById('freeCount').textContent = stats.freePlatforms;
    });
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Focus input
    setTimeout(() => {
        document.getElementById('assistantInput')?.focus();
    }, 100);
}

// Get recommendation
async function getRecommendation() {
    const input = document.getElementById('assistantInput');
    const task = input?.value.trim();
    
    if (!task) {
        alert('Please describe what you need to do');
        return;
    }
    
    const resultsDiv = document.getElementById('recommendationResults');
    resultsDiv.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-[#00ffd5]"></i><p class="text-gray-400 mt-4">Analyzing your task...</p></div>';
    
    try {
        const response = await axios.get(`/api/recommend?task=${encodeURIComponent(task)}`);
        const recommendations = response.data.recommendations;
        
        if (recommendations.length === 0) {
            resultsDiv.innerHTML = `
                <div class="bg-darker border border-[#00ffd5]/20 rounded-xl p-6 text-center">
                    <i class="fas fa-search text-4xl text-gray-500 mb-4"></i>
                    <p class="text-gray-400">No specific recommendations found. Try being more specific!</p>
                </div>
            `;
            return;
        }
        
        resultsDiv.innerHTML = `
            <div class="bg-gradient-to-br from-[#0a0a0a]/20 to-[#0a0a0a]/20 border border-[#00ffd5]/30 rounded-xl p-6">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-400 mr-2"></i>
                    Recommended Platforms for: "${task}"
                </h3>
                <div class="space-y-3">
                    ${recommendations.map((rec, index) => `
                        <div class="bg-darker border border-[#00ffd5]/20 rounded-lg p-4 hover:border-[#00ffd5]/50 transition-all">
                            <div class="flex items-start justify-between mb-2">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-2xl font-bold text-[#00ffd5]">#${index + 1}</span>
                                        <h4 class="text-lg font-semibold text-white">${rec.platform.name.split(/[($]/)[0].trim()}</h4>
                                        <span class="badge bg-[#14b8a6] text-white text-xs">Score: ${rec.relevanceScore}</span>
                                    </div>
                                    <div class="flex flex-wrap gap-2 mb-2">
                                        ${rec.platform.bestFor?.slice(0, 3).map(skill => `
                                            <span class="badge bg-[#14b8a6]/20 text-[#00ffd5] text-xs">${skill}</span>
                                        `).join('') || ''}
                                    </div>
                                    <p class="text-sm text-gray-400 mb-2">${rec.platform.description || ''}</p>
                                    <div class="text-xs text-gray-500">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        Match reasons: ${rec.matchReasons.slice(0, 2).join(', ')}
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2 mt-3">
                                ${rec.platform.url ? `
                                    <button onclick="launchPlatform('${rec.platform.url}', ${rec.platform.id}); closeModal();" class="flex-1 px-4 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white text-sm font-semibold transition-all">
                                        <i class="fas fa-rocket mr-2"></i>Launch Now
                                    </button>
                                ` : ''}
                                <button onclick="showPlatformDetail(${rec.platform.id})" class="px-4 py-2 bg-dark border border-[#00ffd5]/30 hover:bg-[#14b8a6]/20 rounded-lg text-[#00ffd5] text-sm font-semibold transition-all">
                                    <i class="fas fa-info-circle mr-2"></i>Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        resultsDiv.innerHTML = `
            <div class="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <p class="text-gray-400">Error getting recommendations. Please try again.</p>
            </div>
        `;
    }
}

// Get time ago
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Setup Product Pipeline toggle button
function setupProductPipelineButton() {
    const header = document.querySelector('.max-w-7xl.mx-auto .flex.justify-between');
    if (!header) return;
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleViewButton';
    toggleButton.className = 'px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg';
    toggleButton.innerHTML = '<i class="fas fa-briefcase mr-2"></i>Product Pipeline';
    toggleButton.onclick = toggleView;
    
    header.appendChild(toggleButton);
}

// Toggle between platforms and products view
function toggleView() {
    currentView = currentView === 'platforms' ? 'products' : 'platforms';
    const button = document.getElementById('toggleViewButton');
    const mainContent = document.getElementById('app');
    
    if (currentView === 'products') {
        button.innerHTML = '<i class="fas fa-rocket mr-2"></i>AI Platforms';
        button.className = 'px-6 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white font-semibold transition-all shadow-lg';
        renderProductPipeline();
    } else {
        button.innerHTML = '<i class="fas fa-briefcase mr-2"></i>Product Pipeline';
        button.className = 'px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg';
        renderPlatforms(filterPlatforms());
    }
}

// Render Product Pipeline Kanban
function renderProductPipeline() {
    const mainContent = document.getElementById('app');
    
    const ideasCount = getProductsByStatus('idea').length;
    const inProgressCount = getProductsByStatus('in_progress').length;
    const readyCount = getProductsByStatus('ready').length;
    const listedCount = getProductsByStatus('listed').length;
    const totalCount = products.length;
    
    mainContent.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-2">
                        <i class="fas fa-briefcase mr-3 text-green-400"></i>
                        Product Pipeline
                    </h2>
                    <p class="text-gray-400">Track your digital products from idea to sale</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showWorkflowTemplatesModal()" class="px-4 py-3 bg-gradient-to-r from-[#14b8a6] to-blue-600 hover:from-[#0d9488] hover:to-blue-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-magic mr-2"></i>Templates
                    </button>
                    <button onclick="showQuickCaptureModal()" class="px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-bolt mr-2"></i>Quick
                    </button>
                    <button onclick="showAddProductModal()" class="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Product
                    </button>
                    <button onclick="showBundleCreatorModal()" class="px-4 py-3 bg-gradient-to-r from-[#00e5ff] to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-box-open mr-2"></i>Bundle
                    </button>
                    <button onclick="showExportModal()" class="px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4">
                <div class="bg-dark border border-blue-500/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-blue-400">${ideasCount}</div>
                    <div class="text-sm text-gray-400 mt-1">Ideas</div>
                </div>
                <div class="bg-dark border border-yellow-500/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-yellow-400">${inProgressCount}</div>
                    <div class="text-sm text-gray-400 mt-1">In Progress</div>
                </div>
                <div class="bg-dark border border-green-500/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-green-400">${readyCount}</div>
                    <div class="text-sm text-gray-400 mt-1">Ready to Sell</div>
                </div>
                <div class="bg-dark border border-[#00ffd5]/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-[#00ffd5]">${listedCount}</div>
                    <div class="text-sm text-gray-400 mt-1">Listed</div>
                </div>
                <div class="bg-dark border border-[#00e5ff]/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-[#00e5ff]">${totalCount}</div>
                    <div class="text-sm text-gray-400 mt-1">Total Products</div>
                </div>
            </div>
            
            <!-- Kanban Board -->
            <div class="grid grid-cols-4 gap-4">
                ${renderPipelineColumn('idea', 'Ideas', 'blue', '💡')}
                ${renderPipelineColumn('in_progress', 'In Progress', 'yellow', '🚧')}
                ${renderPipelineColumn('ready', 'Ready to Sell', 'green', '✅')}
                ${renderPipelineColumn('listed', 'Listed', 'purple', '🚀')}
            </div>
        </div>
    `;
}

// Render a pipeline column
function renderPipelineColumn(status, title, color, emoji) {
    const products = getProductsByStatus(status);
    
    return `
        <div class="bg-dark border border-${color}-500/30 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-${color}-400">
                    ${emoji} ${title}
                </h3>
                <span class="badge bg-${color}-600 text-white">${products.length}</span>
            </div>
            
            <div class="space-y-3 min-h-[400px]">
                ${products.length === 0 ? `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p class="text-sm">No products yet</p>
                    </div>
                ` : products.map(product => renderProductCard(product, color)).join('')}
            </div>
        </div>
    `;
}

// Render individual product card
function renderProductCard(product, color) {
    const typeIcons = {
        prompt: 'fa-comment-dots',
        image: 'fa-image',
        video: 'fa-video',
        tool: 'fa-tools',
        template: 'fa-file-alt',
        course: 'fa-graduation-cap'
    };
    
    const icon = typeIcons[product.type] || 'fa-box';
    
    return `
        <div class="bg-darker border border-${color}-500/20 rounded-lg p-3 hover:border-${color}-500/50 transition-all cursor-pointer" onclick="showProductDetail(${product.id})">
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fas ${icon} text-${color}-400"></i>
                        <h4 class="font-semibold text-white text-sm">${product.name}</h4>
                    </div>
                    <p class="text-xs text-gray-400 line-clamp-2">${product.description || 'No description'}</p>
                </div>
            </div>
            
            ${product.aiTool ? `
                <div class="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <i class="fas fa-robot"></i>
                    <span>${product.aiTool}</span>
                </div>
            ` : ''}
            
            <div class="flex items-center justify-between text-xs">
                <span class="badge bg-${color}-600/20 text-${color}-300">${product.type}</span>
                ${product.price ? `<span class="text-green-400 font-semibold">${product.price}</span>` : ''}
            </div>
            
            <div class="flex gap-2 mt-3">
                <button onclick="event.stopPropagation(); moveProduct(${product.id}, 'forward')" class="flex-1 px-2 py-1 bg-${color}-600/20 hover:bg-${color}-600/40 rounded text-${color}-400 text-xs font-semibold transition-all">
                    <i class="fas fa-arrow-right"></i>
                </button>
                ${product.status !== 'idea' ? `
                    <button onclick="event.stopPropagation(); moveProduct(${product.id}, 'back')" class="flex-1 px-2 py-1 bg-gray-600/20 hover:bg-gray-600/40 rounded text-gray-400 text-xs font-semibold transition-all">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Move product forward/back in pipeline
function moveProduct(productId, direction) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const statusFlow = ['idea', 'in_progress', 'ready', 'listed'];
    const currentIndex = statusFlow.indexOf(product.status);
    
    if (direction === 'forward' && currentIndex < statusFlow.length - 1) {
        updateProduct(productId, { status: statusFlow[currentIndex + 1] });
    } else if (direction === 'back' && currentIndex > 0) {
        updateProduct(productId, { status: statusFlow[currentIndex - 1] });
    }
    
    renderProductPipeline();
}

// Show Add Product Modal
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-plus-circle mr-2 text-green-400"></i>
                    Add New Product
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleAddProduct(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Product Name *</label>
                    <input type="text" id="productName" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none" placeholder="e.g., Instagram Caption Prompt Pack">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Product Type *</label>
                    <select id="productType" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none">
                        <option value="">Select type...</option>
                        <option value="prompt">💬 AI Prompt</option>
                        <option value="image">🖼️ Image/Digital Art</option>
                        <option value="video">🎥 Video Content</option>
                        <option value="tool">🔧 Tool/Script</option>
                        <option value="template">📄 Template</option>
                        <option value="course">🎓 Course/Tutorial</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Status *</label>
                    <select id="productStatus" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none">
                        <option value="idea">💡 Idea</option>
                        <option value="in_progress">🚧 In Progress</option>
                        <option value="ready">✅ Ready to Sell</option>
                        <option value="listed">🚀 Listed</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">AI Tool Used</label>
                    <select id="productAiTool" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none">
                        <option value="">Select AI tool...</option>
                        ${allPlatforms.map(p => `<option value="${p.name}" data-id="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                    <textarea id="productDescription" rows="3" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none" placeholder="What does this product do?"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Price</label>
                        <input type="text" id="productPrice" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none" placeholder="e.g., $9.99">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Listing URL</label>
                        <input type="url" id="productUrl" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none" placeholder="https://...">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                    <textarea id="productNotes" rows="2" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none" placeholder="Any additional notes..."></textarea>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-check mr-2"></i>Add Product
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Handle add product form submission
function handleAddProduct(event) {
    event.preventDefault();
    
    const aiToolSelect = document.getElementById('productAiTool');
    const selectedOption = aiToolSelect.options[aiToolSelect.selectedIndex];
    
    const productData = {
        name: document.getElementById('productName').value,
        type: document.getElementById('productType').value,
        status: document.getElementById('productStatus').value,
        aiTool: aiToolSelect.value,
        aiToolId: selectedOption.dataset.id ? parseInt(selectedOption.dataset.id) : null,
        description: document.getElementById('productDescription').value,
        price: document.getElementById('productPrice').value,
        url: document.getElementById('productUrl').value,
        notes: document.getElementById('productNotes').value
    };
    
    addProduct(productData);
    closeModal();
    renderProductPipeline();
}

// Show Quick Capture Modal
function showQuickCaptureModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-lg">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-bolt mr-2 text-yellow-400"></i>
                    Quick Capture
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleQuickCapture(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Quick Idea *</label>
                    <input type="text" id="quickCaptureName" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none" placeholder="e.g., Prompt for viral TikTok captions">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Type *</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="selectQuickType('prompt', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            💬 Prompt
                        </button>
                        <button type="button" onclick="selectQuickType('image', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            🖼️ Image
                        </button>
                        <button type="button" onclick="selectQuickType('video', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            🎥 Video
                        </button>
                        <button type="button" onclick="selectQuickType('tool', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            🔧 Tool
                        </button>
                        <button type="button" onclick="selectQuickType('template', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            📄 Template
                        </button>
                        <button type="button" onclick="selectQuickType('course', event)" class="quick-type-btn px-4 py-3 bg-darker border-2 border-gray-700 rounded-lg text-white hover:border-yellow-500 transition-all">
                            🎓 Course
                        </button>
                    </div>
                    <input type="hidden" id="quickCaptureType" required>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-bolt mr-2"></i>Capture Idea
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Select quick type
let selectedQuickType = null;
function selectQuickType(type, event) {
    event.preventDefault();
    selectedQuickType = type;
    document.getElementById('quickCaptureType').value = type;
    
    // Update button styles
    document.querySelectorAll('.quick-type-btn').forEach(btn => {
        btn.classList.remove('border-yellow-500', 'bg-yellow-600/20');
        btn.classList.add('border-gray-700');
    });
    event.target.classList.remove('border-gray-700');
    event.target.classList.add('border-yellow-500', 'bg-yellow-600/20');
}

// Handle quick capture
function handleQuickCapture(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('quickCaptureName').value,
        type: document.getElementById('quickCaptureType').value,
        status: 'idea',
        description: 'Quick capture - add details later'
    };
    
    addProduct(productData);
    closeModal();
    
    if (currentView === 'products') {
        renderProductPipeline();
    }
    
    // Show success notification
    showNotification('💡 Idea captured!');
}

// Show product detail modal
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const statusColors = {
        idea: 'blue',
        in_progress: 'yellow',
        ready: 'green',
        listed: 'purple'
    };
    
    const color = statusColors[product.status] || 'gray';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">${product.name}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <span class="badge bg-${color}-600 text-white">${product.status.replace('_', ' ')}</span>
                    <span class="badge bg-gray-700 text-gray-300">${product.type}</span>
                    ${product.price ? `<span class="text-green-400 font-semibold text-lg">${product.price}</span>` : ''}
                </div>
                
                ${product.description ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                        <p class="text-white">${product.description}</p>
                    </div>
                ` : ''}
                
                ${product.aiTool ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">AI Tool Used</h3>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-robot text-[#00ffd5]"></i>
                            <span class="text-white">${product.aiTool}</span>
                            ${product.aiToolId ? `
                                <button onclick="launchPlatform('${allPlatforms.find(p => p.id === product.aiToolId)?.url}', ${product.aiToolId})" class="px-3 py-1 bg-[#14b8a6]/20 hover:bg-[#14b8a6]/40 rounded text-[#00ffd5] text-xs font-semibold transition-all">
                                    <i class="fas fa-external-link-alt mr-1"></i>Launch
                                </button>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${product.notes ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">Notes</h3>
                        <p class="text-gray-300">${product.notes}</p>
                    </div>
                ` : ''}
                
                ${product.url ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">Listing URL</h3>
                        <a href="${product.url}" target="_blank" class="text-blue-400 hover:text-blue-300 break-all">
                            ${product.url}
                        </a>
                    </div>
                ` : ''}
                
                <div class="text-xs text-gray-500">
                    Created: ${new Date(product.createdAt).toLocaleDateString()}
                    ${product.updatedAt !== product.createdAt ? ` • Updated: ${new Date(product.updatedAt).toLocaleDateString()}` : ''}
                </div>
                
                <div class="flex gap-3 pt-4 border-t border-gray-700">
                    <button onclick="editProduct(${product.id})" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-edit mr-2"></i>Edit
                    </button>
                    <button onclick="deleteProductConfirm(${product.id})" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 font-semibold transition-all">
                        <i class="fas fa-trash mr-2"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Delete product with confirmation
function deleteProductConfirm(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        deleteProduct(productId);
        closeModal();
        if (currentView === 'products') {
            renderProductPipeline();
        }
        showNotification('🗑️ Product deleted');
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== WORKFLOW TEMPLATES MODAL ====================

function showWorkflowTemplatesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-magic mr-2 text-[#00ffd5]"></i>
                    Workflow Templates
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <p class="text-gray-400 mb-6">Choose a template to quickly create product bundles with pre-filled settings and AI suggestions</p>
            
            <div class="grid grid-cols-2 gap-4">
                ${Object.entries(workflowTemplates).map(([key, template]) => `
                    <div class="bg-dark border border-[#00ffd5]/30 rounded-xl p-4 hover:border-[#00ffd5] transition-all cursor-pointer" onclick="selectWorkflowTemplate('${key}')">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-xl font-bold text-white">
                                ${template.emoji} ${template.name}
                            </h3>
                            <span class="badge bg-[#14b8a6] text-white text-xs">$${template.pricing.recommended}</span>
                        </div>
                        <p class="text-sm text-gray-400 mb-3">${template.description}</p>
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <i class="fas fa-robot"></i>
                            <span>Suggested: ${template.suggestedAIs.map(id => allPlatforms.find(p => p.id === id)?.name.split('(')[0].trim()).filter(Boolean).join(', ')}</span>
                        </div>
                        <div class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                            Default: ${Object.values(template.fields)[0]?.default} ${Object.values(template.fields)[0]?.label.toLowerCase()}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function selectWorkflowTemplate(templateKey) {
    closeModal();
    showWorkflowFormModal(templateKey);
}

function showWorkflowFormModal(templateKey) {
    const template = workflowTemplates[templateKey];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    ${template.emoji} ${template.name}
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleWorkflowTemplate(event, '${templateKey}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Bundle Name *</label>
                    <input type="text" id="workflowName" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none" placeholder="e.g., Ultimate ${template.name}">
                </div>
                
                ${Object.entries(template.fields).map(([key, field]) => `
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">${field.label}</label>
                        <input type="text" id="workflow_${key}" value="${field.default}" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none">
                    </div>
                `).join('')}
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">AI Tool to Use *</label>
                    <select id="workflowAiTool" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none">
                        <option value="">Select AI tool...</option>
                        ${template.suggestedAIs.map(id => {
                            const platform = allPlatforms.find(p => p.id === id);
                            return platform ? `<option value="${platform.name}" data-id="${platform.id}" selected>${platform.name} (Recommended)</option>` : '';
                        }).join('')}
                        <option disabled>───────────</option>
                        ${allPlatforms.filter(p => !template.suggestedAIs.includes(p.id)).map(p => `<option value="${p.name}" data-id="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                    <textarea id="workflowDescription" rows="3" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none" placeholder="What makes this bundle special?">${template.description}</textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Bundle Price</label>
                        <input type="text" id="workflowPrice" value="$${template.pricing.recommended}" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none">
                        <p class="text-xs text-gray-500 mt-1">Range: $${template.pricing.min} - $${template.pricing.max}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                        <select id="workflowStatus" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00ffd5] focus:outline-none">
                            <option value="idea">💡 Idea</option>
                            <option value="in_progress" selected>🚧 In Progress</option>
                            <option value="ready">✅ Ready to Sell</option>
                        </select>
                    </div>
                </div>
                
                <div class="bg-[#0a0a0a]/20 border border-[#00ffd5]/30 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-[#00ffd5] mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>What happens next?
                    </h4>
                    <p class="text-xs text-gray-400">
                        This will create a bundle container in your pipeline. You can then add individual products to it as you create them.
                    </p>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-[#14b8a6] to-blue-600 hover:from-[#0d9488] hover:to-blue-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-magic mr-2"></i>Create Bundle Template
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleWorkflowTemplate(event, templateKey) {
    event.preventDefault();
    const template = workflowTemplates[templateKey];
    
    const aiToolSelect = document.getElementById('workflowAiTool');
    const selectedOption = aiToolSelect.options[aiToolSelect.selectedIndex];
    
    // Create the bundle
    const bundleData = {
        name: document.getElementById('workflowName').value,
        type: template.defaultType,
        description: document.getElementById('workflowDescription').value,
        price: document.getElementById('workflowPrice').value,
        status: document.getElementById('workflowStatus').value,
        productIds: [],
        metadata: {
            template: templateKey,
            fields: {}
        }
    };
    
    // Collect template fields
    Object.keys(template.fields).forEach(key => {
        bundleData.metadata.fields[key] = document.getElementById(`workflow_${key}`).value;
    });
    
    createBundle(bundleData);
    
    // Also create a placeholder product for the bundle
    const productData = {
        name: bundleData.name + ' (Bundle)',
        type: template.defaultType,
        status: bundleData.status,
        aiTool: aiToolSelect.value,
        aiToolId: selectedOption.dataset.id ? parseInt(selectedOption.dataset.id) : null,
        description: bundleData.description,
        price: bundleData.price,
        notes: `Template: ${template.name}\\n${Object.entries(bundleData.metadata.fields).map(([k,v]) => `${template.fields[k].label}: ${v}`).join('\\n')}`
    };
    
    addProduct(productData);
    closeModal();
    
    if (currentView === 'products') {
        renderProductPipeline();
    }
    
    showNotification(`${template.emoji} Bundle template created!`);
}

// ==================== BUNDLE CREATOR MODAL ====================

function showBundleCreatorModal() {
    const availableProducts = products.filter(p => p.status === 'ready' || p.status === 'listed');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-3xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-box-open mr-2 text-[#00e5ff]"></i>
                    Create Product Bundle
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleCreateBundle(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Bundle Name *</label>
                    <input type="text" id="bundleName" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none" placeholder="e.g., Social Media Starter Pack">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-3">Select Products to Include</label>
                    <div class="max-h-64 overflow-y-auto space-y-2 bg-darker border border-gray-700 rounded-lg p-4">
                        ${availableProducts.length === 0 ? `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-inbox text-3xl mb-2"></i>
                                <p class="text-sm">No Ready or Listed products available</p>
                                <p class="text-xs mt-2">Create and mark products as "Ready" first</p>
                            </div>
                        ` : availableProducts.map(product => `
                            <label class="flex items-center gap-3 p-3 bg-dark border border-gray-700 rounded-lg hover:border-[#00e5ff]/50 cursor-pointer transition-all">
                                <input type="checkbox" name="bundleProducts" value="${product.id}" class="w-4 h-4 text-[#00e5ff] bg-gray-700 border-gray-600 rounded focus:ring-[#00e5ff]">
                                <div class="flex-1">
                                    <div class="text-white font-semibold">${product.name}</div>
                                    <div class="text-xs text-gray-400">${product.type} ${product.price ? `• ${product.price}` : ''}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                    <textarea id="bundleDescription" rows="3" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none" placeholder="What's included in this bundle?"></textarea>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Individual Price</label>
                        <input type="text" id="bundleIndividualPrice" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none" placeholder="$49.99">
                        <p class="text-xs text-gray-500 mt-1">Sum of individual prices</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Bundle Price *</label>
                        <input type="text" id="bundlePrice" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none" placeholder="$29.99">
                        <p class="text-xs text-gray-500 mt-1">Discounted price</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Discount %</label>
                        <input type="text" id="bundleDiscount" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none" placeholder="40%">
                        <p class="text-xs text-gray-500 mt-1">Calculated savings</p>
                    </div>
                </div>
                
                <div class="bg-[#0a0a0a]/20 border border-[#00e5ff]/30 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-[#00e5ff] mb-2">
                        <i class="fas fa-calculator mr-2"></i>Pricing Tips
                    </h4>
                    <ul class="text-xs text-gray-400 space-y-1">
                        <li>• Black Friday: 30-50% discount is standard</li>
                        <li>• Bundle pricing increases perceived value</li>
                        <li>• Clear discount % drives urgency</li>
                    </ul>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-[#00e5ff] to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-box-open mr-2"></i>Create Bundle
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleCreateBundle(event) {
    event.preventDefault();
    
    const selectedCheckboxes = document.querySelectorAll('input[name="bundleProducts"]:checked');
    const productIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    
    if (productIds.length === 0) {
        alert('Please select at least one product for the bundle');
        return;
    }
    
    const bundleData = {
        name: document.getElementById('bundleName').value,
        type: 'bundle',
        productIds: productIds,
        description: document.getElementById('bundleDescription').value,
        individualPrice: document.getElementById('bundleIndividualPrice').value,
        price: document.getElementById('bundlePrice').value,
        discount: document.getElementById('bundleDiscount').value,
        status: 'ready'
    };
    
    createBundle(bundleData);
    closeModal();
    
    if (currentView === 'products') {
        renderProductPipeline();
    }
    
    showNotification(`📦 Bundle created with ${productIds.length} products!`);
}

// ==================== EXPORT MODAL ====================

function showExportModal() {
    const readyProducts = getProductsByStatus('ready');
    const listedProducts = getProductsByStatus('listed');
    const allProducts = [...readyProducts, ...listedProducts];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-download mr-2 text-cyan-400"></i>
                    Export Products
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-cyan-400 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>Ready to Export
                    </h4>
                    <p class="text-sm text-gray-400">
                        ${allProducts.length} products (Ready + Listed) available for export
                    </p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="exportToCSV()" class="p-6 bg-dark border-2 border-gray-700 hover:border-cyan-500 rounded-xl transition-all text-left">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-file-csv text-3xl text-green-400"></i>
                            <div>
                                <h3 class="font-bold text-white">CSV Export</h3>
                                <p class="text-xs text-gray-400">Spreadsheet format</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">
                            Perfect for Gumroad, Etsy, and bulk uploads
                        </p>
                    </button>
                    
                    <button onclick="exportToJSON()" class="p-6 bg-dark border-2 border-gray-700 hover:border-cyan-500 rounded-xl transition-all text-left">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-code text-3xl text-blue-400"></i>
                            <div>
                                <h3 class="font-bold text-white">JSON Export</h3>
                                <p class="text-xs text-gray-400">Developer format</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">
                            Use in APIs, websites, or custom integrations
                        </p>
                    </button>
                    
                    <button onclick="exportGumroadFormat()" class="p-6 bg-dark border-2 border-gray-700 hover:border-cyan-500 rounded-xl transition-all text-left">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-shopping-bag text-3xl text-[#00e5ff]"></i>
                            <div>
                                <h3 class="font-bold text-white">Gumroad Format</h3>
                                <p class="text-xs text-gray-400">Direct import</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">
                            Pre-formatted for Gumroad product listings
                        </p>
                    </button>
                    
                    <button onclick="generateDescriptions()" class="p-6 bg-dark border-2 border-gray-700 hover:border-cyan-500 rounded-xl transition-all text-left">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-magic text-3xl text-[#00ffd5]"></i>
                            <div>
                                <h3 class="font-bold text-white">AI Descriptions</h3>
                                <p class="text-xs text-gray-400">Coming soon</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">
                            Generate marketing copy with AI
                        </p>
                    </button>
                </div>
                
                <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-yellow-400 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>Black Friday Tip
                    </h4>
                    <p class="text-xs text-gray-400">
                        Export to CSV, add to spreadsheet, prepare bulk listings now. List everything on Black Friday eve for maximum impact!
                    </p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function exportToCSV() {
    const readyProducts = getProductsByStatus('ready');
    const listedProducts = getProductsByStatus('listed');
    const allProducts = [...readyProducts, ...listedProducts];
    
    if (allProducts.length === 0) {
        alert('No products ready for export. Move products to "Ready" or "Listed" status first.');
        return;
    }
    
    // CSV headers
    const headers = ['Name', 'Type', 'Status', 'Description', 'Price', 'AI Tool', 'Notes', 'URL', 'Created Date'];
    
    // Convert products to CSV rows
    const rows = allProducts.map(p => [
        p.name,
        p.type,
        p.status,
        p.description || '',
        p.price || '',
        p.aiTool || '',
        p.notes || '',
        p.url || '',
        new Date(p.createdAt).toLocaleDateString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    closeModal();
    showNotification(`📊 Exported ${allProducts.length} products to CSV!`);
}

function exportToJSON() {
    const readyProducts = getProductsByStatus('ready');
    const listedProducts = getProductsByStatus('listed');
    const allProducts = [...readyProducts, ...listedProducts];
    
    if (allProducts.length === 0) {
        alert('No products ready for export.');
        return;
    }
    
    const exportData = {
        exported_at: new Date().toISOString(),
        total_products: allProducts.length,
        products: allProducts
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    closeModal();
    showNotification(`📦 Exported ${allProducts.length} products to JSON!`);
}

function exportGumroadFormat() {
    const readyProducts = getProductsByStatus('ready');
    const listedProducts = getProductsByStatus('listed');
    const allProducts = [...readyProducts, ...listedProducts];
    
    if (allProducts.length === 0) {
        alert('No products ready for export.');
        return;
    }
    
    // Gumroad CSV format
    const headers = ['Name', 'Description', 'Price', 'URL Slug', 'Tags'];
    
    const rows = allProducts.map(p => [
        p.name,
        p.description || 'Premium digital product',
        p.price?.replace('$', '') || '9.99',
        p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        p.type
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gumroad_import_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    closeModal();
    showNotification(`🛍️ Exported ${allProducts.length} products for Gumroad!`);
}

function generateDescriptions() {
    alert('AI Description Generator coming in next update! This will use your AI platforms to generate marketing copy automatically.');
}

// ==================== CAPTURE LIBRARY UI ====================

// Setup Capture Library button
function setupCaptureLibraryButton() {
    const header = document.querySelector('.max-w-7xl.mx-auto .flex.justify-between');
    if (!header || document.getElementById('captureLibraryButton')) return;
    
    const captureButton = document.createElement('button');
    captureButton.id = 'captureLibraryButton';
    captureButton.className = 'px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all shadow-lg';
    captureButton.innerHTML = '<i class="fas fa-bookmark mr-2"></i>Capture Library';
    captureButton.onclick = () => switchView('captures');
    
    // Insert between Product Pipeline and Smart Assistant buttons
    const pipelineBtn = document.getElementById('toggleViewButton');
    if (pipelineBtn) {
        pipelineBtn.parentNode.insertBefore(captureButton, pipelineBtn.nextSibling);
    }
}

// Switch between views
function switchView(view) {
    currentView = view;
    const mainContent = document.getElementById('app');
    
    // Update all view buttons
    const pipelineBtn = document.getElementById('toggleViewButton');
    const captureBtn = document.getElementById('captureLibraryButton');
    
    if (view === 'platforms') {
        if (pipelineBtn) {
            pipelineBtn.innerHTML = '<i class="fas fa-briefcase mr-2"></i>Product Pipeline';
            pipelineBtn.className = 'px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg';
        }
        if (captureBtn) {
            captureBtn.className = 'px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all shadow-lg';
        }
        renderPlatforms(filterPlatforms());
    } else if (view === 'products') {
        if (pipelineBtn) {
            pipelineBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>AI Platforms';
            pipelineBtn.className = 'px-6 py-2 bg-gradient-to-r from-[#00ffd5] to-[#00e5ff] hover:from-[#00e5ff] hover:to-[#14b8a6] rounded-lg text-white font-semibold transition-all shadow-lg';
        }
        if (captureBtn) {
            captureBtn.className = 'px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all shadow-lg';
        }
        renderProductPipeline();
    } else if (view === 'captures') {
        if (pipelineBtn) {
            pipelineBtn.innerHTML = '<i class="fas fa-briefcase mr-2"></i>Product Pipeline';
            pipelineBtn.className = 'px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg';
        }
        if (captureBtn) {
            captureBtn.className = 'px-6 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 rounded-lg text-black font-bold transition-all shadow-lg';
        }
        renderCaptureLibrary();
    }
}

// Render Capture Library
function renderCaptureLibrary() {
    const mainContent = document.getElementById('app');
    
    const textCaptures = getCapturesByType('text');
    const imageCaptures = getCapturesByType('image');
    const videoCaptures = getCapturesByType('video');
    const linkCaptures = getCapturesByType('link');
    const codeCaptures = getCapturesByType('code');
    const conversationCaptures = getCapturesByType('conversation');
    const favoriteCaptures = getFavoriteCaptures();
    
    const displayCaptures = captureSearch ? searchCaptures(captureSearch) : captures;
    
    mainContent.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-2">
                        <i class="fas fa-bookmark mr-3 text-cyan-400"></i>
                        Capture Library
                    </h2>
                    <p class="text-gray-400">Your centralized hub for AI outputs, prompts, and creative assets</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="showAddCaptureModal()" class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Add Capture
                    </button>
                </div>
            </div>
            
            <!-- Search Bar -->
            <div class="bg-dark border border-cyan-500/30 rounded-xl p-4">
                <div class="flex gap-3">
                    <div class="flex-1 relative">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                        <input 
                            type="text" 
                            id="captureSearchInput"
                            value="${captureSearch}"
                            onkeyup="handleCaptureSearch(event)"
                            class="w-full pl-12 pr-4 py-3 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none" 
                            placeholder="Search captures by title, content, tags, or platform..."
                        >
                    </div>
                    <button onclick="clearCaptureSearch()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-times mr-2"></i>Clear
                    </button>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-7 gap-3">
                <div class="bg-dark border border-cyan-500/30 rounded-xl p-3 cursor-pointer hover:border-cyan-500 transition-all" onclick="filterCapturesByType('')">
                    <div class="text-2xl font-bold text-cyan-400">${captures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">All</div>
                </div>
                <div class="bg-dark border border-[#00ffd5]/30 rounded-xl p-3 cursor-pointer hover:border-[#00ffd5] transition-all" onclick="filterCapturesByType('text')">
                    <div class="text-2xl font-bold text-[#00ffd5]">${textCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">💬 Text</div>
                </div>
                <div class="bg-dark border border-[#00e5ff]/30 rounded-xl p-3 cursor-pointer hover:border-[#00e5ff] transition-all" onclick="filterCapturesByType('image')">
                    <div class="text-2xl font-bold text-[#00e5ff]">${imageCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">🖼️ Images</div>
                </div>
                <div class="bg-dark border border-red-500/30 rounded-xl p-3 cursor-pointer hover:border-red-500 transition-all" onclick="filterCapturesByType('video')">
                    <div class="text-2xl font-bold text-red-400">${videoCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">🎥 Videos</div>
                </div>
                <div class="bg-dark border border-blue-500/30 rounded-xl p-3 cursor-pointer hover:border-blue-500 transition-all" onclick="filterCapturesByType('link')">
                    <div class="text-2xl font-bold text-blue-400">${linkCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">🔗 Links</div>
                </div>
                <div class="bg-dark border border-green-500/30 rounded-xl p-3 cursor-pointer hover:border-green-500 transition-all" onclick="filterCapturesByType('code')">
                    <div class="text-2xl font-bold text-green-400">${codeCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">💻 Code</div>
                </div>
                <div class="bg-dark border border-yellow-500/30 rounded-xl p-3 cursor-pointer hover:border-yellow-500 transition-all" onclick="filterCapturesByType('favorite')">
                    <div class="text-2xl font-bold text-yellow-400">${favoriteCaptures.length}</div>
                    <div class="text-xs text-gray-400 mt-1">⭐ Favs</div>
                </div>
            </div>
            
            <!-- Captures Grid -->
            <div class="grid grid-cols-3 gap-4">
                ${displayCaptures.length === 0 ? `
                    <div class="col-span-3 text-center py-12">
                        <i class="fas fa-inbox text-6xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400 text-lg">No captures yet</p>
                        <p class="text-gray-500 text-sm mt-2">Click "Add Capture" to save your first AI output</p>
                    </div>
                ` : displayCaptures.map(capture => renderCaptureCard(capture)).join('')}
            </div>
        </div>
    `;
}

// Render individual capture card
function renderCaptureCard(capture) {
    const typeIcons = {
        text: 'fa-comment-dots',
        image: 'fa-image',
        video: 'fa-video',
        link: 'fa-link',
        code: 'fa-code',
        conversation: 'fa-comments'
    };
    
    const typeColors = {
        text: 'purple',
        image: 'pink',
        video: 'red',
        link: 'blue',
        code: 'green',
        conversation: 'indigo'
    };
    
    const icon = typeIcons[capture.type] || 'fa-bookmark';
    const color = typeColors[capture.type] || 'gray';
    
    const contentPreview = capture.content.length > 150 
        ? capture.content.substring(0, 150) + '...' 
        : capture.content;
    
    return `
        <div class="bg-dark border border-${color}-500/30 rounded-xl p-4 hover:border-${color}-500 transition-all cursor-pointer" onclick="showCaptureDetail(${capture.id})">
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas ${icon} text-${color}-400"></i>
                        <h3 class="font-bold text-white text-sm">${capture.title}</h3>
                        ${capture.favorite ? '<i class="fas fa-star text-yellow-400 text-xs"></i>' : ''}
                    </div>
                    <p class="text-xs text-gray-400 line-clamp-3">${contentPreview}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-2 mb-3 text-xs">
                <span class="badge bg-${color}-600/20 text-${color}-300">${capture.type}</span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-500">${capture.platform}</span>
                ${capture.useCount > 0 ? `
                    <span class="text-gray-500">•</span>
                    <span class="text-cyan-400"><i class="fas fa-recycle mr-1"></i>${capture.useCount}x</span>
                ` : ''}
            </div>
            
            ${capture.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-3">
                    ${capture.tags.slice(0, 3).map(tag => `
                        <span class="badge bg-gray-700 text-gray-300 text-xs">${tag}</span>
                    `).join('')}
                    ${capture.tags.length > 3 ? `<span class="text-xs text-gray-500">+${capture.tags.length - 3}</span>` : ''}
                </div>
            ` : ''}
            
            <div class="flex gap-2">
                <button onclick="event.stopPropagation(); copyCaptureToClipboard(${capture.id})" class="flex-1 px-3 py-1 bg-${color}-600/20 hover:bg-${color}-600/40 rounded text-${color}-400 text-xs font-semibold transition-all">
                    <i class="fas fa-copy mr-1"></i>Copy
                </button>
                <button onclick="event.stopPropagation(); toggleCaptureFavorite(${capture.id}); renderCaptureLibrary();" class="px-3 py-1 bg-gray-600/20 hover:bg-gray-600/40 rounded text-gray-400 text-xs font-semibold transition-all">
                    <i class="fas fa-star"></i>
                </button>
            </div>
            
            <div class="text-xs text-gray-600 mt-2">${getTimeAgo(capture.createdAt)}</div>
        </div>
    `;
}

// Show Add Capture Modal
function showAddCaptureModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-3xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-plus-circle mr-2 text-cyan-400"></i>
                    Add Capture
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleAddCapture(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Title *</label>
                    <input type="text" id="captureTitle" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none" placeholder="e.g., Instagram Caption Prompt">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Type *</label>
                    <select id="captureType" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="">Select type...</option>
                        <option value="text">💬 Text/Prompt</option>
                        <option value="image">🖼️ Image</option>
                        <option value="video">🎥 Video</option>
                        <option value="link">🔗 Link/URL</option>
                        <option value="code">💻 Code</option>
                        <option value="conversation">💭 Conversation</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">AI Platform *</label>
                    <select id="capturePlatform" required class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
                        <option value="">Select platform...</option>
                        ${allPlatforms.map(p => `<option value="${p.name}" data-id="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Content *</label>
                    <textarea id="captureContent" required rows="8" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none font-mono text-sm" placeholder="Paste your prompt, AI response, code, or any content here..."></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">URL (optional)</label>
                    <input type="url" id="captureUrl" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none" placeholder="https://...">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Tags (comma-separated)</label>
                    <input type="text" id="captureTags" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none" placeholder="e.g., social media, instagram, captions">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                    <textarea id="captureNotes" rows="2" class="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none" placeholder="Why you saved this, what worked well, etc..."></textarea>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-save mr-2"></i>Save Capture
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Handle add capture
function handleAddCapture(event) {
    event.preventDefault();
    
    const platformSelect = document.getElementById('capturePlatform');
    const selectedOption = platformSelect.options[platformSelect.selectedIndex];
    const tagsInput = document.getElementById('captureTags').value;
    
    const captureData = {
        title: document.getElementById('captureTitle').value,
        type: document.getElementById('captureType').value,
        platform: platformSelect.value,
        platformId: selectedOption.dataset.id ? parseInt(selectedOption.dataset.id) : null,
        content: document.getElementById('captureContent').value,
        url: document.getElementById('captureUrl').value,
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
        notes: document.getElementById('captureNotes').value
    };
    
    addCapture(captureData);
    closeModal();
    
    if (currentView === 'captures') {
        renderCaptureLibrary();
    }
    
    showNotification('💾 Capture saved!');
}

// Show capture detail
function showCaptureDetail(captureId) {
    const capture = captures.find(c => c.id === captureId);
    if (!capture) return;
    
    const typeColors = {
        text: 'purple',
        image: 'pink',
        video: 'red',
        link: 'blue',
        code: 'green',
        conversation: 'indigo'
    };
    
    const color = typeColors[capture.type] || 'gray';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <h2 class="text-2xl font-bold text-white">${capture.title}</h2>
                    ${capture.favorite ? '<i class="fas fa-star text-yellow-400 text-xl"></i>' : ''}
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <span class="badge bg-${color}-600 text-white">${capture.type}</span>
                    <span class="text-gray-400">${capture.platform}</span>
                    ${capture.useCount > 0 ? `<span class="text-cyan-400"><i class="fas fa-recycle mr-1"></i>Reused ${capture.useCount}x</span>` : ''}
                </div>
                
                <div class="bg-darker border border-gray-700 rounded-lg p-4">
                    <h3 class="text-sm font-semibold text-gray-400 mb-2">Content</h3>
                    <pre class="text-white whitespace-pre-wrap font-mono text-sm">${capture.content}</pre>
                </div>
                
                ${capture.url ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">URL</h3>
                        <a href="${capture.url}" target="_blank" class="text-cyan-400 hover:text-cyan-300 break-all">
                            ${capture.url}
                        </a>
                    </div>
                ` : ''}
                
                ${capture.tags.length > 0 ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">Tags</h3>
                        <div class="flex flex-wrap gap-2">
                            ${capture.tags.map(tag => `
                                <span class="badge bg-gray-700 text-gray-300">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${capture.notes ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">Notes</h3>
                        <p class="text-gray-300">${capture.notes}</p>
                    </div>
                ` : ''}
                
                <div class="text-xs text-gray-500">
                    Created: ${new Date(capture.createdAt).toLocaleString()}
                    ${capture.updatedAt !== capture.createdAt ? ` • Updated: ${new Date(capture.updatedAt).toLocaleString()}` : ''}
                </div>
                
                <div class="flex gap-3 pt-4 border-t border-gray-700">
                    <button onclick="copyCaptureToClipboard(${capture.id})" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-copy mr-2"></i>Copy Content
                    </button>
                    <button onclick="convertCaptureToProduct(${capture.id})" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-box mr-2"></i>Convert to Product
                    </button>
                    <button onclick="deleteCaptureConfirm(${capture.id})" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 font-semibold transition-all">
                        <i class="fas fa-trash mr-2"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Copy capture to clipboard
function copyCaptureToClipboard(captureId) {
    const capture = captures.find(c => c.id === captureId);
    if (!capture) return;
    
    navigator.clipboard.writeText(capture.content).then(() => {
        incrementCaptureUse(captureId);
        showNotification('📋 Copied to clipboard!');
        if (currentView === 'captures') {
            renderCaptureLibrary();
        }
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Convert capture to product
function convertCaptureToProduct(captureId) {
    const capture = captures.find(c => c.id === captureId);
    if (!capture) return;
    
    const productData = {
        name: capture.title,
        type: capture.type === 'text' ? 'prompt' : capture.type,
        status: 'ready',
        aiTool: capture.platform,
        aiToolId: capture.platformId,
        description: capture.content.substring(0, 200),
        notes: `Converted from capture. Original notes: ${capture.notes}`,
        tags: capture.tags
    };
    
    addProduct(productData);
    incrementCaptureUse(captureId, null);
    closeModal();
    showNotification('📦 Converted to product!');
}

// Delete capture with confirmation
function deleteCaptureConfirm(captureId) {
    if (confirm('Are you sure you want to delete this capture?')) {
        deleteCapture(captureId);
        closeModal();
        if (currentView === 'captures') {
            renderCaptureLibrary();
        }
        showNotification('🗑️ Capture deleted');
    }
}

// Handle capture search
function handleCaptureSearch(event) {
    captureSearch = event.target.value;
    renderCaptureLibrary();
}

// Clear capture search
function clearCaptureSearch() {
    captureSearch = '';
    document.getElementById('captureSearchInput').value = '';
    renderCaptureLibrary();
}

// Filter captures by type
let captureTypeFilter = '';
function filterCapturesByType(type) {
    captureTypeFilter = type;
    if (type === 'favorite') {
        captureSearch = '';
        renderCaptureLibrary();
    } else if (type) {
        captureSearch = '';
        renderCaptureLibrary();
    } else {
        captureSearch = '';
        renderCaptureLibrary();
    }
}

// Make functions globally available
window.showPlatformDetail = showPlatformDetail;
window.launchPlatform = launchPlatform;
window.toggleFavorite = toggleFavorite;
window.sharePlatform = sharePlatform;
window.getRecommendation = getRecommendation;
window.showSmartAssistant = showSmartAssistant;
window.toggleView = toggleView;
window.showAddProductModal = showAddProductModal;
window.showQuickCaptureModal = showQuickCaptureModal;
window.handleAddProduct = handleAddProduct;
window.handleQuickCapture = handleQuickCapture;
window.selectQuickType = selectQuickType;
window.showProductDetail = showProductDetail;
window.moveProduct = moveProduct;
window.deleteProductConfirm = deleteProductConfirm;
window.showWorkflowTemplatesModal = showWorkflowTemplatesModal;
window.selectWorkflowTemplate = selectWorkflowTemplate;
window.handleWorkflowTemplate = handleWorkflowTemplate;
window.showBundleCreatorModal = showBundleCreatorModal;
window.handleCreateBundle = handleCreateBundle;
window.showExportModal = showExportModal;
window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
window.exportGumroadFormat = exportGumroadFormat;
window.generateDescriptions = generateDescriptions;
window.switchView = switchView;
window.showAddCaptureModal = showAddCaptureModal;
window.handleAddCapture = handleAddCapture;
window.showCaptureDetail = showCaptureDetail;
window.copyCaptureToClipboard = copyCaptureToClipboard;
window.convertCaptureToProduct = convertCaptureToProduct;
window.deleteCaptureConfirm = deleteCaptureConfirm;
window.handleCaptureSearch = handleCaptureSearch;
window.clearCaptureSearch = clearCaptureSearch;
window.filterCapturesByType = filterCapturesByType;
window.editProduct = function(productId) {
    alert('Edit functionality coming in next update!');
};
