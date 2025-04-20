import torch
import torch.nn as nn

class FusionModel(nn.Module):
    def __init__(self, input_dim=776, hidden_dim=32):
        super(FusionModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, 1)
        self.sigmoid = nn.Sigmoid()  # Output anomaly score between 0 and 1

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        x = self.sigmoid(x)
        return x