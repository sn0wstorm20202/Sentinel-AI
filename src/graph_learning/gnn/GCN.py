"""
Sentinel AI — GCN Engine (Graph Convolutional Network) Router
"""

import logging

try:
    import torch
    import torch_geometric
    from .GCNPyTorch import GCNClassifier

    PYG_AVAILABLE = True
except ImportError:
    from .GCNFallback import GCNClassifier

    PYG_AVAILABLE = False
