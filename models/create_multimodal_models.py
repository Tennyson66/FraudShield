import torch
from numerical_model import NumericalModel
from fusion_model import FusionModel
import os

# Set the save directory
save_dir = r"e:\fraudshield\models\multimodal"
os.makedirs(save_dir, exist_ok=True)

# Create and save NumericalModel
numerical_model = NumericalModel()
torch.save(numerical_model.state_dict(), os.path.join(save_dir, "numerical_model.pt"))

fusion_model = FusionModel(input_dim=776)
torch.save(fusion_model.state_dict(), os.path.join(save_dir, "fusion_model.pt"))

print("Models saved to", save_dir)