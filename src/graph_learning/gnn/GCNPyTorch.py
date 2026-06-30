import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from torch_geometric.data import Data
from typing import Dict


class GCNClassifier:
    """Graph Convolutional Network for fraud node classification."""

    def __init__(
        self, in_channels: int, hidden_channels: int = 64, out_channels: int = 2
    ):
        self.in_channels = in_channels
        self.hidden_channels = hidden_channels
        self.out_channels = out_channels

        class GCNModel(torch.nn.Module):
            def __init__(self, in_c, hid_c, out_c):
                super().__init__()
                self.conv1 = GCNConv(in_c, hid_c)
                self.conv2 = GCNConv(hid_c, hid_c)
                self.classifier = torch.nn.Linear(hid_c, out_c)

            def forward(self, x, edge_index):
                x = self.conv1(x, edge_index)
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)
                x = self.conv2(x, edge_index)
                x = F.relu(x)
                out = self.classifier(x)
                return F.log_softmax(out, dim=1)

        self.model = GCNModel(in_channels, hidden_channels, out_channels)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.optimizer = torch.optim.Adam(
            self.model.parameters(), lr=0.01, weight_decay=5e-4
        )

    def train_step(self, data: Data) -> float:
        """Runs a single training epoch."""
        self.model.train()
        self.optimizer.zero_grad()
        data = data.to(self.device)
        out = self.model(data.x, data.edge_index)
        loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])
        loss.backward()
        self.optimizer.step()
        return float(loss.item())

    @torch.no_grad()
    def evaluate(self, data: Data, mask: torch.Tensor) -> Dict[str, float]:
        """Evaluates the model on a specific mask (val or test)."""
        self.model.eval()
        data = data.to(self.device)
        out = self.model(data.x, data.edge_index)
        pred = out.argmax(dim=1)

        y_true = data.y[mask].cpu().numpy()
        y_pred = pred[mask].cpu().numpy()
        y_proba = torch.exp(out[mask])[:, 1].cpu().numpy()

        from sklearn.metrics import average_precision_score, roc_auc_score, f1_score

        try:
            pr_auc = average_precision_score(y_true, y_proba)
            roc_auc = roc_auc_score(y_true, y_proba)
            f1 = f1_score(y_true, y_pred, zero_division=0)
        except ValueError:
            pr_auc, roc_auc, f1 = 0.0, 0.0, 0.0

        return {"pr_auc": pr_auc, "roc_auc": roc_auc, "f1": f1}
