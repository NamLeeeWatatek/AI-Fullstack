"""
Serialization utilities
Helper functions for converting objects to JSON-safe formats
"""
from datetime import datetime, date
from typing import Any, Dict


def serialize_for_json(obj: Any) -> Any:
    """
    Recursively convert an object to JSON-serializable format
    Handles datetime, date, and nested structures
    """
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    elif hasattr(obj, 'model_dump'):
        # SQLModel/Pydantic object
        return serialize_for_json(obj.model_dump())
    elif hasattr(obj, '__dict__'):
        # Regular Python object
        return serialize_for_json(obj.__dict__)
    else:
        return obj


def prepare_entity_for_archive(entity: Any) -> Dict[str, Any]:
    """
    Prepare an entity for archiving by converting to JSON-safe dict
    """
    if hasattr(entity, 'model_dump'):
        entity_dict = entity.model_dump()
    else:
        entity_dict = dict(entity)
    
    return serialize_for_json(entity_dict)
