"""
Sentinel AI — GNN Explainer Interface

Provides graph explainability (which neighbors/edges contributed to a risk score).
Uses PyTorch Geometric's GNNExplainer if available.
"""

from typing import Dict, List, Optional

try:
    import torch
    from torch_geometric.explain import Explainer, GNNExplainer

    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False


class GNNExplainerEngine:
    """Explains GNN node classifications by identifying critical edges/features."""

    def __init__(self, model: Optional["torch.nn.Module"] = None):
        if not PYG_AVAILABLE:
            self.available = False
        else:
            self.available = True
            if model is not None:
                self.explainer = Explainer(
                    model=model,
                    algorithm=GNNExplainer(epochs=200),
                    explanation_type="model",
                    node_mask_type="attributes",
                    edge_mask_type="object",
                    model_config=dict(
                        mode="multiclass_classification",
                        task_level="node",
                        return_type="log_probs",
                    ),
                )

    def explain_node(self, node_idx: int, x, edge_index) -> Dict:
        """Returns the most important edges and features for a given node's prediction."""
        if not self.available:
            return {"error": "PyTorch Geometric Explainer not available."}

        explanation = self.explainer(x, edge_index, index=node_idx)

        # Extract top edges
        edge_mask = explanation.edge_mask.cpu().numpy()
        top_edges = edge_mask.argsort()[-5:][::-1]

        return {
            "node_idx": node_idx,
            "top_edge_indices": top_edges.tolist(),
            "edge_importances": edge_mask[top_edges].tolist(),
        }
