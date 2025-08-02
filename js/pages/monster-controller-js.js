/**
 * Monster Controller
 * Handles monster creation, board management, and interactions
 */
class MonsterController {
    static isInitialized = false;
    static currentMonster = null;
    static selectedSlot = null;
    static boardSlots = [];
    static skillSlots = [];

    /**
     * Initialize the monster controller
     */
    static init() {
        if (this.isInitialized) return;
        
        console.log('🐉 Initializing Monster Controller...');
        
        this.setupEventListeners();
        this.initializeBoard();
        this.initializeSkillSlots();
        
        this.isInitialized = true;
        console.log('✅ Monster Controller initialized');
    }

    /**
     * Setup event listeners
     */
    static setupEventListeners() {
        // Create monster button
        const createBtn = document.getElementById('createMonsterBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createMonster());
        }

        // Prepare export button
        const exportBtn = document.getElementById('prepareExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.prepareForExport());
        }

        // Monster image input
        const imageInput = document.getElementById('monsterImageInput');
        if (imageInput) {
            imageInput.addEventListener('change', () => this.handleImageUpload());
        }

        // Form inputs for live preview
        const inputs = ['monsterNameInput', 'monsterHealthInput', 'monsterGoldInput', 'monsterExpInput'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.updatePreview());
            }
        });
    }

    /**
     * Initialize the item board
     */
    static initializeBoard() {
        const preview = document.getElementById('monsterPreview');
        if (!preview) return;

        // Create board container
        const boardContainer = document.createElement('div');
        boardContainer.className = 'item-board-container';
        
        const board = document.createElement('div');
        board.className = 'item-board';
        board.id = 'itemBoard';

        // Create 10 board slots
        for (let i = 0; i < 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'board-slot';
            slot.dataset.slotIndex = i;
            slot.innerHTML = `Slot ${i + 1}`;
            slot.addEventListener('click', () => this.openItemSelection(i));
            
            this.boardSlots[i] = {
                element: slot,
                item: null,
                slotsUsed: 0
            };
            
            board.appendChild(slot);
        }

        boardContainer.appendChild(board);
        preview.appendChild(boardContainer);
    }

    /**
     * Initialize skill slots
     */
    static initializeSkillSlots() {
        const preview = document.getElementById('monsterPreview');
        if (!preview) return;

        // Create monster frame and image
        const frameContainer = document.createElement('div');
        frameContainer.className = 'monster-frame-container';
        
        const frame = document.createElement('div');
        frame.className = 'monster-frame';
        frame.id = 'monsterFrame';
        
        const image = document.createElement('img');
        image.className = 'monster-image';
        image.id = 'monsterImage';
        image.src = 'images/characters/default.png';
        image.alt = 'Monster';
        
        frame.appendChild(image);
        frameContainer.appendChild(frame);

        // Create skill slots container
        const skillContainer = document.createElement('div');
        skillContainer.className = 'skill-slots-container';
        
        // Create 6 skill slots (3 left, 3 right)
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.dataset.skillIndex = i;
            slot.innerHTML = '⚡';
            slot.addEventListener('click', () => this.openSkillSelection(i));
            
            this.skillSlots[i] = {
                element: slot,
                skill: null
            };
            
            skillContainer.appendChild(slot);
        }

        // Create health bar
        const healthContainer = document.createElement('div');
        healthContainer.className = 'health-bar-container';
        
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.id = 'healthBar';
        
        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        healthFill.id = 'healthFill';
        
        const healthText = document.createElement('div');
        healthText.className = 'health-text';
        healthText.id = 'healthText';
        healthText.textContent = '100/100';
        
        // Create coin and exp displays
        const coinDisplay = document.createElement('div');
        coinDisplay.className = 'coin-display';
        coinDisplay.id = 'coinDisplay';
        
        const expDisplay = document.createElement('div');
        expDisplay.className = 'exp-display';
        expDisplay.id = 'expDisplay';
        
        healthBar.appendChild(healthFill);
        healthBar.appendChild(healthText);
        healthBar.appendChild(coinDisplay);
        healthBar.appendChild(expDisplay);
        healthContainer.appendChild(healthBar);

        // Insert elements into preview
        preview.insertBefore(frameContainer, preview.firstChild);
        preview.insertBefore(skillContainer, frameContainer.nextSibling);
        preview.insertBefore(healthContainer, skillContainer.nextSibling);
    }

    /**
     * Create a new monster
     */
    static createMonster() {
        const name = document.getElementById('monsterNameInput')?.value || 'Monster';
        const health = parseInt(document.getElementById('monsterHealthInput')?.value) || 100;
        const gold = parseInt(document.getElementById('monsterGoldInput')?.value) || 0;
        const exp = parseInt(document.getElementById('monsterExpInput')?.value) || 0;

        this.currentMonster = {
            name: name,
            health: health,
            maxHealth: health,
            gold: gold,
            exp: exp,
            image: null,
            skills: new Array(6).fill(null),
            items: new Array(10).fill(null),
            boardSlotsUsed: 0
        };

        this.updatePreview();
        this.updateHealthBar();
        this.updateCoinDisplay();
        this.updateExpDisplay();

        if (typeof Messages !== 'undefined') {
            Messages.showSuccess('Monster created successfully!');
        }
    }

    /**
     * Handle monster image upload
     */
    static async handleImageUpload() {
        const input = document.getElementById('monsterImageInput');
        if (!input?.files?.[0]) return;

        try {
            const file = input.files[0];
            let imageUrl;

            // Try to upload to storage if available
            if (typeof ImageStorage !== 'undefined' && ImageStorage.uploadImage) {
                imageUrl = await ImageStorage.uploadImage(file, 'monster', 'monster');
            } else {
                // Fallback to base64
                imageUrl = await this.readImageFile(file);
            }

            const monsterImage = document.getElementById('monsterImage');
            if (monsterImage) {
                monsterImage.src = imageUrl;
            }

            if (this.currentMonster) {
                this.currentMonster.image = imageUrl;
            }

        } catch (error) {
            console.error('Failed to upload monster image:', error);
            if (typeof Messages !== 'undefined') {
                Messages.showError('Failed to upload monster image');
            }
        }
    }

    /**
     * Read image file as data URL (fallback method)
     */
    static readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Update the monster preview
     */
    static updatePreview() {
        if (!this.currentMonster) return;

        const name = document.getElementById('monsterNameInput')?.value || 'Monster';
        const health = parseInt(document.getElementById('monsterHealthInput')?.value) || 100;
        const gold = parseInt(document.getElementById('monsterGoldInput')?.value) || 0;
        const exp = parseInt(document.getElementById('monsterExpInput')?.value) || 0;

        this.currentMonster.name = name;
        this.currentMonster.health = health;
        this.currentMonster.maxHealth = health;
        this.currentMonster.gold = gold;
        this.currentMonster.exp = exp;

        this.updateHealthBar();
        this.updateCoinDisplay();
        this.updateExpDisplay();
    }

    /**
     * Update the health bar
     */
    static updateHealthBar() {
        if (!this.currentMonster) return;

        const healthFill = document.getElementById('healthFill');
        const healthText = document.getElementById('healthText');

        if (healthFill && healthText) {
            const percentage = (this.currentMonster.health / this.currentMonster.maxHealth) * 100;
            healthFill.style.width = `${percentage}%`;
            healthText.textContent = `${this.currentMonster.health}/${this.currentMonster.maxHealth}`;
        }
    }

    /**
     * Update coin display
     */
    static updateCoinDisplay() {
        if (!this.currentMonster) return;

        const coinDisplay = document.getElementById('coinDisplay');
        if (!coinDisplay) return;

        coinDisplay.innerHTML = '';
        
        // Create coin nodes (2 empty nodes + coin count)
        const totalNodes = this.currentMonster.gold + 2;
        
        for (let i = 0; i < totalNodes; i++) {
            const node = document.createElement('div');
            node.className = 'coin-node';
            
            if (i > 0 && i < totalNodes - 1) {
                // This is a coin position
                const coin = document.createElement('img');
                coin.src = 'images/keywords/effects/value.PNG'; // Using value.png as placeholder
                coin.alt = 'Coin';
                node.appendChild(coin);
            }
            
            coinDisplay.appendChild(node);
        }
    }

    /**
     * Update exp display
     */
    static updateExpDisplay() {
        if (!this.currentMonster) return;

        const expDisplay = document.getElementById('expDisplay');
        if (!expDisplay) return;

        expDisplay.innerHTML = '';
        
        // Create exp nodes (2 empty nodes + exp count)
        const totalNodes = this.currentMonster.exp + 2;
        
        for (let i = 0; i < totalNodes; i++) {
            const node = document.createElement('div');
            node.className = 'exp-node';
            
            if (i > 0 && i < totalNodes - 1) {
                // This is an exp position
                const exp = document.createElement('img');
                exp.src = 'images/keywords/effects/charge.PNG'; // Using charge.png as placeholder
                exp.alt = 'Experience';
                node.appendChild(exp);
            }
            
            expDisplay.appendChild(node);
        }
    }

    /**
     * Open item selection modal
     */
    static async openItemSelection(slotIndex) {
        this.selectedSlot = slotIndex;
        
        // Check if slot can accept items
        const availableSlots = 10 - this.currentMonster?.boardSlotsUsed || 0;
        if (availableSlots <= 0) {
            if (typeof Messages !== 'undefined') {
                Messages.showError('No space available on the board!');
            }
            return;
        }

        const modal = document.getElementById('itemSelectionModal');
        const content = document.getElementById('itemSelectionContent');
        
        if (modal && content) {
            // Show loading
            content.innerHTML = '<div style="text-align: center; color: rgb(251, 225, 183);">Loading items...</div>';
            modal.style.display = 'flex';
            
            try {
                // Load items from database
                const items = await this.loadItemsForSelection();
                
                // Create browse interface
                content.innerHTML = this.createItemBrowseInterface(items, availableSlots);
                
                // Setup browse functionality
                this.setupItemBrowseFunctionality();
                
            } catch (error) {
                console.error('Failed to load items:', error);
                content.innerHTML = `
                    <div style="text-align: center; color: rgb(251, 225, 183);">
                        <p>Failed to load items. Please try again.</p>
                        <button onclick="MonsterController.addTestItem(${slotIndex})" 
                                style="background: rgb(218, 165, 32); color: rgb(37, 26, 12); 
                                       padding: 10px 20px; border: none; border-radius: 5px; 
                                       cursor: pointer; font-weight: bold;">
                            Add Test Item
                        </button>
                    </div>
                `;
            }
        }
    }

    /**
     * Open skill selection modal
     */
    static async openSkillSelection(skillIndex) {
        this.selectedSlot = skillIndex;
        
        const modal = document.getElementById('skillSelectionModal');
        const content = document.getElementById('skillSelectionContent');
        
        if (modal && content) {
            // Show loading
            content.innerHTML = '<div style="text-align: center; color: rgb(251, 225, 183);">Loading skills...</div>';
            modal.style.display = 'flex';
            
            try {
                // Load skills from database
                const skills = await this.loadSkillsForSelection();
                
                // Create browse interface
                content.innerHTML = this.createSkillBrowseInterface(skills);
                
                // Setup browse functionality
                this.setupSkillBrowseFunctionality();
                
            } catch (error) {
                console.error('Failed to load skills:', error);
                content.innerHTML = `
                    <div style="text-align: center; color: rgb(251, 225, 183);">
                        <p>Failed to load skills. Please try again.</p>
                        <button onclick="MonsterController.addTestSkill(${skillIndex})" 
                                style="background: rgb(218, 165, 32); color: rgb(37, 26, 12); 
                                       padding: 10px 20px; border: none; border-radius: 5px; 
                                       cursor: pointer; font-weight: bold;">
                            Add Test Skill
                        </button>
                    </div>
                `;
            }
        }
    }

    /**
     * Add a test item to the board
     */
    static addTestItem(slotIndex) {
        if (!this.currentMonster) return;

        const item = {
            name: 'Test Item',
            image: 'images/characters/default.png',
            border: 'gold',
            size: 'Medium', // 2 slots
            slotsUsed: 2
        };

        // Check if we have enough space
        if (this.currentMonster.boardSlotsUsed + item.slotsUsed > 10) {
            if (typeof Messages !== 'undefined') {
                Messages.showError('Not enough space on the board!');
            }
            return;
        }

        // Add item to the board
        this.currentMonster.items[slotIndex] = item;
        this.currentMonster.boardSlotsUsed += item.slotsUsed;

        // Update the board slot
        const slot = this.boardSlots[slotIndex];
        if (slot) {
            slot.element.className = 'board-slot filled';
            slot.element.innerHTML = `<img src="${item.image}" class="board-item" alt="${item.name}">`;
            slot.item = item;
            slot.slotsUsed = item.slotsUsed;
        }

        this.closeItemModal();
        
        if (typeof Messages !== 'undefined') {
            Messages.showSuccess('Test item added!');
        }
    }

    /**
     * Add a test skill
     */
    static addTestSkill(skillIndex) {
        if (!this.currentMonster) return;

        const skill = {
            name: 'Test Skill',
            image: 'images/characters/default.png',
            border: 'gold'
        };

        // Add skill to the monster
        this.currentMonster.skills[skillIndex] = skill;

        // Update the skill slot
        const slot = this.skillSlots[skillIndex];
        if (slot) {
            slot.element.className = 'skill-slot filled';
            slot.element.innerHTML = `<img src="${skill.image}" alt="${skill.name}">`;
            slot.skill = skill;
        }

        this.closeSkillModal();
        
        if (typeof Messages !== 'undefined') {
            Messages.showSuccess('Test skill added!');
        }
    }

    /**
     * Close item selection modal
     */
    static closeItemModal() {
        const modal = document.getElementById('itemSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Load items for selection
     */
    static async loadItemsForSelection() {
        if (typeof SupabaseClient === 'undefined') {
            throw new Error('SupabaseClient not available');
        }
        
        const { data, error } = await SupabaseClient.supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            throw error;
        }
        
        return data || [];
    }

    /**
     * Load skills for selection
     */
    static async loadSkillsForSelection() {
        if (typeof SupabaseClient === 'undefined') {
            throw new Error('SupabaseClient not available');
        }
        
        const { data, error } = await SupabaseClient.supabase
            .from('skills')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            throw error;
        }
        
        return data || [];
    }

    /**
     * Create item browse interface
     */
    static createItemBrowseInterface(items, availableSlots) {
        return `
            <div style="max-height: 500px; overflow-y: auto;">
                <div style="margin-bottom: 15px; color: rgb(251, 225, 183);">
                    <h4>Select an Item (${availableSlots} slots available)</h4>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" id="itemSearchInput" placeholder="Search items..." 
                               style="width: 100%; padding: 12px; border-radius: 5px; border: 1px solid rgb(218, 165, 32); background: rgb(37, 26, 12); color: rgb(251, 225, 183); font-size: 14px;">
                    </div>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <select id="itemFilterSelect" style="flex: 1; padding: 12px; border-radius: 5px; border: 1px solid rgb(218, 165, 32); background: rgb(37, 26, 12); color: rgb(251, 225, 183); font-size: 14px;">
                            <option value="">All Items</option>
                            <option value="Small">Small Items</option>
                            <option value="Medium">Medium Items</option>
                            <option value="Large">Large Items</option>
                        </select>
                    </div>
                </div>
                <div id="itemBrowseGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                    ${items.map(item => this.createItemCard(item)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create skill browse interface
     */
    static createSkillBrowseInterface(skills) {
        return `
            <div style="max-height: 500px; overflow-y: auto;">
                <div style="margin-bottom: 15px; color: rgb(251, 225, 183);">
                    <h4>Select a Skill</h4>
                    <input type="text" id="skillSearchInput" placeholder="Search skills..." 
                           style="width: 100%; padding: 12px; border-radius: 5px; border: 1px solid rgb(218, 165, 32); background: rgb(37, 26, 12); color: rgb(251, 225, 183); font-size: 14px; margin-bottom: 10px;">
                </div>
                <div id="skillBrowseGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    ${skills.map(skill => this.createSkillCard(skill)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create item card for browse
     */
    static createItemCard(item) {
        const itemData = item.item_data || {};
        const size = itemData.itemSize || 'Medium';
        const slotsUsed = size === 'Small' ? 1 : size === 'Medium' ? 2 : 3;
        
        return `
            <div class="item-card" data-item-id="${item.id}" data-slots="${slotsUsed}" 
                 style="background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%); 
                        border: 2px solid rgb(218, 165, 32); border-radius: 8px; padding: 15px; 
                        cursor: pointer; transition: all 0.2s ease; color: rgb(251, 225, 183); display: flex; align-items: center; gap: 15px;"
                 onclick="MonsterController.selectItem('${item.id}', ${slotsUsed})">
                <div style="flex-shrink: 0;">
                    <img src="${itemData.imageData || 'images/characters/default.png'}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid rgb(218, 165, 32);">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                        ${itemData.itemName || 'Unknown Item'}
                    </div>
                    <div style="font-size: 14px; color: rgb(201, 175, 133);">
                        ${size.toUpperCase()} (${slotsUsed} slots)
                    </div>
                    <div style="font-size: 12px; color: rgb(184, 134, 11); margin-top: 5px;">
                        ${itemData.hero || 'No Hero'} • ${itemData.border || 'Gold'} Border
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create skill card for browse
     */
    static createSkillCard(skill) {
        const skillData = skill.skill_data || {};
        
        return `
            <div class="skill-card" data-skill-id="${skill.id}" 
                 style="background: linear-gradient(135deg, rgb(101, 84, 63) 0%, rgb(89, 72, 51) 100%); 
                        border: 2px solid rgb(218, 165, 32); border-radius: 8px; padding: 15px; 
                        cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 15px;"
                 onclick="MonsterController.selectSkill('${skill.id}')">
                <div style="flex-shrink: 0;">
                    <img src="${skillData.imageData || 'images/characters/default.png'}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 50%; border: 2px solid rgb(218, 165, 32);">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                        ${skillData.skillName || 'Unknown Skill'}
                    </div>
                    <div style="font-size: 12px; color: rgb(184, 134, 11);">
                        ${skillData.border || 'Gold'} Border
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup item browse functionality
     */
    static setupItemBrowseFunctionality() {
        const searchInput = document.getElementById('itemSearchInput');
        const filterSelect = document.getElementById('itemFilterSelect');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterItems());
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterItems());
        }
    }

    /**
     * Setup skill browse functionality
     */
    static setupSkillBrowseFunctionality() {
        const searchInput = document.getElementById('skillSearchInput');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterSkills());
        }
    }

    /**
     * Filter items
     */
    static filterItems() {
        const searchTerm = document.getElementById('itemSearchInput')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('itemFilterSelect')?.value || '';
        const cards = document.querySelectorAll('#itemBrowseGrid .item-card');
        
        cards.forEach(card => {
            const itemName = card.querySelector('div:nth-child(2)')?.textContent.toLowerCase() || '';
            const size = card.querySelector('div:nth-child(3)')?.textContent || '';
            const matchesSearch = itemName.includes(searchTerm);
            const matchesFilter = !filterValue || size.includes(filterValue);
            
            card.style.display = matchesSearch && matchesFilter ? 'block' : 'none';
        });
    }

    /**
     * Filter skills
     */
    static filterSkills() {
        const searchTerm = document.getElementById('skillSearchInput')?.value.toLowerCase() || '';
        const cards = document.querySelectorAll('#skillBrowseGrid .skill-card');
        
        cards.forEach(card => {
            const skillName = card.querySelector('img')?.alt || '';
            const matchesSearch = skillName.toLowerCase().includes(searchTerm);
            card.style.display = matchesSearch ? 'block' : 'none';
        });
    }

    /**
     * Select an item
     */
    static selectItem(itemId, slotsUsed) {
        // Check if we have enough space
        if (this.currentMonster && this.currentMonster.boardSlotsUsed + slotsUsed > 10) {
            if (typeof Messages !== 'undefined') {
                Messages.showError('Not enough space on the board!');
            }
            return;
        }
        
        // Check if adjacent slots are available for multi-slot items
        if (!this.canPlaceItemAtSlot(this.selectedSlot, slotsUsed)) {
            return;
        }
        
        // Add the item to the monster
        this.addItemToMonster(itemId, slotsUsed);
        this.closeItemModal();
    }

    /**
     * Select a skill
     */
    static selectSkill(skillId) {
        // Add the skill to the monster
        this.addSkillToMonster(skillId);
        this.closeSkillModal();
    }

    /**
     * Add item to monster
     */
    static async addItemToMonster(itemId, slotsUsed) {
        try {
            // Get item data from database
            const { data, error } = await SupabaseClient.supabase
                .from('items')
                .select('*')
                .eq('id', itemId)
                .single();
                
            if (error || !data) {
                throw new Error('Failed to load item data');
            }
            
            const itemData = data.item_data || {};
            const size = itemData.itemSize || 'Medium';
            
            // Add to monster
            this.currentMonster.items[this.selectedSlot] = {
                id: itemId,
                name: itemData.itemName || 'Unknown Item',
                image: itemData.imageData || 'images/characters/default.png',
                border: itemData.border || 'gold',
                size: size,
                slotsUsed: slotsUsed,
                data: itemData // Store full data for export
            };
            
            this.currentMonster.boardSlotsUsed += slotsUsed;
            
            // Update the board slot with proper sizing
            const slot = this.boardSlots[this.selectedSlot];
            if (slot) {
                slot.element.className = 'board-slot filled';
                
                // Create item with proper sizing and remove button
                const itemElement = document.createElement('img');
                itemElement.src = itemData.imageData || 'images/characters/default.png';
                itemElement.alt = itemData.itemName || 'Unknown Item';
                itemElement.className = `board-item ${size.toLowerCase()}`;
                itemElement.style.cursor = 'pointer';
                itemElement.onclick = () => this.showItemDetails(itemId);
                
                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-item-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.removeItemFromSlot(this.selectedSlot);
                };
                
                slot.element.innerHTML = '';
                slot.element.appendChild(itemElement);
                slot.element.appendChild(removeBtn);
                slot.item = this.currentMonster.items[this.selectedSlot];
                slot.slotsUsed = slotsUsed;
                
                // Mark adjacent slots as occupied for multi-slot items
                if (slotsUsed > 1) {
                    for (let i = 1; i < slotsUsed; i++) {
                        const adjacentSlotIndex = this.selectedSlot + i;
                        if (adjacentSlotIndex < 10) {
                            this.currentMonster.items[adjacentSlotIndex] = {
                                id: itemId,
                                name: itemData.itemName || 'Unknown Item',
                                image: itemData.imageData || 'images/characters/default.png',
                                border: itemData.border || 'gold',
                                size: size,
                                slotsUsed: slotsUsed,
                                data: itemData,
                                isPartOfMultiSlot: true,
                                mainSlot: this.selectedSlot
                            };
                            
                            // Update adjacent slot display
                            const adjacentSlot = this.boardSlots[adjacentSlotIndex];
                            if (adjacentSlot) {
                                adjacentSlot.element.className = 'board-slot filled';
                                adjacentSlot.element.innerHTML = '';
                                adjacentSlot.item = this.currentMonster.items[adjacentSlotIndex];
                                adjacentSlot.slotsUsed = 0; // Don't count this slot's usage
                            }
                        }
                    }
                }
            }
            
            if (typeof Messages !== 'undefined') {
                Messages.showSuccess('Item added to monster!');
            }
            
        } catch (error) {
            console.error('Failed to add item to monster:', error);
            if (typeof Messages !== 'undefined') {
                Messages.showError('Failed to add item to monster');
            }
        }
    }

    /**
     * Add skill to monster
     */
    static async addSkillToMonster(skillId) {
        try {
            // Get skill data from database
            const { data, error } = await SupabaseClient.supabase
                .from('skills')
                .select('*')
                .eq('id', skillId)
                .single();
                
            if (error || !data) {
                throw new Error('Failed to load skill data');
            }
            
            const skillData = data.skill_data || {};
            
            // Add to monster
            this.currentMonster.skills[this.selectedSlot] = {
                id: skillId,
                name: skillData.skillName || 'Unknown Skill',
                image: skillData.imageData || 'images/characters/default.png',
                border: skillData.border || 'gold',
                data: skillData // Store full data for export
            };
            
            // Update the skill slot
            const slot = this.skillSlots[this.selectedSlot];
            if (slot) {
                slot.element.className = 'skill-slot filled';
                slot.element.innerHTML = `<img src="${skillData.imageData || 'images/characters/default.png'}" alt="${skillData.skillName || 'Unknown Skill'}">`;
                slot.element.onclick = () => this.showSkillDetails(skillId);
                slot.skill = this.currentMonster.skills[this.selectedSlot];
            }
            
            if (typeof Messages !== 'undefined') {
                Messages.showSuccess('Skill added to monster!');
            }
            
        } catch (error) {
            console.error('Failed to add skill to monster:', error);
            if (typeof Messages !== 'undefined') {
                Messages.showError('Failed to add skill to monster');
            }
        }
    }

    /**
     * Prepare monster for export
     */
    static prepareForExport() {
        if (!this.currentMonster) {
            if (typeof Messages !== 'undefined') {
                Messages.showError('Please create a monster first!');
            }
            return;
        }

        const exportSection = document.getElementById('exportSection');
        const exportPreview = document.getElementById('exportMonsterPreview');

        if (exportSection && exportPreview) {
            // Clear previous content
            exportPreview.innerHTML = '';

            // Create the same monster preview structure as the main preview
            this.createExportMonsterPreview(exportPreview);

            // Show export section
            exportSection.classList.add('active');
            
            if (typeof Messages !== 'undefined') {
                Messages.showSuccess('Monster prepared for export!');
            }
        }
    }

    /**
     * Create export monster preview (same as main preview)
     */
    static createExportMonsterPreview(container) {
        if (!this.currentMonster) return;

        // Create monster frame and image
        const frameContainer = document.createElement('div');
        frameContainer.className = 'monster-frame-container';
        
        const frame = document.createElement('div');
        frame.className = 'monster-frame';
        frame.id = 'exportMonsterFrame';
        
        const image = document.createElement('img');
        image.className = 'monster-image';
        image.id = 'exportMonsterImage';
        image.src = this.currentMonster.image || 'images/characters/default.png';
        image.alt = 'Monster';
        
        frame.appendChild(image);
        frameContainer.appendChild(frame);

        // Create skill slots container
        const skillContainer = document.createElement('div');
        skillContainer.className = 'skill-slots-container';
        
        // Create 6 skill slots (3 left, 3 right)
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.dataset.skillIndex = i;
            
            const skill = this.currentMonster.skills[i];
            if (skill) {
                slot.className = 'skill-slot filled';
                slot.innerHTML = `<img src="${skill.image}" alt="${skill.name}">`;
                slot.onclick = () => this.showSkillDetails(skill.id);
            } else {
                slot.innerHTML = '⚡';
            }
            
            skillContainer.appendChild(slot);
        }

        // Create health bar
        const healthContainer = document.createElement('div');
        healthContainer.className = 'health-bar-container';
        
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.id = 'exportHealthBar';
        
        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        healthFill.id = 'exportHealthFill';
        healthFill.style.width = '100%';
        
        const healthText = document.createElement('div');
        healthText.className = 'health-text';
        healthText.id = 'exportHealthText';
        healthText.textContent = `${this.currentMonster.health}/${this.currentMonster.maxHealth}`;
        
        // Create coin and exp displays
        const coinDisplay = document.createElement('div');
        coinDisplay.className = 'coin-display';
        coinDisplay.id = 'exportCoinDisplay';
        
        const expDisplay = document.createElement('div');
        expDisplay.className = 'exp-display';
        expDisplay.id = 'exportExpDisplay';
        
        healthBar.appendChild(healthFill);
        healthBar.appendChild(healthText);
        healthBar.appendChild(coinDisplay);
        healthBar.appendChild(expDisplay);
        healthContainer.appendChild(healthBar);

        // Create item board
        const boardContainer = document.createElement('div');
        boardContainer.className = 'item-board-container';
        
        const board = document.createElement('div');
        board.className = 'item-board';
        board.id = 'exportItemBoard';

        // Create 10 board slots
        for (let i = 0; i < 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'board-slot';
            slot.dataset.slotIndex = i;
            
            const item = this.currentMonster.items[i];
            if (item && !item.isPartOfMultiSlot) {
                slot.className = 'board-slot filled';
                
                const itemElement = document.createElement('img');
                itemElement.src = item.image;
                itemElement.alt = item.name;
                itemElement.className = `board-item ${item.size.toLowerCase()}`;
                itemElement.style.cursor = 'pointer';
                itemElement.onclick = () => this.showItemDetails(item.id);
                
                slot.innerHTML = '';
                slot.appendChild(itemElement);
            } else if (item && item.isPartOfMultiSlot) {
                // Don't display items that are part of multi-slot items
                slot.className = 'board-slot filled';
                slot.innerHTML = '';
            } else {
                slot.innerHTML = `Slot ${i + 1}`;
            }
            
            board.appendChild(slot);
        }

        boardContainer.appendChild(board);

        // Insert elements into export preview
        container.insertBefore(frameContainer, container.firstChild);
        container.insertBefore(skillContainer, frameContainer.nextSibling);
        container.insertBefore(healthContainer, skillContainer.nextSibling);
        container.insertBefore(boardContainer, healthContainer.nextSibling);

        // Update coin and exp displays
        this.updateExportCoinDisplay();
        this.updateExportExpDisplay();
    }

    /**
     * Update export coin display
     */
    static updateExportCoinDisplay() {
        if (!this.currentMonster) return;

        const coinDisplay = document.getElementById('exportCoinDisplay');
        if (!coinDisplay) return;

        coinDisplay.innerHTML = '';
        
        // Create coin nodes (2 empty nodes + coin count)
        const totalNodes = this.currentMonster.gold + 2;
        
        for (let i = 0; i < totalNodes; i++) {
            const node = document.createElement('div');
            node.className = 'coin-node';
            
            if (i > 0 && i < totalNodes - 1) {
                // This is a coin position
                const coin = document.createElement('img');
                coin.src = 'images/keywords/effects/value.PNG'; // Using value.png as placeholder
                coin.alt = 'Coin';
                node.appendChild(coin);
            }
            
            coinDisplay.appendChild(node);
        }
    }

    /**
     * Update export exp display
     */
    static updateExportExpDisplay() {
        if (!this.currentMonster) return;

        const expDisplay = document.getElementById('exportExpDisplay');
        if (!expDisplay) return;

        expDisplay.innerHTML = '';
        
        // Create exp nodes (2 empty nodes + exp count)
        const totalNodes = this.currentMonster.exp + 2;
        
        for (let i = 0; i < totalNodes; i++) {
            const node = document.createElement('div');
            node.className = 'exp-node';
            
            if (i > 0 && i < totalNodes - 1) {
                // This is an exp position
                const exp = document.createElement('img');
                exp.src = 'images/keywords/effects/charge.PNG'; // Using charge.png as placeholder
                exp.alt = 'Experience';
                node.appendChild(exp);
            }
            
            expDisplay.appendChild(node);
        }
    }

    /**
     * Show item details (full card generator logic)
     */
    static async showItemDetails(itemId) {
        try {
            // Get item data from database
            const { data, error } = await SupabaseClient.supabase
                .from('items')
                .select('*')
                .eq('id', itemId)
                .single();
                
            if (error || !data) {
                throw new Error('Failed to load item data');
            }

            // Create modal for item details
            const modal = document.createElement('div');
            modal.className = 'monster-modal';
            modal.style.display = 'flex';
            
            const itemData = data.item_data || {};
            
            modal.innerHTML = `
                <div class="monster-modal-content" style="max-width: 800px;">
                    <button class="monster-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h3 style="color: rgb(251, 225, 183); margin-bottom: 20px;">${itemData.itemName || 'Unknown Item'}</h3>
                    <div id="itemDetailsContent">
                        <!-- Item details will be loaded here using card generator logic -->
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Use card generator logic to display the item
            if (typeof CardGenerator !== 'undefined') {
                const cardHtml = await CardGenerator.createCard(itemData);
                const content = modal.querySelector('#itemDetailsContent');
                if (content) {
                    content.innerHTML = cardHtml;
                }
            } else {
                // Fallback display
                const content = modal.querySelector('#itemDetailsContent');
                if (content) {
                    content.innerHTML = `
                        <div style="text-align: center; color: rgb(251, 225, 183);">
                            <img src="${itemData.imageData || 'images/characters/default.png'}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 10px; border: 3px solid rgb(218, 165, 32); margin-bottom: 15px;">
                            <h4>${itemData.itemName || 'Unknown Item'}</h4>
                            <p><strong>Hero:</strong> ${itemData.hero || 'None'}</p>
                            <p><strong>Size:</strong> ${(itemData.itemSize || 'Medium').toUpperCase()}</p>
                            <p><strong>Border:</strong> ${itemData.border || 'Gold'}</p>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            console.error('Failed to show item details:', error);
            if (typeof Messages !== 'undefined') {
                Messages.showError('Failed to load item details');
            }
        }
    }

    /**
     * Show skill details (full card generator logic)
     */
    static async showSkillDetails(skillId) {
        try {
            // Get skill data from database
            const { data, error } = await SupabaseClient.supabase
                .from('skills')
                .select('*')
                .eq('id', skillId)
                .single();
                
            if (error || !data) {
                throw new Error('Failed to load skill data');
            }

            // Create modal for skill details
            const modal = document.createElement('div');
            modal.className = 'monster-modal';
            modal.style.display = 'flex';
            
            const skillData = data.skill_data || {};
            
            modal.innerHTML = `
                <div class="monster-modal-content" style="max-width: 600px;">
                    <button class="monster-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h3 style="color: rgb(251, 225, 183); margin-bottom: 20px;">${skillData.skillName || 'Unknown Skill'}</h3>
                    <div id="skillDetailsContent">
                        <!-- Skill details will be loaded here using skill generator logic -->
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Use skill generator logic to display the skill
            if (typeof SkillGenerator !== 'undefined') {
                const skillHtml = await SkillGenerator.createSkill(skillData);
                const content = modal.querySelector('#skillDetailsContent');
                if (content) {
                    content.innerHTML = skillHtml;
                }
            } else {
                // Fallback display
                const content = modal.querySelector('#skillDetailsContent');
                if (content) {
                    content.innerHTML = `
                        <div style="text-align: center; color: rgb(251, 225, 183);">
                            <img src="${skillData.imageData || 'images/characters/default.png'}" style="width: 225px; height: 225px; object-fit: cover; border-radius: 50%; border: 3px solid rgb(218, 165, 32); margin-bottom: 15px;">
                            <h4>${skillData.skillName || 'Unknown Skill'}</h4>
                            <p><strong>Effect:</strong> ${skillData.skillEffect || 'None'}</p>
                            <p><strong>Border:</strong> ${skillData.border || 'Gold'}</p>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            console.error('Failed to show skill details:', error);
            if (typeof Messages !== 'undefined') {
                Messages.showError('Failed to load skill details');
            }
        }
    }

    /**
     * Check if an item can be placed at a specific slot
     */
    static canPlaceItemAtSlot(slotIndex, slotsUsed) {
        if (!this.currentMonster) return false;
        
        // Check if the selected slot is empty
        if (this.currentMonster.items[slotIndex]) {
            if (typeof Messages !== 'undefined') {
                Messages.showError('This slot is already occupied!');
            }
            return false;
        }
        
        // For single slot items, just check if the slot is empty
        if (slotsUsed === 1) {
            return true;
        }
        
        // For medium items (2 slots), check if the slot to the right is empty
        if (slotsUsed === 2) {
            if (slotIndex + 1 >= 10) {
                if (typeof Messages !== 'undefined') {
                    Messages.showError('Medium items need an empty slot to the right!');
                }
                return false;
            }
            
            if (this.currentMonster.items[slotIndex + 1]) {
                if (typeof Messages !== 'undefined') {
                    Messages.showError('Medium items need an empty slot to the right!');
                }
                return false;
            }
            
            return true;
        }
        
        // For large items (3 slots), check if both adjacent slots are empty
        if (slotsUsed === 3) {
            if (slotIndex + 2 >= 10) {
                if (typeof Messages !== 'undefined') {
                    Messages.showError('Large items need two empty slots to the right!');
                }
                return false;
            }
            
            if (this.currentMonster.items[slotIndex + 1] || this.currentMonster.items[slotIndex + 2]) {
                if (typeof Messages !== 'undefined') {
                    Messages.showError('Large items need two empty slots to the right!');
                }
                return false;
            }
            
            return true;
        }
        
        return true;
    }

    /**
     * Remove item from slot
     */
    static removeItemFromSlot(slotIndex) {
        if (!this.currentMonster || !this.currentMonster.items[slotIndex]) {
            return;
        }

        const item = this.currentMonster.items[slotIndex];
        
        // Handle multi-slot items
        if (item.isPartOfMultiSlot) {
            // This is a part of a multi-slot item, find the main slot
            const mainSlot = item.mainSlot;
            const mainItem = this.currentMonster.items[mainSlot];
            if (mainItem) {
                this.removeItemFromSlot(mainSlot);
            }
            return;
        }
        
        // Remove the main item
        this.currentMonster.boardSlotsUsed -= item.slotsUsed;
        this.currentMonster.items[slotIndex] = null;

        // Reset the main board slot
        const slot = this.boardSlots[slotIndex];
        if (slot) {
            slot.element.className = 'board-slot';
            slot.element.innerHTML = `Slot ${slotIndex + 1}`;
            slot.item = null;
            slot.slotsUsed = 0;
        }
        
        // Clear adjacent slots if this was a multi-slot item
        if (item.slotsUsed > 1) {
            for (let i = 1; i < item.slotsUsed; i++) {
                const adjacentSlotIndex = slotIndex + i;
                if (adjacentSlotIndex < 10) {
                    this.currentMonster.items[adjacentSlotIndex] = null;
                    
                    // Reset adjacent slot display
                    const adjacentSlot = this.boardSlots[adjacentSlotIndex];
                    if (adjacentSlot) {
                        adjacentSlot.element.className = 'board-slot';
                        adjacentSlot.element.innerHTML = `Slot ${adjacentSlotIndex + 1}`;
                        adjacentSlot.item = null;
                        adjacentSlot.slotsUsed = 0;
                    }
                }
            }
        }

        if (typeof Messages !== 'undefined') {
            Messages.showSuccess('Item removed from monster!');
        }
    }

    /**
     * Close skill selection modal
     */
    static closeSkillModal() {
        const modal = document.getElementById('skillSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Global functions for modal closing
window.closeItemModal = () => MonsterController.closeItemModal();
window.closeSkillModal = () => MonsterController.closeSkillModal(); 