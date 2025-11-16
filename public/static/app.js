// Global state
let allPlatforms = [];
let currentFilter = 'all';
let searchQuery = '';
let favorites = [];
let recentActivity = [];
let quickLaunchPlatforms = [];
let products = [];
let currentView = 'platforms'; // 'platforms' or 'products'

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
    loadPlatforms();
    setupEventListeners();
    renderQuickLaunchBar();
    setupSmartAssistant();
    setupProductPipelineButton();
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
                <i class="fas fa-server text-3xl text-purple-400"></i>
                <span class="text-3xl font-bold text-white">${stats.totalPlatforms}</span>
            </div>
            <p class="text-gray-400 text-sm font-semibold">Total Platforms</p>
        </div>
        
        <div class="stat-card rounded-xl p-6 card-hover cursor-pointer">
            <div class="flex items-center justify-between mb-2">
                <i class="fas fa-brain text-3xl text-pink-400"></i>
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
        <button class="filter-tab active px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold transition-all" data-category="all">
            <i class="fas fa-th mr-2"></i>All Platforms
        </button>
    `;
    
    const favoritesTabHTML = `
        <button class="filter-tab px-6 py-3 rounded-xl bg-dark border border-purple-500/30 text-gray-300 hover:bg-purple-600/20 hover:text-white font-semibold transition-all" data-category="favorites">
            <i class="fas fa-heart mr-2"></i>Favorites <span class="ml-2 text-xs opacity-75">(${favorites.length})</span>
        </button>
    `;
    
    const categoryTabsHTML = categories.map(cat => `
        <button class="filter-tab px-6 py-3 rounded-xl bg-dark border border-purple-500/30 text-gray-300 hover:bg-purple-600/20 hover:text-white font-semibold transition-all" data-category="${cat.name}">
            <i class="${getCategoryIcon(cat.name)} mr-2"></i>${cat.name} <span class="ml-2 text-xs opacity-75">(${cat.count})</span>
        </button>
    `).join('');
    
    document.getElementById('filterTabs').innerHTML = allTabHTML + favoritesTabHTML + categoryTabsHTML;
    
    // Add click listeners
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => {
                t.classList.remove('active', 'bg-purple-600', 'text-white');
                t.classList.add('bg-dark', 'border', 'border-purple-500/30', 'text-gray-300');
            });
            tab.classList.add('active', 'bg-purple-600', 'text-white');
            tab.classList.remove('bg-dark', 'border', 'border-purple-500/30', 'text-gray-300');
            
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
                        ${platform.models.length > 3 ? `<p class="text-xs text-purple-400">+${platform.models.length - 3} more</p>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="flex gap-2 pt-4 border-t border-purple-500/20">
                ${platform.url ? `
                    <button onclick="event.stopPropagation(); launchPlatform('${platform.url}', ${platform.id})" class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white text-sm font-semibold transition-all">
                        <i class="fas fa-rocket mr-2"></i>Launch
                    </button>
                ` : ''}
                <button onclick="showPlatformDetail(${platform.id})" class="flex-1 px-4 py-2 bg-dark border border-purple-500/30 hover:bg-purple-600/20 rounded-lg text-purple-400 text-sm font-semibold transition-all">
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
                    <i class="fas fa-brain text-purple-400 mr-2"></i>
                    AI Models (${platform.models.length})
                </h3>
                <div class="grid gap-2">
                    ${platform.models.map(model => `
                        <div class="bg-darker border border-purple-500/20 rounded-lg p-3">
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
                    <i class="fas fa-list text-pink-400 mr-2"></i>
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
        <div class="bg-darker border border-purple-500/20 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                <i class="fas fa-external-link-alt text-blue-400 mr-2"></i>
                Quick Actions
            </h4>
            <div class="flex flex-wrap gap-2">
                ${platform.url ? `
                    <button onclick="launchPlatform('${platform.url}', ${platform.id})" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white text-sm font-semibold transition-all">
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
        bar.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-dark/90 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-3 shadow-2xl z-50 flex gap-2';
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
                    class="group relative px-4 py-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all hover:scale-110 border border-purple-500/30"
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
    smartBtn.className = 'px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all';
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
    badges.innerHTML = '<span class="badge bg-gradient-to-r from-purple-600 to-pink-600 text-white"><i class="fas fa-robot mr-1"></i>Powered by AI</span>';
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 class="text-xl font-bold text-white mb-3 flex items-center">
                    <i class="fas fa-question-circle text-purple-400 mr-2"></i>
                    What do you need to do?
                </h3>
                <p class="text-gray-400 mb-4">Tell me your task and I'll recommend the best AI platform</p>
                
                <div class="relative">
                    <input 
                        type="text" 
                        id="assistantInput" 
                        placeholder="e.g., I need to code a website, create a logo, write an email..." 
                        class="w-full px-6 py-4 bg-darker border border-purple-500/30 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500"
                    />
                    <button onclick="getRecommendation()" class="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all">
                        <i class="fas fa-paper-plane mr-2"></i>Ask
                    </button>
                </div>
            </div>
            
            <div id="recommendationResults"></div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-darker border border-purple-500/20 rounded-xl p-4">
                    <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-clock text-blue-400 mr-2"></i>
                        Recent Activity
                    </h4>
                    <div id="recentActivityList" class="space-y-2">
                        ${recentActivity.slice(0, 5).map(activity => {
                            const platform = allPlatforms.find(p => p.id === activity.platformId);
                            if (!platform) return '';
                            return `
                                <button onclick="launchPlatform('${activity.url}', ${activity.platformId})" class="w-full text-left px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 rounded-lg transition-all">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-300">${platform.name.split(/[($]/)[0].trim()}</span>
                                        <span class="text-xs text-gray-500">${getTimeAgo(activity.timestamp)}</span>
                                    </div>
                                </button>
                            `;
                        }).join('') || '<p class="text-gray-500 text-sm">No recent activity</p>'}
                    </div>
                </div>
                
                <div class="bg-darker border border-purple-500/20 rounded-xl p-4">
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
            
            <div class="bg-darker border border-purple-500/20 rounded-xl p-4">
                <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
                    <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
                    Quick Examples
                </h4>
                <div class="flex flex-wrap gap-2">
                    <button onclick="document.getElementById('assistantInput').value='I need to write code'; getRecommendation()" class="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Write code
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to create images'; getRecommendation()" class="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Create images
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to do research'; getRecommendation()" class="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                        Do research
                    </button>
                    <button onclick="document.getElementById('assistantInput').value='I need to design a presentation'; getRecommendation()" class="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
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
    resultsDiv.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-purple-400"></i><p class="text-gray-400 mt-4">Analyzing your task...</p></div>';
    
    try {
        const response = await axios.get(`/api/recommend?task=${encodeURIComponent(task)}`);
        const recommendations = response.data.recommendations;
        
        if (recommendations.length === 0) {
            resultsDiv.innerHTML = `
                <div class="bg-darker border border-purple-500/20 rounded-xl p-6 text-center">
                    <i class="fas fa-search text-4xl text-gray-500 mb-4"></i>
                    <p class="text-gray-400">No specific recommendations found. Try being more specific!</p>
                </div>
            `;
            return;
        }
        
        resultsDiv.innerHTML = `
            <div class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-400 mr-2"></i>
                    Recommended Platforms for: "${task}"
                </h3>
                <div class="space-y-3">
                    ${recommendations.map((rec, index) => `
                        <div class="bg-darker border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/50 transition-all">
                            <div class="flex items-start justify-between mb-2">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-2xl font-bold text-purple-400">#${index + 1}</span>
                                        <h4 class="text-lg font-semibold text-white">${rec.platform.name.split(/[($]/)[0].trim()}</h4>
                                        <span class="badge bg-purple-600 text-white text-xs">Score: ${rec.relevanceScore}</span>
                                    </div>
                                    <div class="flex flex-wrap gap-2 mb-2">
                                        ${rec.platform.bestFor?.slice(0, 3).map(skill => `
                                            <span class="badge bg-purple-600/20 text-purple-300 text-xs">${skill}</span>
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
                                    <button onclick="launchPlatform('${rec.platform.url}', ${rec.platform.id}); closeModal();" class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white text-sm font-semibold transition-all">
                                        <i class="fas fa-rocket mr-2"></i>Launch Now
                                    </button>
                                ` : ''}
                                <button onclick="showPlatformDetail(${rec.platform.id})" class="px-4 py-2 bg-dark border border-purple-500/30 hover:bg-purple-600/20 rounded-lg text-purple-400 text-sm font-semibold transition-all">
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
        button.className = 'px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all shadow-lg';
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
                <div class="flex gap-3">
                    <button onclick="showQuickCaptureModal()" class="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-bolt mr-2"></i>Quick Capture
                    </button>
                    <button onclick="showAddProductModal()" class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Add Product
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
                <div class="bg-dark border border-purple-500/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-purple-400">${listedCount}</div>
                    <div class="text-sm text-gray-400 mt-1">Listed</div>
                </div>
                <div class="bg-dark border border-pink-500/30 rounded-xl p-4">
                    <div class="text-3xl font-bold text-pink-400">${totalCount}</div>
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
                            <i class="fas fa-robot text-purple-400"></i>
                            <span class="text-white">${product.aiTool}</span>
                            ${product.aiToolId ? `
                                <button onclick="launchPlatform('${allPlatforms.find(p => p.id === product.aiToolId)?.url}', ${product.aiToolId})" class="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 rounded text-purple-400 text-xs font-semibold transition-all">
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
window.editProduct = function(productId) {
    alert('Edit functionality coming in next update!');
};
