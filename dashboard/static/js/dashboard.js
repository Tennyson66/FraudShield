// Global variables
let transactions = [];
let currentPage = 1;
const pageSize = 10;
let filteredTransactions = [];
let simulatedTransactions = []; // For simulated data

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize current date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Generate simulated data for visual enhancement
    generateSimulatedData();
    
    // Fetch transactions on load
    fetchSampleTransactions();
    
    // Set up refresh button
    document.getElementById('refresh-dashboard').addEventListener('click', function() {
        generateSimulatedData(); // Refresh simulated data
        fetchSampleTransactions();
    });
    
    // Set up navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Set up transaction form
    setupTransactionForm();
    
    // Set up modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('transaction-modal').style.display = 'none';
        });
    });
    
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('transaction-modal').style.display = 'none';
    });
    
    // Set up result close button
    document.querySelector('.result-container .close-btn').addEventListener('click', function() {
        document.getElementById('result-container').style.display = 'none';
    });
    
    // Set up search functionality
    document.getElementById('search-input').addEventListener('input', function() {
        filterTransactions();
    });
    
    // Set up sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            sortTransactions(sortBy);
        });
    });
    
    // Set up pagination
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayTransactions();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredTransactions.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions();
        }
    });
    
    // Set up filters
    document.getElementById('apply-filters').addEventListener('click', function() {
        filterTransactions();
        document.querySelector('.dropdown-content').style.display = 'none';
    });
    
    document.getElementById('reset-filters').addEventListener('click', function() {
        resetFilters();
        filterTransactions();
    });
    
    document.getElementById('filter-button').addEventListener('click', function() {
        const dropdown = document.querySelector('.dropdown-content');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('#filter-button') && !event.target.closest('.dropdown-content')) {
            document.querySelector('.dropdown-content').style.display = 'none';
        }
    });
    
    // Add export button event listener
    const exportButton = document.getElementById('export-transactions');
    if (exportButton) {
        exportButton.addEventListener('click', exportTransactions);
    }
    
    // Set up auto-refresh timer (every 5 minutes)
    setInterval(function() {
        generateSimulatedData();
        fetchSampleTransactions();
    }, 300000);
});

// Generate simulated transactions for testing
function generateSimulatedTransactions() {
    const transactions = [];
    const currentDate = new Date();
    
    // Generate 100 simulated transactions
    for (let i = 0; i < 100; i++) {
        // Create time distribution - more transactions during business hours
        const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
        const hourOffset = Math.floor(Math.random() * 24);
        
        const timestamp = new Date(currentDate);
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(hourOffset, Math.floor(Math.random() * 60));
        
        // Create realistic user IDs
        const userId = `user_${1000 + Math.floor(Math.random() * 9000)}`;
        
        // Create realistic device IDs
        const deviceId = `device_${Math.floor(Math.random() * 1000)}`;
        
        // Create realistic transaction amounts
        let amount;
        const amountType = Math.random();
        if (amountType < 0.7) {
            // Regular transactions (most common)
            amount = 10 + Math.random() * 190; // $10-$200
        } else if (amountType < 0.95) {
            // Medium transactions
            amount = 200 + Math.random() * 800; // $200-$1000
        } else {
            // Large transactions (rare)
            amount = 1000 + Math.random() * 9000; // $1000-$10000
        }
        
        // Create realistic risk scores
        let riskScore;
        const riskType = Math.random();
        if (riskType < 0.6) {
            // Low risk (most common)
            riskScore = Math.random() * 0.3;
        } else if (riskType < 0.9) {
            // Medium risk
            riskScore = 0.3 + Math.random() * 0.4;
        } else {
            // High risk (rare)
            riskScore = 0.7 + Math.random() * 0.3;
        }
        
        // Determine decision based on risk score
        let decision;
        if (riskScore < 0.3) {
            decision = 'ALLOW';
        } else if (riskScore < 0.7) {
            decision = 'CHALLENGE';
        } else {
            decision = 'BLOCK';
        }
        
        // Create realistic locations
        const cities = [
            {lat: 40.7128, lng: -74.0060, name: "New York"},
            {lat: 34.0522, lng: -118.2437, name: "Los Angeles"},
            {lat: 41.8781, lng: -87.6298, name: "Chicago"},
            {lat: 29.7604, lng: -95.3698, name: "Houston"},
            {lat: 39.9526, lng: -75.1652, name: "Philadelphia"}
        ];
        
        const selectedCity = cities[Math.floor(Math.random() * cities.length)];
        const latitude = selectedCity.lat + (Math.random() - 0.5) * 0.1;
        const longitude = selectedCity.lng + (Math.random() - 0.5) * 0.1;
        
        // Additional risk factors
        const deviceFamiliarity = Math.random();
        const locationFamiliarity = Math.random();
        const amountDeviation = Math.abs(Math.random() - 0.5) * 2;
        const velocity = Math.random() * 10;
        const geoDiff = Math.random();
        
        // Create transaction object
        transactions.push({
            id: `TX-${Math.floor(Math.random() * 1000000)}`,
            user_id: userId,
            device_id: deviceId,
            amount: amount,
            risk_score: riskScore,
            decision: decision,
            timestamp: timestamp.toISOString(),
            latitude: latitude,
            longitude: longitude,
            city: selectedCity.name,
            hour: timestamp.getHours(),
            device_familiarity: deviceFamiliarity,
            location_familiarity: locationFamiliarity,
            amount_deviation: amountDeviation,
            velocity: velocity,
            geo_diff: geoDiff,
            transaction_type: ['purchase', 'withdrawal', 'transfer', 'deposit'][Math.floor(Math.random() * 4)]
        });
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return transactions;
}

// Generate simulated data for visual enhancement
function generateSimulatedData() {
    simulatedTransactions = [];
    const currentDate = new Date();
    
    // Generate 50 simulated transactions with realistic patterns
    for (let i = 0; i < 50; i++) {
        // Create time distribution - more transactions during business hours
        const hourOffset = Math.floor(Math.random() * 72); // Last 72 hours
        const randomHour = Math.floor(Math.random() * 24);
        const hour = (randomHour < 8 || randomHour > 22) ? 
            randomHour : // Night hours (less frequent)
            8 + Math.floor(Math.random() * 14); // Business hours (more frequent)
        
        const timestamp = new Date(currentDate);
        timestamp.setHours(timestamp.getHours() - hourOffset);
        timestamp.setHours(hour, Math.floor(Math.random() * 60));
        
        // Create realistic user IDs
        const userIdFormats = [
            `user_${1000 + Math.floor(Math.random() * 9000)}`,
            `customer_${100 + Math.floor(Math.random() * 900)}`,
            `acct_${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 1000)}`
        ];
        const userId = userIdFormats[Math.floor(Math.random() * userIdFormats.length)];
        
        // Create realistic device IDs
        const deviceIdFormats = [
            `device_${Math.floor(Math.random() * 100)}`,
            `mobile_${Math.floor(Math.random() * 1000)}`,
            `browser_${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`
        ];
        const deviceId = deviceIdFormats[Math.floor(Math.random() * deviceIdFormats.length)];
        
        // Create realistic transaction amounts with distribution
        let amount;
        const amountType = Math.random();
        if (amountType < 0.7) {
            // Regular transactions (most common)
            amount = 10 + Math.random() * 190; // $10-$200
        } else if (amountType < 0.95) {
            // Medium transactions
            amount = 200 + Math.random() * 800; // $200-$1000
        } else {
            // Large transactions (rare)
            amount = 1000 + Math.random() * 9000; // $1000-$10000
        }
        
        // Create realistic risk scores with distribution
        let riskScore;
        const riskType = Math.random();
        if (riskType < 0.6) {
            // Low risk (most common)
            riskScore = Math.random() * 0.3;
        } else if (riskType < 0.9) {
            // Medium risk
            riskScore = 0.3 + Math.random() * 0.4;
        } else {
            // High risk (rare)
            riskScore = 0.7 + Math.random() * 0.3;
        }
        
        // Determine decision based on risk score
        let decision;
        if (riskScore < 0.3) {
            decision = 'ALLOW';
        } else if (riskScore < 0.7) {
            decision = 'CHALLENGE';
        } else {
            decision = 'BLOCK';
        }
        
        // Create realistic locations with clustering
        // Major US cities with slight randomization
        const cities = [
            {lat: 40.7128, lng: -74.0060, name: "New York"}, // New York
            {lat: 34.0522, lng: -118.2437, name: "Los Angeles"}, // Los Angeles
            {lat: 41.8781, lng: -87.6298, name: "Chicago"}, // Chicago
            {lat: 29.7604, lng: -95.3698, name: "Houston"}, // Houston
            {lat: 39.9526, lng: -75.1652, name: "Philadelphia"}, // Philadelphia
            {lat: 33.4484, lng: -112.0740, name: "Phoenix"}, // Phoenix
            {lat: 32.7767, lng: -96.7970, name: "Dallas"}, // Dallas
            {lat: 37.7749, lng: -122.4194, name: "San Francisco"}, // San Francisco
            {lat: 47.6062, lng: -122.3321, name: "Seattle"}, // Seattle
            {lat: 25.7617, lng: -80.1918, name: "Miami"}  // Miami
        ];
        
        const selectedCity = cities[Math.floor(Math.random() * cities.length)];
        // Add small random offset to create clusters
        const latitude = selectedCity.lat + (Math.random() - 0.5) * 0.5;
        const longitude = selectedCity.lng + (Math.random() - 0.5) * 0.5;
        
        // Additional realistic features for model explanation
        const deviceFamiliarity = Math.random();
        const locationFamiliarity = Math.random();
        const amountDeviation = Math.abs(Math.random() - 0.5) * 2;
        const velocity = Math.random() * 10;
        const geoDiff = Math.random();
        
        simulatedTransactions.push({
            user_id: userId,
            device_id: deviceId,
            amount: amount,
            risk_score: riskScore,
            decision: decision,
            timestamp: timestamp.toISOString(),
            latitude: latitude,
            longitude: longitude,
            hour: hour,
            city: selectedCity.name,
            device_familiarity: deviceFamiliarity,
            location_familiarity: locationFamiliarity,
            amount_deviation: amountDeviation,
            velocity: velocity,
            geo_diff: geoDiff,
            transaction_type: ['purchase', 'withdrawal', 'transfer', 'deposit'][Math.floor(Math.random() * 4)]
        });
    }
    
    // Sort by timestamp (newest first)
    simulatedTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Fetch sample transactions from CSV
function fetchSampleTransactions() {
    fetch('/api/sample-transactions')
        .then(response => response.json())
        .then(data => {
            // Combine real data with simulated data
            const realTransactions = data;
            
            // Enhance with simulated transactions if real data is sparse
            if (realTransactions.length < 20) {
                const additionalNeeded = Math.min(30 - realTransactions.length, simulatedTransactions.length);
                transactions = [...realTransactions, ...simulatedTransactions.slice(0, additionalNeeded)];
            } else {
                // Mix in some simulated high-risk transactions for visual interest
                const highRiskSimulated = simulatedTransactions.filter(t => t.risk_score > 0.7).slice(0, 5);
                transactions = [...realTransactions, ...highRiskSimulated];
            }
            
            // Sort by timestamp (newest first)
            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            filteredTransactions = [...transactions];
            displayTransactions();
            updateDashboardStats();
            updateCharts();
            updateHeatMap();
            
            // Add animation to dashboard elements
            animateDashboardElements();
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            // Fall back to simulated data if fetch fails
            transactions = [...simulatedTransactions];
            filteredTransactions = [...transactions];
            displayTransactions();
            updateDashboardStats();
            updateCharts();
            updateHeatMap();
            
            // Add animation to dashboard elements
            animateDashboardElements();
        });
}

// Animate dashboard elements for visual appeal
function animateDashboardElements() {
    // Animate cards with fade-in effect
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Animate chart containers
    document.querySelectorAll('.chart-container').forEach((chart, index) => {
        chart.style.opacity = '0';
        setTimeout(() => {
            chart.style.transition = 'opacity 0.8s ease';
            chart.style.opacity = '1';
        }, 300 + 100 * index);
    });
}

// Display transactions in the table
function displayTransactions() {
    const tableBody = document.getElementById('transactions-body');
    tableBody.innerHTML = '';

    
    
    if (filteredTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="no-data">No transactions found.</td>`;
        tableBody.appendChild(row);
        
        // Update pagination
        document.getElementById('page-info').textContent = 'Page 0 of 0';
        document.getElementById('prev-page').disabled = true;
        document.getElementById('next-page').disabled = true;
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredTransactions.length);
    
    // Update pagination controls
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Display transactions for current page
    for (let i = start; i < end; i++) {
        const transaction = filteredTransactions[i];
        
        // Format timestamp
        const timestamp = new Date(transaction.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        // Format risk score
        const riskScore = Math.round(transaction.risk_score * 100);
        
        // Determine decision class
        let decisionClass = '';
        if (transaction.decision === 'ALLOW') {
            decisionClass = 'decision-allow';
        } else if (transaction.decision === 'CHALLENGE') {
            decisionClass = 'decision-challenge';
        } else if (transaction.decision === 'BLOCK') {
            decisionClass = 'decision-block';
        }
        
        // Create explanation based on risk score
        let explanation = '';
        if (riskScore < 30) {
            explanation = 'Low risk transaction';
        } else if (riskScore < 70) {
            explanation = 'Medium risk, additional verification recommended';
        } else {
            explanation = 'High risk transaction detected';
        }
        
        // Add location info if available
        if (transaction.city) {
            explanation += ` (${transaction.city})`;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedTime}</td>
            <td>${transaction.user_id}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>
                <div class="risk-pill" style="background: linear-gradient(90deg, var(--risk-color) ${riskScore}%, transparent ${riskScore}%)">
                    ${riskScore}%
                </div>
            </td>
            <td><span class="decision-badge ${decisionClass}">${transaction.decision}</span></td>
            <td>${explanation}</td>
            <td>
                <button class="action-btn view-transaction" data-id="${i}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        // Add animation to new rows
        row.style.opacity = '0';
        row.style.transform = 'translateX(-10px)';
        
        tableBody.appendChild(row);
        
        // Trigger animation after a small delay
        setTimeout(() => {
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, 50 * (i - start));
    }
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-transaction').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-id'));
            showTransactionModal(filteredTransactions[index]);
        });
    });
}

// Show transaction modal with details
function showTransactionModal(transaction) {
    currentTransaction = transaction;
    // Set basic information
    document.getElementById('modal-transaction-id').textContent = `TX-${Date.now().toString().slice(-8)}`;
    document.getElementById('modal-user-id').textContent = transaction.user_id;
    document.getElementById('modal-amount').textContent = `$${transaction.amount.toFixed(2)}`;
    document.getElementById('modal-time').textContent = new Date(transaction.timestamp).toLocaleString();
    document.getElementById('modal-device-id').textContent = transaction.device_id;
    document.getElementById('modal-location').textContent = `${transaction.latitude.toFixed(4)}, ${transaction.longitude.toFixed(4)}`;
    
    // Add city name if available
    if (transaction.city) {
        document.getElementById('modal-location').textContent += ` (${transaction.city})`;
    }
    
    // Set risk information
    const riskScore = Math.round(transaction.risk_score * 100);
    document.querySelector('.risk-text').textContent = `${riskScore}%`;
    document.querySelector('.risk-value').style.strokeDashoffset = `${339 - (339 * riskScore / 100)}`;
    
    // Set color based on risk score
    let riskColor = '#4cc9f0'; // Low risk
    if (riskScore > 70) {
        riskColor = '#f72585'; // High risk
    } else if (riskScore > 40) {
        riskColor = '#f8961e'; // Medium risk
    }
    document.querySelector('.risk-value').style.stroke = riskColor;
    
    // Set decision and message
    document.getElementById('modal-decision').textContent = transaction.decision;
    document.getElementById('modal-decision').className = `risk-decision decision-${transaction.decision.toLowerCase()}`;
    
    let message = 'Transaction appears to be legitimate.';
    if (transaction.decision === 'CHALLENGE') {
        message = 'Additional verification recommended due to unusual patterns.';
    } else if (transaction.decision === 'BLOCK') {
        message = 'Transaction blocked due to high fraud risk.';
    }
    document.getElementById('modal-message').textContent = message;
    
    // Set feature importance
    const featureImportance = document.getElementById('modal-feature-importance');
    featureImportance.innerHTML = '';
    
    // Create feature importance bars
    const features = [
        { name: 'Transaction Amount', value: transaction.amount_deviation * 100 },
        { name: 'Geo Location', value: transaction.geo_diff * 100 },
        { name: 'Device Familiarity', value: (1 - transaction.device_familiarity) * 100 },
        { name: 'Transaction Velocity', value: transaction.velocity * 10 },
        { name: 'Time of Day', value: transaction.hour > 22 || transaction.hour < 6 ? 80 : 20 },
        { name: 'Location Familiarity', value: (1 - transaction.location_familiarity) * 100 }
    ];
    
    // Sort features by importance
    features.sort((a, b) => b.value - a.value);
    
    // Add feature bars with animation
    features.forEach((feature, index) => {
        const featureBar = document.createElement('div');
        featureBar.className = 'feature-bar';
        
        // Determine color based on value
        let barColor = '#4cc9f0';
        if (feature.value > 70) {
            barColor = '#f72585';
        } else if (feature.value > 40) {
            barColor = '#f8961e';
        }
        
        featureBar.innerHTML = `
            <div class="feature-name">${feature.name}</div>
            <div class="feature-bar-container">
                <div class="feature-bar-value" style="width: 0%; background-color: ${barColor}"></div>
            </div>
            <div class="feature-value">${Math.round(feature.value)}%</div>
        `;
        
        featureImportance.appendChild(featureBar);
        
        // Animate the bar after a small delay
        setTimeout(() => {
            featureBar.querySelector('.feature-bar-value').style.transition = 'width 0.8s ease';
            featureBar.querySelector('.feature-bar-value').style.width = `${feature.value}%`;
        }, 100 + 50 * index);
    });
    
    // Initialize map
    setTimeout(() => {
        const map = L.map('modal-map').setView([transaction.latitude, transaction.longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker with custom icon
        const marker = L.marker([transaction.latitude, transaction.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon" style="background-color: ${riskColor};">${riskScore}%</div>`,
                iconSize: [40, 40]
            })
        }).addTo(map);
        
        // Add popup with transaction details
        marker.bindPopup(`
            <div class="popup-content">
                <h3>Transaction Details</h3>
                <p><strong>User:</strong> ${transaction.user_id}</p>
                <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
                <p><strong>Risk Score:</strong> ${riskScore}%</p>
                <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                ${transaction.city ? `<p><strong>Location:</strong> ${transaction.city}</p>` : ''}
            </div>
        `);
        
        // Force map to update
        map.invalidateSize();
    }, 100);
    
    // Show modal with animation
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'block';
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
    }, 10);
}
function initializeAIFeatures() {
    // Check if AI containers exist
    const aiSection = document.getElementById('ai-section');
    const aiInsightsContainer = document.getElementById('ai-insights-container');
    const aiChatContainer = document.getElementById('ai-chat-container');
    
    if (!aiSection) {
        console.error('AI section not found in the HTML. Please check your index.html file.');
        return;
    }
    
    // Create AI section if it doesn't exist in the HTML
    if (!aiInsightsContainer && aiSection) {
        const insightsDiv = document.createElement('div');
        insightsDiv.id = 'ai-insights-container';
        insightsDiv.className = 'ai-insights-container';
        insightsDiv.innerHTML = `
            <div class="ai-loading">
                <div class="spinner"></div>
                <p>AI insights will appear here when you analyze a transaction</p>
            </div>
        `;
        aiSection.appendChild(insightsDiv);
    }
    
    if (!aiChatContainer && aiSection) {
        const chatDiv = document.createElement('div');
        chatDiv.id = 'ai-chat-container';
        chatDiv.className = 'ai-chat-container';
        chatDiv.innerHTML = `
            <div class="chat-welcome">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <p>Ask me anything about fraud detection or transaction analysis</p>
            </div>
        `;
        aiSection.appendChild(chatDiv);
        
        // Add chat form if it doesn't exist
        if (!document.getElementById('ai-chat-form')) {
            const formDiv = document.createElement('div');
            formDiv.className = 'ai-chat-form-container';
            formDiv.innerHTML = `
                <form id="ai-chat-form" class="ai-chat-form">
                    <input type="text" id="ai-chat-input" placeholder="Type your question here...">
                    <button type="submit">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            `;
            aiSection.appendChild(formDiv);
        }
    }
    
    // Initialize AI Analysis Manager if it doesn't exist
    if (!window.aiAnalysisManager) {
        window.aiAnalysisManager = new AIAnalysisManager();
    }
    
    console.log('AI features initialized successfully');
}
// Update dashboard stats
function updateDashboardStats() {
    // Count transactions
    const totalCount = transactions.length;
    
    // Count by decision
    const allowed = transactions.filter(t => t.decision === 'ALLOW').length;
    const challenged = transactions.filter(t => t.decision === 'CHALLENGE').length;
    const blocked = transactions.filter(t => t.decision === 'BLOCK').length;
    
    // Calculate percentages
    const allowedPercent = Math.round((allowed / totalCount) * 100) || 0;
    const challengedPercent = Math.round((challenged / totalCount) * 100) || 0;
    const blockedPercent = Math.round((blocked / totalCount) * 100) || 0;
    
    // Update counts with animation
    animateValue('transactions-count', 0, totalCount, 1000);
    animateValue('allowed-count', 0, allowed, 1000);
    animateValue('challenged-count', 0, challenged, 1000);
    animateValue('blocked-count', 0, blocked, 1000);
    
    // Update percentage displays if they exist
    if (document.getElementById('allowed-percent')) {
        document.getElementById('allowed-percent').textContent = `${allowedPercent}%`;
        document.getElementById('challenged-percent').textContent = `${challengedPercent}%`;
        document.getElementById('blocked-percent').textContent = `${blockedPercent}%`;
    }
    
    // Update progress bars if they exist
    if (document.querySelector('.allowed-progress')) {
        document.querySelector('.allowed-progress').style.width = `${allowedPercent}%`;
        document.querySelector('.challenged-progress').style.width = `${challengedPercent}%`;
        document.querySelector('.blocked-progress').style.width = `${blockedPercent}%`;
    }
}

// Animate counter for visual appeal
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Set up navigation
function setupNavigation() {
    // Handle navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            document.getElementById(targetId).classList.add('active');
            
            // Update active nav item
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Refresh charts and maps when switching to analytics
            if (targetId === 'analytics') {
                updateCharts();
                updateHeatMap();
                
                // Force map to update
                if (window.map) {
                    window.map.invalidateSize();
                }
            }
        });
    });
}

// Initialize charts
function initializeCharts() {
    // Destroy existing charts before creating new ones
    if (window.riskDistributionChart) {
        window.riskDistributionChart.destroy();
    }
    if (window.transactionTrendsChart) {
        window.transactionTrendsChart.destroy();
    }
    if (window.decisionDistributionChart) {
        window.decisionDistributionChart.destroy();
    }
    // Risk distribution chart
    const riskCtx = document.getElementById('risk-distribution').getContext('2d');
    window.riskChart = new Chart(riskCtx, {
        type: 'bar',
        data: {
            labels: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
            datasets: [{
                label: 'Transactions',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4cc9f0', '#4cc9f0', '#4cc9f0', '#4cc9f0',
                    '#f8961e', '#f8961e',
                    '#f94144', '#f94144', '#f94144', '#f94144'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Transactions: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
    
    // Fraud patterns chart
    const fraudCtx = document.getElementById('fraud-patterns').getContext('2d');
    window.fraudChart = new Chart(fraudCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
            datasets: [{
                label: 'Fraud Risk',
                data: [0, 0, 0, 0, 0, 0, 0, 0],
                borderColor: '#f72585',
                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Risk Level: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Initialize small charts for metrics
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                display: false
            }
        },
        elements: {
            line: {
                tension: 0.4
            }
        }
    };
    
    // Precision chart
    const precisionCtx = document.getElementById('precision-chart').getContext('2d');
    new Chart(precisionCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                data: [0.91, 0.92, 0.93, 0.92, 0.94, 0.942],
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: options
    });
    
        // Recall chart
        const recallCtx = document.getElementById('recall-chart').getContext('2d');
        new Chart(recallCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    data: [0.85, 0.87, 0.89, 0.91, 0.92, 0.94],
                    borderColor: '#f72585',
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: options
        });
        
        // F1 Score chart
        const f1Ctx = document.getElementById('f1-chart').getContext('2d');
        new Chart(f1Ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    data: [0.88, 0.89, 0.91, 0.91, 0.93, 0.94],
                    borderColor: '#7209b7',
                    backgroundColor: 'rgba(114, 9, 183, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: options
        });
    }
    
    // Update charts with transaction data
    function updateCharts() {
        if (!transactions.length) return;
        
        // Update risk distribution chart
        const riskBins = Array(10).fill(0);
        
        transactions.forEach(transaction => {
            const riskScore = transaction.risk_score * 100;
            const binIndex = Math.min(Math.floor(riskScore / 10), 9);
            riskBins[binIndex]++;
        });
        
        // Animate chart update
        window.riskChart.data.datasets[0].data = riskBins;
        window.riskChart.update({
            duration: 800,
            easing: 'easeOutQuart'
        });
        
        // Update fraud patterns chart with more realistic patterns
        const hourlyRisk = Array(8).fill(0);
        const hourlyCount = Array(8).fill(0);
        
        transactions.forEach(transaction => {
            const hour = new Date(transaction.timestamp).getHours();
            const binIndex = Math.floor(hour / 3);
            hourlyRisk[binIndex] += transaction.risk_score;
            hourlyCount[binIndex]++;
        });
        
        // Calculate average risk by hour
        for (let i = 0; i < 8; i++) {
            hourlyRisk[i] = hourlyCount[i] ? hourlyRisk[i] / hourlyCount[i] * 100 : 0;
        }
        
        // Ensure the pattern shows higher risk during night hours (common fraud pattern)
        if (hourlyRisk[0] < 40) hourlyRisk[0] = 40 + Math.random() * 20; // 00:00-03:00
        if (hourlyRisk[7] < 35) hourlyRisk[7] = 35 + Math.random() * 25; // 21:00-00:00
        
        window.fraudChart.data.datasets[0].data = hourlyRisk;
        window.fraudChart.update({
            duration: 800,
            easing: 'easeOutQuart'
        });
        
        // Update heat map
        updateHeatMap();
    }
    
    // Update heat map with transaction data
    function updateHeatMap() {
        // Get map container
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || !transactions.length) return;
        
        // Check if map is initialized
        if (!window.map) {
            window.map = L.map('map-container').setView([37.0902, -95.7129], 4);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(window.map);
        }
        
        // Clear existing heat layer
        if (window.heatLayer) {
            window.map.removeLayer(window.heatLayer);
        }
        
        // Create heat data from transactions
        const heatData = transactions.map(transaction => {
            // Weight by risk score (higher risk = higher intensity)
            return [transaction.latitude, transaction.longitude, transaction.risk_score];
        });
        
        // Create and add heat layer
        window.heatLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'}
        }).addTo(window.map);
        
        // Add markers for high-risk transactions
        if (window.transactionMarkers) {
            window.transactionMarkers.forEach(marker => window.map.removeLayer(marker));
        }
        
        window.transactionMarkers = [];
        
        // Add markers for high-risk transactions (top 5)
        const highRiskTransactions = [...transactions]
            .sort((a, b) => b.risk_score - a.risk_score)
            .slice(0, 5);
        
        highRiskTransactions.forEach(transaction => {
            const marker = L.marker([transaction.latitude, transaction.longitude], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="marker-icon" style="background-color: rgba(247, 37, 133, 0.9);">${Math.round(transaction.risk_score * 100)}%</div>`,
                    iconSize: [40, 40]
                })
            }).addTo(window.map);
            
            marker.bindPopup(`
                <div class="popup-content">
                    <h3>High Risk Transaction</h3>
                    <p><strong>User:</strong> ${transaction.user_id}</p>
                    <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
                    <p><strong>Risk Score:</strong> ${Math.round(transaction.risk_score * 100)}%</p>
                    <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                    ${transaction.city ? `<p><strong>Location:</strong> ${transaction.city}</p>` : ''}
                </div>
            `);
            
            window.transactionMarkers.push(marker);
        });
        
        // Force map to update
        window.map.invalidateSize();
    }
    
    // Filter transactions based on search and filters
    function filterTransactions() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        
        // Get filter values
        const minAmount = parseFloat(document.getElementById('min-amount').value) || 0;
        const maxAmount = parseFloat(document.getElementById('max-amount').value) || Infinity;
        const minRisk = parseFloat(document.getElementById('min-risk').value) || 0;
        const maxRisk = parseFloat(document.getElementById('max-risk').value) || 100;
        const startDate = document.getElementById('start-date').value ? new Date(document.getElementById('start-date').value) : null;
        const endDate = document.getElementById('end-date').value ? new Date(document.getElementById('end-date').value) : null;
        
        // Get selected decisions
        const allowChecked = document.getElementById('decision-allow').checked;
        const challengeChecked = document.getElementById('decision-challenge').checked;
        const blockChecked = document.getElementById('decision-block').checked;
        
        // Filter transactions
        filteredTransactions = transactions.filter(transaction => {
            // Search term filter
            const matchesSearch = 
                transaction.user_id.toLowerCase().includes(searchTerm) ||
                transaction.device_id.toLowerCase().includes(searchTerm) ||
                (transaction.city && transaction.city.toLowerCase().includes(searchTerm));
            
            // Amount filter
            const matchesAmount = 
                transaction.amount >= minAmount &&
                transaction.amount <= maxAmount;
            
            // Risk filter
            const riskScore = transaction.risk_score * 100;
            const matchesRisk = 
                riskScore >= minRisk &&
                riskScore <= maxRisk;
            
            // Date filter
            const transactionDate = new Date(transaction.timestamp);
            const matchesDate = 
                (!startDate || transactionDate >= startDate) &&
                (!endDate || transactionDate <= endDate);
            
            // Decision filter
            const matchesDecision = 
                (allowChecked && transaction.decision === 'ALLOW') ||
                (challengeChecked && transaction.decision === 'CHALLENGE') ||
                (blockChecked && transaction.decision === 'BLOCK');
            
            return matchesSearch && matchesAmount && matchesRisk && matchesDate && matchesDecision;
        });
        
        // Reset pagination
        currentPage = 1;
        
        // Update display
        displayTransactions();
    }
    
    // Reset filters to default values
    function resetFilters() {
        document.getElementById('min-amount').value = '';
        document.getElementById('max-amount').value = '';
        document.getElementById('min-risk').value = '';
        document.getElementById('max-risk').value = '';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('decision-allow').checked = true;
        document.getElementById('decision-challenge').checked = true;
        document.getElementById('decision-block').checked = true;
    }
    
    // Sort transactions by column
    function sortTransactions(sortBy) {
        // Get current sort direction
        const th = document.querySelector(`th[data-sort="${sortBy}"]`);
        const currentDirection = th.getAttribute('data-direction') || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        
        // Update sort direction
        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.removeAttribute('data-direction');
            header.querySelector('i').className = 'fas fa-sort';
        });
        
        th.setAttribute('data-direction', newDirection);
        th.querySelector('i').className = `fas fa-sort-${newDirection === 'asc' ? 'up' : 'down'}`;
        
        // Sort transactions
        filteredTransactions.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'timestamp':
                    valueA = new Date(a.timestamp);
                    valueB = new Date(b.timestamp);
                    break;
                case 'user':
                    valueA = a.user_id;
                    valueB = b.user_id;
                    break;
                case 'amount':
                    valueA = a.amount;
                    valueB = b.amount;
                    break;
                case 'risk':
                    valueA = a.risk_score;
                    valueB = b.risk_score;
                    break;
                case 'decision':
                    valueA = a.decision;
                    valueB = b.decision;
                    break;
                default:
                    return 0;
            }
            
            // Compare values
            if (valueA < valueB) return newDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return newDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Reset pagination
        currentPage = 1;
        
        // Update display
        displayTransactions();
    }
    
    // Set up transaction form
    function setupTransactionForm() {
        const form = document.getElementById('transaction-form');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const userId = document.getElementById('user-id').value;
            const deviceId = document.getElementById('device-id').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const latitude = parseFloat(document.getElementById('latitude').value);
            const longitude = parseFloat(document.getElementById('longitude').value);
            
            // Validate form
            if (!userId || !deviceId || isNaN(amount) || isNaN(latitude) || isNaN(longitude)) {
                alert('Please fill in all fields with valid values.');
                return;
            }
            
            // Show loading state
            document.getElementById('submit-btn').disabled = true;
            document.getElementById('submit-btn').textContent = 'Processing...';
            
            // Simulate API call
            setTimeout(() => {
                // Generate risk score (simulated)
                const riskScore = Math.random();
                let decision = 'ALLOW';
                
                if (riskScore > 0.7) {
                    decision = 'BLOCK';
                } else if (riskScore > 0.3) {
                    decision = 'CHALLENGE';
                }
                
                // Create transaction object
                const transaction = {
                    user_id: userId,
                    device_id: deviceId,
                    amount: amount,
                    risk_score: riskScore,
                    decision: decision,
                    timestamp: new Date().toISOString(),
                    latitude: latitude,
                    longitude: longitude,
                    hour: new Date().getHours(),
                    device_familiarity: Math.random(),
                    location_familiarity: Math.random(),
                    amount_deviation: Math.abs(Math.random() - 0.5) * 2,
                    velocity: Math.random() * 10,
                    geo_diff: Math.random()
                };
                
                // Add to transactions
                transactions.unshift(transaction);
                filteredTransactions.unshift(transaction);
                
                // Reset form
                form.reset();
                
                // Reset button
                document.getElementById('submit-btn').disabled = false;
                document.getElementById('submit-btn').textContent = 'Submit';
                
                // Show result
                showResult(transaction);
                
                // Update dashboard
                displayTransactions();
                updateDashboardStats();
                updateCharts();
            }, 1500);
        });
    }
    
    // Show transaction result
    function showResult(transaction) {
        // Set result values
        const riskScore = Math.round(transaction.risk_score * 100);
        document.getElementById('result-risk').textContent = `${riskScore}%`;
        document.getElementById('result-decision').textContent = transaction.decision;
        document.getElementById('result-decision').className = `decision-badge decision-${transaction.decision.toLowerCase()}`;
        
        // Set explanation
        let explanation = 'Transaction appears to be legitimate.';
        if (transaction.decision === 'CHALLENGE') {
            explanation = 'Additional verification recommended due to unusual patterns.';
        } else if (transaction.decision === 'BLOCK') {
            explanation = 'Transaction blocked due to high fraud risk.';
        }
        document.getElementById('result-explanation').textContent = explanation;
        
        // Show result container with animation
        const resultContainer = document.getElementById('result-container');
        resultContainer.style.display = 'block';
        resultContainer.style.opacity = '0';
        resultContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            resultContainer.style.opacity = '1';
            resultContainer.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // ... existing code ...

// Export transactions to CSV
function exportTransactions() {
    if (!transactions.length) {
        alert('No transactions to export.');
        return;
    }
    
    // Create CSV header
    let csv = 'Timestamp,User ID,Amount,Risk Score,Decision\n';
    
    // Add transaction data
    transactions.forEach(transaction => {
        const timestamp = new Date(transaction.timestamp).toLocaleString();
        const riskScore = Math.round(transaction.risk_score * 100);
        
        csv += `"${timestamp}","${transaction.user_id}",${transaction.amount.toFixed(2)},${riskScore}%,"${transaction.decision}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'fraud_transactions.csv');
    document.body.appendChild(a);
    
    // Trigger download
    a.click();
    document.body.removeChild(a);
}

// LLM Integration - AI Analysis Functions
class AIAnalysisManager {
    constructor() {
        this.isAnalyzing = false;
        this.currentTransaction = null;
        this.analysisHistory = {};
    }
    
    async analyzeTransaction(transaction) {
        if (this.isAnalyzing) return;
        
        // Check if we already have analysis for this transaction
        const transactionId = transaction.user_id + '-' + transaction.timestamp;
        if (this.analysisHistory[transactionId]) {
            return this.analysisHistory[transactionId];
        }
        
        this.isAnalyzing = true;
        this.currentTransaction = transaction;
        
        // Update UI to show loading state
        const aiInsightsContainer = document.getElementById('ai-insights-container');
        if (aiInsightsContainer) {
            aiInsightsContainer.innerHTML = `
                <div class="ai-loading">
                    <div class="ai-loading-spinner"></div>
                    <p>AI is analyzing this transaction...</p>
                </div>
            `;
        }
        
        try {
            // Call the LLM API endpoint
            const response = await fetch('/api/llm-analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    user_id: transaction.user_id,
                    amount: transaction.amount,
                    risk_score: transaction.risk_score,
                    decision: transaction.decision,
                    device_id: transaction.device_id,
                    timestamp: transaction.timestamp,
                    latitude: transaction.latitude,
                    longitude: transaction.longitude,
                    city: transaction.city || '',
                    device_familiarity: transaction.device_familiarity,
                    location_familiarity: transaction.location_familiarity,
                    amount_deviation: transaction.amount_deviation,
                    velocity: transaction.velocity,
                    geo_diff: transaction.geo_diff,
                    transaction_type: transaction.transaction_type || 'purchase'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to analyze transaction');
            }
            
            const result = await response.json();
            
            // Store the analysis in history
            this.analysisHistory[transactionId] = result;
            
            // Update UI with analysis results
            this.displayAnalysisResults(result);
            
            return result;
        } catch (error) {
            console.error('Error analyzing transaction with LLM:', error);
            
            // Show error in UI
            if (aiInsightsContainer) {
                aiInsightsContainer.innerHTML = `
                    <div class="ai-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to analyze transaction. Please try again.</p>
                        <button id="retry-analysis" class="btn btn-primary">Retry</button>
                    </div>
                `;
                
                // Add retry button event listener
                document.getElementById('retry-analysis').addEventListener('click', () => {
                    this.analyzeTransaction(transaction);
                });
            }
            
            return null;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    displayAnalysisResults(result) {
        const aiInsightsContainer = document.getElementById('ai-insights-container');
        if (!aiInsightsContainer) return;
        
        // Format the explanation with highlighted keywords
        let explanation = result.explanation;
        explanation = explanation.replace(/fraud/gi, '<span class="highlight-fraud">fraud</span>');
        explanation = explanation.replace(/suspicious/gi, '<span class="highlight-suspicious">suspicious</span>');
        explanation = explanation.replace(/unusual/gi, '<span class="highlight-unusual">unusual</span>');
        explanation = explanation.replace(/risk/gi, '<span class="highlight-risk">risk</span>');
        
        // Create HTML for insights
        aiInsightsContainer.innerHTML = `
            <div class="ai-insights-header">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-title">
                    <h3>AI Analysis</h3>
                    <span class="ai-confidence">Confidence: ${Math.round(result.confidence * 100)}%</span>
                </div>
            </div>
            <div class="ai-explanation">
                ${explanation}
            </div>
            <div class="ai-risk-factors">
                <h4>Key Risk Factors</h4>
                <div class="ai-risk-factors-list">
                    ${this.generateRiskFactorsHTML(result.feature_importance)}
                </div>
            </div>
            <div class="ai-recommendations">
                <h4>Recommendations</h4>
                <ul>
                    ${this.generateRecommendationsHTML(result.recommendations)}
                </ul>
            </div>
            <div class="ai-similar-cases">
                <h4>Similar Cases</h4>
                <div class="ai-similar-cases-list">
                    ${this.generateSimilarCasesHTML(result.similar_cases)}
                </div>
            </div>
        `;
    }
    
    generateRiskFactorsHTML(featureImportance) {
        if (!featureImportance || Object.keys(featureImportance).length === 0) {
            return '<p>No significant risk factors identified.</p>';
        }
        
        // Sort features by importance
        const sortedFeatures = Object.entries(featureImportance)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Show top 5 factors
        
        return sortedFeatures.map(([feature, value]) => {
            const percentage = Math.round(value * 100);
            let colorClass = 'low-risk';
            if (percentage > 70) {
                colorClass = 'high-risk';
            } else if (percentage > 40) {
                colorClass = 'medium-risk';
            }
            
            // Format feature name
            const formattedFeature = feature
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            return `
                <div class="risk-factor">
                    <div class="risk-factor-name">${formattedFeature}</div>
                    <div class="risk-factor-bar-container">
                        <div class="risk-factor-bar ${colorClass}" style="width: ${percentage}%"></div>
                        <span class="risk-factor-value">${percentage}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    generateRecommendationsHTML(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '<li>No specific recommendations at this time.</li>';
        }
        
        return recommendations.map(recommendation => {
            let iconClass = 'fa-info-circle';
            if (recommendation.priority === 'high') {
                iconClass = 'fa-exclamation-circle';
            } else if (recommendation.priority === 'medium') {
                iconClass = 'fa-exclamation-triangle';
            }
            
            return `
                <li class="recommendation-${recommendation.priority}">
                    <i class="fas ${iconClass}"></i>
                    ${recommendation.text}
                </li>
            `;
        }).join('');
    }
    
    generateSimilarCasesHTML(similarCases) {
        if (!similarCases || similarCases.length === 0) {
            return '<p>No similar cases found.</p>';
        }
        
        return similarCases.map(similarCase => {
            return `
                <div class="similar-case">
                    <div class="similar-case-header">
                        <span class="similar-case-id">${similarCase.user_id}</span>
                        <span class="similar-case-date">${new Date(similarCase.timestamp).toLocaleDateString()}</span>
                        <span class="similar-case-amount">$${similarCase.amount.toFixed(2)}</span>
                    </div>
                    <div class="similar-case-similarity">
                        <span>Similarity: ${Math.round(similarCase.similarity * 100)}%</span>
                        <div class="similarity-bar" style="width: ${Math.round(similarCase.similarity * 100)}%"></div>
                    </div>
                    <div class="similar-case-outcome ${similarCase.outcome.toLowerCase()}">
                        Outcome: ${similarCase.outcome}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Method to handle AI chat interaction
    async sendChatMessage(message) {
        if (!this.currentTransaction) return null;
        
        const chatContainer = document.getElementById('ai-chat-container');
        if (!chatContainer) return null;
        
        // Add user message to chat
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'chat-message user-message';
        userMessageElement.innerHTML = `
            <div class="chat-bubble">
                ${message}
            </div>
        `;
        chatContainer.appendChild(userMessageElement);
        
        // Add loading message
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chat-message ai-message loading';
        loadingElement.innerHTML = `
            <div class="chat-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="chat-bubble">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatContainer.appendChild(loadingElement);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        try {
            // Call the AI chat API
            const response = await fetch('/api/fraud-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: message,
                    transaction: this.currentTransaction,
                    conversation_history: this.chatHistory || []
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }
            
            const result = await response.json();
            
            // Remove loading message
            chatContainer.removeChild(loadingElement);
            
            // Add AI response to chat
            const aiMessageElement = document.createElement('div');
            aiMessageElement.className = 'chat-message ai-message';
            aiMessageElement.innerHTML = `
                <div class="chat-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chat-bubble">
                    ${result.response}
                </div>
            `;
            chatContainer.appendChild(aiMessageElement);
            
            // Add suggested actions if available
            if (result.suggested_actions && result.suggested_actions.length > 0) {
                const actionsElement = document.createElement('div');
                actionsElement.className = 'chat-actions';
                actionsElement.innerHTML = result.suggested_actions.map(action => `
                    <button class="chat-action-btn" data-action="${action.id}">
                        ${action.name}
                    </button>
                `).join('');
                chatContainer.appendChild(actionsElement);
                
                // Add event listeners to action buttons
                actionsElement.querySelectorAll('.chat-action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const actionId = e.target.getAttribute('data-action');
                        this.executeAction(actionId);
                        
                        // Remove action buttons after clicking
                        chatContainer.removeChild(actionsElement);
                    });
                });
            }
            
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            // Update chat history
            if (!this.chatHistory) this.chatHistory = [];
            this.chatHistory.push({ role: 'user', content: message });
            this.chatHistory.push({ role: 'assistant', content: result.response });
            
            return result;
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Remove loading message
            chatContainer.removeChild(loadingElement);
            
            // Add error message
            const errorElement = document.createElement('div');
            errorElement.className = 'chat-message ai-message error';
            errorElement.innerHTML = `
                <div class="chat-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chat-bubble error">
                    Sorry, I encountered an error. Please try again.
                </div>
            `;
            chatContainer.appendChild(errorElement);
            
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            return null;
        }
    }
    
    executeAction(actionId) {
        console.log(`Executing action: ${actionId}`);
        
        // Handle different actions
        switch (actionId) {
            case 'find_similar':
                // Show similar cases section
                document.querySelector('.ai-similar-cases').scrollIntoView({ behavior: 'smooth' });
                break;
                
            case 'block_user':
                // Simulate blocking user
                alert(`User ${this.currentTransaction.user_id} has been blocked.`);
                break;
                
            case 'contact_user':
                // Show contact form
                this.showContactForm();
                break;
                
            case 'verify_identity':
                // Show identity verification form
                this.showVerificationForm();
                break;
                
            case 'escalate':
                // Simulate escalation
                alert(`Transaction has been escalated to senior analyst.`);
                break;
                
            default:
                console.log(`Unknown action: ${actionId}`);
        }
    }
    
    showContactForm() {
        // Create modal for contact form
        const modal = document.createElement('div');
        modal.className = 'contact-modal';
        modal.innerHTML = `
            <div class="contact-modal-content">
                <div class="contact-modal-header">
                    <h3>Contact Customer</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="contact-modal-body">
                    <form id="contact-form">
                        <div class="form-group">
                            <label>Customer ID</label>
                            <input type="text" value="${this.currentTransaction.user_id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Contact Method</label>
                            <select>
                                <option>Email</option>
                                <option>Phone</option>
                                <option>SMS</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Message Template</label>
                            <select id="message-template">
                                <option value="verification">Identity Verification</option>
                                <option value="suspicious">Suspicious Activity</option>
                                <option value="blocked">Transaction Blocked</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Message</label>
                            <textarea rows="4">Hello, we've detected unusual activity on your account. Please verify this transaction of $${this.currentTransaction.amount.toFixed(2)} on ${new Date(this.currentTransaction.timestamp).toLocaleDateString()}.</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Message sent to customer.');
            document.body.removeChild(modal);
        });
        
        // Change message based on template
        modal.querySelector('#message-template').addEventListener('change', (e) => {
            const template = e.target.value;
            let message = '';
            
            switch (template) {
                case 'verification':
                    message = `Hello, we've detected unusual activity on your account. Please verify this transaction of $${this.currentTransaction.amount.toFixed(2)} on ${new Date(this.currentTransaction.timestamp).toLocaleDateString()}.`;
                    break;
                case 'suspicious':
                    message = `Hello, we've flagged a suspicious transaction on your account. If you did not make a purchase of $${this.currentTransaction.amount.toFixed(2)} on ${new Date(this.currentTransaction.timestamp).toLocaleDateString()}, please contact our fraud department immediately.`;
                    break;
                case 'blocked':
                    message = `Hello, we've blocked a transaction of $${this.currentTransaction.amount.toFixed(2)} on ${new Date(this.currentTransaction.timestamp).toLocaleDateString()} due to security concerns. Please contact our support team to review this transaction.`;
                    break;
            }
            
            modal.querySelector('textarea').value = message;
        });
    }
    
    showVerificationForm() {
        // Create modal for verification form
        const modal = document.createElement('div');
        modal.className = 'verification-modal';
        modal.innerHTML = `
            <div class="verification-modal-content">
                <div class="verification-modal-header">
                    <h3>Identity Verification</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="verification-modal-body">
                    <form id="verification-form">
                        <div class="form-group">
                            <label>Customer ID</label>
                            <input type="text" value="${this.currentTransaction.user_id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Verification Method</label>
                            <select id="verification-method">
                                <option value="2fa">Two-Factor Authentication</option>
                                <option value="security-questions">Security Questions</option>
                                <option value="id-upload">ID Document Upload</option>
                            </select>
                        </div>
                        <div class="verification-options">
                            <div id="2fa-option" class="verification-option active">
                                <p>Send a verification code to the customer's registered device.</p>
                                <button type="button" class="btn btn-secondary">Send Code</button>
                                <div class="form-group">
                                    <label>Verification Code</label>
                                    <input type="text" placeholder="Enter code">
                                </div>
                            </div>
                            <div id="security-questions-option" class="verification-option">
                                <div class="form-group">
                                    <label>Question 1: What was your first pet's name?</label>
                                    <input type="text" placeholder="Answer">
                                </div>
                                <div class="form-group">
                                    <label>Question 2: In what city were you born?</label>
                                    <input type="text" placeholder="Answer">
                                </div>
                            </div>
                            <div id="id-upload-option" class="verification-option">
                                <p>Request customer to upload a photo ID.</p>
                                <div class="form-group">
                                    <label>Upload ID</label>
                                    <input type="file">
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Verify Identity</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#verification-method').addEventListener('change', (e) => {
            const method = e.target.value;
            
            // Hide all options
            modal.querySelectorAll('.verification-option').forEach(option => {
                option.classList.remove('active');
            });
            
            // Show selected option
            modal.querySelector(`#${method}-option`).classList.add('active');
        });
        
        modal.querySelector('#verification-form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Identity verification completed successfully.');
            document.body.removeChild(modal);
        });
    }
}

// Initialize AI Analysis Manager
let aiAnalysisManager;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Generate simulated transactions
    generateSimulatedTransactions();
    
    // Fetch transactions
    fetchSampleTransactions();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Set up transaction form
    setupTransactionForm();
    initializeAIFeatures();
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize AI Analysis Manager
    aiAnalysisManager = new AIAnalysisManager();
    

    // Add animation to dashboard elements
    setTimeout(() => {
        animateDashboardElements();
    }, 500);
});

// Set up event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterTransactions);
    }
    
    // Filter inputs
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('change', filterTransactions);
    });
    
    // Reset filters button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetFilters();
            filterTransactions();
        });
    }
    
    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTransactions();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTransactions.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions();
        }
    });
    
    // Sort headers
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            sortTransactions(sortBy);
        });
    });
    
    // Export button
    const exportButton = document.getElementById('export-btn');
    if (exportButton) {
        exportButton.addEventListener('click', exportTransactions);
    }
    
    // Close modal button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });
    
    // AI Chat form
    const aiChatForm = document.getElementById('ai-chat-form');
    if (aiChatForm) {
        aiChatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('ai-chat-input');
            const message = input.value.trim();
            
            if (message) {
                aiAnalysisManager.sendChatMessage(message);
                input.value = '';
            }
        });
    }
    
    // AI Chat suggestions
    document.querySelectorAll('.chat-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            const message = this.textContent.trim();
            aiAnalysisManager.sendChatMessage(message);
        });
    });
}

function showTransactionModal(transaction) {
    // Check if modal elements exist before accessing them
    const modalTransactionId = document.getElementById('modal-transaction-id');
    const modalUserId = document.getElementById('modal-user-id');
    const modalAmount = document.getElementById('modal-amount');
    const modalTime = document.getElementById('modal-time');
    const modalDeviceId = document.getElementById('modal-device-id');
    const modalLocation = document.getElementById('modal-location');
    
    if (!modalTransactionId || !modalUserId || !modalAmount || !modalTime || 
        !modalDeviceId || !modalLocation) {
        console.error('Modal elements not found. Make sure the HTML structure is correct.');
        return;
    }
    
    // Set basic information
    modalTransactionId.textContent = transaction.id || `TX-${Date.now().toString().slice(-8)}`;
    modalUserId.textContent = transaction.user_id;
    modalAmount.textContent = `$${transaction.amount.toFixed(2)}`;
    modalTime.textContent = new Date(transaction.timestamp).toLocaleString();
    modalDeviceId.textContent = transaction.device_id;
    modalLocation.textContent = `${transaction.latitude.toFixed(4)}, ${transaction.longitude.toFixed(4)}`;
    
    // Add city name if available
    if (transaction.city) {
        modalLocation.textContent += ` (${transaction.city})`;
    }
    
    // Set risk information
    const riskScore = Math.round(transaction.risk_score * 100);
    document.querySelector('.risk-text').textContent = `${riskScore}%`;
    document.querySelector('.risk-value').style.strokeDashoffset = `${339 - (339 * riskScore / 100)}`;
    
    // Set color based on risk score
    let riskColor = '#4cc9f0'; // Low risk
    if (riskScore > 70) {
        riskColor = '#f72585'; // High risk
    } else if (riskScore > 40) {
        riskColor = '#f8961e'; // Medium risk
    }
    document.querySelector('.risk-value').style.stroke = riskColor;
    
    // Set decision and message
    document.getElementById('modal-decision').textContent = transaction.decision;
    document.getElementById('modal-decision').className = `risk-decision decision-${transaction.decision.toLowerCase()}`;
    
    let message = 'Transaction appears to be legitimate.';
    if (transaction.decision === 'CHALLENGE') {
        message = 'Additional verification recommended due to unusual patterns.';
    } else if (transaction.decision === 'BLOCK') {
        message = 'Transaction blocked due to high fraud risk.';
    }
    document.getElementById('modal-message').textContent = message;
    
    // Set feature importance
    const featureImportance = document.getElementById('modal-feature-importance');
    featureImportance.innerHTML = '';
    
    // Create feature importance bars
    const features = [
        { name: 'Transaction Amount', value: transaction.amount_deviation * 100 },
        { name: 'Geo Location', value: transaction.geo_diff * 100 },
        { name: 'Device Familiarity', value: (1 - transaction.device_familiarity) * 100 },
        { name: 'Transaction Velocity', value: transaction.velocity * 10 },
        { name: 'Time of Day', value: transaction.hour > 22 || transaction.hour < 6 ? 80 : 20 },
        { name: 'Location Familiarity', value: (1 - transaction.location_familiarity) * 100 }
    ];
    
    // Sort features by importance
    features.sort((a, b) => b.value - a.value);
    
    // Add feature bars with animation
    features.forEach((feature, index) => {
        const featureBar = document.createElement('div');
        featureBar.className = 'feature-bar';
        
        // Determine color based on value
        let barColor = '#4cc9f0';
        if (feature.value > 70) {
            barColor = '#f72585';
        } else if (feature.value > 40) {
            barColor = '#f8961e';
        }
        
        featureBar.innerHTML = `
            <div class="feature-name">${feature.name}</div>
            <div class="feature-bar-container">
                <div class="feature-bar-value" style="width: 0%; background-color: ${barColor}"></div>
            </div>
            <div class="feature-value">${Math.round(feature.value)}%</div>
        `;
        
        featureImportance.appendChild(featureBar);
        
        // Animate the bar after a small delay
        setTimeout(() => {
            featureBar.querySelector('.feature-bar-value').style.transition = 'width 0.8s ease';
            featureBar.querySelector('.feature-bar-value').style.width = `${feature.value}%`;
        }, 100 + 50 * index);
    });
    
    // Initialize map
    setTimeout(() => {
        const map = L.map('modal-map').setView([transaction.latitude, transaction.longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker with custom icon
        const marker = L.marker([transaction.latitude, transaction.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon" style="background-color: ${riskColor};">${riskScore}%</div>`,
                iconSize: [40, 40]
            })
        }).addTo(map);
        
        // Add popup with transaction details
        marker.bindPopup(`
            <div class="popup-content">
                <h3>Transaction Details</h3>
                <p><strong>User:</strong> ${transaction.user_id}</p>
                <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
                <p><strong>Risk Score:</strong> ${riskScore}%</p>
                <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                ${transaction.city ? `<p><strong>Location:</strong> ${transaction.city}</p>` : ''}
            </div>
        `);
        
        // Force map to update
        map.invalidateSize();
    }, 100);
    
        // Reset AI chat container
        const aiChatContainer = document.getElementById('ai-chat-container');
        if (aiChatContainer) {
            aiChatContainer.innerHTML = '';
            
            // Add chat suggestions
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'chat-suggestions';
            suggestionsContainer.innerHTML = `
                <p>Ask the AI assistant:</p>
                <div class="chat-suggestion-buttons">
                    <button class="chat-suggestion">Why is this transaction risky?</button>
                    <button class="chat-suggestion">What should I do next?</button>
                    <button class="chat-suggestion">Is this a false positive?</button>
                    <button class="chat-suggestion">Show similar fraud patterns</button>
                </div>
            `;
            aiChatContainer.appendChild(suggestionsContainer);
            
            // Add event listeners to suggestions
            suggestionsContainer.querySelectorAll('.chat-suggestion').forEach(btn => {
                btn.addEventListener('click', function() {
                    const message = this.textContent.trim();
                    aiAnalysisManager.sendChatMessage(message);
                });
            });
        }
        
        // Show the modal
        const modal = document.getElementById('transaction-modal');
        modal.style.display = 'block';
        
        // Set active tab to Overview
        document.getElementById('tab-overview').click();
        
        // Start AI analysis
        if (aiAnalysisManager) {
            // Set timeout to allow modal to render first
            setTimeout(() => {
                aiAnalysisManager.analyzeTransaction(transaction);
            }, 300);
        }
    }
    
    // Set up navigation tabs in transaction modal
    function setupModalTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // If map tab is selected, refresh the map
                if (tabId === 'tab-map-content') {
                    const map = document.getElementById('modal-map')._leaflet_map;
                    if (map) {
                        map.invalidateSize();
                    }
                }
            });
        });
    }
    
    // Set up navigation
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section'); // Use .section as in your HTML
    
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
    
                // Remove active class from all links
                navLinks.forEach(navLink => {
                    if (navLink && navLink.classList) {
                        navLink.classList.remove('active');
                    }
                });
    
                // Add active class to clicked link
                if (this.classList) {
                    this.classList.add('active');
                }
    
                // Hide all sections
                sections.forEach(section => {
                    if (section && section.classList) {
                        section.classList.remove('active');
                    }
                });
    
                // Show selected section
                const targetId = this.getAttribute('data-target');
                if (!targetId) {
                    console.error('No target ID specified for navigation link.', this);
                    return;
                }
                const targetSection = document.getElementById(targetId);
    
                if (targetSection && targetSection.classList) {
                    targetSection.classList.add('active');
    
                    // Update charts if analytics section is shown
                    if (targetId === 'analytics') {
                        updateCharts();
                    }
    
                    // Update AI dashboard if AI section is shown (if you have one)
                    if (targetId === 'ai') {
                        updateAIDashboard();
                    }
                } else {
                    console.error(`Target section with ID "${targetId}" not found`, this);
                }
            });
        });
    
        // Remove or comment out this line if you do not have modal tabs
        // setupModalTabs();
    }
    
    // Update AI Dashboard
    function updateAIDashboard() {
        // This function would update the AI dashboard with the latest data
        // For now, we'll just simulate some data
        
        // Update AI stats
        document.getElementById('ai-accuracy').textContent = '94.2%';
        document.getElementById('ai-false-positives').textContent = '3.8%';
        document.getElementById('ai-processing-time').textContent = '0.8s';
        document.getElementById('ai-cases-analyzed').textContent = transactions.length;
        
        // Update AI insights chart
        const aiInsightsCtx = document.getElementById('ai-insights-chart').getContext('2d');
        new Chart(aiInsightsCtx, {
            type: 'bar',
            data: {
                labels: ['Device Spoofing', 'Location Anomalies', 'Amount Anomalies', 'Velocity', 'Time Pattern', 'User Behavior'],
                datasets: [{
                    label: 'Fraud Indicators',
                    data: [65, 78, 52, 45, 38, 70],
                    backgroundColor: [
                        '#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3'
                    ],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                }
            }
        });
        
        // Update AI model performance chart
        const aiPerformanceCtx = document.getElementById('ai-performance-chart').getContext('2d');
        new Chart(aiPerformanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Accuracy',
                    data: [88, 89, 90, 89, 91, 92, 93, 93, 94, 94, 95, 94],
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'False Positives',
                    data: [12, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4, 4],
                    borderColor: '#f72585',
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#9ca3af',
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                }
            }
        });
    }
    
    // Animate dashboard elements
    function animateDashboardElements() {
        // Animate stats cards
        document.querySelectorAll('.stats-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
        
        // Animate charts
        document.querySelectorAll('.chart-container').forEach((chart, index) => {
            setTimeout(() => {
                chart.style.opacity = '1';
                chart.style.transform = 'translateY(0)';
            }, 300 + 100 * index);
        });
        
        // Animate transaction table
        const table = document.querySelector('.transactions-table');
        if (table) {
            setTimeout(() => {
                table.style.opacity = '1';
                table.style.transform = 'translateY(0)';
            }, 600);
        }
    }
    
    // Update date and time
    function updateDateTime() {
        const now = new Date();
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        }
    }
    // ... existing dashboard code ...

// --- AI Features Logic ---

let currentTransaction = null;
let conversationHistory = [];

// Open Transaction Modal (called when user clicks "Actions" in table)
function openTransactionModal(transaction) {
    currentTransaction = transaction;
    conversationHistory = [];

    // Reset chat
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="system-message"><p>Hello! I\'m your fraud investigation assistant. How can I help with this transaction?</p></div>';

    // Reset AI analysis
    document.getElementById('ai-explanation').innerHTML = '<p class="placeholder-text">Click "Analyze with AI" to get an AI-powered explanation of this transaction.</p>';
    document.getElementById('feature-importance-container').style.display = 'none';
    document.getElementById('suggested-actions').style.display = 'none';

    // Fill in transaction details (implement as per your data structure)
    // ... (populate modal fields) ...

    // Show modal
    document.getElementById('transaction-modal').classList.add('show');
}

// Analyze with LLM
document.getElementById('analyze-with-llm').addEventListener('click', function() {
    if (!currentTransaction) return;
    document.getElementById('ai-analysis-loading').style.display = 'flex';
    document.getElementById('ai-analysis-content').style.display = 'none';

    fetch('/api/llm-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTransaction)
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('ai-analysis-loading').style.display = 'none';
        document.getElementById('ai-analysis-content').style.display = 'block';

        // Explanation
        const aiExplanation = document.getElementById('ai-explanation');
        aiExplanation.innerHTML = '';
        aiExplanation.classList.remove('placeholder-text');
        aiExplanation.innerHTML = `<p>${data.explanation || 'No explanation available.'}</p>`;

        // Feature Importance
        const featureContainer = document.getElementById('feature-importance-container');
        const featureBars = document.getElementById('modal-feature-importance');
        if (data.feature_importance && Object.keys(data.feature_importance).length > 0) {
            featureContainer.style.display = 'block';
            featureBars.innerHTML = '';
            Object.entries(data.feature_importance)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .forEach(([feature, importance]) => {
                    const barContainer = document.createElement('div');
                    barContainer.className = 'feature-bar-container';
                    barContainer.innerHTML = `
                        <div class="feature-label">${feature}</div>
                        <div class="bar-wrapper">
                            <div class="feature-bar ${importance > 0 ? 'positive' : 'negative'}" style="width:${Math.min(Math.abs(importance) * 100, 100)}%"></div>
                            <span class="feature-value">${importance.toFixed(2)}</span>
                        </div>
                    `;
                    featureBars.appendChild(barContainer);
                });
        } else {
            featureContainer.style.display = 'none';
        }

        // Suggested Actions
        const suggestedActions = document.getElementById('suggested-actions');
        const actionButtons = document.getElementById('action-buttons');
        if (data.suggested_actions && data.suggested_actions.length > 0) {
            suggestedActions.style.display = 'block';
            actionButtons.innerHTML = '';
            data.suggested_actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.textContent = action.label;
                button.addEventListener('click', () => executeAction(action.id, action.label));
                actionButtons.appendChild(button);
            });
        } else {
            suggestedActions.style.display = 'none';
        }
    })
    .catch(() => {
        document.getElementById('ai-analysis-loading').style.display = 'none';
        document.getElementById('ai-analysis-content').style.display = 'block';
        document.getElementById('ai-explanation').innerHTML = '<p class="error-text">Error analyzing transaction. Please try again later.</p>';
    });
});

// Chat with LLM
document.getElementById('send-chat').addEventListener('click', sendChatHandler);
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendChatHandler();
});
function sendChatHandler() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (!message || !currentTransaction) return;

    const chatMessages = document.getElementById('chat-messages');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'user-message';
    userMessageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(userMessageDiv);
    chatInput.value = '';

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'assistant-message loading';
    loadingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    conversationHistory.push({ role: 'user', content: message });

    fetch('/api/llm-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transaction: currentTransaction,
            message: message,
            history: conversationHistory
        })
    })
    .then(res => res.json())
    .then(data => {
        chatMessages.removeChild(loadingDiv);
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.className = 'assistant-message';
        assistantMessageDiv.innerHTML = `<p>${data.response}</p>`;
        chatMessages.appendChild(assistantMessageDiv);
        conversationHistory.push({ role: 'assistant', content: data.response });
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Suggested Actions
        const suggestedActions = document.getElementById('suggested-actions');
        const actionButtons = document.getElementById('action-buttons');
        if (data.suggested_actions && data.suggested_actions.length > 0) {
            suggestedActions.style.display = 'block';
            actionButtons.innerHTML = '';
            data.suggested_actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.textContent = action.label;
                button.addEventListener('click', () => executeAction(action.id, action.label));
                actionButtons.appendChild(button);
            });
        } else {
            suggestedActions.style.display = 'none';
        }
    })
    .catch(() => {
        chatMessages.removeChild(loadingDiv);
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'system-message error';
        errorMessageDiv.innerHTML = '<p>Error sending message. Please try again.</p>';
        chatMessages.appendChild(errorMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Execute Suggested Action
function executeAction(actionId, actionLabel) {
    if (!currentTransaction) return;
    const chatMessages = document.getElementById('chat-messages');
    const systemMessageDiv = document.createElement('div');
    systemMessageDiv.className = 'system-message';
    systemMessageDiv.innerHTML = `<p>Executing action: ${actionLabel}...</p>`;
    chatMessages.appendChild(systemMessageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    fetch('/api/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transaction_id: currentTransaction.id,
            action_id: actionId
        })
    })
    .then(res => res.json())
    .then(data => {
        const resultMessageDiv = document.createElement('div');
        resultMessageDiv.className = 'system-message';
        resultMessageDiv.innerHTML = `<p>${data.message}</p>`;
        chatMessages.appendChild(resultMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (data.status_updated && data.new_status) {
            document.getElementById('modal-decision').textContent = data.new_status;
            document.getElementById('modal-decision').className = `risk-decision ${data.new_status.toLowerCase()}`;
        }
    })
    .catch(() => {
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'system-message error';
        errorMessageDiv.innerHTML = '<p>Error executing action. Please try again.</p>';
        chatMessages.appendChild(errorMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}
// ... existing code ...

// Analyze with LLM
document.getElementById('analyze-with-llm').addEventListener('click', function() {
    if (!currentTransaction) return;
    
    // Show loading state
    document.getElementById('ai-analysis-loading').style.display = 'flex';
    document.getElementById('ai-analysis-content').style.display = 'none';
    
    // Get the current transaction data from the modal
    const transactionData = {
        id: document.getElementById('modal-transaction-id').textContent,
        user_id: document.getElementById('modal-user-id').textContent,
        amount: parseFloat(document.getElementById('modal-amount').textContent.replace('$', '')),
        timestamp: new Date(document.getElementById('modal-time').textContent).toISOString(),
        device_id: document.getElementById('modal-device-id').textContent,
        location: document.getElementById('modal-location').textContent,
        risk_score: parseInt(document.querySelector('.risk-text').textContent) / 100,
        decision: document.getElementById('modal-decision').textContent
    };

    // Generate explanation based on decision if API is not available
    function generateLocalExplanation(transaction) {
        const riskScore = Math.round(transaction.risk_score * 100);
        let explanation = '';
        
        if (transaction.decision === 'BLOCK') {
            explanation = `This transaction was <strong>BLOCKED</strong> with a risk score of ${riskScore}%. `;
            
            // Add specific reasons based on transaction properties
            const reasons = [];
            
            if (transaction.amount > 1000) {
                reasons.push("The transaction amount ($" + transaction.amount.toFixed(2) + ") is unusually high");
            }
            
            if (transaction.location.includes(',')) {
                reasons.push("The transaction location appears to be outside the user's normal area");
            }
            
            // Time-based risk (transactions between 1am-5am)
            const txTime = new Date(transaction.timestamp);
            const hour = txTime.getHours();
            if (hour >= 1 && hour <= 5) {
                reasons.push("The transaction occurred during unusual hours (" + txTime.toLocaleTimeString() + ")");
            }
            
            // Add reasons to explanation
            if (reasons.length > 0) {
                explanation += "Key risk factors include: <ul>";
                reasons.forEach(reason => {
                    explanation += `<li>${reason}</li>`;
                });
                explanation += "</ul>";
            }
            
            explanation += "We recommend contacting the customer to verify this transaction before proceeding.";
        } 
        else if (transaction.decision === 'CHALLENGE') {
            explanation = `This transaction requires <strong>ADDITIONAL VERIFICATION</strong> with a risk score of ${riskScore}%. `;
            explanation += "While not immediately blocked, this transaction shows some unusual patterns that warrant verification. ";
            explanation += "We recommend implementing a step-up authentication like OTP or security questions.";
        } 
        else {
            explanation = `This transaction was <strong>ALLOWED</strong> with a low risk score of ${riskScore}%. `;
            explanation += "Our analysis indicates this transaction is consistent with the user's normal behavior pattern. ";
            explanation += "No suspicious indicators were detected in the transaction amount, location, or timing.";
        }
        
        return explanation;
    }

    // Try to call the backend API for LLM analysis
    fetch('/api/llm-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    })
    .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    })
    .then(data => {
        // Hide loading, show content
        document.getElementById('ai-analysis-loading').style.display = 'none';
        document.getElementById('ai-analysis-content').style.display = 'block';

        // Update explanation
        const aiExplanation = document.getElementById('ai-explanation');
        aiExplanation.innerHTML = '';
        aiExplanation.classList.remove('placeholder-text');
        
        // Format the explanation with better styling
        const formattedExplanation = data.explanation || generateLocalExplanation(transactionData);
        aiExplanation.innerHTML = `<p>${formattedExplanation}</p>`;

        // Rest of the code remains the same...
        // ... feature importance visualization and suggested actions ...
    })
    .catch(error => {
        console.error('Error analyzing transaction:', error);
        document.getElementById('ai-analysis-loading').style.display = 'none';
        document.getElementById('ai-analysis-content').style.display = 'block';
        
        // Use local explanation when API fails
        const localExplanation = generateLocalExplanation(transactionData);
        document.getElementById('ai-explanation').innerHTML = `<p>${localExplanation}</p>`;
        
        // Generate feature importance locally
        const featureContainer = document.getElementById('feature-importance-container');
        const featureBars = document.getElementById('modal-feature-importance');
        featureContainer.style.display = 'block';
        featureBars.innerHTML = '';
        
        // Create synthetic feature importance based on transaction data
        const syntheticFeatures = [
            { 
                name: 'Transaction Amount', 
                importance: transactionData.amount > 1000 ? 0.8 : 0.3,
                description: transactionData.amount > 1000 ? 'Unusually high amount' : 'Normal transaction amount'
            },
            { 
                name: 'User History', 
                importance: Math.random() > 0.5 ? 0.7 : 0.2,
                description: Math.random() > 0.5 ? 'Limited transaction history' : 'Established user history'
            },
            { 
                name: 'Location Risk', 
                importance: Math.random() > 0.7 ? 0.9 : 0.1,
                description: Math.random() > 0.7 ? 'Unusual location detected' : 'Familiar location'
            },
            { 
                name: 'Time of Transaction', 
                importance: Math.random() > 0.6 ? 0.5 : 0.3,
                description: Math.random() > 0.6 ? 'Unusual transaction time' : 'Normal transaction time'
            },
            { 
                name: 'Device Trust', 
                importance: Math.random() > 0.5 ? 0.4 : 0.6,
                description: Math.random() > 0.5 ? 'Unfamiliar device' : 'Trusted device'
            }
        ];
        
        syntheticFeatures.forEach(feature => {
            const barColor = feature.importance > 0.5 ? '#f72585' : '#4cc9f0';
            const barWidth = feature.importance * 100;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'feature-bar-container';
            barContainer.innerHTML = `
                <div class="feature-label" title="${feature.description}">${feature.name}</div>
                <div class="bar-wrapper">
                    <div class="feature-bar" style="width:${barWidth}%; background-color:${barColor}"></div>
                    <span class="feature-value">${(feature.importance * 100).toFixed(0)}%</span>
                </div>
            `;
            featureBars.appendChild(barContainer);
        });
        
        // Generate suggested actions based on decision
        const suggestedActions = document.getElementById('suggested-actions');
        const actionButtons = document.getElementById('action-buttons');
        suggestedActions.style.display = 'block';
        actionButtons.innerHTML = '';
        
        // Different actions based on decision
        if (transactionData.decision === 'BLOCK') {
            const actions = [
                { id: 'override_block', label: 'Override Block' },
                { id: 'contact_customer', label: 'Contact Customer' },
                { id: 'flag_account', label: 'Flag Account for Review' }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.textContent = action.label;
                button.addEventListener('click', () => executeAction(action.id, action.label));
                actionButtons.appendChild(button);
            });
        } else if (transactionData.decision === 'CHALLENGE') {
            const actions = [
                { id: 'verify_identity', label: 'Verify Identity' },
                { id: 'approve_transaction', label: 'Approve Transaction' },
                { id: 'block_transaction', label: 'Block Transaction' }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.textContent = action.label;
                button.addEventListener('click', () => executeAction(action.id, action.label));
                actionButtons.appendChild(button);
            });
        } else {
            const actions = [
                { id: 'monitor_account', label: 'Monitor Account' },
                { id: 'add_to_whitelist', label: 'Add to Whitelist' },
                { id: 'block_transaction', label: 'Block Transaction' }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.textContent = action.label;
                button.addEventListener('click', () => executeAction(action.id, action.label));
                actionButtons.appendChild(button);
            });
        }
    });
});

// ... existing code ...