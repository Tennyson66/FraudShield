# FraudShield AI

A real-time fraud detection system that uses machine learning and LLMs to detect and explain fraudulent financial transactions.


## Overview

FraudShield AI is a standalone system that combines supervised machine learning, unsupervised anomaly detection, and large language models to provide accurate fraud detection with human-readable explanations. The system analyzes transactions in real-time, assigns risk scores, and recommends appropriate actions.

## Key Features

### 1. Real-time Fraud Detection with Hybrid Models

- **Supervised ML Model (RandomForest)**: Trained on historical labeled data to recognize known fraud patterns
- **Unsupervised Anomaly Detection (Isolation Forest)**: Identifies unusual transactions that deviate from normal patterns
- **Combined Risk Scoring**: Outputs a fraud risk score from 0-100 based on both models

### 2. Score-based Transaction Action Logic

- **0-50**: ✅ ALLOW - Transaction proceeds normally
- **51-80**: ⚠️ CHALLENGE - Requires additional verification (OTP/MFA)
- **81-100**: ❌ BLOCK - Transaction is stopped due to high risk

### 3. Behavior Fingerprinting

- Profiles each user's normal behavior (average amount, location, time, device)
- Compares new transactions against the user's baseline
- Detects deviations that might indicate account takeover or unusual activity

### 4. LLM Integration for Explainability

- **Natural Language Explanations**: Explains why a transaction was flagged or allowed
- **Fraud Analyst Assistant**: Answers analyst questions about flagged transactions
- **Audit Reports**: Generates detailed summaries for flagged transactions
- **Pattern Detection**: Analyzes multiple transactions to identify coordinated fraud

### 5. Interactive Dashboard UI

- **Live Transaction Feed**: Color-coded by risk level
- **Detailed Transaction View**: Shows metadata, risk score, and explanation
- **AI Analysis**: On-demand detailed analysis of transaction risk factors
- **Action Buttons**: Approve, challenge, or block transactions directly from the UI

### 6. Lightweight Architecture

- Runs locally using Flask
- Uses CSV/SQLite for data storage
- No Docker or complex setup required

## Getting Started

### Prerequisites

- Python 3.8+
- pip package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Tennyson66.git
cd fraudshield
```

plaintext

2. Install dependencies:
```bash
pip install -r requirements.txt
```


3. Train the models:
```bash
python models/train_supervised.py python models/train_anomaly.py
```


4. Start the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```bash
http://localhost:5000
```

## Usage Guide

### Viewing Transactions
The main dashboard displays recent transactions with color-coded risk levels:- 🟢 Green: Low risk (0-50)- 🟡 Yellow: Medium risk (51-80)- 🔴 Red: High risk (81-100)Click on any transaction to view detailed information.

### Analyzing Transactions
1. Select a transaction from the table
2. Click "Analyze with AI" in the transaction modal
3. Review the AI-generated explanation and feature importance
4. Use the suggested actions to respond to the transaction

### Fraud Analyst Tools- 
**Transaction Search**: Filter by user ID, amount, or risk level- 
**AI Analysis**: Get detailed explanations of why a transaction was flagged- 
**Action Buttons**: Take immediate action on suspicious transactions- 
**User Behavior Profile**: View a user's normal transaction patterns

## Technical Architecture

### Backend Components- 

**Flask API**: Handles HTTP requests and serves the web interface- 

**ML Models**: RandomForest (supervised) and Isolation Forest (anomaly detection)- 

**Feature Engineering**: Extracts and transforms transaction data for model input- 

**Behavior Fingerprinting**: Profiles user behavior and detects deviations- 

**Scoring Logic**: Combines model outputs to calculate final risk score- 

**LLM Integration**: Connects to GPT for natural language explanations

### Frontend Components- 

**Dashboard UI**: HTML/CSS/JS interface for monitoring transactions- 

**Transaction Modal**: Detailed view of individual transactions- 

**AI Analysis Panel**: Shows explanation and feature importance- 

**Action Buttons**: Interface for responding to transactions

### ContributingContributions are welcome! Please feel free to submit a Pull Request.
