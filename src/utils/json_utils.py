import json
import numpy as np
import pandas as pd
from pathlib import Path


class CustomJSONEncoder(json.JSONEncoder):
    """
    Enterprise JSON Encoder that handles numpy arrays, pandas timestamps,
    pathlib Paths, and other non-standard types encountered in ML pipelines.
    """

    def default(self, obj):
        if isinstance(
            obj,
            (
                np.integer,
                np.int8,
                np.int16,
                np.int32,
                np.int64,
                np.uint8,
                np.uint16,
                np.uint32,
                np.uint64,
            ),
        ):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        elif isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        elif isinstance(obj, Path):
            return str(obj)
        return super().default(obj)
