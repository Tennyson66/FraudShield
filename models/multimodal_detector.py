import numpy as np
# import tensorflow as tf # Removed TensorFlow import
import torch # Added PyTorch import
from transformers import AutoModel, AutoTokenizer # Changed TFAutoModel to AutoModel
from models.numerical_model import NumericalModel
from models.fusion_model import FusionModel

class MultimodalAnomalyDetector:
    def __init__(self, model_path='e:/fraudshield/models/multimodal'):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.text_model = AutoModel.from_pretrained('distilbert-base-uncased').to(self.device)
        self.text_tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')

        # Instantiate and load weights for numerical model
        self.numerical_model = NumericalModel()
        self.numerical_model.load_state_dict(torch.load(f'{model_path}/numerical_model.pt', map_location=self.device))
        self.numerical_model.to(self.device)
        self.numerical_model.eval()

        # Instantiate and load weights for fusion model
        self.fusion_model = FusionModel(input_dim=776)
        self.fusion_model.load_state_dict(torch.load(f'{model_path}/fusion_model.pt', map_location=self.device))
        self.fusion_model.to(self.device)
        self.fusion_model.eval()
    def process_text(self, text_data):
        """Process transaction descriptions and other text data"""
        tokens = self.text_tokenizer(
            text_data, 
            padding='max_length', 
            truncation=True, 
            max_length=128,
            return_tensors='pt' # Changed to 'pt' for PyTorch
        ).to(self.device) # Move tensors to the appropriate device
        
        with torch.no_grad(): # Disable gradient calculation for inference
            outputs = self.text_model(
                input_ids=tokens['input_ids'], 
                attention_mask=tokens['attention_mask']
            )
            # Use last hidden state's CLS token representation
            text_features = outputs.last_hidden_state[:, 0, :] 
        
        return text_features
    
    def process_numerical(self, numerical_data):
        """Process numerical transaction features"""
        # Convert numpy array to PyTorch tensor
        numerical_tensor = torch.tensor(numerical_data, dtype=torch.float32).to(self.device)
        with torch.no_grad(): # Disable gradient calculation
            processed_features = self.numerical_model(numerical_tensor)
        return processed_features
    
    def detect_anomalies(self, transaction):
        """
        Detect anomalies using multimodal approach
        
        Args:
            transaction: Dictionary containing transaction data
            
        Returns:
            anomaly_score: Float indicating anomaly level
            explanation: Dict of feature contributions
        """
        # Extract text data (ensure all elements are strings)
        text_data = [
            str(transaction.get('description', '')),
            str(transaction.get('user_agent', '')),
            str(transaction.get('email', ''))
        ]
        
        # Extract numerical features (ensure correct types)
        numerical_features_np = np.array([[
            float(transaction.get('amount', 0)),
            int(transaction.get('hour', 0)),
            int(transaction.get('day_of_week', 0)),
            float(transaction.get('latitude', 0)),
            float(transaction.get('longitude', 0)),
            int(transaction.get('velocity', 0)),
            float(transaction.get('device_familiarity', 1.0)),
            float(transaction.get('location_familiarity', 1.0))
        ]], dtype=np.float32) # Specify dtype
        
        # Process each modality
        text_features = self.process_text(text_data)
        numerical_features = self.process_numerical(numerical_features_np)
        
        # Combine features using PyTorch
        combined_features = torch.cat([text_features, numerical_features], dim=1)
        
        # Get anomaly score using PyTorch model
        with torch.no_grad():
            anomaly_score_tensor = self.fusion_model(combined_features)
        
        # Extract scalar value from tensor
        anomaly_score = anomaly_score_tensor.item() if anomaly_score_tensor.numel() == 1 else anomaly_score_tensor[0][0].item()

        # Calculate feature importance (simplified example using tensor means)
        # NOTE: Integrated Gradients would require a PyTorch implementation (e.g., using Captum library)
        feature_importance = {
            'text': text_features.mean().item(),
            'numerical': numerical_features.mean().item(),
            'amount': numerical_features[0][0].item(),
            'time_of_day': numerical_features[0][1].item(),
            'location': (numerical_features[0][3].item() + numerical_features[0][4].item()) / 2
        }
        
        return anomaly_score, feature_importance