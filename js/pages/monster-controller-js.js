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
        image.src = 'images/default.png';
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
                coin.src = 'images/value.png'; // Using value.png as placeholder
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
                exp.src = 'images/charge.png'; // Using charge.png as placeholder
                exp.alt = 'Experience';
                node.appendChild(exp);
            }
            
            expDisplay.appendChild(node);
        }
    }

    /**
     * Open item selection modal
     */
    static openItemSelection(slotIndex) {
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
            // For now, show a simple message
            content.innerHTML = `
                <div style="text-align: center; color: rgb(251, 225, 183);">
                    <p>Item selection will be implemented with browse integration.</p>
                    <p>Available slots: ${availableSlots}</p>
                    <button onclick="MonsterController.addTestItem(${slotIndex})" 
                            style="background: rgb(218, 165, 32); color: rgb(37, 26, 12); 
                                   padding: 10px 20px; border: none; border-radius: 5px; 
                                   cursor: pointer; font-weight: bold;">
                        Add Test Item
                    </button>
                </div>
            `;
            
            modal.style.display = 'flex';
        }
    }

    /**
     * Open skill selection modal
     */
    static openSkillSelection(skillIndex) {
        this.selectedSlot = skillIndex;
        
        const modal = document.getElementById('skillSelectionModal');
        const content = document.getElementById('skillSelectionContent');
        
        if (modal && content) {
            // For now, show a simple message
            content.innerHTML = `
                <div style="text-align: center; color: rgb(251, 225, 183);">
                    <p>Skill selection will be implemented with browse integration.</p>
                    <button onclick="MonsterController.addTestSkill(${skillIndex})" 
                            style="background: rgb(218, 165, 32); color: rgb(37, 26, 12); 
                                   padding: 10px 20px; border: none; border-radius: 5px; 
                                   cursor: pointer; font-weight: bold;">
                        Add Test Skill
                    </button>
                </div>
            `;
            
            modal.style.display = 'flex';
        }
    }

    /**
     * Add a test item to the board
     */
    static addTestItem(slotIndex) {
        if (!this.currentMonster) return;

        const item = {
            name: 'Test Item',
            image: 'images/default.png',
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
            image: 'images/default.png',
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