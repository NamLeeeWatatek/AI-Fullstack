"""
AI Models Management API
Manage AI model configurations and API keys
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os

from app.core.auth import get_current_user
from app.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter()


class AIModelConfig(BaseModel):
    provider: str  # 'openai', 'gemini', 'anthropic', etc.
    model_name: str
    display_name: str
    api_key_configured: bool
    is_available: bool
    capabilities: List[str]
    max_tokens: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "provider": "gemini",
                "model_name": "gemini-pro",
                "display_name": "Gemini Pro",
                "api_key_configured": True,
                "is_available": True,
                "capabilities": ["chat", "text-generation"],
                "max_tokens": 8192
            }
        }


class AIModelResponse(BaseModel):
    provider: str
    models: List[AIModelConfig]


class UpdateAPIKeyRequest(BaseModel):
    provider: str
    api_key: str


@router.get("/models", response_model=List[AIModelResponse])
async def list_ai_models(
    current_user: dict = Depends(get_current_user)
):
    """
    List all available AI models and their configurations
    """
    # Check which API keys are configured
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    models = [
        AIModelResponse(
            provider="gemini",
            models=[
                AIModelConfig(
                    provider="gemini",
                    model_name="gemini-pro",
                    display_name="Gemini Pro",
                    api_key_configured=bool(gemini_key),
                    is_available=bool(gemini_key),
                    capabilities=["chat", "text-generation", "code-generation"],
                    max_tokens=8192
                ),
                AIModelConfig(
                    provider="gemini",
                    model_name="gemini-pro-vision",
                    display_name="Gemini Pro Vision",
                    api_key_configured=bool(gemini_key),
                    is_available=bool(gemini_key),
                    capabilities=["chat", "vision", "image-analysis"],
                    max_tokens=4096
                )
            ]
        ),
        AIModelResponse(
            provider="openai",
            models=[
                AIModelConfig(
                    provider="openai",
                    model_name="gpt-4",
                    display_name="GPT-4",
                    api_key_configured=bool(openai_key),
                    is_available=bool(openai_key),
                    capabilities=["chat", "text-generation", "code-generation"],
                    max_tokens=8192
                ),
                AIModelConfig(
                    provider="openai",
                    model_name="gpt-4-turbo",
                    display_name="GPT-4 Turbo",
                    api_key_configured=bool(openai_key),
                    is_available=bool(openai_key),
                    capabilities=["chat", "text-generation", "code-generation", "vision"],
                    max_tokens=128000
                ),
                AIModelConfig(
                    provider="openai",
                    model_name="gpt-3.5-turbo",
                    display_name="GPT-3.5 Turbo",
                    api_key_configured=bool(openai_key),
                    is_available=bool(openai_key),
                    capabilities=["chat", "text-generation"],
                    max_tokens=16385
                )
            ]
        ),
        AIModelResponse(
            provider="anthropic",
            models=[
                AIModelConfig(
                    provider="anthropic",
                    model_name="claude-3-opus",
                    display_name="Claude 3 Opus",
                    api_key_configured=bool(anthropic_key),
                    is_available=bool(anthropic_key),
                    capabilities=["chat", "text-generation", "code-generation"],
                    max_tokens=200000
                ),
                AIModelConfig(
                    provider="anthropic",
                    model_name="claude-3-sonnet",
                    display_name="Claude 3 Sonnet",
                    api_key_configured=bool(anthropic_key),
                    is_available=bool(anthropic_key),
                    capabilities=["chat", "text-generation"],
                    max_tokens=200000
                )
            ]
        )
    ]
    
    return models


@router.get("/providers")
async def list_providers(
    current_user: dict = Depends(get_current_user)
):
    """List all AI providers and their status"""
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    return {
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini",
                "configured": bool(gemini_key),
                "masked_key": mask_api_key(gemini_key) if gemini_key else None,
                "models_count": 2
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "configured": bool(openai_key),
                "masked_key": mask_api_key(openai_key) if openai_key else None,
                "models_count": 3
            },
            {
                "id": "anthropic",
                "name": "Anthropic",
                "configured": bool(anthropic_key),
                "masked_key": mask_api_key(anthropic_key) if anthropic_key else None,
                "models_count": 2
            }
        ]
    }


class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-pro"
    conversation_history: Optional[List[dict]] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7


class ChatResponse(BaseModel):
    response: str
    model: str
    tokens_used: int


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI assistant
    Supports multiple models
    """
    # Route to appropriate AI service based on model
    if request.model.startswith("gemini"):
        from app.api.v1.ai import ai_gemini
        
        ai_request = {
            "prompt": request.message,
            "context": {"history": request.conversation_history or []},
            "max_tokens": request.max_tokens or 1024
        }
        
        # Call Gemini API
        response = await ai_gemini(ai_request, current_user)
        
        return ChatResponse(
            response=response["suggestion"],
            model=request.model,
            tokens_used=response["tokens_used"]
        )
    
    elif request.model.startswith("gpt"):
        from app.api.v1.ai import ai_openai
        
        ai_request = {
            "prompt": request.message,
            "context": {"history": request.conversation_history or []},
            "max_tokens": request.max_tokens or 1024
        }
        
        response = await ai_openai(ai_request, current_user)
        
        return ChatResponse(
            response=response["suggestion"],
            model=request.model,
            tokens_used=response["tokens_used"]
        )
    
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Model {request.model} not supported"
        )
