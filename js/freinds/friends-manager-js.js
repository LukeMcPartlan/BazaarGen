/**
 * Friends System Manager
 * Handles all friend-related operations
 */
class FriendsManager {
  static debugMode = true;

  /**
   * Debug logging function
   */
  static debug(message, data = null) {
    if (this.debugMode) {
      console.log(`[FriendsManager] ${message}`, data || '');
    }
  }

  /**
   * Send a friend request to another user
   * @param {string} friendEmail - Email of user to befriend
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async sendFriendRequest(friendEmail) {
    try {
      this.debug('Sending friend request to:', friendEmail);

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to send friend requests');
      }

      if (!friendEmail || friendEmail.trim() === '') {
        throw new Error('Friend email is required');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('send_friend_request', { friend_email: friendEmail.trim() });

      this.debug('Friend request result:', { data, error });

      if (error) {
        throw error;
      }

      const result = data[0];
      this.debug('Friend request response:', result);

      if (result.success) {
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(result.message);
        }
        
        // Trigger custom event for UI updates
        document.dispatchEvent(new CustomEvent('friendRequestSent', {
          detail: { friendEmail, friendshipId: result.friendship_id }
        }));
      } else {
        if (typeof Messages !== 'undefined') {
          Messages.showWarning(result.message);
        }
      }

      return {
        success: result.success,
        message: result.message,
        friendshipId: result.friendship_id
      };

    } catch (error) {
      this.debug('Error sending friend request:', error);
      console.error('Error sending friend request:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to send friend request: ' + error.message);
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Respond to a friend request (accept, decline, or block)
   * @param {number} friendshipId - ID of the friendship record
   * @param {string} response - 'accepted', 'declined', or 'blocked'
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async respondToFriendRequest(friendshipId, response) {
    try {
      this.debug(`Responding to friend request ${friendshipId} with:`, response);

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to respond to friend requests');
      }

      if (!['accepted', 'declined', 'blocked'].includes(response)) {
        throw new Error('Invalid response. Must be: accepted, declined, or blocked');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('respond_to_friend_request', { 
          friendship_id: friendshipId, 
          response: response 
        });

      this.debug('Friend request response result:', { data, error });

      if (error) {
        throw error;
      }

      const result = data[0];
      this.debug('Friend request response:', result);

      if (result.success) {
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(result.message);
        }
        
        // Trigger custom event for UI updates
        document.dispatchEvent(new CustomEvent('friendRequestResponded', {
          detail: { friendshipId, response, success: true }
        }));
      } else {
        if (typeof Messages !== 'undefined') {
          Messages.showError(result.message);
        }
      }

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
      this.debug('Error responding to friend request:', error);
      console.error('Error responding to friend request:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to respond to friend request: ' + error.message);
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current user's friends list
   * @param {string} userEmail - Optional: get friends of specific user (defaults to current user)
   * @returns {Promise<Array>} Array of friend objects
   */
  static async getFriends(userEmail = null) {
    try {
      this.debug('Getting friends for user:', userEmail || 'current user');

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to get friends');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('get_user_friends', userEmail ? { user_email_param: userEmail } : {});

      this.debug('Get friends result:', { data, error });

      if (error) {
        throw error;
      }

      this.debug('Retrieved friends:', data?.length || 0);
      return data || [];

    } catch (error) {
      this.debug('Error getting friends:', error);
      console.error('Error getting friends:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load friends: ' + error.message);
      }
      
      return [];
    }
  }

  /**
   * Get pending friend requests for current user
   * @returns {Promise<Array>} Array of pending friend request objects
   */
  static async getPendingFriendRequests() {
    try {
      this.debug('Getting pending friend requests...');

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to get friend requests');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('get_pending_friend_requests');

      this.debug('Get pending requests result:', { data, error });

      if (error) {
        throw error;
      }

      this.debug('Retrieved pending requests:', data?.length || 0);
      return data || [];

    } catch (error) {
      this.debug('Error getting pending friend requests:', error);
      console.error('Error getting pending friend requests:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to load friend requests: ' + error.message);
      }
      
      return [];
    }
  }

  /**
   * Search for users to add as friends
   * @param {string} searchTerm - Search term (alias or email)
   * @param {number} limit - Maximum number of results (default: 20)
   * @returns {Promise<Array>} Array of user objects with friendship status
   */
  static async searchUsers(searchTerm, limit = 20) {
    try {
      this.debug('Searching users with term:', searchTerm);

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to search users');
      }

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('search_users', { 
          search_term: searchTerm.trim(), 
          limit_count: limit 
        });

      this.debug('Search users result:', { data, error });

      if (error) {
        throw error;
      }

      this.debug('Found users:', data?.length || 0);
      return data || [];

    } catch (error) {
      this.debug('Error searching users:', error);
      console.error('Error searching users:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to search users: ' + error.message);
      }
      
      return [];
    }
  }

  /**
   * Check if two users are friends
   * @param {string} userEmail1 - First user's email
   * @param {string} userEmail2 - Second user's email  
   * @returns {Promise<boolean>} True if users are friends
   */
  static async areUsersFriends(userEmail1, userEmail2) {
    try {
      this.debug('Checking if users are friends:', { userEmail1, userEmail2 });

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('are_users_friends', { 
          user1_email: userEmail1, 
          user2_email: userEmail2 
        });

      this.debug('Are friends result:', { data, error });

      if (error) {
        throw error;
      }

      const areFriends = data === true;
      this.debug('Users are friends:', areFriends);
      return areFriends;

    } catch (error) {
      this.debug('Error checking friendship:', error);
      console.error('Error checking friendship:', error);
      return false;
    }
  }

  /**
   * Unfriend a user
   * @param {string} friendEmail - Email of friend to unfriend
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async unfriendUser(friendEmail) {
    try {
      this.debug('Unfriending user:', friendEmail);

      if (!SupabaseClient || !SupabaseClient.isReady()) {
        throw new Error('Database not available');
      }

      if (!GoogleAuth || !GoogleAuth.isSignedIn()) {
        throw new Error('Must be signed in to unfriend users');
      }

      // Confirm with user
      const confirmed = await new Promise((resolve) => {
        if (typeof Messages !== 'undefined' && Messages.showConfirmation) {
          Messages.showConfirmation(
            `Are you sure you want to unfriend this user? This action cannot be undone.`,
            () => resolve(true),
            () => resolve(false)
          );
        } else {
          resolve(confirm('Are you sure you want to unfriend this user?'));
        }
      });

      if (!confirmed) {
        return { success: false, message: 'Unfriend cancelled' };
      }

      // Call the database function
      const { data, error } = await SupabaseClient.supabase
        .rpc('unfriend_user', { friend_email: friendEmail });

      this.debug('Unfriend result:', { data, error });

      if (error) {
        throw error;
      }

      const result = data[0];
      this.debug('Unfriend response:', result);

      if (result.success) {
        if (typeof Messages !== 'undefined') {
          Messages.showSuccess(result.message);
        }
        
        // Trigger custom event for UI updates
        document.dispatchEvent(new CustomEvent('userUnfriended', {
          detail: { friendEmail }
        }));
      } else {
        if (typeof Messages !== 'undefined') {
          Messages.showError(result.message);
        }
      }

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
      this.debug('Error unfriending user:', error);
      console.error('Error unfriending user:', error);
      
      if (typeof Messages !== 'undefined') {
        Messages.showError('Failed to unfriend user: ' + error.message);
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Get friends count for a user
   * @param {string} userEmail - User's email (optional, defaults to current user)
   * @returns {Promise<number>} Number of friends
   */
  static async getFriendsCount(userEmail = null) {
    try {
      const friends = await this.getFriends(userEmail);
      return friends.length;
    } catch (error) {
      this.debug('Error getting friends count:', error);
      return 0;
    }
  }

  /**
   * Get friend requests count for current user
   * @returns {Promise<number>} Number of pending friend requests
   */
  static async getFriendRequestsCount() {
    try {
      const requests = await this.getPendingFriendRequests();
      return requests.length;
    } catch (error) {
      this.debug('Error getting friend requests count:', error);
      return 0;
    }
  }

  /**
   * Accept a friend request by requester email (alternative to using friendship ID)
   * @param {string} requesterEmail - Email of user who sent the request
   * @returns {Promise<Object>} Result object
   */
  static async acceptFriendRequestByEmail(requesterEmail) {
    try {
      this.debug('Accepting friend request from:', requesterEmail);

      // Get pending requests to find the friendship ID
      const pendingRequests = await this.getPendingFriendRequests();
      const request = pendingRequests.find(req => req.requester_email === requesterEmail);

      if (!request) {
        throw new Error('No pending friend request found from this user');
      }

      return await this.respondToFriendRequest(request.request_id, 'accepted');

    } catch (error) {
      this.debug('Error accepting friend request by email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Decline a friend request by requester email
   * @param {string} requesterEmail - Email of user who sent the request
   * @returns {Promise<Object>} Result object
   */
  static async declineFriendRequestByEmail(requesterEmail) {
    try {
      this.debug('Declining friend request from:', requesterEmail);

      const pendingRequests = await this.getPendingFriendRequests();
      const request = pendingRequests.find(req => req.requester_email === requesterEmail);

      if (!request) {
        throw new Error('No pending friend request found from this user');
      }

      return await this.respondToFriendRequest(request.request_id, 'declined');

    } catch (error) {
      this.debug('Error declining friend request by email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Block a user by requester email
   * @param {string} requesterEmail - Email of user to block
   * @returns {Promise<Object>} Result object
   */
  static async blockUserByEmail(requesterEmail) {
    try {
      this.debug('Blocking user:', requesterEmail);

      const pendingRequests = await this.getPendingFriendRequests();
      const request = pendingRequests.find(req => req.requester_email === requesterEmail);

      if (!request) {
        throw new Error('No pending friend request found from this user');
      }

      return await this.respondToFriendRequest(request.request_id, 'blocked');

    } catch (error) {
      this.debug('Error blocking user by email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Setup event listeners for friends system
   */
  static setupEventListeners() {
    this.debug('Setting up friends system event listeners...');

    // Listen for auth changes to clear friends data
    document.addEventListener('userSignedOut', () => {
      this.debug('User signed out, clearing friends data');
      // Clear any cached friends data here if needed
    });

    this.debug('Friends system event listeners setup complete');
  }

  /**
   * Toggle debug mode
   */
  static toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.debug('Debug mode toggled:', this.debugMode ? 'ON' : 'OFF');
    return this.debugMode;
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    return {
      debugMode: this.debugMode,
      supabaseReady: SupabaseClient?.isReady() || false,
      userSignedIn: GoogleAuth?.isSignedIn() || false,
      currentUser: GoogleAuth?.getUserEmail() || null
    };
  }
}

// Setup event listeners when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  FriendsManager.setupEventListeners();
});

// Make available globally
window.FriendsManager = FriendsManager;

// Global convenience functions
window.sendFriendRequest = (email) => FriendsManager.sendFriendRequest(email);
window.acceptFriendRequest = (id) => FriendsManager.respondToFriendRequest(id, 'accepted');
window.declineFriendRequest = (id) => FriendsManager.respondToFriendRequest(id, 'declined');
window.blockUser = (id) => FriendsManager.respondToFriendRequest(id, 'blocked');
window.unfriendUser = (email) => FriendsManager.unfriendUser(email);

// Global debug function
window.debugFriends = () => {
  console.log('=== Friends System Debug Info ===');
  console.log('Debug Info:', FriendsManager.getDebugInfo());
  
  // Test some functions if user is signed in
  if (GoogleAuth?.isSignedIn()) {
    console.log('Testing friends functions...');
    
    FriendsManager.getFriends().then(friends => {
      console.log('Current friends:', friends);
    });
    
    FriendsManager.getPendingFriendRequests().then(requests => {
      console.log('Pending requests:', requests);
    });
  }
};