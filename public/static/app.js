// Global state
let allPlatforms = [];
let currentFilter = 'all';
let searchQuery = '';
let favorites = [];
let recentActivity = [];
let quickLaunchPlatforms = [];

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
    loadPlatforms();
    setupEventListeners();
    renderQuickLaunchBar();
    setupSmartAssistant();
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

// Make functions globally available
window.showPlatformDetail = showPlatformDetail;
window.launchPlatform = launchPlatform;
window.toggleFavorite = toggleFavorite;
window.sharePlatform = sharePlatform;
window.getRecommendation = getRecommendation;
window.showSmartAssistant = showSmartAssistant;
