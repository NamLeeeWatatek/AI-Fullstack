# ✅ No Certificate Mode Configured

## What was done?

1.  **Updated `Settings`**: Modified `apps/backend/app/core/config.py` to make `CASDOOR_CERTIFICATE` optional (`Optional[str] = None`).
2.  **Updated `AuthService`**: Modified `apps/backend/app/core/auth.py` to:
    *   Initialize `CasdoorSDK` with an empty string if no certificate is provided.
    *   **Fallback to skip verification**: If standard token verification fails (due to missing/invalid cert), it will decode the token without signature verification.

## ⚠️ Security Note
This mode skips JWT signature verification if the certificate is missing. This is acceptable for **internal/self-hosted** environments where you trust the network between Casdoor and your Backend. For public production, using a valid certificate is recommended.

## 🚀 Next Steps

1.  **Restart Backend**:
    You MUST restart the backend for changes to take effect.
    ```bash
    cd apps/backend
    python run.py
    ```

2.  **Test Login**:
    *   Go to `http://localhost:3003/login`
    *   Login with Casdoor.
    *   It should now work. You will see a log message:
        `⚠️  Token decoded without verification (No Cert Mode): ...`
