from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import cloudinary
import cloudinary.uploader
import cloudinary.api

from app.db.session import get_session
from app.core.auth import get_current_user
from app.core.config import settings
from app.models.media import MediaAsset, MediaAssetResponse

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

# File size limits (bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload/image", response_model=MediaAssetResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload an image to Cloudinary"""
    user_id = current_user.get("id")
    
    # Read file content
    content = await file.read()
    
    # Validate size
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"Image size exceeds {MAX_IMAGE_SIZE / 1024 / 1024}MB limit")
    
    # Validate type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            content,
            folder=f"wataomi/{user_id}",
            resource_type="image"
        )
        
        # Save to database
        media = MediaAsset(
            user_id=user_id,
            public_id=result["public_id"],
            url=result["url"],
            secure_url=result["secure_url"],
            resource_type=result["resource_type"],
            format=result["format"],
            width=result.get("width"),
            height=result.get("height"),
            bytes=result["bytes"]
        )
        session.add(media)
        await session.commit()
        await session.refresh(media)
        return media
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/file", response_model=MediaAssetResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload a file to Cloudinary"""
    user_id = current_user.get("id")
    
    # Read file content
    content = await file.read()
    
    # Validate size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB limit")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            content,
            folder=f"wataomi/{user_id}",
            resource_type="auto"
        )
        
        # Save to database
        media = MediaAsset(
            user_id=user_id,
            public_id=result["public_id"],
            url=result["url"],
            secure_url=result["secure_url"],
            resource_type=result["resource_type"],
            format=result["format"],
            width=result.get("width"),
            height=result.get("height"),
            bytes=result["bytes"]
        )
        session.add(media)
        await session.commit()
        await session.refresh(media)
        return media
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/", response_model=List[MediaAssetResponse])
async def list_media(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List user's media assets"""
    user_id = current_user.get("id")
    
    query = select(MediaAsset).where(MediaAsset.user_id == user_id)
    result = await session.execute(query)
    return result.scalars().all()

@router.delete("/{public_id:path}")
async def delete_media(
    public_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a media asset"""
    user_id = current_user.get("id")
    
    # Find in database
    query = select(MediaAsset).where(
        MediaAsset.public_id == public_id,
        MediaAsset.user_id == user_id
    )
    result = await session.execute(query)
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    try:
        # Delete from Cloudinary
        cloudinary.uploader.destroy(public_id, resource_type=media.resource_type)
        
        # Delete from database
        await session.delete(media)
        await session.commit()
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/signature")
async def get_upload_signature(
    current_user: dict = Depends(get_current_user)
):
    """Generate Cloudinary upload signature for client-side uploads"""
    import time
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": f"wataomi/{current_user.get('id')}"
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        settings.CLOUDINARY_API_SECRET
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": settings.CLOUDINARY_API_KEY,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME
    }
