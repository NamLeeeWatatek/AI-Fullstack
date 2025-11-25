from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.auth import auth_service
from app.db.session import get_session
from app.models.user import User, Workspace, WorkspaceMember
from typing import Optional

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    workspace_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CasdoorLoginRequest(BaseModel):
    code: str
    state: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: dict
    workspace: Optional[dict] = None

@router.post("/casdoor/login", response_model=AuthResponse)
async def casdoor_login(data: CasdoorLoginRequest, session: AsyncSession = Depends(get_session)):
    """Login with Casdoor code"""
    try:
        # Exchange code for token
        token_response = auth_service.sdk.get_oauth_token(code=data.code)
        print(f"DEBUG: get_oauth_token returned type: {type(token_response)}")
        print(f"DEBUG: get_oauth_token value: {token_response}")
        
        if not token_response:
             raise HTTPException(status_code=400, detail="Failed to get token from Casdoor")

        # Check for error in response (Casdoor SDK might return dict on error)
        if isinstance(token_response, dict) and "error" in token_response:
            error_msg = token_response.get("error_description", token_response.get("error"))
            raise HTTPException(status_code=400, detail=f"Casdoor error: {error_msg}")
        
        # If it's a dict but has access_token (some SDK versions might do this)
        if isinstance(token_response, dict) and "access_token" in token_response:
            token = token_response["access_token"]
        else:
            token = token_response

        # Ensure token is string for response and verification
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        
        # Verify the token to get user info
        jwt_payload = auth_service.verify_token(token)
        if not jwt_payload:
             raise HTTPException(status_code=400, detail="Invalid token received from Casdoor")

        # Sync user to local database
        external_id = jwt_payload.get("sub") or jwt_payload.get("id")
        email = jwt_payload.get("email")
        name = jwt_payload.get("name", email)
        
        if not external_id or not email:
            raise HTTPException(status_code=400, detail="Missing user information in token")
        
        # Find or create user
        query = select(User).where(User.external_id == external_id)
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            # Try to find by email
            query = select(User).where(User.email == email)
            result = await session.execute(query)
            user = result.scalar_one_or_none()
            
            if user:
                # Update external_id for existing user
                user.external_id = external_id
                user.name = name
            else:
                # Create new user
                user = User(
                    email=email,
                    external_id=external_id,
                    name=name,
                    hashed_password="",  # No password for Casdoor users
                    is_active=True
                )
                session.add(user)
            
            await session.commit()
            await session.refresh(user)
        
        # Check if user has a workspace
        query = select(WorkspaceMember).where(WorkspaceMember.user_id == user.id)
        result = await session.execute(query)
        workspace_member = result.scalar_one_or_none()
        
        workspace_data = None
        if not workspace_member:
            # Create default workspace for new user
            workspace = Workspace(
                name=f"{user.name}'s Workspace",
                slug=f"{user.email.split('@')[0]}-workspace",
                owner_id=user.id
            )
            session.add(workspace)
            await session.commit()
            await session.refresh(workspace)
            
            # Add user as workspace owner
            workspace_member = WorkspaceMember(
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner"
            )
            session.add(workspace_member)
            await session.commit()
            
            workspace_data = {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug
            }
        else:
            # Get existing workspace
            workspace = await session.get(Workspace, workspace_member.workspace_id)
            workspace_data = {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug
            }
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "external_id": user.external_id
            },
            "workspace": workspace_data
        }
    except Exception as e:
        print(f"Casdoor login error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    """Register a new user and create their workspace"""
    # TODO: Check if user exists
    # TODO: Create user in database
    # TODO: Create workspace
    # TODO: Add user as workspace owner
    
    # Mock response
    access_token = create_access_token({"sub": "user@example.com", "workspace_id": 1})
    refresh_token = create_refresh_token({"sub": "user@example.com"})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": 1,
            "email": data.email,
            "name": data.name
        },
        "workspace": {
            "id": 1,
            "name": data.workspace_name,
            "slug": data.workspace_name.lower().replace(" ", "-")
        }
    }

@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """Login with email and password"""
    # TODO: Verify credentials
    # TODO: Get user and workspace from database
    
    # Mock response
    access_token = create_access_token({"sub": data.email, "workspace_id": 1})
    refresh_token = create_refresh_token({"sub": data.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": 1,
            "email": data.email,
            "name": "John Doe"
        },
        "workspace": {
            "id": 1,
            "name": "My Workspace",
            "slug": "my-workspace"
        }
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    # TODO: Verify refresh token
    # TODO: Generate new access token
    
    access_token = create_access_token({"sub": "user@example.com", "workspace_id": 1})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me")
async def get_current_user():
    """Get current authenticated user"""
    # TODO: Get user from token
    
    return {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "workspace": {
            "id": 1,
            "name": "My Workspace"
        }
    }

@router.post("/logout")
async def logout():
    """Logout user - client should clear token"""
    # For JWT-based auth, logout is handled client-side by removing the token
    # For Casdoor, we could optionally revoke the token here
    # For now, just return success
    return {
        "message": "Logged out successfully"
    }
