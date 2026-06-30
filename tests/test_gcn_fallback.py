import importlib
import sys
from unittest.mock import patch

def test_gcn_import_fallback():
    # If we are in an environment without torch, this just tests it natively.
    # If we do have torch, we can test that it loads successfully.
    import src.graph_learning.gnn.GCN as gcn_module
    
    assert hasattr(gcn_module, 'PYG_AVAILABLE')
    assert hasattr(gcn_module, 'GCNClassifier')
    
    # We can also test the explicit fallback logic by forcing an ImportError
    # We remove torch from sys.modules and patch __import__
    if 'src.graph_learning.gnn.GCN' in sys.modules:
        del sys.modules['src.graph_learning.gnn.GCN']
    
    orig_import = __import__
    def mock_import(name, *args, **kwargs):
        if name == 'torch':
            raise ImportError("Mocked PyTorch absence")
        return orig_import(name, *args, **kwargs)
        
    with patch('builtins.__import__', side_effect=mock_import):
        import src.graph_learning.gnn.GCN as fallback_gcn
        assert fallback_gcn.PYG_AVAILABLE is False
        assert fallback_gcn.GCNClassifier.__name__ == 'GCNClassifier'
