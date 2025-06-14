class EbayLinkLookup {
    constructor() {
        this.sheetId = '1y5LIRkB_PbD0Wl1-sGBRw_M2N-UXxjeeGrIN7j7f720';
        this.sheetName = 'Sheet1';
        this.apiKey = 'AIzaSyB81cI1s1rziK9cMqgVkSZc63BFO06Q1Xk';
        this.searchColumn = 3; // Column D (0-indexed)
        this.resultFields = ['name', 'id', 'variation', 'ebay'];
        this.minLoadingDuration = 800; // Minimum loading time in ms
        
        this.initializeElements();
        this.bindEvents();
        this.autoFocusInput();
    }

    initializeElements() {
        this.searchInput = document.getElementById('ebayLink');
        this.searchBtn = document.getElementById('searchBtn');
        this.btnText = this.searchBtn.querySelector('.btn-text');
        this.loadingSpinner = this.searchBtn.querySelector('.loading-spinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.noResults = document.getElementById('noResults');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsGrid = document.getElementById('resultsGrid');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Clear previous results when user starts typing
        this.searchInput.addEventListener('input', () => {
            this.hideAllResults();
        });
    }

    autoFocusInput() {
        // Auto-focus with a slight delay to ensure smooth page load
        setTimeout(() => {
            this.searchInput.focus();
        }, 500);
    }

    async handleSearch() {
        const ebayLink = this.searchInput.value.trim();
        
        if (!ebayLink) {
            this.showError('Please enter an eBay link');
            return;
        }

        if (!this.isValidEbayLink(ebayLink)) {
            this.showError('Please enter a valid eBay link');
            return;
        }

        this.setLoadingState(true);
        this.hideAllResults();

        // Track the start time to ensure minimum loading duration
        const startTime = Date.now();

        try {
            const results = await this.searchInSheet(ebayLink);
            
            // Calculate remaining time to reach minimum loading duration
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, this.minLoadingDuration - elapsedTime);
            
            // Wait for remaining time if needed
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
            
            this.setLoadingState(false);
            
            if (results.length > 0) {
                this.displayResults(results);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            // Calculate remaining time to reach minimum loading duration
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, this.minLoadingDuration - elapsedTime);
            
            // Wait for remaining time if needed
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
            
            this.setLoadingState(false);
            this.showError('Failed to search. Please try again.');
            console.error('Search error:', error);
        }
    }

    isValidEbayLink(link) {
        const ebayPattern = /^https?:\/\/(www\.)?ebay\.(com|co\.uk|de|fr|it|es|ca|com\.au|ie|at|be|ch|nl|pl|se|in|ph|sg|my|th|vn|hk|tw|co\.kr|co\.jp|cn|ru|ua|bg|cz|dk|ee|fi|gr|hr|hu|lt|lv|no|pt|ro|si|sk|tr|com\.br|com\.mx|com\.ar|com\.co|com\.pe|com\.uy|com\.ve|com\.do|com\.gt|com\.hn|com\.ni|com\.pa|com\.sv|com\.cr|com\.bz|com\.jm|com\.tt|com\.bb|com\.ag|com\.lc|com\.gd|com\.vc|com\.dm|com\.kn|com\.ms|com\.vg|com\.ai|com\.tc|com\.bs|com\.ky|com\.bm|com\.pr|com\.vi|com\.as|com\.gu|com\.mp|com\.mh|com\.fm|com\.pw|com\.ki|com\.nr|com\.nu|com\.ck|com\.fj|com\.to|com\.tv|com\.vu|com\.ws|com\.sb|com\.nc|com\.wf|com\.pf|com\.tf|com\.re|com\.yt|com\.pm|com\.bl|com\.mf|com\.gp|com\.mq|com\.gf|com\.sr|com\.gy|com\.fk|com\.gs|com\.sh|com\.ac|com\.ta|com\.io|com\.cc|com\.cx|com\.nf|com\.hm|com\.aq)\//i;
        return ebayPattern.test(link);
    }

    async searchInSheet(ebayLink) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${this.sheetName}?key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const rows = data.values || [];
            
            // Search for matching eBay link
            const results = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row[this.searchColumn] && this.normalizeUrl(row[this.searchColumn]) === this.normalizeUrl(ebayLink)) {
                    const result = {
                        name: row[0] || 'N/A',
                        id: row[1] || 'N/A',
                        variation: row[2] || 'N/A',
                        ebay: row[3] || 'N/A'
                    };
                    results.push(result);
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    normalizeUrl(url) {
        // Remove protocol, www, and trailing slashes for comparison
        return url.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.searchBtn.disabled = true;
            this.btnText.classList.add('hidden');
            this.loadingSpinner.classList.remove('hidden');
            this.searchInput.disabled = true;
        } else {
            this.searchBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.loadingSpinner.classList.add('hidden');
            this.searchInput.disabled = false;
        }
    }

    hideAllResults() {
        this.errorMessage.classList.add('hidden');
        this.noResults.classList.add('hidden');
        this.resultsContainer.classList.add('hidden');
    }

    showError(message) {
        this.hideAllResults();
        this.errorMessage.querySelector('.error-text').textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Scroll to error message
        setTimeout(() => {
            this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    showNoResults() {
        this.hideAllResults();
        this.noResults.classList.remove('hidden');
        
        // Scroll to no results message
        setTimeout(() => {
            this.noResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    displayResults(results) {
        this.hideAllResults();
        
        // Clear previous results
        this.resultsGrid.innerHTML = '';
        
        // Create result cards
        results.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            this.resultsGrid.appendChild(card);
        });
        
        this.resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const fields = [
            { label: 'Name', value: result.name },
            { label: 'ID', value: result.id },
            { label: 'Variation', value: result.variation },
            { label: 'eBay Link', value: result.ebay, isLink: true }
        ];
        
        const html = fields.map(field => {
            const value = field.isLink ? 
                `<a href="${field.value}" target="_blank" rel="noopener noreferrer" style="color: #FFD700; text-decoration: none;">${this.truncateUrl(field.value)}</a>` : 
                this.escapeHtml(field.value);
            
            return `
                <div class="result-item">
                    <span class="result-label">${field.label}</span>
                    <span class="result-value">${value}</span>
                </div>
            `;
        }).join('');
        
        card.innerHTML = html;
        return card;
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EbayLinkLookup();
});

// Add some accessibility improvements
document.addEventListener('keydown', (e) => {
    // Allow Escape key to clear focus
    if (e.key === 'Escape') {
        document.activeElement.blur();
    }
});

// Add visual feedback for keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

// Add error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});