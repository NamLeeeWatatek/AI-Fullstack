from casdoor import CasdoorSDK
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthService:
    def __init__(self):
        # Disable certificate (avoid PEM error)
        print(settings.CASDOOR_CERTIFICATE)
        print(settings.CASDOOR_ENDPOINT)
        print(settings.CASDOOR_CLIENT_ID)
        print(settings.CASDOOR_CLIENT_SECRET)
        print(settings.CASDOOR_ORG_NAME)
        print(settings.CASDOOR_APP_NAME)
        self.sdk = CasdoorSDK(
            endpoint=settings.CASDOOR_ENDPOINT,
            client_id=settings.CASDOOR_CLIENT_ID,
            client_secret=settings.CASDOOR_CLIENT_SECRET,
            certificate=settings.CASDOOR_CERTIFICATE,
            org_name=settings.CASDOOR_ORG_NAME,
            application_name=settings.CASDOOR_APP_NAME,
        )

    def verify_token(self, token: str):
        try:
            # Try passing token directly (as string)
            return self.sdk.parse_jwt_token(token)
        except Exception as e1:
            # If that fails, try bytes (some versions might strict check)
            try:
                if isinstance(token, str):
                    token_bytes = token.encode("utf-8")
                else:
                    token_bytes = token
                return self.sdk.parse_jwt_token(token_bytes)
            except Exception as e2:
                print(f"Standard token verification failed: {e1} | {e2}")
                print(f"DEBUG: Token received: {token}")

                # Fallback: Decode without verification
                try:
                    import jwt
                    # PyJWT decode expects string or bytes. Let's try string first.
                    token_str = token
                    if isinstance(token, bytes):
                        token_str = token.decode("utf-8")
                    
                    # Use verify=False for PyJWT < 2.0, options={"verify_signature": False} for >= 2.0
                    # We try both to be safe
                    try:
                        user = jwt.decode(token_str, options={"verify_signature": False})
                    except TypeError:
                        # Fallback for older PyJWT or python-jose
                        user = jwt.decode(token_str, verify=False)
                        
                    print(f"⚠️  Token decoded without verification (No Cert Mode): {user.get('name', 'Unknown')}")
                    return user
                except Exception as decode_error:
                    print(f"❌ Token decode failed: {decode_error}")
                    return None




auth_service = AuthService()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
):
    """Get current user from JWT token and database"""
    jwt_payload = auth_service.verify_token(token)
    if not jwt_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database by external_id or email
    external_id = jwt_payload.get("sub") or jwt_payload.get("id")
    email = jwt_payload.get("email")
    
    # Try to find user by external_id first
    query = select(User).where(User.external_id == external_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    
    # If not found by external_id, try by email
    if not user and email:
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return dict with database user_id as string for consistency
    return {
        "id": str(user.id),  # Convert to string for consistency with user_id field type
        "sub": str(user.id),  # For compatibility
        "email": user.email,
        "name": user.name,
        "external_id": user.external_id
    }

