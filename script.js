class EnhancedAnonymousChat {
    constructor() {
        this.socket = io();
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.onlineCount = document.getElementById('onlineCount');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.reactionPicker = document.getElementById('reactionPicker');
        this.replyPreview = document.getElementById('replyPreview');
        this.replyClose = document.getElementById('replyClose');
        this.searchBtn = document.getElementById('searchBtn');
        this.menuBtn = document.getElementById('menuBtn');
        this.searchBar = document.getElementById('searchBar');
        this.searchInput = document.getElementById('searchInput');
        this.searchClose = document.getElementById('searchClose');
        this.searchResults = document.getElementById('searchResults');
        this.headerMenu = document.getElementById('headerMenu');
        this.confirmationDialog = document.getElementById('confirmationDialog');
        
        this.userId = this.generateUserId();
        this.userColor = this.generateUserColor();
        this.userName = this.generateUserName();
        this.replyingTo = null;
        this.currentMenu = null;
        this.allMessages = [];
        this.isSearchMode = false;
        this.pendingAction = null;
        
        // Encryption properties
        this.keyPair = null;
        this.roomKey = null;
        this.userPublicKeys = new Map();
        this.isEncryptionReady = false;
        
        this.initializeEncryption().then(() => {
            this.initializeEventListeners();
            this.initializeSocketEvents();
        });
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateUserColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
            '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
            '#ff9f43', '#10ac84', '#ee5a24', '#0abde3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateUserName() {
        const adjectives = ['Anonymous', 'Mystery', 'Secret', 'Hidden', 'Unknown', 'Phantom', 'Ghost', 'Shadow'];
        const nouns = ['User', 'Person', 'Visitor', 'Guest', 'Friend', 'Stranger', 'Soul', 'Being'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj} ${noun}`;
    }
    
    // ============ ENCRYPTION METHODS ============
    
    async initializeEncryption() {
        try {
            const roomSeed = "anonymous-chat-room-2024";
            const encoder = new TextEncoder();
            const seedData = encoder.encode(roomSeed);
            
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                seedData,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            this.roomKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode('anonymous-chat-salt'),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['encrypt', 'decrypt']
            );
            
            this.isEncryptionReady = true;
            console.log('🔐 End-to-end encryption initialized with shared room key');
            
        } catch (error) {
            console.error('Encryption initialization failed:', error);
            this.isEncryptionReady = false;
        }
    }
    
    async encryptMessage(plaintext) {
        if (!this.isEncryptionReady || !this.roomKey) {
            return { encrypted: false, data: plaintext };
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                this.roomKey,
                data
            );
            
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            return {
                encrypted: true,
                data: this.arrayBufferToBase64(combined.buffer),
                algorithm: 'AES-GCM'
            };
            
        } catch (error) {
            console.error('Encryption failed:', error);
            return { encrypted: false, data: plaintext };
        }
    }
    
    async decryptMessage(encryptedData) {
        if (!encryptedData.encrypted || !this.roomKey) {
            return encryptedData.data;
        }
        
        try {
            const combined = this.base64ToArrayBuffer(encryptedData.data);
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                this.roomKey,
                encrypted
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
            
        } catch (error) {
            console.error('Decryption failed:', error);
            return '[🔒 Encrypted message - decryption failed]';
        }
    }
    
    async encryptFile(fileData) {
        if (!this.isEncryptionReady || !this.roomKey) {
            return { encrypted: false, data: fileData };
        }
        
        try {
            const dataBuffer = this.base64ToArrayBuffer(fileData.split(',')[1]);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                this.roomKey,
                dataBuffer
            );
            
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            return {
                encrypted: true,
                data: this.arrayBufferToBase64(combined.buffer),
                mimeType: fileData.split(',')[0]
            };
            
        } catch (error) {
            console.error('File encryption failed:', error);
            return { encrypted: false, data: fileData };
        }
    }
    
    async decryptFile(encryptedFile) {
        if (!encryptedFile.encrypted || !this.roomKey) {
            return encryptedFile.data;
        }
        
        try {
            const combined = this.base64ToArrayBuffer(encryptedFile.data);
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                this.roomKey,
                encrypted
            );
            
            const base64Data = this.arrayBufferToBase64(decrypted);
            return encryptedFile.mimeType + ',' + base64Data;
            
        } catch (error) {
            console.error('File decryption failed:', error);
            return 'data:text/plain;base64,W/CfkrIgRW5jcnlwdGVkIGZpbGUgLSBkZWNyeXB0aW9uIGZhaWxlZF0=';
        }
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    // ============ EVENT LISTENERS ============
    
    initializeEventListeners() {
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Typing indicator
        this.messageInput.addEventListener('input', () => {
            this.socket.emit('typing', { userId: this.userId });
        });
        
        // Emoji picker
        this.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPicker();
        });
        
        // File upload
        this.attachBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        
        // Reply close
        this.replyClose.addEventListener('click', () => {
            this.cancelReply();
        });
        
        // Search functionality
        this.searchBtn.addEventListener('click', () => {
            this.toggleSearch();
        });
        
        this.searchClose.addEventListener('click', () => {
            this.closeSearch();
        });
        
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
        
        // Menu functionality
        this.menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHeaderMenu();
        });
        
        // Menu items
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            this.showConfirmationDialog(
                'Clear Chat',
                'Are you sure you want to clear all messages? This action cannot be undone.',
                () => this.clearChat(),
                'danger'
            );
            this.headerMenu.style.display = 'none';
        });
        
        document.getElementById('exportChatBtn').addEventListener('click', () => {
            this.exportChat();
            this.headerMenu.style.display = 'none';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.addSystemMessage('Settings feature coming soon!');
            this.headerMenu.style.display = 'none';
        });
        
        // Dialog functionality
        document.getElementById('dialogCancel').addEventListener('click', () => {
            this.hideConfirmationDialog();
        });
        
        document.getElementById('dialogConfirm').addEventListener('click', () => {
            if (this.pendingAction) {
                this.pendingAction();
                this.pendingAction = null;
            }
            this.hideConfirmationDialog();
        });
        
        // Emoji picker events
        this.emojiPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji')) {
                this.insertEmoji(e.target.dataset.emoji);
            }
        });
        
        // Reaction picker events
        this.reactionPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('reaction-emoji')) {
                this.addReaction(e.target.dataset.reaction);
            }
        });
        
        // Close pickers when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.emojiPicker.contains(e.target) && !this.emojiBtn.contains(e.target)) {
                this.emojiPicker.style.display = 'none';
            }
            if (!this.reactionPicker.contains(e.target)) {
                this.reactionPicker.style.display = 'none';
            }
            if (!this.headerMenu.contains(e.target) && !this.menuBtn.contains(e.target)) {
                this.headerMenu.style.display = 'none';
            }
            if (this.currentMenu && !this.currentMenu.contains(e.target)) {
                this.currentMenu.remove();
                this.currentMenu = null;
            }
            
            // Handle file download clicks
            if (e.target.closest('.file-download')) {
                const button = e.target.closest('.file-download');
                const fileUrl = button.dataset.fileUrl;
                const fileName = button.dataset.fileName;
                this.downloadFile(fileUrl, fileName);
            }
        });
        
        // Auto-focus on message input
        this.messageInput.focus();
    }
    
    // ============ SOCKET EVENTS ============
    
    initializeSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.isEncryptionReady) {
                this.addSystemMessage('🔐 Connected with end-to-end encryption');
            } else {
                this.addSystemMessage('Connected to chat');
            }
        });
        
        this.socket.on('disconnect', () => {
            this.addSystemMessage('Disconnected from chat');
        });
        
        this.socket.on('message', async (data) => {
            await this.displayMessage(data);
        });
        
        this.socket.on('reaction', (data) => {
            this.updateMessageReaction(data);
        });
        
        this.socket.on('userCount', (count) => {
            this.onlineCount.textContent = count;
        });
        
        this.socket.on('userJoined', () => {
            this.addSystemMessage('Someone joined the chat');
        });
        
        this.socket.on('userLeft', () => {
            this.addSystemMessage('Someone left the chat');
        });
        
        this.socket.on('typing', (data) => {
            if (data.userId !== this.userId) {
                this.showTypingIndicator();
            }
        });
    }
    
    // ============ MESSAGE HANDLING ============
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (message === '') return;
        
        const formattedMessage = this.formatMessage(message);
        const encryptedText = await this.encryptMessage(formattedMessage);
        
        const messageData = {
            text: encryptedText,
            userId: this.userId,
            userColor: this.userColor,
            userName: this.userName,
            timestamp: new Date().toISOString(),
            messageId: this.generateMessageId(),
            replyTo: this.replyingTo
        };
        
        this.socket.emit('message', messageData);
        this.messageInput.value = '';
        this.cancelReply();
        this.messageInput.focus();
    }
    
    formatMessage(text) {
        return text
            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            .replace(/~([^~]+)~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
    }
    
    async handleFileUpload(file) {
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 10MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const encryptedFile = await this.encryptFile(e.target.result);
            
            const messageData = {
                type: 'file',
                fileName: file.name,
                fileSize: this.formatFileSize(file.size),
                fileType: file.type,
                fileData: encryptedFile,
                userId: this.userId,
                userColor: this.userColor,
                userName: this.userName,
                timestamp: new Date().toISOString(),
                messageId: this.generateMessageId()
            };
            
            this.socket.emit('message', messageData);
        };
        
        reader.readAsDataURL(file);
        this.fileInput.value = '';
    }
    
    async displayMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.userId === this.userId ? 'own' : 'other'}`;
        messageDiv.dataset.messageId = data.messageId;
        
        const timestamp = new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const isOwn = data.userId === this.userId;
        const userNameHtml = !isOwn ? `<div class="user-name" style="color: ${data.userColor}">${data.userName || 'Anonymous User'}</div>` : '';
        const statusIcon = isOwn ? '<i class="fas fa-check-double message-status"></i>' : '';
        const encryptionIcon = this.isEncryptionReady ? '<i class="fas fa-lock" style="color: #8696a0; font-size: 10px; margin-left: 4px;" title="End-to-end encrypted"></i>' : '';
        
        let replyHtml = '';
        if (data.replyTo) {
            const replyText = data.replyTo.text?.encrypted ? 
                await this.decryptMessage(data.replyTo.text) : 
                (data.replyTo.text || data.replyTo.fileName || 'Media');
            
            replyHtml = `
                <div class="message-reply">
                    <div class="reply-author">${data.replyTo.userName}</div>
                    <div class="reply-message">${replyText}</div>
                </div>
            `;
        }
        
        let contentHtml = '';
        if (data.type === 'file') {
            const decryptedFile = await this.decryptFile(data.fileData);
            
            if (data.fileType.startsWith('image/')) {
                contentHtml = `
                    <div class="image-message">
                        <img src="${decryptedFile}" alt="${data.fileName}" onclick="this.requestFullscreen()">
                    </div>
                `;
            } else {
                const fileIcon = this.getFileIcon(data.fileType);
                contentHtml = `
                    <div class="file-message">
                        <div class="file-icon">
                            <i class="${fileIcon}"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">${data.fileName}</div>
                            <div class="file-size">${data.fileSize}</div>
                        </div>
                        <button class="file-download" data-file-url="${decryptedFile}" data-file-name="${data.fileName}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                `;
            }
        } else {
            const decryptedText = await this.decryptMessage(data.text);
            contentHtml = `<div class="message-text formatted-text">${decryptedText}</div>`;
        }
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">
                    ${userNameHtml}
                    ${replyHtml}
                    ${contentHtml}
                </div>
                <div class="message-info">
                    <span class="message-time">${timestamp}${encryptionIcon}</span>
                    ${statusIcon}
                </div>
                <div class="message-reactions" data-message-id="${data.messageId}"></div>
            </div>
        `;
        
        // Add context menu
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageMenu(e, data);
        });
        
        // Add long press for mobile
        let pressTimer;
        messageDiv.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                this.showMessageMenu(e.touches[0], data);
            }, 500);
        });
        
        messageDiv.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        this.chatMessages.appendChild(messageDiv);
        
        // Store message for search functionality
        this.allMessages.push(data);
        
        this.scrollToBottom();
        this.removeTypingIndicator();
    }
    
    // ============ SEARCH FUNCTIONALITY ============
    
    toggleSearch() {
        const isVisible = this.searchBar.style.display === 'block';
        if (isVisible) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }
    
    openSearch() {
        this.searchBar.style.display = 'block';
        this.searchInput.focus();
        this.isSearchMode = true;
        document.body.classList.add('search-mode');
    }
    
    closeSearch() {
        this.searchBar.style.display = 'none';
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        this.isSearchMode = false;
        document.body.classList.remove('search-mode');
        this.clearSearchHighlights();
        this.messageInput.focus();
    }
    
    async performSearch(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            this.clearSearchHighlights();
            return;
        }
        
        const messages = Array.from(this.chatMessages.querySelectorAll('.message'));
        const results = [];
        
        this.clearSearchHighlights();
        
        for (const messageEl of messages) {
            const messageId = messageEl.dataset.messageId;
            const textEl = messageEl.querySelector('.message-text');
            
            if (textEl) {
                let text = textEl.textContent;
                
                const messageData = this.allMessages.find(m => m.messageId === messageId);
                if (messageData && messageData.text?.encrypted) {
                    try {
                        text = await this.decryptMessage(messageData.text);
                    } catch (error) {
                        console.error('Search decryption failed:', error);
                    }
                }
                
                if (text.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        element: messageEl,
                        text: text,
                        messageId: messageId,
                        timestamp: messageData?.timestamp || new Date().toISOString()
                    });
                    
                    messageEl.classList.add('search-match');
                    this.highlightSearchTerm(textEl, query);
                }
            }
        }
        
        this.displaySearchResults(results, query);
    }
    
    highlightSearchTerm(element, query) {
        const text = element.textContent;
        const regex = new RegExp(`(${query})`, 'gi');
        const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
        element.innerHTML = highlightedText;
    }
    
    clearSearchHighlights() {
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach(message => {
            message.classList.remove('search-match', 'highlighted');
            const textEl = message.querySelector('.message-text');
            if (textEl) {
                const highlights = textEl.querySelectorAll('.search-highlight');
                highlights.forEach(highlight => {
                    highlight.outerHTML = highlight.textContent;
                });
            }
        });
    }
    
    displaySearchResults(results, query) {
        this.searchResults.innerHTML = '';
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-result-item">
                    <div class="search-result-text">No messages found for "${query}"</div>
                </div>
            `;
            return;
        }
        
        results.forEach(result => {
            const resultEl = document.createElement('div');
            resultEl.className = 'search-result-item';
            
            const timestamp = new Date(result.timestamp).toLocaleString();
            const preview = result.text.length > 100 ? result.text.substring(0, 100) + '...' : result.text;
            
            resultEl.innerHTML = `
                <div class="search-result-text">${preview}</div>
                <div class="search-result-info">${timestamp}</div>
            `;
            
            resultEl.addEventListener('click', () => {
                this.scrollToMessage(result.element);
                this.closeSearch();
            });
            
            this.searchResults.appendChild(resultEl);
        });
    }
    
    scrollToMessage(messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlighted');
        
        setTimeout(() => {
            messageElement.classList.remove('highlighted');
        }, 3000);
    }
    
    // ============ MENU FUNCTIONALITY ============
    
    toggleHeaderMenu() {
        const isVisible = this.headerMenu.style.display === 'block';
        this.headerMenu.style.display = isVisible ? 'none' : 'block';
    }
    
    showConfirmationDialog(title, message, action, type = 'normal') {
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogMessage').textContent = message;
        
        const confirmBtn = document.getElementById('dialogConfirm');
        confirmBtn.className = `dialog-btn confirm-btn ${type === 'danger' ? 'danger' : ''}`;
        
        this.pendingAction = action;
        this.confirmationDialog.style.display = 'flex';
    }
    
    hideConfirmationDialog() {
        this.confirmationDialog.style.display = 'none';
        this.pendingAction = null;
    }
    
    clearChat() {
        const messages = this.chatMessages.querySelectorAll('.message, .system-message');
        messages.forEach(message => {
            if (!message.classList.contains('welcome-message')) {
                message.remove();
            }
        });
        
        this.allMessages = [];
        this.addSystemMessage('Chat cleared locally');
    }
    
    async exportChat() {
        const messages = [];
        
        for (const messageData of this.allMessages) {
            let text = messageData.text;
            
            if (messageData.text?.encrypted) {
                try {
                    text = await this.decryptMessage(messageData.text);
                } catch (error) {
                    text = '[Encrypted message - could not decrypt]';
                }
            }
            
            messages.push({
                user: messageData.userName,
                message: text,
                timestamp: new Date(messageData.timestamp).toLocaleString(),
                type: messageData.type || 'text'
            });
        }
        
        const chatData = {
            exportDate: new Date().toLocaleString(),
            totalMessages: messages.length,
            messages: messages
        };
        
        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `anonymous-chat-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.addSystemMessage('Chat exported successfully');
    }
    
    // ============ UTILITY METHODS ============
    
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fas fa-image';
        if (fileType.startsWith('video/')) return 'fas fa-video';
        if (fileType.startsWith('audio/')) return 'fas fa-music';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word')) return 'fas fa-file-word';
        if (fileType.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    showMessageMenu(e, messageData) {
        if (this.currentMenu) {
            this.currentMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'message-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        
        const menuItems = [
            { icon: 'fas fa-reply', text: 'Reply', action: () => this.startReply(messageData) },
            { icon: 'fas fa-smile', text: 'React', action: () => this.showReactionPicker(e, messageData) },
            { icon: 'fas fa-copy', text: 'Copy', action: () => this.copyMessage(messageData) }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
                this.currentMenu = null;
            });
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        this.currentMenu = menu;
    }
    
    async startReply(messageData) {
        const decryptedText = messageData.text?.encrypted ? 
            await this.decryptMessage(messageData.text) : 
            (messageData.text || messageData.fileName || 'Media');
        
        this.replyingTo = {
            messageId: messageData.messageId,
            userId: messageData.userId,
            userName: messageData.userName,
            text: decryptedText
        };
        
        document.getElementById('replyToUser').textContent = messageData.userName;
        document.getElementById('replyText').textContent = decryptedText;
        this.replyPreview.style.display = 'block';
        this.messageInput.focus();
    }
    
    cancelReply() {
        this.replyingTo = null;
        this.replyPreview.style.display = 'none';
    }
    
    showReactionPicker(e, messageData) {
        this.reactionPicker.style.display = 'block';
        this.reactionPicker.style.left = e.clientX + 'px';
        this.reactionPicker.style.top = (e.clientY - 60) + 'px';
        this.reactionPicker.dataset.messageId = messageData.messageId;
    }
    
    addReaction(emoji) {
        const messageId = this.reactionPicker.dataset.messageId;
        this.socket.emit('reaction', {
            messageId: messageId,
            emoji: emoji,
            userId: this.userId
        });
        this.reactionPicker.style.display = 'none';
    }
    
    updateMessageReaction(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (!messageElement) return;
        
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        let reactionElement = reactionsContainer.querySelector(`[data-emoji="${data.emoji}"]`);
        
        if (!reactionElement) {
            reactionElement = document.createElement('div');
            reactionElement.className = 'reaction';
            reactionElement.dataset.emoji = data.emoji;
            reactionElement.innerHTML = `${data.emoji} <span class="reaction-count">1</span>`;
            reactionsContainer.appendChild(reactionElement);
        } else {
            const countElement = reactionElement.querySelector('.reaction-count');
            const currentCount = parseInt(countElement.textContent);
            countElement.textContent = currentCount + 1;
        }
        
        if (data.userId === this.userId) {
            reactionElement.classList.add('own');
        }
    }
    
    async copyMessage(messageData) {
        const text = messageData.text?.encrypted ? 
            await this.decryptMessage(messageData.text) : 
            (messageData.text || messageData.fileName || 'Media file');
        
        navigator.clipboard.writeText(text).then(() => {
            this.addSystemMessage('Message copied to clipboard');
        });
    }
    
    toggleEmojiPicker() {
        const isVisible = this.emojiPicker.style.display === 'block';
        this.emojiPicker.style.display = isVisible ? 'none' : 'block';
    }
    
    insertEmoji(emoji) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        this.messageInput.focus();
        this.emojiPicker.style.display = 'none';
    }
    
    addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = text;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.removeTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            Someone is typing
            <span class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </span>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            this.removeTypingIndicator();
        }, 3000);
    }
    
    removeTypingIndicator() {
        const existingIndicator = document.getElementById('typingIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    downloadFile(dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the enhanced chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedAnonymousChat();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
    
    // Handle PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or banner
        showInstallPrompt();
    });
    
    function showInstallPrompt() {
        // Create install prompt
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <i class="fas fa-mobile-alt"></i>
                <span>Install Anonymous Chat as an app</span>
                <button class="install-btn" id="installBtn">Install</button>
                <button class="install-close" id="installClose">×</button>
            </div>
        `;
        
        document.body.appendChild(installBanner);
        
        document.getElementById('installBtn').addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    installBanner.remove();
                });
            }
        });
        
        document.getElementById('installClose').addEventListener('click', () => {
            installBanner.remove();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.body.contains(installBanner)) {
                installBanner.remove();
            }
        }, 10000);
    }
});