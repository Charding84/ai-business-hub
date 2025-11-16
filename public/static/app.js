// Global state
let allPlatforms = [];
let currentFilter = 'all';
let searchQuery = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadPlatforms();
    setupEventListeners();
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
    
    const categoryTabsHTML = categories.map(cat => `
        <button class="filter-tab px-6 py-3 rounded-xl bg-dark border border-purple-500/30 text-gray-300 hover:bg-purple-600/20 hover:text-white font-semibold transition-all" data-category="${cat.name}">
            <i class="${getCategoryIcon(cat.name)} mr-2"></i>${cat.name} <span class="ml-2 text-xs opacity-75">(${cat.count})</span>
        </button>
    `).join('');
    
    document.getElementById('filterTabs').innerHTML = allTabHTML + categoryTabsHTML;
    
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
            filterPlatforms();
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
        <div class="platform-card rounded-xl p-6 card-hover cursor-pointer" onclick="showPlatformDetail(${platform.id})">
            <div class="flex items-start justify-between mb-4">
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
            
            <div class="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <span class="text-xs text-gray-500">
                    <i class="fas fa-info-circle mr-1"></i>
                    ${platform.details.length} details
                </span>
                <button class="text-purple-400 hover:text-purple-300 transition-colors text-sm font-semibold">
                    View Details <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = platformsHTML;
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
                <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors">
                    <i class="fas fa-rocket mr-2"></i>Launch Platform
                </button>
                <button class="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white text-sm transition-colors">
                    <i class="fas fa-star mr-2"></i>Add to Favorites
                </button>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
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

// Make function globally available
window.showPlatformDetail = showPlatformDetail;
