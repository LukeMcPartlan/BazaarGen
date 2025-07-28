/**
 * ContestsController - Manages contest functionality
 */
class ContestsController {
  static contests = [];
  static userItems = [];
  static userSkills = [];
  static debugMode = true;

  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[ContestsController] ${message}`, data || '');
    }
  }

  /**
   * Initialize the contests page
   */
  static async init() {
    this.debug('🚀 Initializing ContestsController...');
    
    try {
      // Wait for authentication
      await this.waitForGoogleAuth();
      
      // Wait for database
      await this.waitForDatabase();
      
      // Load contests
      await this.loadContests();
      
      // Setup global functions
      this.setupGlobalFunctions();
      
      this.debug('✅ ContestsController initialization complete');
      
    } catch (error) {
      this.debug('❌ Error initializing ContestsController:', error);
      console.error('Error initializing ContestsController:', error);
    }
  }

  /**
   * Wait for Google Auth to be ready
   */
  static async waitForGoogleAuth() {
    this.debug('⏳ Waiting for GoogleAuth...');
    
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (typeof GoogleAuth !== 'undefined' && GoogleAuth.isInitialized()) {
          this.debug('✅ GoogleAuth ready');
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  /**
   * Wait for database to be ready
   */
  static async waitForDatabase() {
    this.debug('⏳ Waiting for SupabaseClient...');
    
    return new Promise((resolve) => {
      const checkDatabase = () => {
        if (typeof SupabaseClient !== 'undefined' && SupabaseClient.isInitialized()) {
          this.debug('✅ SupabaseClient ready');
          resolve();
        } else {
          setTimeout(checkDatabase, 100);
        }
      };
      checkDatabase();
    });
  }

  /**
   * Load all contests from database
   */
  static async loadContests() {
    this.debug('📋 Loading contests...');
    
    try {
      // Show loading state
      const loadingEl = document.getElementById('contestsLoading');
      const gridEl = document.getElementById('contestsGrid');
      const emptyEl = document.getElementById('contestsEmpty');
      
      if (loadingEl) loadingEl.style.display = 'block';
      if (gridEl) gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'none';
      
      // Fetch contests from database
      const contests = await SupabaseClient.getContests();
      this.contests = contests || [];
      
      this.debug(`📋 Loaded ${this.contests.length} contests`);
      
      // Hide loading state
      if (loadingEl) loadingEl.style.display = 'none';
      
      if (this.contests.length === 0) {
        this.debug('📭 No contests found, showing empty state');
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      
      // Display contests
      this.displayContests();
      
    } catch (error) {
      this.debug('❌ Error loading contests:', error);
      console.error('Error loading contests:', error);
      
      // Hide loading and show error
      const loadingEl = document.getElementById('contestsLoading');
      const emptyEl = document.getElementById('contestsEmpty');
      
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) {
        emptyEl.innerHTML = '<h3>Error Loading Contests</h3><p>Failed to load contests. Please try refreshing the page.</p>';
        emptyEl.style.display = 'block';
      }
    }
  }

  /**
   * Display contests in the grid
   */
  static displayContests() {
    this.debug('🎴 Displaying contests...');
    
    const gridEl = document.getElementById('contestsGrid');
    if (!gridEl) return;
    
    this.contests.forEach(contest => {
      const contestCard = this.createContestCard(contest);
      gridEl.appendChild(contestCard);
    });
    
    this.debug(`✅ Displayed ${this.contests.length} contests`);
  }

  /**
   * Create a contest card element
   */
  static createContestCard(contest) {
    this.debug(`🏗️ Creating contest card for: ${contest.name}`);
    
    const card = document.createElement('div');
    card.className = 'contest-card';
    
    // Determine contest status
    const now = new Date();
    const endDate = new Date(contest.end_date);
    const isActive = now < endDate;
    
    // Create contest header
    const header = document.createElement('div');
    header.className = 'contest-header';
    
    const title = document.createElement('h3');
    title.className = 'contest-title';
    title.textContent = contest.name;
    
    const status = document.createElement('span');
    status.className = `contest-status ${isActive ? 'active' : 'ended'}`;
    status.textContent = isActive ? 'Active' : 'Ended';
    
    header.appendChild(title);
    header.appendChild(status);
    
    // Create contest info
    const info = document.createElement('div');
    info.className = 'contest-info';
    
    const type = document.createElement('div');
    type.className = 'contest-type';
    
    let typeIcon = '🎴';
    let typeText = 'Cards & Skills';
    
    if (contest.type === 'cards') {
      typeIcon = '🎴';
      typeText = 'Cards Only';
    } else if (contest.type === 'skills') {
      typeIcon = '⚡';
      typeText = 'Skills Only';
    }
    
    type.innerHTML = `<span class="contest-type-icon">${typeIcon}</span> ${typeText}`;
    
    const endDateText = document.createElement('div');
    endDateText.textContent = `Ends: ${endDate.toLocaleDateString()}`;
    
    info.appendChild(type);
    info.appendChild(endDateText);
    
    // Create description
    const description = document.createElement('div');
    description.className = 'contest-description';
    description.textContent = contest.description;
    
    // Create anchor card if exists
    let anchorSection = null;
    if (contest.anchor_card) {
      anchorSection = document.createElement('div');
      anchorSection.className = 'contest-anchor';
      
      try {
        const anchorData = JSON.parse(contest.anchor_card);
        const anchorCard = CardGenerator.createCard({
          data: anchorData,
          mode: 'browser'
        });
        anchorSection.appendChild(anchorCard);
      } catch (error) {
        this.debug('❌ Error creating anchor card:', error);
      }
    }
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'contest-actions';
    
    if (isActive) {
      // Active contest - show submit and view buttons
      const submitBtn = document.createElement('button');
      submitBtn.className = 'contest-btn btn-submit';
      submitBtn.textContent = '📤 Submit Entry';
      submitBtn.onclick = () => this.openSubmissionModal(contest);
      
      const viewBtn = document.createElement('button');
      viewBtn.className = 'contest-btn btn-view';
      viewBtn.textContent = '👁️ View Entries';
      viewBtn.onclick = () => this.openEntriesModal(contest);
      
      actions.appendChild(submitBtn);
      actions.appendChild(viewBtn);
    } else {
      // Ended contest - show winners button
      const winnersBtn = document.createElement('button');
      winnersBtn.className = 'contest-btn btn-winners';
      winnersBtn.textContent = '🏆 View Winners';
      winnersBtn.onclick = () => this.openWinnersModal(contest);
      
      actions.appendChild(winnersBtn);
    }
    
    // Assemble card
    card.appendChild(header);
    card.appendChild(info);
    card.appendChild(description);
    
    if (anchorSection) {
      card.appendChild(anchorSection);
    }
    
    card.appendChild(actions);
    
    return card;
  }

  /**
   * Open submission modal for a contest
   */
  static async openSubmissionModal(contest) {
    this.debug(`📤 Opening submission modal for contest: ${contest.name}`);
    
    try {
      // Load user's items and skills
      await this.loadUserContent();
      
      // Filter content based on contest type
      let availableContent = [];
      
      if (contest.type === 'cards' || contest.type === 'both') {
        availableContent = availableContent.concat(this.userItems.map(item => ({
          ...item,
          contentType: 'card'
        })));
      }
      
      if (contest.type === 'skills' || contest.type === 'both') {
        availableContent = availableContent.concat(this.userSkills.map(skill => ({
          ...skill,
          contentType: 'skill'
        })));
      }
      
      // Check which items are already submitted
      const submittedItems = await SupabaseClient.getContestSubmissions(contest.id);
      const submittedIds = submittedItems.map(sub => sub.item_id);
      
      // Create modal content
      const modalContent = document.getElementById('submissionModalContent');
      modalContent.innerHTML = `
        <div style="color: rgb(251, 225, 183); margin-bottom: 20px;">
          <h3>${contest.name}</h3>
          <p>${contest.description}</p>
          <p><strong>Select an item to submit:</strong></p>
        </div>
        <div class="submissions-grid">
          ${availableContent.map(item => {
            const isSubmitted = submittedIds.includes(item.id);
            const isCard = item.contentType === 'card';
            const itemName = isCard ? item.item_data?.itemName : item.skill_data?.skillName;
            
            return `
              <div class="submission-item ${isSubmitted ? 'already-submitted' : ''}" 
                   onclick="${isSubmitted ? '' : `ContestsController.selectSubmission('${item.id}', '${item.contentType}')`}"
                   data-item-id="${item.id}"
                   data-content-type="${item.contentType}">
                <div style="text-align: center;">
                  <div style="font-weight: bold; color: rgb(251, 225, 183); margin-bottom: 10px;">
                    ${isCard ? '🎴' : '⚡'} ${itemName || 'Untitled'}
                  </div>
                  ${isSubmitted ? '<div style="color: #f44336; font-size: 12px;">Already Submitted</div>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="ContestsController.submitToContest('${contest.id}')" 
                  class="contest-btn btn-submit" 
                  id="submitContestBtn" 
                  style="display: none;">
            Submit Selected Item
          </button>
        </div>
      `;
      
      // Show modal
      document.getElementById('submissionModal').style.display = 'block';
      
    } catch (error) {
      this.debug('❌ Error opening submission modal:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load submission options');
      } else {
        alert('Failed to load submission options');
      }
    }
  }

  /**
   * Load user's content (items and skills)
   */
  static async loadUserContent() {
    this.debug('📦 Loading user content...');
    
    try {
      // Load user's items
      this.userItems = await SupabaseClient.getUserItems() || [];
      this.debug(`📦 Loaded ${this.userItems.length} user items`);
      
      // Load user's skills
      this.userSkills = await SupabaseClient.getUserSkills() || [];
      this.debug(`⚡ Loaded ${this.userSkills.length} user skills`);
      
    } catch (error) {
      this.debug('❌ Error loading user content:', error);
      throw error;
    }
  }

  /**
   * Select a submission item
   */
  static selectSubmission(itemId, contentType) {
    this.debug(`✅ Selected submission: ${itemId} (${contentType})`);
    
    // Remove previous selections
    document.querySelectorAll('.submission-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Select new item
    const selectedItem = document.querySelector(`[data-item-id="${itemId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    // Show submit button
    const submitBtn = document.getElementById('submitContestBtn');
    if (submitBtn) {
      submitBtn.style.display = 'inline-block';
    }
  }

  /**
   * Submit selected item to contest
   */
  static async submitToContest(contestId) {
    const selectedItem = document.querySelector('.submission-item.selected');
    if (!selectedItem) {
      if (typeof Messages !== 'undefined') {
        Messages.showError('Please select an item to submit');
      } else {
        alert('Please select an item to submit');
      }
      return;
    }
    
    const itemId = selectedItem.getAttribute('data-item-id');
    const contentType = selectedItem.getAttribute('data-content-type');
    
    this.debug(`📤 Submitting ${contentType} ${itemId} to contest ${contestId}`);
    
    try {
      await SupabaseClient.submitToContest(contestId, itemId, contentType);
      
      if (typeof Messages !== 'undefined') {
        Messages.showSuccess('Item submitted successfully!');
      } else {
        alert('Item submitted successfully!');
      }
      
      this.closeSubmissionModal();
      
    } catch (error) {
      this.debug('❌ Error submitting to contest:', error);
      
      let errorMessage = 'Failed to submit item';
      if (error.message.includes('already submitted')) {
        errorMessage = 'This item has already been submitted to a contest';
      }
      
      if (typeof Messages !== 'undefined') {
        Messages.showError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  }

  /**
   * Open entries modal for a contest
   */
  static async openEntriesModal(contest) {
    this.debug(`👁️ Opening entries modal for contest: ${contest.name}`);
    
    try {
      const submissions = await SupabaseClient.getContestSubmissions(contest.id);
      
      const modalContent = document.getElementById('submissionModalContent');
      modalContent.innerHTML = `
        <div style="color: rgb(251, 225, 183); margin-bottom: 20px;">
          <h3>${contest.name} - Entries</h3>
          <p>${submissions.length} submissions</p>
        </div>
        <div class="submissions-grid">
          ${submissions.map(submission => {
            const isCard = submission.content_type === 'card';
            const itemName = isCard ? submission.item_data?.itemName : submission.skill_data?.skillName;
            const creator = submission.user_alias || 'Unknown';
            
            return `
              <div class="submission-item">
                <div style="text-align: center;">
                  <div style="font-weight: bold; color: rgb(251, 225, 183); margin-bottom: 10px;">
                    ${isCard ? '🎴' : '⚡'} ${itemName || 'Untitled'}
                  </div>
                  <div style="color: rgb(201, 175, 133); font-size: 12px;">
                    by ${creator}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      // Update modal title
      document.querySelector('#submissionModal .modal-title').textContent = 'Contest Entries';
      
      // Show modal
      document.getElementById('submissionModal').style.display = 'block';
      
    } catch (error) {
      this.debug('❌ Error opening entries modal:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load contest entries');
      } else {
        alert('Failed to load contest entries');
      }
    }
  }

  /**
   * Open winners modal for a contest
   */
  static async openWinnersModal(contest) {
    this.debug(`🏆 Opening winners modal for contest: ${contest.name}`);
    
    try {
      const winners = await SupabaseClient.getContestWinners(contest.id);
      
      const modalContent = document.getElementById('winnersModalContent');
      modalContent.innerHTML = `
        <div style="color: rgb(251, 225, 183); margin-bottom: 20px;">
          <h3>${contest.name} - Winners</h3>
          <p>🏆 Contest Winners</p>
        </div>
        <div class="winners-grid">
          ${winners.map((winner, index) => {
            const isCard = winner.content_type === 'card';
            const itemName = isCard ? winner.item_data?.itemName : winner.skill_data?.skillName;
            const creator = winner.user_alias || 'Unknown';
            const rank = index + 1;
            
            return `
              <div class="winner-item">
                <div class="winner-rank">#${rank}</div>
                <div style="font-weight: bold; color: rgb(251, 225, 183); margin-bottom: 10px;">
                  ${isCard ? '🎴' : '⚡'} ${itemName || 'Untitled'}
                </div>
                <div style="color: rgb(201, 175, 133); font-size: 12px;">
                  by ${creator}
                </div>
                <div class="winner-votes">
                  ${winner.votes || 0} votes
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      // Show modal
      document.getElementById('winnersModal').style.display = 'block';
      
    } catch (error) {
      this.debug('❌ Error opening winners modal:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load contest winners');
      } else {
        alert('Failed to load contest winners');
      }
    }
  }

  /**
   * Close submission modal
   */
  static closeSubmissionModal() {
    document.getElementById('submissionModal').style.display = 'none';
  }

  /**
   * Close winners modal
   */
  static closeWinnersModal() {
    document.getElementById('winnersModal').style.display = 'none';
  }

  /**
   * Setup global functions
   */
  static setupGlobalFunctions() {
    // Make functions available globally
    window.ContestsController = ContestsController;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.ContestsController = ContestsController;
} 