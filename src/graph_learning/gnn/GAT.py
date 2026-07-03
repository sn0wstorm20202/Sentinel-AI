"""
Sentinel AI — GAT Engine (Graph Attention Network)

Implements Graph Attention Networks, which learn to weigh neighbour importance,
making it highly effective for identifying specific malicious interactions in
fraud rings. Requires PyTorch Geometric.
"""

from typing import Dict

try:
    import torch
    import torch.nn.functional as F
    from torch_geometric.nn import GATConv

    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False


class GATClassifier:
    """Graph Attention Network for fraud classification."""

    def __init__(
        self,
        in_channels: int,
        hidden_channels: int = 8,
        heads: int = 8,
        out_channels: int = 2,
    ):
        if not PYG_AVAILABLE:
            raise ImportError("PyTorch Geometric is required for GAT.")

        class GATModel(torch.nn.Module):
            def __init__(self, in_c, hid_c, hds, out_c):
                super().__init__()
                self.conv1 = GATConv(in_c, hid_c, heads=hds, dropout=0.6)
                # On the output, we average the attention heads (heads=1)
                self.conv2 = GATConv(
                    hid_c * hds, out_c, heads=1, concat=False, dropout=0.6
                )

            def forward(self, x, edge_index):
                x = F.dropout(x, p=0.6, training=self.training)
                x = F.elu(self.conv1(x, edge_index))
                x = F.dropout(x, p=0.6, training=self.training)
                x = self.conv2(x, edge_index)
                return F.log_softmax(x, dim=1)

        self.model = GATModel(in_channels, hidden_channels, heads, out_channels)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.optimizer = torch.optim.Adam(
            self.model.parameters(), lr=0.005, weight_decay=5e-4
        )

    def train_step(self, data) -> float:
        self.model.train()
        self.optimizer.zero_grad()
        data = data.to(self.device)
        out = self.model(data.x, data.edge_index)
        loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])
        loss.backward()
        self.optimizer.step()
        return float(loss.item())

    @torch.no_grad()
    def evaluate(self, data, mask) -> Dict[str, float]:
        self.model.eval()
        data = data.to(self.device)
        out = self.model(data.x, data.edge_index)

        y_true = data.y[mask].cpu().numpy()
        y_proba = torch.exp(out[mask])[:, 1].cpu().numpy()

        from sklearn.metrics import average_precision_score, roc_auc_score

        try:
            return {
                "pr_auc": average_precision_score(y_true, y_proba),
                "roc_auc": roc_auc_score(y_true, y_proba),
            }
        except:
            return {"pr_auc": 0.0, "roc_auc": 0.0}
