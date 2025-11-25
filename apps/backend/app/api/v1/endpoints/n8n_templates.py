"""
N8N Templates API
Provide pre-configured workflow templates for N8N integrations
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.data.n8n_templates import get_n8n_templates, get_n8n_template_by_id

router = APIRouter()


class TemplateListItem(BaseModel):
    id: str
    name: str
    description: str
    category: str
    thumbnail: str


class TemplateDetail(BaseModel):
    id: str
    name: str
    description: str
    category: str
    thumbnail: str
    nodes: list
    edges: list


@router.get("/", response_model=List[TemplateListItem])
async def list_n8n_templates(
    current_user: dict = Depends(get_current_user)
):
    """List all available N8N workflow templates"""
    templates = get_n8n_templates()
    return templates


@router.get("/{template_id}", response_model=TemplateDetail)
async def get_n8n_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific N8N template with full workflow data"""
    template = get_n8n_template_by_id(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "id": template_id,
        **template
    }
