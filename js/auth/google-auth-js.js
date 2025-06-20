/**
 * Google Authentication Handler
 * Manages Google Sign-In functionality and user sessions
 */
class GoogleAuth {
  
  static CLIENT_ID = "208926605452-h7mj4nrcubf43pfi78vgql9o12lqnr0n.apps.googleusercontent.com";
  static currentUser = null;
  static currentUserData = null;
  static isEditingAlias = false;
  static isInitialized = false;

  /**
   * Initialize Google Sign-In
   */
  static init() {
    if (this.isInitialized) return;

    window.onload = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback: (response) => this.handleCredentialResponse(response)
        });

        // Render the sign-in button
        const signInButton = document.getElementById("google-signin-button");
        if (signInButton) {
          google.accounts.id.renderButton(signInButton, {
            type: "standard",
            size: "medium",
            theme: "outline",
            text: "sign_in_with",
            shape: "rectangular",
            logo_alignment: "left"
          });
        }

        this.checkExistingSession();
        this.isInitialized = true;
      } else {
        console.warn('Google Sign-In library not loaded');
      }
    };
  }

  /**
   * Handle Google credential response
   * @param {Object} response - Google credential response
   */
  static async handleCredentialResponse(response) {
    try {
      const responsePayload = this.decodeJwtResponse(response.credential);
      console.log("User signed in:", responsePayload.email);
      this.currentUser = responsePayload;

      // Sign in to Supabase with the Google credential
      if (window.SupabaseClient) {
        const { data: supabaseUser, error: authError } = await SupabaseClient.client.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (authError) {
          console.error('Supabase auth error:', authError);
        }
      }

      // Check if user exists in database
      const existingUser = await this.getUserFromDatabase(responsePayload.sub);
      
      if (existingUser) {
        this.currentUserData = existingUser;
        this.showUserInfo(existingUser.alias);
      } else {
        this.showAliasModal();
      }
    } catch (error) {
      console.error('Error handling sign-in:', error);
      Messages.showError('Sign-in failed. Please try again.');
    }
  }

  /**
   * Decode JWT response from Google
   * @param {string} token - JWT token
   * @returns {Object} Decoded user information
   */
  static decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  /**
   * Show alias creation/editing modal
   * @param {boolean} isEditing - Whether this is editing an existing alias
   */
  static showAliasModal(isEditing = false) {
    const modal = document.getElementById('alias-modal');
    const input = document.getElementById('alias-input');
    const error = document.getElementById('alias-error');
    const title = document.getElementById('alias-modal-title');
    const description = document.getElementById('alias-modal-description');
    const saveBtn = document.getElementById('alias-save-btn');
    const cancelBtn = document.getElementById('alias-cancel-btn');
    
    if (!modal) {
      console.warn('Alias modal not found in DOM');
      return;
    }
    
    this.isEditingAlias = isEditing;
    
    if (isEditing) {
      title.textContent = 'Edit Your Alias';
      description.textContent = 'Change your display name';
      input.value = this.currentUserData?.alias || '';
      saveBtn.textContent = 'Update Alias';
      cancelBtn.textContent = 'Cancel';
    } else {
      title.textContent = 'Welcome to BazaarGen!';
      description.textContent = 'Choose an alias to display on the site';
      input.value = '';
      saveBtn.textContent = 'Save Alias';
      cancelBtn.textContent = 'Cancel';
    }
    
    // Clear previous errors
    error.textContent = '';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on input
    setTimeout(() => input.focus(), 100);
    
    // Handle Enter key
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        this.saveAlias();
      }
    };
  }

  /**
   * Save user alias
   */
  static async saveAlias() {
    const input = document.getElementById('alias-input');
    const error = document.getElementById('alias-error');
    const alias = input.value.trim();
    
    // Clear previous errors
    error.textContent = '';
    
    // Validate alias
    const validation = Validation.validateAlias(alias);
    if (!validation.valid) {
      error.textContent = validation.error;
      return;
    }

    try {
      // Check if alias is already taken (skip check if editing and using same alias)
      if (!this.isEditingAlias || alias !== this.currentUserData?.alias) {
        if (window.SupabaseClient) {
          const { data: existingAlias } = await SupabaseClient.client
            .from('users')
            .select('id')
            .eq('alias', alias)
            .maybeSingle();

          if (existingAlias) {
            error.textContent = 'Alias is already taken';
            return;
          }
        }
      }

      let data, dbError;

      if (this.isEditingAlias) {
        // Update existing user
        if (window.SupabaseClient) {
          const result = await SupabaseClient.client
            .from('users')
            .update({ alias: alias })
            .eq('id', this.currentUserData.id)
            .select()
            .single();
          
          data = result.data;
          dbError = result.error;
        }
      } else {
        // Create new user
        if (window.SupabaseClient) {
          const result = await SupabaseClient.client
            .from('users')
            .upsert([
              {
                google_id: this.currentUser.sub,
                alias: alias,
                email: this.currentUser.email,
                avatar_url: this.currentUser.picture
              }
            ], {
              onConflict: 'google_id',
              ignoreDuplicates: false
            })
            .select()
            .single();
          
          data = result.data;
          dbError = result.error;
        }
      }

      if (dbError) {
        throw dbError;
      }

      // Success - hide modal and show user info
      document.getElementById('alias-modal').style.display = 'none';
      this.currentUserData = data;
      this.showUserInfo(alias);
      
      Messages.showSuccess(`Alias ${this.isEditingAlias ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Error saving user:', error);
      error.textContent = 'Error saving alias. Please try again.';
    }
  }

  /**
   * Cancel alias creation/editing
   */
  static cancelAliasCreation() {
    if (this.isEditingAlias) {
      // Just hide the modal when editing
      document.getElementById('alias-modal').style.display = 'none';
    } else {
      // Hide modal and sign out user for new user registration
      document.getElementById('alias-modal').style.display = 'none';
      this.signOut();
    }
  }

  /**
   * Edit current user's alias
   */
  static editAlias() {
    if (this.currentUserData) {
      this.showAliasModal(true);
    }
  }

  /**
   * Show user information in UI
   * @param {string} alias - User's alias
   */
  static showUserInfo(alias) {
    // Hide sign-in button
    const signInButton = document.getElementById('google-signin-button');
    if (signInButton) {
      signInButton.style.display = 'none';
    }
    
    // Show user info with alias
    const userInfo = document.getElementById('user-info');
    const userAlias = document.getElementById('user-alias');
    
    if (userInfo && userAlias) {
      userAlias.textContent = alias;
      userAlias.onclick = () => this.editAlias();
      userInfo.style.display = 'flex';
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      // Clear Google session
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
      
      // Sign out from Supabase
      if (window.SupabaseClient) {
        await SupabaseClient.client.auth.signOut();
      }
      
      // Clear local state
      this.currentUser = null;
      this.currentUserData = null;
      
      // Hide user info and show sign-in button
      const userInfo = document.getElementById('user-info');
      const signInButton = document.getElementById('google-signin-button');
      
      if (userInfo) {
        userInfo.style.display = 'none';
      }
      
      if (signInButton) {
        signInButton.style.display = 'block';
      }
      
      Messages.showInfo('Signed out successfully');
      
    } catch (error) {
      console.error('Error during sign out:', error);
      Messages.showError('Error signing out. Please refresh the page.');
    }
  }

  /**
   * Get user from database by Google ID
   * @param {string} googleId - User's Google ID
   * @returns {Object|null} User data or null
   */
  static async getUserFromDatabase(googleId) {
    try {
      if (window.SupabaseClient) {
        const { data, error } = await SupabaseClient.client
          .from('users')
          .select('*')
          .eq('google_id', googleId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Check for existing authentication session
   */
  static async checkExistingSession() {
    try {
      if (window.SupabaseClient) {
        const { data: { session }, error } = await SupabaseClient.client.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          return;
        }
        
        if (session && session.user) {
          // User is already signed in
          const googleId = session.user.user_metadata?.sub || session.user.user_metadata?.provider_id;
          if (googleId) {
            const userData = await this.getUserFromDatabase(googleId);
            if (userData) {
              this.currentUserData = userData;
              this.showUserInfo(userData.alias);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  }

  /**
   * Get current user information
   * @returns {Object|null} Current user data
   */
  static getCurrentUser() {
    return this.currentUserData;
  }

  /**
   * Check if user is signed in
   * @returns {boolean} Whether user is signed in
   */
  static isSignedIn() {
    return this.currentUser !== null && this.currentUserData !== null;
  }

  /**
   * Get user's display name
   * @returns {string} User's alias or 'Anonymous'
   */
  static getUserDisplayName() {
    return this.currentUserData?.alias || 'Anonymous';
  }

  /**
   * Setup authentication event listeners
   */
  static setupEventListeners() {
    // Listen for auth state changes from Supabase
    if (window.SupabaseClient) {
      SupabaseClient.client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        } else if (event === 'SIGNED_IN' && session) {
          this.handleSignIn(session);
        }
      });
    }

    // Setup global functions for HTML onclick handlers
    window.signOut = () => this.signOut();
    window.editAlias = () => this.editAlias();
    window.saveAlias = () => this.saveAlias();
    window.cancelAliasCreation = () => this.cancelAliasCreation();
  }

  /**
   * Handle sign in event
   * @param {Object} session - Supabase session
   */
  static async handleSignIn(session) {
    if (session.user) {
      const googleId = session.user.user_metadata?.sub || session.user.user_metadata?.provider_id;
      if (googleId) {
        const userData = await this.getUserFromDatabase(googleId);
        if (userData) {
          this.currentUserData = userData;
          this.showUserInfo(userData.alias);
        }
      }
    }
  }

  /**
   * Handle sign out event
   */
  static handleSignOut() {
    this.currentUser = null;
    this.currentUserData = null;
    
    const userInfo = document.getElementById('user-info');
    const signInButton = document.getElementById('google-signin-button');
    
    if (userInfo) {
      userInfo.style.display = 'none';
    }
    
    if (signInButton) {
      signInButton.style.display = 'block';
    }
  }

  /**
   * Debug authentication state
   */
  static async debugAuth() {
    if (window.SupabaseClient) {
      const { data: { session } } = await SupabaseClient.client.auth.getSession();
      console.log('Debug Auth - Session:', session);
      console.log('Debug Auth - User ID:', session?.user?.id);
      console.log('Debug Auth - Google User:', this.currentUser);
      console.log('Debug Auth - Current User Data:', this.currentUserData);
    }
  }
}

// Auto-initialize and setup
GoogleAuth.init();
GoogleAuth.setupEventListeners();