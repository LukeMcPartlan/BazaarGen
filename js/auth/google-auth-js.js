/**
 * Google Authentication Handler with Enhanced Debugging
 * Manages Google sign-in/out and user session
 */
class GoogleAuth {
  static isInitialized = false;
  static currentUser = null;
  static userProfile = null;
  static debugMode = true; // Enable debugging

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[GoogleAuth] ${message}`, data || '');
    }
  }

  /**
   * Initialize Google Auth
   */
  static async init() {
    if (this.isInitialized) {
      this.debug('Already initialized, skipping...');
      return;
    }

    try {
      this.debug('Starting Google Auth initialization...');
      
      // Wait for Google Identity Services to load
      this.debug('Waiting for Google API...');
      await this.waitForGoogleAPI();
      this.debug('Google API loaded successfully');
      
      // Initialize Google Sign-In
      this.debug('Initializing Google Sign-In...');
      google.accounts.id.initialize({
        client_id: '208926605452-h7mj4nrcubf43pfi78vgql9o12lqnr0n.apps.googleusercontent.com', // YOUR REAL ID
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup', // Use popup instead of redirect to avoid CORS issues
        context: 'signin'
      });

      this.debug('Google Sign-In initialized with config');

      // Render sign-in button
      this.debug('Rendering sign-in button...');
      this.renderSignInButton();
      
      // Check for existing session
      this.debug('Checking for existing session...');
      this.checkExistingSession();

      this.isInitialized = true;
      this.debug('Google Auth initialization completed successfully');

    } catch (error) {
      this.debug('Failed to initialize Google Auth:', error);
      console.error('Google Auth initialization failed:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to initialize Google sign-in. Please refresh the page.');
      }
    }
  }

  /**
   * Wait for Google API to be available
   */
  static waitForGoogleAPI() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkAPI = () => {
        attempts++;
        this.debug(`Checking for Google API, attempt ${attempts}/${maxAttempts}`);
        
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          this.debug('Google API found!');
          resolve();
        } else if (attempts >= maxAttempts) {
          this.debug('Max attempts reached, Google API not found');
          reject(new Error('Google API failed to load'));
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      
      checkAPI();
    });
  }

  /**
   * Handle credential response from Google
   */
  static async handleCredentialResponse(response) {
    try {
      this.debug('Received credential response from Google');
      this.debug('Response keys:', Object.keys(response));
      
      if (!response.credential) {
        throw new Error('No credential in response');
      }

      // Decode the JWT token
      this.debug('Decoding JWT token...');
      const userInfo = this.parseJWT(response.credential);
      this.debug('Decoded user info:', {
        email: userInfo.email,
        name: userInfo.name,
        sub: userInfo.sub,
        picture: userInfo.picture
      });

      console.log('User signed in:', userInfo.email);

      // Store user info
      this.currentUser = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.sub,
        token: response.credential
      };

      this.debug('Stored current user:', this.currentUser);

      // Store in session storage for persistence
      this.debug('Saving to session storage...');
      sessionStorage.setItem('bazaargen_user', JSON.stringify(this.currentUser));

      // Show user as signed in
      this.debug('Updating UI to show signed in state...');
      this.showUserSignedIn();

      // Fetch or create user profile from database
      this.debug('Fetching user profile from database...');
      await this.fetchUserProfile();

      // Trigger custom event
      this.debug('Triggering userSignedIn event...');
      document.dispatchEvent(new CustomEvent('userSignedIn', { 
        detail: this.currentUser 
      }));

      this.debug('Sign-in process completed successfully');

    } catch (error) {
      this.debug('Error handling sign-in:', error);
      console.error('Error handling sign-in:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Sign-in failed. Please try again.');
      }
    }
  }

  /**
   * Parse JWT token
   */
  static parseJWT(token) {
    try {
      this.debug('Parsing JWT token...');
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      const parsed = JSON.parse(jsonPayload);
      this.debug('JWT parsed successfully');
      return parsed;
    } catch (error) {
      this.debug('Error parsing JWT:', error);
      console.error('Error parsing JWT:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Fetch user profile from database
   */
  static async fetchUserProfile() {
    try {
      this.debug('Fetching user profile...');
      
      if (!this.currentUser) {
        throw new Error('No current user');
      }

      this.debug('Current user email:', this.currentUser.email);

      // Check if SupabaseClient is available
      if (typeof SupabaseClient === 'undefined') {
        this.debug('SupabaseClient not available, using fallback');
        this.userProfile = {
          alias: this.currentUser.name || this.currentUser.email.split('@')[0],
          email: this.currentUser.email
        };
        this.updateUserDisplay();
        return;
      }

      if (!SupabaseClient.isReady()) {
        this.debug('Database not ready, using fallback');
        this.userProfile = {
          alias: this.currentUser.name || this.currentUser.email.split('@')[0],
          email: this.currentUser.email
        };
        this.updateUserDisplay();
        return;
      }

      this.debug('Querying database for user profile...');
      // Try to fetch existing user profile
      const profile = await SupabaseClient.getUserProfile(this.currentUser.email);
      
      if (profile && profile.alias) {
        // User has existing profile
        this.debug('Found existing profile:', profile);
        this.userProfile = profile;
        this.updateUserDisplay();
      } else {
        // New user - show alias creation modal
        this.debug('No existing profile found, showing alias creation modal');
        this.showAliasCreationModal(true);
      }

    } catch (error) {
      this.debug('Error fetching user profile:', error);
      console.error('Error fetching user profile:', error);
      
      // Fallback to using name/email
      this.debug('Using fallback profile');
      this.userProfile = {
        alias: this.currentUser.name || this.currentUser.email.split('@')[0],
        email: this.currentUser.email
      };
      this.updateUserDisplay();
    }
  }

  /**
   * Show alias creation modal
   */
  static showAliasCreationModal(isNewUser = false) {
    this.debug('Showing alias creation modal, isNewUser:', isNewUser);
    
    const modal = document.getElementById('alias-modal');
    const title = document.getElementById('alias-modal-title');
    const description = document.getElementById('alias-modal-description');
    const input = document.getElementById('alias-input');
    const cancelBtn = document.getElementById('alias-cancel-btn');

    if (!modal) {
      this.debug('Alias modal not found in DOM');
      return;
    }

    if (isNewUser) {
      title.textContent = 'Welcome to BazaarGen!';
      description.textContent = 'Choose an alias to display on the site';
      cancelBtn.style.display = 'none'; // Hide cancel for new users
      input.value = this.currentUser.name || this.currentUser.email.split('@')[0];
    } else {
      title.textContent = 'Edit Your Alias';
      description.textContent = 'Change your display name';
      cancelBtn.style.display = 'inline-block';
      input.value = this.userProfile?.alias || '';
    }

    modal.style.display = 'flex';
    input.focus();
    this.debug('Alias modal displayed');
  }

  /**
   * Save user alias
   */
  static async saveAlias() {
    this.debug('Attempting to save alias...');
    
    const input = document.getElementById('alias-input');
    const errorDiv = document.getElementById('alias-error');
    const alias = input.value.trim();

    this.debug('Alias input value:', alias);

    // Clear previous errors
    errorDiv.textContent = '';

    // Validate alias
    if (!alias) {
      this.debug('Validation failed: empty alias');
      errorDiv.textContent = 'Alias cannot be empty';
      return;
    }

    if (alias.length < 2) {
      this.debug('Validation failed: alias too short');
      errorDiv.textContent = 'Alias must be at least 2 characters';
      return;
    }

    if (alias.length > 20) {
      this.debug('Validation failed: alias too long');
      errorDiv.textContent = 'Alias must be 20 characters or less';
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
      this.debug('Validation failed: invalid characters');
      errorDiv.textContent = 'Alias can only contain letters, numbers, hyphens, and underscores';
      return;
    }

    this.debug('Alias validation passed');

    try {
      // Disable save button
      const saveBtn = document.getElementById('alias-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      this.debug('Save button disabled, attempting database save...');

      // Save to database if available
      if (typeof SupabaseClient !== 'undefined' && SupabaseClient.isReady()) {
        this.debug('Saving to database...');
        await SupabaseClient.saveUserProfile({
          email: this.currentUser.email,
          alias: alias,
          google_id: this.currentUser.googleId
        });
        this.debug('Database save successful');
      } else {
        this.debug('Database not available, saving locally only');
      }

      // Update local profile
      this.userProfile = {
        alias: alias,
        email: this.currentUser.email
      };

      this.debug('Local profile updated:', this.userProfile);

      // Update display
      this.updateUserDisplay();

      // Close modal
      document.getElementById('alias-modal').style.display = 'none';

      this.debug('Alias save process completed');

      if (typeof Messages !== 'undefined') {
        Messages.showSuccess('Alias saved successfully!');
      }

    } catch (error) {
      this.debug('Error saving alias:', error);
      console.error('Error saving alias:', error);
      errorDiv.textContent = 'Failed to save alias. Please try again.';
    } finally {
      // Re-enable save button
      const saveBtn = document.getElementById('alias-save-btn');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Alias';
      this.debug('Save button re-enabled');
    }
  }

  /**
   * Cancel alias creation
   */
  static cancelAliasCreation() {
    this.debug('Canceling alias creation...');
    
    const modal = document.getElementById('alias-modal');
    modal.style.display = 'none';

    // If user was signing in, use fallback display name
    if (this.currentUser && !this.userProfile) {
      this.debug('Using fallback profile for canceled alias creation');
      this.userProfile = {
        alias: this.currentUser.name || this.currentUser.email.split('@')[0],
        email: this.currentUser.email
      };
      this.updateUserDisplay();
    }
  }

  /**
   * Update user display in navigation
   */
  static updateUserDisplay() {
    this.debug('Updating user display...');
    
    const userInfo = document.getElementById('user-info');
    const userAlias = document.getElementById('user-alias');
    const signInButton = document.getElementById('google-signin-button');

    this.debug('DOM elements found:', {
      userInfo: !!userInfo,
      userAlias: !!userAlias,
      signInButton: !!signInButton
    });

    if (userInfo && userAlias && this.userProfile) {
      this.debug('Setting alias display:', this.userProfile.alias);
     userAlias.innerHTML = `
  <a href="profile.html" style="
    color: rgb(251, 225, 183);
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s ease;
    padding: 5px 10px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  " onmouseover="this.style.color='rgb(218, 165, 32)'; this.style.background='rgba(218, 165, 32, 0.1)'" 
     onmouseout="this.style.color='rgb(251, 225, 183)'; this.style.background='transparent'">
    👤 ${this.userProfile.alias}
  </a>
      userInfo.style.display = 'flex';
      
      if (signInButton) {
        signInButton.style.display = 'none';
      }

      this.debug('User display updated successfully');
    } else {
      this.debug('Could not update user display - missing elements or profile');
    }
  }

  /**
   * Show user as signed in
   */
  static showUserSignedIn() {
    this.debug('Showing user as signed in...');
    
    const userInfo = document.getElementById('user-info');
    const signInButton = document.getElementById('google-signin-button');

    if (userInfo) {
      userInfo.style.display = 'flex';
      this.debug('User info shown');
    }
    
    if (signInButton) {
      signInButton.style.display = 'none';
      this.debug('Sign-in button hidden');
    }
  }

  /**
   * Sign out user
   */
  static signOut() {
    try {
      this.debug('Starting sign out process...');
      
      // Clear user data
      this.currentUser = null;
      this.userProfile = null;
      
      // Clear session storage
      this.debug('Clearing session storage...');
      sessionStorage.removeItem('bazaargen_user');
      
      // Update UI
      this.debug('Updating UI for signed out state...');
      const userInfo = document.getElementById('user-info');
      const signInButton = document.getElementById('google-signin-button');
      
      if (userInfo) {
        userInfo.style.display = 'none';
      }
      
      if (signInButton) {
        signInButton.style.display = 'block';
      }

      // Trigger custom event
      this.debug('Triggering userSignedOut event...');
      document.dispatchEvent(new CustomEvent('userSignedOut'));

      this.debug('Sign out completed successfully');

      if (typeof Messages !== 'undefined') {
        Messages.showInfo('Signed out successfully');
      }

    } catch (error) {
      this.debug('Error signing out:', error);
      console.error('Error signing out:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Error signing out. Please refresh the page.');
      }
    }
  }

  /**
   * Check for existing session
   */
  static checkExistingSession() {
    try {
      this.debug('Checking for existing session...');
      
      const savedUser = sessionStorage.getItem('bazaargen_user');
      if (savedUser) {
        this.debug('Found saved user session');
        this.currentUser = JSON.parse(savedUser);
        this.debug('Restored user session:', this.currentUser.email);
        
        // Fetch user profile
        this.fetchUserProfile();
      } else {
        this.debug('No existing session found');
      }
    } catch (error) {
      this.debug('Error checking existing session:', error);
      console.error('Error checking existing session:', error);
      sessionStorage.removeItem('bazaargen_user');
    }
  }

  /**
   * Render Google Sign-In button
   */
  static renderSignInButton() {
    const buttonContainer = document.getElementById('google-signin-button');
    if (!buttonContainer) {
      this.debug('Sign-in button container not found');
      return;
    }

    this.debug('Rendering Google Sign-In button...');

    try {
      google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'medium',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
      
      this.debug('Google Sign-In button rendered successfully');
    } catch (error) {
      this.debug('Error rendering sign-in button:', error);
      console.error('Error rendering sign-in button:', error);
      
      // Fallback: create custom button
      this.debug('Creating fallback sign-in button...');
      buttonContainer.innerHTML = `
        <button onclick="GoogleAuth.promptSignIn()" class="google-signin-fallback" style="
          padding: 8px 16px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          background: white;
          color: #3c4043;
          font-family: 'Google Sans', Roboto, sans-serif;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          📧 Sign in with Google
        </button>
      `;
    }
  }

  /**
   * Prompt sign-in (fallback method)
   */
  static promptSignIn() {
    this.debug('Prompting sign-in via fallback method...');
    
    try {
      google.accounts.id.prompt();
      this.debug('Sign-in prompt triggered');
    } catch (error) {
      this.debug('Error prompting sign-in:', error);
      console.error('Error prompting sign-in:', error);
      if (typeof Messages !== 'undefined') {
        Messages.showError('Google sign-in is not available. Please refresh the page and try again.');
      }
    }
  }

  /**
   * Check if user is signed in
   */
  static isSignedIn() {
    const signedIn = this.currentUser !== null;
    this.debug('Checking if signed in:', signedIn);
    return signedIn;
  }

  /**
   * Get current user email
   */
  static getUserEmail() {
    const email = this.currentUser?.email || null;
    this.debug('Getting user email:', email);
    return email;
  }

  /**
   * Get current user display name
   */
  static getUserDisplayName() {
    const displayName = this.userProfile?.alias || this.currentUser?.name || this.currentUser?.email || 'User';
    this.debug('Getting user display name:', displayName);
    return displayName;
  }

  /**
   * Get current user profile
   */
  static getUserProfile() {
    this.debug('Getting user profile:', this.userProfile);
    return this.userProfile;
  }

  /**
   * Get authentication status info
   */
  static getAuthInfo() {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn(),
      currentUser: this.currentUser,
      userProfile: this.userProfile,
      debugMode: this.debugMode
    };
  }

  /**
   * Toggle debug mode
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debug('Debug mode toggled:', this.debugMode ? 'ON' : 'OFF');
    return this.debugMode;
  }
}

// Global functions for HTML onclick handlers
window.GoogleAuth = GoogleAuth;
window.signOut = () => GoogleAuth.signOut();
window.editAlias = () => GoogleAuth.showAliasCreationModal(false);
window.saveAlias = () => GoogleAuth.saveAlias();
window.cancelAliasCreation = () => GoogleAuth.cancelAliasCreation();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  GoogleAuth.debug('DOM loaded, initializing Google Auth...');
  GoogleAuth.init();
});

// Initialize immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GoogleAuth.init());
} else {
  GoogleAuth.init();
}

// Global debug functions
window.debugGoogleAuth = () => {
  console.log('=== Google Auth Debug Info ===');
  console.log('Auth Info:', GoogleAuth.getAuthInfo());
  console.log('Session Storage:', sessionStorage.getItem('bazaargen_user'));
};

window.toggleGoogleAuthDebug = () => {
  const newMode = GoogleAuth.toggleDebugMode();
  console.log('Google Auth debug mode:', newMode ? 'ENABLED' : 'DISABLED');
};

window.testGoogleAuth = async () => {
  console.log('=== Testing Google Auth ===');
  console.log('Is initialized:', GoogleAuth.isInitialized);
  console.log('Is signed in:', GoogleAuth.isSignedIn());
  console.log('User email:', GoogleAuth.getUserEmail());
  console.log('Display name:', GoogleAuth.getUserDisplayName());
  console.log('User profile:', GoogleAuth.getUserProfile());
};
