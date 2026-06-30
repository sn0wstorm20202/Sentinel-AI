import numpy as np
import pandas as pd
from pathlib import Path
from typing import Any

def sanitize_for_json(obj: Any) -> Any:
    """
    Enterprise JSON Serializer.
    Recursively converts numpy, pandas, and pathlib types into standard Python types
    so they can be safely serialized by standard json or FastAPI.
    """
    if isinstance(obj, (np.float32, np.float64, np.float16)):
        return float(obj)
    if isinstance(obj, (np.int32, np.int64, np.int16, np.int8)):
        return int(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return [sanitize_for_json(x) for x in obj.tolist()]
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    if isinstance(obj, Path):
        return str(obj)
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return obj
