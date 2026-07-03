import pytest
import numpy as np
import pandas as pd
from pathlib import Path
import json
from src.utils.json_utils import CustomJSONEncoder

def test_json_serializer():
    data = {
        "f32": np.float32(1.23),
        "i64": np.int64(42),
        "arr": np.array([1, 2, 3]),
        "ts": pd.Timestamp("2026-07-01T00:00:00Z"),
        "path": Path("/some/path")
    }
    encoded = json.dumps(data, cls=CustomJSONEncoder)
    decoded = json.loads(encoded)
    
    # Due to float precision, we check approximation
    assert abs(decoded["f32"] - 1.23) < 1e-5
    assert decoded["i64"] == 42
    assert decoded["arr"] == [1, 2, 3]
    assert "2026-07-01" in decoded["ts"]
    assert "some" in decoded["path"]
