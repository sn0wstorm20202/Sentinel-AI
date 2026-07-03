from typing import Dict
from typing import Any


class GCNClassifier:
    """Fallback GCN Classifier when PyTorch / PyG is not available."""

    def __init__(
        self, in_channels: int, hidden_channels: int = 64, out_channels: int = 2
    ):
        raise ImportError(
            "PyTorch and PyTorch Geometric are required to use the GNN Engine. "
            "Please install them, or rely on the Classical Graph ML Engine (Node2Vec + XGBoost)."
        )

    def train_step(self, data: Any) -> float:
        return 0.0

    def evaluate(self, data: Any, mask: Any) -> Dict[str, float]:
        return {"pr_auc": 0.0, "roc_auc": 0.0, "f1": 0.0}
