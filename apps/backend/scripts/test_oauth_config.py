#!/usr/bin/env python3
"""
Test OAuth Configuration
Kiểm tra xem các OAuth credentials đã được config đúng chưa
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

def check_config(name: str, value: str | None) -> bool:
    """Check if a config value is set"""
    if value and value != "":
        print(f"✅ {name}: Configured")
        return True
    else:
        print(f"❌ {name}: Not configured")
        return False

def main():
    print("=" * 60)
    print("WataOmi OAuth Configuration Check")
    print("=" * 60)
    print()
    
    results = {}
    
    # Facebook
    print("📘 Facebook Messenger")
    results['facebook'] = all([
        check_config("FACEBOOK_APP_ID", settings.FACEBOOK_APP_ID),
        check_config("FACEBOOK_APP_SECRET", settings.FACEBOOK_APP_SECRET)
    ])
    print()
    
    # Instagram
    print("📷 Instagram")
    results['instagram'] = all([
        check_config("INSTAGRAM_APP_ID", settings.INSTAGRAM_APP_ID),
        check_config("INSTAGRAM_APP_SECRET", settings.INSTAGRAM_APP_SECRET)
    ])
    print()
    
    # Google
    print("🔴 Google")
    results['google'] = all([
        check_config("GOOGLE_CLIENT_ID", settings.GOOGLE_CLIENT_ID),
        check_config("GOOGLE_CLIENT_SECRET", settings.GOOGLE_CLIENT_SECRET)
    ])
    print()
    
    # Cloudinary
    print("☁️  Cloudinary (Media Upload)")
    results['cloudinary'] = all([
        check_config("CLOUDINARY_CLOUD_NAME", settings.CLOUDINARY_CLOUD_NAME),
        check_config("CLOUDINARY_API_KEY", settings.CLOUDINARY_API_KEY),
        check_config("CLOUDINARY_API_SECRET", settings.CLOUDINARY_API_SECRET)
    ])
    print()
    
    # Casdoor
    print("🔐 Casdoor (Authentication)")
    results['casdoor'] = all([
        check_config("CASDOOR_ENDPOINT", settings.CASDOOR_ENDPOINT),
        check_config("CASDOOR_CLIENT_ID", settings.CASDOOR_CLIENT_ID),
        check_config("CASDOOR_CLIENT_SECRET", settings.CASDOOR_CLIENT_SECRET)
    ])
    print()
    
    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    
    configured = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"Configured: {configured}/{total}")
    print()
    
    if configured == total:
        print("🎉 All services are configured!")
    else:
        print("⚠️  Some services need configuration.")
        print()
        print("Missing configurations:")
        for service, is_configured in results.items():
            if not is_configured:
                print(f"  - {service.title()}")
        print()
        print("📚 See docs/OAUTH_SETUP_GUIDE.md for setup instructions")
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    main()
