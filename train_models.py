import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve, average_precision_score
import joblib
import os
import datetime
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('logs', 'training.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def generate_sample_data(n_samples=10000):
    """Generate synthetic transaction data for training"""
    np.random.seed(42)
    
    # Generate user IDs
    user_ids = np.random.randint(1000, 9999, n_samples)
    
    # Generate transaction amounts (most are small, some are large)
    amounts = np.exp(np.random.normal(3, 1.5, n_samples))
    
    # Generate hour of day (0-23)
    hours = np.random.randint(0, 24, n_samples)
    
    # Generate transaction velocity (0-10)
    velocity = np.random.randint(0, 10, n_samples)
    
    # Generate geo difference (0-1)
    geo_diff = np.random.beta(1, 10, n_samples)
    
    # Generate amount deviation (0-1)
    amount_deviation = np.random.beta(1, 5, n_samples)
    
    # Generate is weekend (0 or 1)
    is_weekend = np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3])
    
    # Generate device familiarity (0-1)
    device_familiarity = np.random.beta(2, 1, n_samples)
    
    # Generate transaction amount percentile (0-1)
    amount_percentile = np.random.beta(2, 5, n_samples)
    
    # Generate location familiarity (0-1)
    location_familiarity = np.random.beta(2, 1, n_samples)
    
    # Generate time since last transaction (0-1)
    time_since_last = np.random.beta(1, 3, n_samples)
    
    # Create features array
    X = np.column_stack([
        hours / 24.0,  # Normalize hour
        np.log1p(amounts) / 10.0,  # Normalize amount
        velocity / 10.0,  # Normalize velocity
        geo_diff,
        amount_deviation,
        is_weekend,
        device_familiarity,
        amount_percentile,
        location_familiarity,
        time_since_last
    ])
    
    # Generate labels (fraud is rare, ~5%)
    # Higher chance of fraud if:
    # - Unusual hour (late night)
    # - High amount
    # - High velocity
    # - Large geo difference
    # - Unusual amount for user
    # - Low device familiarity
    # - Low location familiarity
    
    fraud_score = (
        (hours >= 22).astype(float) * 0.3 +
        (np.log1p(amounts) > 6).astype(float) * 0.3 +
        (velocity > 5).astype(float) * 0.2 +
        (geo_diff > 0.7).astype(float) * 0.4 +
        (amount_deviation > 0.8).astype(float) * 0.3 +
        (device_familiarity < 0.3).astype(float) * 0.3 +
        (location_familiarity < 0.3).astype(float) * 0.3
    )
    
    # Add some randomness
    fraud_score += np.random.normal(0, 0.1, n_samples)
    
    # Convert to binary labels
    y = (fraud_score > 0.7).astype(int)
    
    # Create DataFrame
    df = pd.DataFrame({
        'user_id': [f"user_{uid}" for uid in user_ids],
        'amount': amounts,
        'timestamp': [
            (datetime.datetime.now() - datetime.timedelta(days=np.random.randint(0, 30))).isoformat() 
            for _ in range(n_samples)
        ],
        'device_id': [f"device_{np.random.randint(1, 100)}" for _ in range(n_samples)],
        'latitude': np.random.uniform(25, 50, n_samples),
        'longitude': np.random.uniform(-125, -70, n_samples),
        'hour': hours,
        'velocity': velocity,
        'geo_diff': geo_diff,
        'amount_deviation': amount_deviation,
        'is_weekend': is_weekend,
        'device_familiarity': device_familiarity,
        'location_familiarity': location_familiarity,
        'time_since_last': time_since_last,
        'is_fraud': y
    })
    
    return df, X, y

def evaluate_model(model, X_test, y_test, model_name="Model"):
    """Evaluate model performance with multiple metrics"""
    # Make predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Calculate metrics
    accuracy = (y_pred == y_test).mean()
    auc_roc = roc_auc_score(y_test, y_prob)
    avg_precision = average_precision_score(y_test, y_prob)
    
    # Print performance report
    logger.info(f"\n{model_name} Performance:")
    logger.info(f"Accuracy: {accuracy:.4f}")
    logger.info(f"AUC-ROC: {auc_roc:.4f}")
    logger.info(f"Average Precision: {avg_precision:.4f}")
    logger.info("\nClassification Report:")
    logger.info(classification_report(y_test, y_pred))
    
    # Create visualizations directory
    os.makedirs('visualizations', exist_ok=True)
    
    # Plot precision-recall curve
    precision, recall, _ = precision_recall_curve(y_test, y_prob)
    plt.figure(figsize=(10, 6))
    plt.plot(recall, precision, marker='.')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curve - {model_name}')
    plt.grid(True)
    plt.savefig(f'visualizations/{model_name.replace(" ", "_").lower()}_pr_curve.png')
    
    # Return metrics for comparison
    return {
        'accuracy': accuracy,
        'auc_roc': auc_roc,
        'avg_precision': avg_precision
    }

def train_models():
    """Train and save fraud detection models"""
    logger.info("Generating sample data...")
    df, X, y = generate_sample_data()
    
    # Save sample data
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/sample_transactions.csv', index=False)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features for better model performance
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the scaler for future use
    joblib.dump(scaler, 'models/feature_scaler.pkl')
    
    # Train supervised model (Random Forest)
    logger.info("Training supervised model (Random Forest)...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    # Perform cross-validation
    cv_scores = cross_val_score(rf_model, X_train_scaled, y_train, cv=5, scoring='roc_auc')
    logger.info(f"Cross-validation AUC-ROC scores: {cv_scores}")
    logger.info(f"Mean CV AUC-ROC: {cv_scores.mean():.4f}")
    
    # Train on full training set
    rf_model.fit(X_train_scaled, y_train)
    
    # Evaluate Random Forest model
    rf_metrics = evaluate_model(rf_model, X_test_scaled, y_test, "Random Forest")
    
    # Get feature importances
    feature_names = [
        'Hour of Day', 'Transaction Amount', 'Transaction Velocity', 
        'Geo Difference', 'Amount Deviation', 'Is Weekend',
        'Device Familiarity', 'Amount Percentile', 'Location Familiarity',
        'Time Since Last'
    ]
    
    importances = pd.DataFrame({
        'Feature': feature_names,
        'Importance': rf_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    logger.info("\nFeature Importances:")
    logger.info(importances)
    
    # Plot feature importances
    plt.figure(figsize=(12, 6))
    plt.barh(importances['Feature'], importances['Importance'])
    plt.xlabel('Importance')
    plt.title('Feature Importances')
    plt.tight_layout()
    plt.savefig('visualizations/feature_importances.png')
    
    # Train Gradient Boosting model as an alternative
    logger.info("\nTraining alternative model (Gradient Boosting)...")
    gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb_model.fit(X_train_scaled, y_train)
    
    # Evaluate Gradient Boosting model
    gb_metrics = evaluate_model(gb_model, X_test_scaled, y_test, "Gradient Boosting")
    
    # Choose the best model based on AUC-ROC
    best_model = rf_model if rf_metrics['auc_roc'] >= gb_metrics['auc_roc'] else gb_model
    best_model_name = "Random Forest" if rf_metrics['auc_roc'] >= gb_metrics['auc_roc'] else "Gradient Boosting"
    
    logger.info(f"\nBest model: {best_model_name} with AUC-ROC: {max(rf_metrics['auc_roc'], gb_metrics['auc_roc']):.4f}")
    
    # Train anomaly detection model (Isolation Forest)
    logger.info("\nTraining anomaly detection model (Isolation Forest)...")
    # Train only on legitimate transactions
    X_train_normal = X_train_scaled[y_train == 0]
    
    iso_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_model.fit(X_train_normal)
    
    # Save models
    os.makedirs('models', exist_ok=True)
    version = datetime.datetime.now().strftime('%Y%m%d_%H%M')
    
    # Save both models with version
    joblib.dump(rf_model, f'models/rf_model_v{version}.pkl')
    joblib.dump(gb_model, f'models/gb_model_v{version}.pkl')
    joblib.dump(iso_model, f'models/anomaly_model_v{version}.pkl')
    
    # Save best supervised model as the default
    joblib.dump(best_model, f'models/supervised_model_v{version}.pkl')
    joblib.dump(best_model, 'models/supervised_model.pkl')
    joblib.dump(iso_model, 'models/anomaly_model.pkl')
    
    # Save model metadata
    model_metadata = {
        'version': version,
        'timestamp': datetime.datetime.now().isoformat(),
        'features': feature_names,
        'metrics': {
            'random_forest': rf_metrics,
            'gradient_boosting': gb_metrics
        },
        'best_model': best_model_name,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'fraud_ratio': y.mean()
    }
    
    with open(f'models/model_metadata_v{version}.json', 'w') as f:
        import json
        json.dump(model_metadata, f, indent=2)
    
    logger.info(f"\nModels trained and saved successfully (version: {version})")
    logger.info(f"Best model ({best_model_name}) set as default supervised model")
    
if __name__ == "__main__":
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    
    try:
        train_models()
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}", exc_info=True)