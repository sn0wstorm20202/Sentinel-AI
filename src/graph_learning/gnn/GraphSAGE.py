"""
Sentinel AI — GraphSAGE Engine

Implements GraphSAGE (SAmple and aggreGatE) for inductive node classification.
Ideal for fraud detection as it generalizes well to unseen nodes.
Requires PyTorch Geometric.
"""

from typing import Dict

try:
    import torch
    import torch.nn.functional as F
    from torch_geometric.nn import SAGEConv

    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False


class GraphSAGEClassifier:
    """GraphSAGE Network for inductive fraud classification."""

    def __init__(
        self, in_channels: int, hidden_channels: int = 64, out_channels: int = 2
    ):
        if not PYG_AVAILABLE:
            raise ImportError("PyTorch Geometric is required for GraphSAGE.")

        self.in_channels = in_channels
        self.hidden_channels = hidden_channels
        self.out_channels = out_channels

        class SAGEModel(torch.nn.Module):
            def __init__(self, in_c, hid_c, out_c):
                super().__init__()
                self.conv1 = SAGEConv(in_c, hid_c, aggr="mean")
                self.conv2 = SAGEConv(hid_c, hid_c, aggr="mean")
                self.classifier = torch.nn.Linear(hid_c, out_c)

            def forward(self, x, edge_index):
                x = self.conv1(x, edge_index)
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)
                x = self.conv2(x, edge_index)
                x = F.relu(x)
                out = self.classifier(x)
                return F.log_softmax(out, dim=1)

        self.model = SAGEModel(in_channels, hidden_channels, out_channels)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.01)

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
        pred = out.argmax(dim=1)

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
