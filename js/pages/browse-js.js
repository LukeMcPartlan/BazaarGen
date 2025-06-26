static async createCommentsSection(itemId) {
  const commentsContainer = document.createElement('div');
  commentsContainer.className = 'comments-section';
  // Use the same styling as defined in CSS instead of inline white background
  
  // Comments header with proper theming
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
  header.innerHTML = `
    <h4 style="margin: 0; color: rgb(251, 225, 183); font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">Comments</h4>
    <button class="toggle-comments-btn">Show/Hide</button>
  `;

  // Comments list with proper theming
  const commentsList = document.createElement('div');
  commentsList.className = 'comments-list';
  commentsList.id = `comments-${itemId}`;
  commentsList.style.display = 'none'; // Start hidden

  // Add comment form with proper theming
  const commentForm = document.createElement('div');
  commentForm.className = 'comment-form';
  commentForm.style.display = 'none'; // Start hidden
  
  if (window.GoogleAuth && GoogleAuth.isSignedIn()) {
    commentForm.innerHTML = `
      <div style="display: flex; gap: 10px; margin-top: 15px; border-top: 2px solid rgb(218, 165, 32); padding-top: 15px;">
        <input type="text" 
               id="comment-input-${itemId}" 
               placeholder="Add a comment..." 
               class="comment-form-input">
        <button onclick="BrowsePageController.addComment('${itemId}')" 
                class="comment-form-button">
          Post
        </button>
      </div>
    `;
  } else {
    commentForm.innerHTML = `
      <div style="text-align: center; padding: 20px; color: rgb(251, 225, 183); font-style: italic; background: linear-gradient(135deg, rgba(74, 60, 46, 0.5) 0%, rgba(89, 72, 51, 0.4) 100%); border-radius: 8px; border: 2px dashed rgba(218, 165, 32, 0.5); text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
        Sign in to comment
      </div>
    `;
  }

  // Load comments
  await this.loadComments(itemId, commentsList);

  // Toggle functionality with improved UX
  const toggleBtn = header.querySelector('.toggle-comments-btn');
  let isExpanded = false;
  
  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    commentsList.style.display = isExpanded ? 'block' : 'none';
    commentForm.style.display = isExpanded ? 'block' : 'none';
    toggleBtn.textContent = isExpanded ? 'Hide' : 'Show';
    
    // Update container width when expanded
    if (isExpanded) {
      commentsContainer.style.transition = 'width 0.3s ease';
    }
  });

  commentsContainer.appendChild(header);
  commentsContainer.appendChild(commentsList);
  commentsContainer.appendChild(commentForm);

  return commentsContainer;
}
