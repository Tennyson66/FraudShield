class FraudInvestigationAssistant {
    constructor() {
        this.conversationHistory = [];
        this.currentTransaction = null;
    }
    
    async initialize(container) {
        this.container = container;
        this.renderInterface();
        this.attachEventListeners();
    }
    
    renderInterface() {
        this.container.innerHTML = `
            <div class="assistant-header">
                <h3>Fraud Investigation Assistant</h3>
            </div>
            <div class="assistant-conversation" id="conversation-container"></div>
            <div class="assistant-input">
                <input type="text" id="assistant-query" placeholder="Ask about this transaction...">
                <button id="assistant-submit">Send</button>
            </div>
            <div class="assistant-suggestions">
                <button class="suggestion-btn" data-query="Why was this transaction flagged?">Why was this flagged?</button>
                <button class="suggestion-btn" data-query="What are similar fraud cases?">Similar cases</button>
                <button class="suggestion-btn" data-query="Recommend next steps">Next steps</button>
            </div>
        `;
    }
    
    attachEventListeners() {
        document.getElementById('assistant-submit').addEventListener('click', () => {
            this.handleUserQuery();
        });
        
        document.getElementById('assistant-query').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserQuery();
            }
        });
        
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('assistant-query').value = e.target.dataset.query;
                this.handleUserQuery();
            });
        });
    }
    
    setTransaction(transaction) {
        this.currentTransaction = transaction;
        this.conversationHistory = [];
        this.addSystemMessage("I'm ready to help you investigate this transaction. What would you like to know?");
    }
    
    async handleUserQuery() {
        const queryInput = document.getElementById('assistant-query');
        const query = queryInput.value.trim();
        
        if (!query) return;
        
        // Add user message to conversation
        this.addUserMessage(query);
        queryInput.value = '';
        
        // Show loading indicator
        this.addSystemMessage('Thinking...', 'loading-message');
        
        try {
            // Send query to backend
            const response = await fetch('/api/fraud-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    transaction: this.currentTransaction,
                    conversation_history: this.conversationHistory
                })
            });
            
            const result = await response.json();
            
            // Remove loading message
            document.querySelector('.loading-message').remove();
            
            // Add response to conversation
            this.addSystemMessage(result.response);
            
            // If there are suggested actions, display them
            if (result.suggested_actions && result.suggested_actions.length > 0) {
                this.displaySuggestedActions(result.suggested_actions);
            }
        } catch (error) {
            console.error('Error querying fraud assistant:', error);
            document.querySelector('.loading-message').remove();
            this.addSystemMessage('Sorry, I encountered an error while processing your request.');
        }
    }
    
    addUserMessage(message) {
        const conversationContainer = document.getElementById('conversation-container');
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.textContent = message;
        conversationContainer.appendChild(messageElement);
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
        
        this.conversationHistory.push({role: 'user', content: message});
    }
    
    addSystemMessage(message, className = 'system-message') {
        const conversationContainer = document.getElementById('conversation-container');
        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.innerHTML = message;
        conversationContainer.appendChild(messageElement);
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
        
        if (className !== 'loading-message') {
            this.conversationHistory.push({role: 'assistant', content: message});
        }
    }
    
    displaySuggestedActions(actions) {
        const conversationContainer = document.getElementById('conversation-container');
        const actionsElement = document.createElement('div');
        actionsElement.className = 'suggested-actions';
        
        actionsElement.innerHTML = `
            <div class="actions-header">Suggested Actions:</div>
            <div class="actions-list">
                ${actions.map(action => `
                    <button class="action-btn" data-action="${action.id}">
                        ${action.name}
                    </button>
                `).join('')}
            </div>
        `;
        
        conversationContainer.appendChild(actionsElement);
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
        
        // Attach event listeners to action buttons
        actionsElement.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeAction(e.target.dataset.action);
            });
        });
    }
    
    async executeAction(actionId) {
        // Implementation to execute suggested actions
        console.log(`Executing action: ${actionId}`);
        // ...
    }
}

// Initialize the assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.fraudAssistant = new FraudInvestigationAssistant();
    const assistantContainer = document.getElementById('fraud-assistant-container');
    if (assistantContainer) {
        window.fraudAssistant.initialize(assistantContainer);
    }
});