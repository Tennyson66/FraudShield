import os
import sys
import pandas as pd
import numpy as np
import joblib
import datetime
import logging
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve, average_precision_score
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve

# Add parent directory to path to import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.feature_engineering import extract_features

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('logs', 'retraining.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_feedback_data(feedback_file='data/feedback.csv'):
    """
    Load feedback data with corrected labels
    """
    if not os.path.exists(feedback_file):
        logger.warning(f"Feedback file {feedback_file} not found.")
        return None
    
    return pd.read_csv(feedback_file)

def load_existing_models():
    """
    Load the existing models for comparison
    """
    supervised_model_path = 'models/supervised_model.pkl'
    anomaly_model_path = 'models/anomaly_model.pkl'
    
    if not os.path.exists(supervised_model_path) or not os.path.exists(anomaly_model_path):
        logger.warning("Existing models not found.")
        return None, None
    
    supervised_model = joblib.load(supervised_model_path)
    anomaly_model = joblib.load(anomaly_model_path)
    
    return supervised_model, anomaly_model

def prepare_training_data(feedback_data):
    """
    Prepare training data from feedback
    """
    X = []
    y = []
    
    for _, row in feedback_data.iterrows():
        # Create a transaction object from the feedback data
        transaction = {
            'user_id': row['user_id'],
            'amount': row['amount'],
            'timestamp': row['timestamp'],
            'device_id': row.get('device_id', 'unknown'),
            'location': {
                'latitude': row.get('latitude', 0),
                'longitude': row.get('longitude', 0)
            }
        }
        
        # Extract features
        features = extract_features(transaction)
        X.append(features)
        
        # Get corrected label
        y.append(row['is_fraud'])
    
    return np.array(X), np.array(y)

def compare_model_performance(old_model, new_model, X_test, y_test):
    """
    Compare performance between old and new models
    """
    if old_model is None:
        logger.info("No previous model available for comparison.")
        return
    
    # Get predictions from both models
    old_pred_proba = old_model.predict_proba(X_test)[:, 1]
    new_pred_proba = new_model.predict_proba(X_test)[:, 1]
    
    # Calculate AUC-ROC for both models
    old_auc = roc_auc_score(y_test, old_pred_proba)
    new_auc = roc_auc_score(y_test, new_pred_proba)
    
    # Calculate Average Precision for both models
    old_ap = average_precision_score(y_test, old_pred_proba)
    new_ap = average_precision_score(y_test, new_pred_proba)
    
    # Print comparison
    logger.info("\nModel Performance Comparison:")
    logger.info(f"Old Model - AUC-ROC: {old_auc:.4f}, Avg Precision: {old_ap:.4f}")
    logger.info(f"New Model - AUC-ROC: {new_auc:.4f}, Avg Precision: {new_ap:.4f}")
    logger.info(f"Improvement - AUC-ROC: {(new_auc-old_auc)*100:.2f}%, Avg Precision: {(new_ap-old_ap)*100:.2f}%")
    
    # Create performance visualization directory
    os.makedirs('visualizations', exist_ok=True)
    
    # Plot ROC curves
    plt.figure(figsize=(10, 8))
    
    # Plot calibration curves
    plt.subplot(2, 2, 1)
    prob_true_old, prob_pred_old = calibration_curve(y_test, old_pred_proba, n_bins=10)
    prob_true_new, prob_pred_new = calibration_curve(y_test, new_pred_proba, n_bins=10)
    
    plt.plot(prob_pred_old, prob_true_old, marker='o', linewidth=1, label='Old Model')
    plt.plot(prob_pred_new, prob_true_new, marker='o', linewidth=1, label='New Model')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('Mean Predicted Probability')
    plt.ylabel('Fraction of Positives')
    plt.title('Calibration Curve')
    plt.legend()
    
    # Save the visualization
    plt.tight_layout()
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M')
    plt.savefig(f'visualizations/model_comparison_{timestamp}.png')
    logger.info(f"Performance comparison visualization saved to visualizations/model_comparison_{timestamp}.png")

def tune_hyperparameters(X_train, y_train):
    """
    Perform hyperparameter tuning for the Random Forest model
    """
    logger.info("Performing hyperparameter tuning for Random Forest...")
    
    # Define parameter grid
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 10, 20, 30],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    }
    
    # Create a smaller subset for tuning if dataset is large
    if len(X_train) > 10000:
        logger.info("Using subset of data for hyperparameter tuning due to large dataset size")
        X_tune, _, y_tune, _ = train_test_split(X_train, y_train, train_size=10000, random_state=42)
    else:
        X_tune, y_tune = X_train, y_train
    
    # Create grid search
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(
        estimator=rf,
        param_grid=param_grid,
        cv=3,
        scoring='roc_auc',
        n_jobs=-1,
        verbose=1
    )
    
    # Perform grid search
    grid_search.fit(X_tune, y_tune)
    
    # Get best parameters
    best_params = grid_search.best_params_
    logger.info(f"Best parameters: {best_params}")
    
    return best_params

def retrain_models(X, y, test_size=0.2, tune_params=True):
    """
    Retrain models with new data
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
    
    # Tune hyperparameters if requested
    if tune_params:
        best_params = tune_hyperparameters(X_train, y_train)
    else:
        best_params = {'n_estimators': 100, 'random_state': 42}
    
    # Train supervised model (Random Forest)
    logger.info("Training supervised model (Random Forest)...")
    rf_model = RandomForestClassifier(**best_params)
    rf_model.fit(X_train, y_train)
    
    # Evaluate supervised model
    y_pred = rf_model.predict(X_test)
    y_prob = rf_model.predict_proba(X_test)[:, 1]
    
    logger.info("\nRandom Forest Performance:")
    logger.info(classification_report(y_test, y_pred))
    logger.info(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.4f}")
    
    # Get feature importances
    feature_importances = pd.DataFrame({
        'feature': [f"feature_{i}" for i in range(X.shape[1])],
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    logger.info("\nTop 10 Feature Importances:")
    logger.info(feature_importances.head(10))
    
    # Train anomaly detection model (Isolation Forest)
    logger.info("\nTraining anomaly detection model (Isolation Forest)...")
    # Train only on legitimate transactions
    X_train_normal = X_train[y_train == 0]
    
    iso_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_model.fit(X_train_normal)
    
    return rf_model, iso_model, X_test, y_test

def save_models(rf_model, iso_model):
    """
    Save the retrained models
    """
    os.makedirs('models', exist_ok=True)
    version = datetime.datetime.now().strftime('%Y%m%d_%H%M')
    
    # Save versioned models
    joblib.dump(rf_model, f'models/supervised_model_v{version}.pkl')
    joblib.dump(iso_model, f'models/anomaly_model_v{version}.pkl')
    
    # Save as current models
    joblib.dump(rf_model, 'models/supervised_model.pkl')
    joblib.dump(iso_model, 'models/anomaly_model.pkl')
    
    logger.info(f"\nModels trained and saved successfully (version: {version})")
    return version

def main():
    logger.info("FraudShield AI - Model Retraining")
    logger.info("=================================")
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    # Load feedback data
    logger.info("Loading feedback data...")
    feedback_data = load_feedback_data()
    
    if feedback_data is None:
        logger.info("Creating sample feedback data for demonstration...")
        # Create sample feedback data for demonstration
        from train_models import generate_sample_data
        sample_df, _, _ = generate_sample_data(1000)
        feedback_data = sample_df
        feedback_data.to_csv('data/feedback.csv', index=False)
        logger.info(f"Sample feedback data saved to data/feedback.csv")
    
    # Load existing models for comparison
    old_supervised, old_anomaly = load_existing_models()
    
    # Prepare training data
    logger.info("Preparing training data...")
    X, y = prepare_training_data(feedback_data)
    
    # Check class balance
    fraud_ratio = np.mean(y)
    logger.info(f"Class distribution - Fraud: {fraud_ratio:.2%}, Legitimate: {1-fraud_ratio:.2%}")
    
    # Retrain models
    logger.info("Retraining models...")
    rf_model, iso_model, X_test, y_test = retrain_models(X, y)
    
    # Compare with old model if available
    if old_supervised is not None:
        compare_model_performance(old_supervised, rf_model, X_test, y_test)
    
    # Save models
    version = save_models(rf_model, iso_model)
    
    logger.info("\nRetraining complete!")
    logger.info(f"New models saved as version: {version}")
    logger.info("The models have been set as the current active models.")

if __name__ == "__main__":
    main()