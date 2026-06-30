from pathlib import Path
import sys
import os


def bootstrap():
    """
    Dynamically locates the project root and sets sys.path and CWD.
    This ensures notebooks and scripts can run from anywhere.
    """
    current = Path.cwd().resolve()
    while current != current.parent:
        if (current / "src").exists():
            sys.path.insert(0, str(current))
            os.chdir(str(current))
            return
        current = current.parent

    raise RuntimeError("Project root not found")
