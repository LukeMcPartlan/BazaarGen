/**
 * Browse Page Helper Functions and Utilities
 * Save as: js/pages/browse-page-helpers.js
 * Additional utilities and helper functions for the enhanced browse page
 */

(function() {
    'use strict';
    
    console.log('🛠️ Browse Page Helpers Loading...');
    
    /**
     * Browse Page Helper Functions
     */
    window.BrowsePageHelpers = {
        
        /**
         * Get current tab name
         */
        getCurrentTab: () => {
            return EnhancedBrowsePageController?.activeTab || 'items';
        },
        
        /**
         * Switch to a specific tab programmatically
         */
        switchToTab: (tabName) => {
            if (EnhancedBrowsePageController) {
                EnhancedBrowsePageController.switchTab(tabName);
                console.log(`🔄 Switched to ${tabName} tab`);
            } else {
                console.warn('⚠️ EnhancedBrowsePageController not available');
            }
        },
        
        /**
         * Refresh current tab content
         */
        refreshCurrentTab: () => {
            if (EnhancedBrowsePageController) {
                EnhancedBrowsePageController.handleFilterChange();
                console.log('🔄 Refreshed current tab');
            } else {
                console.warn('⚠️ EnhancedBrowsePageController not available');
            }
        },
        
        /**
         * Get current filter state
         */
        getCurrentFilters: () => {
            if (!EnhancedBrowsePageController) return {};
            
            if (EnhancedBrowsePageController.activeTab === 'skills') {
                return EnhancedBrowsePageController.getSkillFilters();
            } else {
                return EnhancedBrowsePageController.getFilters();
            }
        },
        
        /**
         * Get current statistics
         */
        getCurrentStats: () => {
            if (!EnhancedBrowsePageController) return {};
            
            const tab = EnhancedBrowsePageController.activeTab;
            
            if (tab === 'skills') {
                return {
                    total: EnhancedBrowsePageController.allSkills?.length || 0,
                    displayed: EnhancedBrowsePageController.displayedSkills?.length || 0,
                    collections: EnhancedBrowsePageController.skillCollections?.size || 0
                };
            } else {
                return {
                    total: EnhancedBrowsePageController.allItems?.length || 0,
                    displayed: EnhancedBrowsePageController.displayedItems?.length || 0,
                    collections: EnhancedBrowsePageController.collections?.size || 0
                };
            }
        },
        
        /**
         * Export current view as data
         */
        exportCurrentView: () => {
            if (!EnhancedBrowsePageController) {
                console.warn('⚠️ EnhancedBrowsePageController not available');
                return;
            }
            
            const tab = EnhancedBrowsePageController.activeTab;
            const filters = tab === 'skills' ? 
                EnhancedBrowsePageController.getSkillFilters() : 
                EnhancedBrowsePageController.getFilters();
            
            const data = tab === 'skills' ? 
                EnhancedBrowsePageController.allSkills : 
                EnhancedBrowsePageController.allItems;
            
            const exportData = {
                type: tab,
                timestamp: new Date().toISOString(),
                filters: filters,
                count: data?.length || 0,
                data: data || []
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bazaargen-${tab}-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            if (typeof Messages !== 'undefined') {
                Messages.showSuccess(`Exported ${data?.length || 0} ${tab}!`);
            } else {
                console.log(`✅ Exported ${data?.length || 0} ${tab}`);
            }
        },
        
        /**
         * Get popular keywords from current tab data
         */
        getPopularKeywords: (limit = 10) => {
            if (!EnhancedBrowsePageController) return [];
            
            const tab = EnhancedBrowsePageController.activeTab;
            const data = tab === 'skills' ? 
                EnhancedBrowsePageController.allSkills : 
                EnhancedBrowsePageController.allItems;
            
            if (!data || data.length === 0) return [];
            
            const keywordCounts = new Map();
            const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
            
            data.forEach(item => {
                let text = '';
                if (tab === 'skills') {
                    text = item.skill_data?.skillEffect || '';
                } else {
                    text = item.item_data?.passiveEffect || '';
                }
                
                const words = text
                    .toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !commonWords.has(word));
                
                words.forEach(word => {
                    keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
                });
            });
            
            return Array.from(keywordCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([keyword, count]) => ({ keyword, count }));
        },
        
        /**
         * Apply filters programmatically
         */
        applyFilters: (filters) => {
            const tab = EnhancedBrowsePageController?.activeTab;
            if (!tab) return;
            
            if (tab === 'skills') {
                // Apply skill filters
                Object.entries(filters).forEach(([key, value]) => {
                    const elementId = key === 'sortBy' ? 'skillSortBy' : 
                                     key === 'search' ? 'skillSearchInput' :
                                     key === 'keywords' ? 'keywordFilter' :
                                     key === 'creator' ? 'creatorFilter' :
                                     key === 'rarity' ? 'rarityFilter' :
                                     key === 'length' ? 'lengthFilter' : null;
                    
                    if (elementId) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.value = value;
                        }
                    }
                });
            } else {
                // Apply item filters
                Object.entries(filters).forEach(([key, value]) => {
                    const elementId = key === 'search' ? 'searchInput' :
                                     key === 'hero' ? 'heroFilter' :
                                     key === 'contest' ? 'contestFilter' :
                                     key === 'sortBy' ? 'sortBy' : null;
                    
                    if (elementId) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.value = value;
                        }
                    }
                });
            }
            
            // Trigger filter change
            this.refreshCurrentTab();
        },
        
        /**
         * Clear all filters
         */
        clearAllFilters: () => {
            const tab = EnhancedBrowsePageController?.activeTab;
            if (!tab) return;
            
            if (tab === 'skills') {
                ['skillSortBy', 'rarityFilter', 'skillSearchInput', 'keywordFilter', 'creatorFilter', 'lengthFilter'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        if (element.tagName === 'SELECT') {
                            element.selectedIndex = 0;
                        } else {
                            element.value = '';
                        }
                    }
                });
            } else {
                ['sortBy', 'heroFilter', 'searchInput', 'contestFilter'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        if (element.tagName === 'SELECT') {
                            element.selectedIndex = 0;
                        } else {
                            element.value = '';
                        }
                    }
                });
            }
            
            this.refreshCurrentTab();
            console.log('🧹 Cleared all filters');
        },
        
        /**
         * Search for specific content
         */
        searchFor: (query) => {
            const tab = EnhancedBrowsePageController?.activeTab;
            if (!tab) return;
            
            const searchElementId = tab === 'skills' ? 'skillSearchInput' : 'searchInput';
            const searchElement = document.getElementById(searchElementId);
            
            if (searchElement) {
                searchElement.value = query;
                this.refreshCurrentTab();
                console.log(`🔍 Searching for: "${query}" in ${tab}`);
            }
        },
        
        /**
         * Get collections data
         */
        getCollections: () => {
            if (!EnhancedBrowsePageController) return [];
            
            const tab = EnhancedBrowsePageController.activeTab;
            const collections = tab === 'skills' ? 
                EnhancedBrowsePageController.skillCollections : 
                EnhancedBrowsePageController.collections;
            
            return Array.from(collections.values());
        },
        
        /**
         * Performance monitoring
         */
        getPerformanceMetrics: () => {
            const tab = EnhancedBrowsePageController?.activeTab;
            const stats = this.getCurrentStats();
            
            return {
                currentTab: tab,
                itemsLoaded: stats.total,
                itemsDisplayed: stats.displayed,
                collections: stats.collections,
                loadTime: performance.now(),
                memoryUsage: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
                } : 'Not available'
            };
        }
    };
    
    /**
     * Enhanced keyboard shortcuts
     */
    document.addEventListener('keydown', (e) => {
        // Only if not typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Switch tabs with 1 and 2 keys
        if (e.key === '1') {
            e.preventDefault();
            window.BrowsePageHelpers.switchToTab('items');
        } else if (e.key === '2') {
            e.preventDefault();
            window.BrowsePageHelpers.switchToTab('skills');
        }
        
        // Refresh with R key
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            window.BrowsePageHelpers.refreshCurrentTab();
        }
        
        // Export with E key (Ctrl+E)
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.BrowsePageHelpers.exportCurrentView();
        }
        
        // Clear filters with Ctrl+K
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            window.BrowsePageHelpers.clearAllFilters();
        }
        
        // Focus search with / key
        if (e.key === '/') {
            e.preventDefault();
            const tab = window.BrowsePageHelpers.getCurrentTab();
            const searchElementId = tab === 'skills' ? 'skillSearchInput' : 'searchInput';
            const searchElement = document.getElementById(searchElementId);
            if (searchElement) {
                searchElement.focus();
                searchElement.select();
            }
        }
    });
    
    /**
     * URL parameter handling for deep linking
     */
    const URLManager = {
        
        /**
         * Parse URL parameters and apply them
         */
        parseAndApplyURLParams: () => {
            const params = new URLSearchParams(window.location.search);
            
            // Switch to specified tab
            const tab = params.get('tab');
            if (tab && ['items', 'skills'].includes(tab)) {
                setTimeout(() => {
                    window.BrowsePageHelpers.switchToTab(tab);
                    
                    // Apply filters after tab switch
                    setTimeout(() => {
                        this.applyFiltersFromURL(params, tab);
                    }, 500);
                }, 100);
            }
        },
        
        /**
         * Apply filters from URL parameters
         */
        applyFiltersFromURL: (params, tab) => {
            const filters = {};
            
            if (tab === 'skills') {
                if (params.get('sort')) filters.sortBy = params.get('sort');
                if (params.get('rarity')) filters.rarity = params.get('rarity');
                if (params.get('search')) filters.search = params.get('search');
                if (params.get('keywords')) filters.keywords = params.get('keywords');
                if (params.get('creator')) filters.creator = params.get('creator');
                if (params.get('length')) filters.length = params.get('length');
            } else {
                if (params.get('sort')) filters.sortBy = params.get('sort');
                if (params.get('hero')) filters.hero = params.get('hero');
                if (params.get('search')) filters.search = params.get('search');
                if (params.get('contest')) filters.contest = params.get('contest');
            }
            
            if (Object.keys(filters).length > 0) {
                window.BrowsePageHelpers.applyFilters(filters);
            }
        },
        
        /**
         * Update URL with current state
         */
        updateURL: () => {
            const tab = window.BrowsePageHelpers.getCurrentTab();
            const filters = window.BrowsePageHelpers.getCurrentFilters();
            
            const params = new URLSearchParams();
            params.set('tab', tab);
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim && value.trim() !== '') {
                    params.set(key === 'sortBy' ? 'sort' : key, value);
                }
            });
            
            const newURL = window.location.pathname + '?' + params.toString();
            window.history.replaceState({}, '', newURL);
        }
    };
    
    /**
     * Auto-suggestions for search inputs
     */
    const SearchSuggestions = {
        
        /**
         * Setup search suggestions
         */
        setup: () => {
            // Add suggestions to search inputs when they get focus
            document.addEventListener('focusin', (e) => {
                if (e.target.id === 'skillSearchInput' || e.target.id === 'searchInput' || e.target.id === 'keywordFilter') {
                    this.showSuggestions(e.target);
                }
            });
            
            document.addEventListener('focusout', (e) => {
                setTimeout(() => this.hideSuggestions(e.target), 200);
            });
        },
        
        /**
         * Show search suggestions
         */
        showSuggestions: (input) => {
            const suggestions = this.getSuggestions(input.id);
            if (suggestions.length === 0) return;
            
            const suggestionsList = document.createElement('div');
            suggestionsList.className = 'search-suggestions';
            suggestionsList.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(37, 26, 12, 0.95);
                border: 2px solid rgb(218, 165, 32);
                border-top: none;
                border-radius: 0 0 6px 6px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            `;
            
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 8px 12px;
                    color: rgb(251, 225, 183);
                    cursor: pointer;
                    border-bottom: 1px solid rgba(218, 165, 32, 0.2);
                    transition: background 0.2s ease;
                `;
                item.textContent = suggestion;
                
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(218, 165, 32, 0.2)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });
                
                item.addEventListener('click', () => {
                    input.value = suggestion;
                    this.hideSuggestions(input);
                    window.BrowsePageHelpers.refreshCurrentTab();
                });
                
                suggestionsList.appendChild(item);
            });
            
            // Position relative to input
            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(suggestionsList);
        },
        
        /**
         * Hide search suggestions
         */
        hideSuggestions: (input) => {
            const existing = input.parentNode.querySelector('.search-suggestions');
            if (existing) {
                existing.remove();
            }
        },
        
        /**
         * Get suggestions based on input type
         */
        getSuggestions: (inputId) => {
            if (inputId === 'keywordFilter') {
                return ['damage', 'heal', 'slow', 'haste', 'poison', 'burn', 'freeze', 'lifesteal', 'shield', 'regen'];
            } else if (inputId === 'skillSearchInput') {
                return ['fireball', 'healing', 'lightning', 'shield', 'teleport', 'summon', 'curse', 'blessing'];
            } else if (inputId === 'searchInput') {
                return ['sword', 'armor', 'potion', 'ring', 'staff', 'bow', 'shield', 'helmet'];
            }
            return [];
        }
    };
    
    /**
     * Analytics and tracking
     */
    const Analytics = {
        
        /**
         * Track user interactions
         */
        trackInteraction: (action, data = {}) => {
            const event = {
                timestamp: new Date().toISOString(),
                action: action,
                tab: window.BrowsePageHelpers?.getCurrentTab(),
                data: data
            };
            
            console.log('📊 Interaction:', event);
            
            // Store in localStorage for analysis
            const interactions = JSON.parse(localStorage.getItem('browse_interactions') || '[]');
            interactions.push(event);
            
            // Keep only last 100 interactions
            if (interactions.length > 100) {
                interactions.splice(0, interactions.length - 100);
            }
            
            localStorage.setItem('browse_interactions', JSON.stringify(interactions));
        },
        
        /**
         * Get usage statistics
         */
        getUsageStats: () => {
            const interactions = JSON.parse(localStorage.getItem('browse_interactions') || '[]');
            
            const stats = {
                totalInteractions: interactions.length,
                byAction: {},
                byTab: {},
                sessionDuration: 0
            };
            
            interactions.forEach(interaction => {
                stats.byAction[interaction.action] = (stats.byAction[interaction.action] || 0) + 1;
                stats.byTab[interaction.tab] = (stats.byTab[interaction.tab] || 0) + 1;
            });
            
            if (interactions.length > 0) {
                const firstInteraction = new Date(interactions[0].timestamp);
                const lastInteraction = new Date(interactions[interactions.length - 1].timestamp);
                stats.sessionDuration = Math.round((lastInteraction - firstInteraction) / 1000 / 60); // minutes
            }
            
            return stats;
        }
    };
    
    // Initialize components
    document.addEventListener('DOMContentLoaded', () => {
        // Setup URL parameter handling
        URLManager.parseAndApplyURLParams();
        
        // Setup search suggestions
        SearchSuggestions.setup();
        
        // Track page load
        Analytics.trackInteraction('page_load');
        
        // Track tab switches
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('browse-tab')) {
                Analytics.trackInteraction('tab_switch', { tab: e.target.dataset.tab });
            }
        });
        
        // Track filter changes
        ['change', 'input'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                if (e.target.classList.contains('control-select') || e.target.classList.contains('control-input')) {
                    Analytics.trackInteraction('filter_change', { 
                        filter: e.target.id, 
                        value: e.target.value 
                    });
                }
            });
        });
        
        // Update URL when filters change
        let urlUpdateTimeout;
        document.addEventListener('input', () => {
            clearTimeout(urlUpdateTimeout);
            urlUpdateTimeout = setTimeout(() => {
                URLManager.updateURL();
            }, 1000);
        });
        
        console.log('✅ Browse Page Helpers initialized');
    });
    
    // Make components available globally for debugging
    window.BrowsePageHelpers.URLManager = URLManager;
    window.BrowsePageHelpers.SearchSuggestions = SearchSuggestions;
    window.BrowsePageHelpers.Analytics = Analytics;
    
    console.log('📋 Browse Page Helpers loaded. Available methods:', Object.keys(window.BrowsePageHelpers));
    
})();