"""
Sentinel AI Core Exceptions
"""

class SentinelError(Exception):
    """Base class for all Sentinel AI exceptions."""
    pass

class ConfigurationError(SentinelError):
    """Raised when a configuration file is missing or invalid."""
    pass

class KnowledgeBaseError(SentinelError):
    """Raised when the knowledge base has missing or inconsistent mappings."""
    pass

class ModelRegistryError(SentinelError):
    """Raised when model registration or retrieval fails."""
    pass

class GraphBuildError(SentinelError):
    """Raised when graph construction or feature extraction fails."""
    pass

class DriftDetectionError(SentinelError):
    """Raised when drift monitoring fails to calculate metrics."""
    pass

class InvestigationError(SentinelError):
    """Raised when the Copilot fails to generate a case."""
    pass
