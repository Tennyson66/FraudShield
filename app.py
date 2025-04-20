import datetime
import json
import os
import subprocess
import sys

from flask import jsonify, request
from flask import Flask, flash, jsonify, redirect, render_template, request, url_for
import joblib
import numpy as np
import openai
import pandas as pd

from models.multimodal_detector import MultimodalAnomalyDetector
from utils.explanation_generator import generate_fraud_explanation
from utils.feature_engineering import extract_features
# Update this import line
from utils.app_logging import log_error, log_prediction, logger, log_feedback # Renamed from utils.loggingfrom utils.scoring import calculate_risk_score, get_decision

# Initialize models
multimodal_detector = MultimodalAnomalyDetector()


app = Flask(__name__, template_folder='dashboard/templates', static_folder='dashboard/static')
app.secret_key = os.urandom(24)  # For flash messages

# Load models
try:
    supervised_model = joblib.load('models/supervised_model.pkl')
    anomaly_model = joblib.load('models/anomaly_model.pkl')
    model_version = "current"
    logger.info("Models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {e}")
    supervised_model = None
    anomaly_model = None
    model_version = None

@app.route('/')
def home():
    return render_template('index.html')
@app.route('/dashboard2')
def dash2():
    return render_template('dashboard.html')
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if models are loaded
        if supervised_model is None or anomaly_model is None:
            return jsonify({'error': 'Models not loaded. Please check logs.'}), 500
            
        # Get transaction data
        transaction = request.json
        
        # Extract features
        features = extract_features(transaction)
        
        # Make predictions
        supervised_score = supervised_model.predict_proba(features.reshape(1, -1))[0][1]
        anomaly_score = anomaly_model.decision_function(features.reshape(1, -1))[0]
        anomaly_score = 1 / (1 + np.exp(-anomaly_score))  # Normalize to 0-1
        
        # Calculate final risk score
        risk_score = calculate_risk_score(supervised_score, anomaly_score, transaction_data=transaction)
        
        # Get decision
        decision, message = get_decision(risk_score, user_id=transaction.get('user_id'), 
                                        amount=float(transaction.get('amount', 0)))
        
        # Log prediction
        log_prediction(transaction, risk_score, decision, model_version)
        
        # Return response
        response = {
            'risk_score': int(risk_score * 100),
            'decision': decision,
            'message': message,
            'model_version': model_version
        }
        
        return jsonify(response)
    
    except Exception as e:
        error_msg = f"Prediction error: {str(e)}"
        log_error(error_msg, "prediction_error", transaction=request.json)
        return jsonify({'error': error_msg}), 500

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'operational' if supervised_model is not None else 'degraded',
        'models': {
            'supervised': supervised_model.__class__.__name__ if supervised_model else 'Not loaded',
            'anomaly': anomaly_model.__class__.__name__ if anomaly_model else 'Not loaded',
            'version': model_version
        },
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/retrain', methods=['GET', 'POST'])
def retrain_page():
    # Get list of available models
    models_info = get_models_info()
    
    # Handle retraining request
    retraining_result = None
    
    if request.method == 'POST':
        if 'retrain' in request.form:
            # Trigger model retraining
            retraining_result = trigger_retraining()
            if retraining_result.get('success'):
                flash('Model retraining completed successfully!', 'success')
                # Reload models after successful retraining
                reload_models()
            else:
                flash(f'Model retraining failed: {retraining_result.get("error")}', 'danger')
            
            # Refresh models info after retraining
            models_info = get_models_info()
        
        elif 'activate' in request.form:
            # Activate a specific model version
            version = request.form.get('version')
            activation_result = activate_model_version(version)
            
            if activation_result.get('success'):
                flash(f'Model version {version} activated successfully!', 'success')
                # Reload models after activation
                reload_models()
            else:
                flash(f'Model activation failed: {activation_result.get("error")}', 'danger')
                
            # Refresh models info
            models_info = get_models_info()
    
    return render_template('retrain.html', models=models_info, result=retraining_result)

def get_models_info():
    """Get information about available models"""
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    models_info = {
        'versions': [],
        'current': {
            'supervised': None,
            'anomaly': None
        }
    }
    
    # Check if models directory exists
    if not os.path.exists(models_dir):
        return models_info
    
    # Get current models info
    supervised_path = os.path.join(models_dir, 'supervised_model.pkl')
    anomaly_path = os.path.join(models_dir, 'anomaly_model.pkl')
    
    if os.path.exists(supervised_path):
        models_info['current']['supervised'] = {
            'path': supervised_path,
            'size': f"{os.path.getsize(supervised_path) / (1024 * 1024):.2f} MB",
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(supervised_path)).strftime('%Y-%m-%d %H:%M:%S')
        }
    
    if os.path.exists(anomaly_path):
        models_info['current']['anomaly'] = {
            'path': anomaly_path,
            'size': f"{os.path.getsize(anomaly_path) / (1024 * 1024):.2f} MB",
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(anomaly_path)).strftime('%Y-%m-%d %H:%M:%S')
        }
    
    # Get versioned models
    for file in os.listdir(models_dir):
        if file.startswith('supervised_model_v') and file.endswith('.pkl'):
            version = file.replace('supervised_model_v', '').replace('.pkl', '')
            anomaly_file = f'anomaly_model_v{version}.pkl'
            
            if os.path.exists(os.path.join(models_dir, anomaly_file)):
                version_info = {
                    'version': version,
                    'date': datetime.datetime.strptime(version.split('_')[0], '%Y%m%d').strftime('%Y-%m-%d'),
                    'time': version.split('_')[1][:2] + ':' + version.split('_')[1][2:] if '_' in version else '',
                    'supervised_size': f"{os.path.getsize(os.path.join(models_dir, file)) / (1024 * 1024):.2f} MB",
                    'anomaly_size': f"{os.path.getsize(os.path.join(models_dir, anomaly_file)) / (1024 * 1024):.2f} MB",
                    'is_current': False
                }
                
                # Check if this is the current model
                if models_info['current']['supervised'] and models_info['current']['anomaly']:
                    sup_modified = datetime.datetime.fromtimestamp(os.path.getmtime(supervised_path))
                    ano_modified = datetime.datetime.fromtimestamp(os.path.getmtime(anomaly_path))
                    ver_sup_modified = datetime.datetime.fromtimestamp(os.path.getmtime(os.path.join(models_dir, file)))
                    ver_ano_modified = datetime.datetime.fromtimestamp(os.path.getmtime(os.path.join(models_dir, anomaly_file)))
                    
                    if abs((sup_modified - ver_sup_modified).total_seconds()) < 1 and \
                       abs((ano_modified - ver_ano_modified).total_seconds()) < 1:
                        version_info['is_current'] = True
                
                models_info['versions'].append(version_info)
    
    # Sort versions by date (newest first)
    models_info['versions'].sort(key=lambda x: x['version'], reverse=True)
    
    return models_info

def trigger_retraining():
    """Trigger the model retraining process"""
    try:
        # Create a log file for the retraining output
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, f'retraining_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        
        # Run the retraining script as a subprocess
        retrain_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'retraining', 'retrain.py')
        
        with open(log_file, 'w') as f:
            process = subprocess.Popen([sys.executable, retrain_script], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.STDOUT,
                                      universal_newlines=True)
            
            output = ""
            for line in process.stdout:
                output += line
                f.write(line)
                f.flush()
            
            process.wait()
            
            if process.returncode != 0:
                return {
                    'success': False,
                    'error': f'Retraining process exited with code {process.returncode}',
                    'output': output,
                    'log_file': log_file,
                    'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
        
        return {
            'success': True,
            'output': output,
            'log_file': log_file,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        error_msg = f"Error triggering retraining: {str(e)}"
        log_error(error_msg, "retraining_error")
        return {
            'success': False,
            'error': error_msg,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

def activate_model_version(version):
    """Activate a specific model version"""
    try:
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
        
        # Check if version exists
        supervised_version_path = os.path.join(models_dir, f'supervised_model_v{version}.pkl')
        anomaly_version_path = os.path.join(models_dir, f'anomaly_model_v{version}.pkl')
        
        if not os.path.exists(supervised_version_path) or not os.path.exists(anomaly_version_path):
            return {
                'success': False,
                'error': f'Model version {version} not found'
            }
        
        # Copy versioned models to current models
        supervised_current_path = os.path.join(models_dir, 'supervised_model.pkl')
        anomaly_current_path = os.path.join(models_dir, 'anomaly_model.pkl')
        
        # Load models to verify they are valid
        try:
            joblib.load(supervised_version_path)
            joblib.load(anomaly_version_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'Invalid model files: {str(e)}'
            }
        
        # Make backup of current models
        backup_time = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        if os.path.exists(supervised_current_path):
            os.rename(supervised_current_path, 
                     os.path.join(models_dir, f'supervised_model_backup_{backup_time}.pkl'))
        
        if os.path.exists(anomaly_current_path):
            os.rename(anomaly_current_path, 
                     os.path.join(models_dir, f'anomaly_model_backup_{backup_time}.pkl'))
        
        # Copy versioned models to current
        import shutil
        shutil.copy2(supervised_version_path, supervised_current_path)
        shutil.copy2(anomaly_version_path, anomaly_current_path)
        
        logger.info(f"Activated model version {version}")
        
        return {
            'success': True,
            'version': version,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        error_msg = f"Error activating model version {version}: {str(e)}"
        log_error(error_msg, "model_activation_error")
        return {
            'success': False,
            'error': error_msg
        }

def reload_models():
    """Reload the current models"""
    global supervised_model, anomaly_model, model_version
    
    try:
        supervised_model = joblib.load('models/supervised_model.pkl')
        anomaly_model = joblib.load('models/anomaly_model.pkl')
        model_version = "current"
        logger.info("Models reloaded successfully")
        return True
    except Exception as e:
        error_msg = f"Error reloading models: {str(e)}"
        log_error(error_msg, "model_reload_error")
        return False

@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for a transaction (for model improvement)"""
    try:
        feedback = request.json
        
        # Validate required fields
        required_fields = ['transaction_id', 'original_decision', 'corrected_decision']
        for field in required_fields:
            if field not in feedback:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Save feedback to CSV for retraining
        feedback_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        os.makedirs(feedback_dir, exist_ok=True)
        feedback_file = os.path.join(feedback_dir, 'feedback.csv')
        
        # Create or append to feedback file
        is_new_file = not os.path.exists(feedback_file)
        with open(feedback_file, 'a', newline='') as f:
            writer = pd.DataFrame([feedback]).to_csv(f, header=is_new_file, index=False)
        
        # Log the feedback
        from utils.logging import log_feedback
        log_feedback(
            feedback['transaction_id'],
            feedback['original_decision'],
            feedback['corrected_decision'],
            feedback.get('analyst_id')
        )
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully'
        })
    
    except Exception as e:
        error_msg = f"Error submitting feedback: {str(e)}"
        log_error(error_msg, "feedback_error", transaction=request.json)
        return jsonify({'error': error_msg}), 500

@app.route('/transactions')
def transactions_page():
    return render_template('index.html')

@app.route('/analytics')
def analytics_page():
    return render_template('index.html')

@app.route('/settings')
def settings_page():
    return render_template('index.html')

@app.route('/api/transactions')
def get_transactions():
    """API endpoint to get transaction data"""
    try:
        # Read from logs/predictions.csv
        csv_log_path = os.path.join('logs', 'predictions.csv')
        if not os.path.exists(csv_log_path):
            return jsonify([])
            
        transactions = []
        with open(csv_log_path, 'r') as f:
            import csv
            reader = csv.DictReader(f)
            for row in reader:
                transactions.append({
                    'timestamp': row['timestamp'],
                    'user_id': row['user_id'],
                    'amount': float(row['amount']),
                    'risk_score': float(row['risk_score']),
                    'decision': row['decision'],
                    'model_version': row['model_version']
                })
        
        # Sort by timestamp (newest first)
        transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(transactions)
    except Exception as e:
        log_error(f"Error fetching transactions: {str(e)}", "api_error")
        return jsonify([])

@app.route('/api/sample-transactions')
def get_sample_transactions():
    """API endpoint to get sample transaction data from CSV"""
    try:
        # Read from data/sample_transactions.csv
        csv_path = os.path.join('data', 'sample_transactions.csv')
        if not os.path.exists(csv_path):
            return jsonify([])
            
        transactions = []
        with open(csv_path, 'r') as f:
            import csv
            reader = csv.DictReader(f)
            for row in reader:
                # Convert string values to appropriate types
                risk_score = float(row.get('amount_deviation', 0)) * 0.7 + float(row.get('geo_diff', 0)) * 0.3
                risk_score = min(risk_score, 1.0)  # Ensure risk score is between 0 and 1
                
                # Determine decision based on risk score
                decision = "ALLOW"
                if risk_score > 0.7:
                    decision = "BLOCK"
                elif risk_score > 0.4:
                    decision = "CHALLENGE"
                
                transactions.append({
                    'timestamp': row.get('timestamp', ''),
                    'user_id': row.get('user_id', ''),
                    'amount': float(row.get('amount', 0)),
                    'device_id': row.get('device_id', ''),
                    'latitude': float(row.get('latitude', 0)),
                    'longitude': float(row.get('longitude', 0)),
                    'hour': int(row.get('hour', 0)),
                    'velocity': int(row.get('velocity', 0)),
                    'geo_diff': float(row.get('geo_diff', 0)),
                    'amount_deviation': float(row.get('amount_deviation', 0)),
                    'is_weekend': int(row.get('is_weekend', 0)),
                    'device_familiarity': float(row.get('device_familiarity', 0)),
                    'location_familiarity': float(row.get('location_familiarity', 0)),
                    'time_since_last': float(row.get('time_since_last', 0)),
                    'is_fraud': int(row.get('is_fraud', 0)),
                    'risk_score': risk_score,
                    'decision': decision
                })
        
        # Sort by timestamp (newest first)
        transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(transactions)
    except Exception as e:
        app.logger.error(f"Error fetching sample transactions: {str(e)}")
        return jsonify([])
        
@app.route('/api/llm-analyze', methods=['POST'])
def llm_analyze():
    """Analyze a transaction using LLM capabilities"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Get transaction data
        transaction = {
            'user_id': data.get('user_id'),
            'amount': data.get('amount'),
            'description': data.get('description', ''),
            'location': data.get('location', ''),
            'device_id': data.get('device_id'),
            'timestamp': data.get('timestamp')
        }
        
        # Use multimodal detector for advanced analysis
        anomaly_score, feature_importance = multimodal_detector.detect_anomalies(transaction)
        
        # Generate natural language explanation
        explanation = generate_fraud_explanation(transaction, feature_importance)
        
        return jsonify({
            'success': True,
            'risk_score': float(anomaly_score),
            'explanation': explanation,
            'feature_importance': feature_importance
        })
    
    except Exception as e:
        app.logger.error(f"Error in LLM analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/fraud-assistant', methods=['POST'])
def fraud_assistant():
    """Provide AI-powered assistance for fraud investigation"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        query = data.get('query', '')
        transaction = data.get('transaction', {})
        conversation_history = data.get('conversation_history', [])
        
        # Format conversation for the LLM
        formatted_conversation = []
        for message in conversation_history:
            formatted_conversation.append({
                "role": message["role"],
                "content": message["content"]
            })
        
        # Add system message with transaction context
        system_message = {
            "role": "system",
            "content": f"""
            You are a fraud investigation assistant helping an analyst review a potentially fraudulent transaction.
            
            Transaction details:
            - User ID: {transaction.get('user_id', 'Unknown')}
            - Amount: ${transaction.get('amount', 0)}
            - Time: {transaction.get('timestamp', 'Unknown')}
            - Risk Score: {transaction.get('risk_score', 0) * 100}%
            - Decision: {transaction.get('decision', 'Unknown')}
            
            Provide helpful insights about this transaction. Be concise and focus on actionable information.
            """
        }
        
        formatted_conversation.insert(0, system_message)
        
        # Add the current query
        formatted_conversation.append({
            "role": "user",
            "content": query
        })
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=formatted_conversation,
            temperature=0.7,
            max_tokens=500
        )
        
        assistant_response = response.choices[0].message.content
        
        # Generate suggested actions based on the conversation
        suggested_actions = generate_suggested_actions(query, transaction, assistant_response)
        
        return jsonify({
            'response': assistant_response,
            'suggested_actions': suggested_actions
        })
    
    except Exception as e:
        app.logger.error(f"Error in fraud assistant: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_suggested_actions(query, transaction, response):
    """Generate suggested actions based on the conversation context"""
    # This is a simplified implementation
    actions = []
    
    # Add actions based on query content
    if "similar" in query.lower() and "case" in query.lower():
        actions.append({
            "id": "find_similar",
            "name": "Find Similar Cases"
        })
    
    if "block" in query.lower() or "flag" in query.lower():
        actions.append({
            "id": "block_user",
            "name": "Block User Account"
        })
    
    if "contact" in query.lower() or "call" in query.lower():
        actions.append({
            "id": "contact_user",
            "name": "Contact Customer"
        })
    
    # Add default actions
    if transaction.get('decision') == 'CHALLENGE':
        actions.append({
            "id": "verify_identity",
            "name": "Verify Customer Identity"
        })
    
    if transaction.get('risk_score', 0) > 0.7:
        actions.append({
            "id": "escalate",
            "name": "Escalate to Senior Analyst"
        })
    
    return actions


if __name__ == '__main__':
    # Create necessary directories if they don't exist
    os.makedirs('data', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    app.run(debug=True)