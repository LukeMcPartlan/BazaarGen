/**
 * Navigation Controller
 * Handles navigation menu behavior, mobile menu, and page routing
 */
class Navigation {
  
  static isInitialized = false;
  
  /**
   * Initialize navigation functionality
   */
  static init() {
    if (this.isInitialized) return;
    
    document.addEventListener('DOMContentLoaded', () => {
      this.setupMobileMenu();
      this.setupNavigation();
      this.setupClickOutside();
      this.isInitialized = true;
    });
  }

  /**
   * Setup mobile menu toggle functionality
   */
  static setupMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        navMenu.classList.toggle('active');
      });
    }
  }

  /**
   * Setup navigation link handling
   */
  static setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const page = link.getAttribute('data-page');
        const href = link.getAttribute('href');
        
        // Handle external links normally
        if (href && href !== '#') {
          return; // Let the browser handle the navigation
        }

        // Handle internal page navigation
        if (page) {
          e.preventDefault();
          this.navigateToPage(page, link);
        }
      });
    });
  }

  /**
   * Setup click outside to close mobile menu
   */
  static setupClickOutside() {
    document.addEventListener('click', (e) => {
      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');
      
      // Close mobile menu when clicking outside
      if (navToggle && navMenu && 
          !navToggle.contains(e.target) && 
          !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
      }

      // Close export menus when clicking outside
      if (!e.target.closest('.card-export-btn') && 
          !e.target.closest('.skill-export-btn') && 
          !e.target.closest('.export-menu')) {
        document.querySelectorAll('.export-menu').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  }

  /**
   * Navigate to a specific page
   * @param {string} page - Page identifier
   * @param {HTMLElement} clickedLink - The clicked navigation link
   */
  static navigateToPage(page, clickedLink) {
    // Update active state
    this.setActiveNavigation(clickedLink);
    
    // Close mobile menu
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
      navMenu.classList.remove('active');
    }

    // Handle page-specific navigation
    this.handlePageContent(page);
  }

  /**
   * Set active navigation state
   * @param {HTMLElement} activeLink - The active navigation link
   */
  static setActiveNavigation(activeLink) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  /**
   * Handle page content changes
   * @param {string} page - Page identifier
   */
  static handlePageContent(page) {
    const pageTitle = document.querySelector('.page-title');
    
    switch(page) {
      case 'items':
        if (pageTitle) pageTitle.textContent = 'Bazaar Card Generator';
        this.showItemsContent();
        break;
        
      case 'skills':
        // Navigate to skills page
        window.location.href = 'skills.html';
        break;
        
      case 'browse':
        // Navigate to browse page
        window.location.href = 'browse.html';
        break;
        
      case 'contests':
        if (pageTitle) pageTitle.textContent = 'Community Contests';
        this.showContestsContent();
        break;
        
      default:
        console.warn('Unknown page:', page);
    }
  }

  /**
   * Show items/cards content (default view)
   */
  static showItemsContent() {
    // This would be implemented if you have multiple pages in one HTML file
    // For now, the main page is already the items page
  }

  /**
   * Show contests content
   */
  static showContestsContent() {
    // Placeholder for contests functionality
    const outputContainer = document.getElementById('outputContainer');
    if (outputContainer) {
      outputContainer.innerHTML = `
        <div class="contest-placeholder">
          <h3>🏆 Community Contests Coming Soon! 🏆</h3>
          <p>Stay tuned for exciting card creation contests where the community votes on the best designs!</p>
        </div>
      `;
    }
  }

  /**
   * Get current page from URL or page state
   * @returns {string} Current page identifier
   */
  static getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('skills.html')) return 'skills';
    if (path.includes('browse.html')) return 'browse';
    if (path.includes('contests.html')) return 'contests';
    
    return 'items'; // Default to items page
  }

  /**
   * Set navigation state based on current page
   */
  static setCurrentPageActive() {
    const currentPage = this.getCurrentPage();
    const navLink = document.querySelector(`[data-page="${currentPage}"]`);
    
    if (navLink) {
      this.setActiveNavigation(navLink);
    }
  }

  /**
   * Add navigation breadcrumbs
   * @param {Array} breadcrumbs - Array of breadcrumb objects {text, link}
   */
  static addBreadcrumbs(breadcrumbs) {
    const existingBreadcrumbs = document.querySelector('.breadcrumbs');
    if (existingBreadcrumbs) {
      existingBreadcrumbs.remove();
    }

    if (!breadcrumbs || breadcrumbs.length === 0) return;

    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'breadcrumbs';
    
    breadcrumbs.forEach((crumb, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = ' > ';
        breadcrumbContainer.appendChild(separator);
      }

      if (crumb.link && index < breadcrumbs.length - 1) {
        const link = document.createElement('a');
        link.href = crumb.link;
        link.textContent = crumb.text;
        link.className = 'breadcrumb-link';
        breadcrumbContainer.appendChild(link);
      } else {
        const span = document.createElement('span');
        span.textContent = crumb.text;
        span.className = 'breadcrumb-current';
        breadcrumbContainer.appendChild(span);
      }
    });

    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
      pageHeader.appendChild(breadcrumbContainer);
    }
  }

  /**
   * Show loading state in navigation
   * @param {boolean} loading - Whether to show loading state
   */
  static setLoadingState(loading) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      if (loading) {
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.6';
      } else {
        link.style.pointerEvents = '';
        link.style.opacity = '';
      }
    });
  }

  /**
   * Add notification badge to navigation item
   * @param {string} page - Page identifier
   * @param {number} count - Notification count
   */
  static addNotificationBadge(page, count) {
    const navLink = document.querySelector(`[data-page="${page}"]`);
    if (!navLink) return;

    // Remove existing badge
    const existingBadge = navLink.querySelector('.nav-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Add new badge if count > 0
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'nav-badge';
      badge.textContent = count > 99 ? '99+' : count.toString();
      navLink.appendChild(badge);
    }
  }

  /**
   * Setup keyboard navigation
   */
  static setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Alt + number keys for quick navigation
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const keyMap = {
          '1': 'items',
          '2': 'skills', 
          '3': 'browse',
          '4': 'contests'
        };

        if (keyMap[e.key]) {
          e.preventDefault();
          const navLink = document.querySelector(`[data-page="${keyMap[e.key]}"]`);
          if (navLink) {
            navLink.click();
          }
        }
      }

      // Escape to close mobile menu
      if (e.key === 'Escape') {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
        }
      }
    });
  }

  /**
   * Get navigation state for saving/restoring
   * @returns {Object} Navigation state
   */
  static getNavigationState() {
    return {
      currentPage: this.getCurrentPage(),
      mobileMenuOpen: document.getElementById('nav-menu')?.classList.contains('active') || false
    };
  }

  /**
   * Restore navigation state
   * @param {Object} state - Navigation state to restore
   */
  static restoreNavigationState(state) {
    if (state.currentPage) {
      const navLink = document.querySelector(`[data-page="${state.currentPage}"]`);
      if (navLink) {
        this.setActiveNavigation(navLink);
      }
    }

    if (state.mobileMenuOpen) {
      const navMenu = document.getElementById('nav-menu');
      if (navMenu) {
        navMenu.classList.add('active');
      }
    }
  }
}

// Auto-initialize navigation
Navigation.init();