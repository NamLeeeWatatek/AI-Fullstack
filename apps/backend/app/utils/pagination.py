"""
Standard Pagination Utility for FastAPI
Usage: Apply to any SQLAlchemy query
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Query
from math import ceil

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = 1
    page_size: int = 25
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "desc"
    
    class Config:
        extra = "allow"  # Allow additional filter fields


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


def paginate(
    query: Query,
    page: int = 1,
    page_size: int = 25,
    max_page_size: int = 100
) -> tuple[List, dict]:
    """
    Paginate a SQLAlchemy query
    
    Args:
        query: SQLAlchemy query object
        page: Current page number (1-indexed)
        page_size: Number of items per page
        max_page_size: Maximum allowed page size
        
    Returns:
        Tuple of (items, pagination_meta)
    """
    # Validate and limit page size
    page = max(1, page)
    page_size = min(max(1, page_size), max_page_size)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = ceil(total / page_size) if total > 0 else 1
    page = min(page, total_pages)  # Don't exceed total pages
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Get items
    items = query.offset(offset).limit(page_size).all()
    
    # Build metadata
    meta = {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    
    return items, meta


def create_paginated_response(
    items: List[T],
    meta: dict
) -> dict:
    """
    Create standardized paginated response
    
    Args:
        items: List of items
        meta: Pagination metadata from paginate()
        
    Returns:
        Dictionary with items and pagination info
    """
    return {
        "items": items,
        **meta
    }
