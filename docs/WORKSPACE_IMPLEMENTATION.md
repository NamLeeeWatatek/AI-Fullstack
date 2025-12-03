# Workspace Implementation Guide

## Overview
Workspace feature đã được implement đầy đủ cho cả backend và frontend, cho phép users tạo và quản lý nhiều workspaces.

## Backend Changes

### 1. Auth Service Updates
**File:** `apps/backend/src/auth/auth.service.ts`

- Tự động tạo workspace khi user login lần đầu
- Trả về workspace info trong login response
- Import `WorkspaceHelperService` để quản lý workspace

```typescript
// Login response bây giờ bao gồm:
{
  token: string,
  refreshToken: string,
  user: User,
  workspace: Workspace,      // Current/default workspace
  workspaces: Workspace[]    // All user workspaces
}
```

### 2. Workspace Module
**Files:**
- `apps/backend/src/workspaces/workspaces.service.ts`
- `apps/backend/src/workspaces/workspace-helper.service.ts`
- `apps/backend/src/workspaces/workspaces.controller.ts`

**New Endpoints:**
- `GET /api/v1/workspaces` - Get all user workspaces
- `GET /api/v1/workspaces/current` - Get current/default workspace
- `POST /api/v1/workspaces` - Create new workspace
- `PATCH /api/v1/workspaces/:id` - Update workspace
- `DELETE /api/v1/workspaces/:id` - Delete workspace
- `GET /api/v1/workspaces/:id/members` - Get workspace members
- `POST /api/v1/workspaces/:id/members` - Add member
- `DELETE /api/v1/workspaces/:id/members/:userId` - Remove member

### 3. Workspace Guards & Decorators
**Files:**
- `apps/backend/src/workspaces/guards/workspace-access.guard.ts`
- `apps/backend/src/workspaces/decorators/workspace.decorator.ts`

**Usage:**
```typescript
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Get(':workspaceId/bots')
getBots(@WorkspaceId() workspaceId: string) {
  // workspaceId is validated and user has access
}
```

### 4. Bot Service Updates
**File:** `apps/backend/src/bots/bots.service.ts`

- Bots bây giờ require `workspaceId`
- Auto-create workspace nếu user chưa có

## Frontend Changes

### 1. Workspace Types
**File:** `apps/web/lib/types/workspace.ts`

```typescript
interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Redux Store
**File:** `apps/web/lib/store/slices/workspaceSlice.ts`

**State:**
```typescript
{
  currentWorkspace: Workspace | null,
  workspaces: Workspace[],
  isLoading: boolean,
  error: string | null
}
```

**Actions:**
- `setCurrentWorkspace` - Set active workspace
- `setWorkspaces` - Set all workspaces
- `switchWorkspace` - Switch to different workspace
- `addWorkspace` - Add new workspace
- `updateWorkspace` - Update workspace
- `removeWorkspace` - Remove workspace

### 3. Workspace Hook
**File:** `apps/web/lib/hooks/useWorkspace.ts`

```typescript
const {
  currentWorkspace,
  workspaces,
  isLoading,
  error,
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  switchWorkspace
} = useWorkspace();
```

### 4. Auth Updates
**File:** `apps/web/lib/hooks/useAuth.ts`

- Tự động sync workspace từ session vào Redux store
- Expose workspace info từ session

```typescript
const {
  user,
  accessToken,
  workspace,      // Current workspace from session
  workspaces,     // All workspaces from session
  isAuthenticated,
  isLoading,
  signOut
} = useAuth();
```

### 5. Workspace Switcher Component
**File:** `apps/web/components/workspace/workspace-switcher.tsx`

- Dropdown để switch giữa các workspaces
- Hiển thị workspace name, avatar, và plan
- Tích hợp trong dashboard sidebar

### 6. Dashboard Layout
**File:** `apps/web/app/(dashboard)/layout.tsx`

- Thay thế static workspace selector bằng `<WorkspaceSwitcher />`
- Tự động load workspace info khi user login

### 7. Bots Page Updates
**File:** `apps/web/app/(dashboard)/bots/page.tsx`

- Sử dụng `currentWorkspace` từ `useWorkspace()`
- Filter bots theo workspace
- Include `workspaceId` khi tạo bot mới

## Usage Examples

### Backend: Validate Workspace Access
```typescript
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Get(':workspaceId/resources')
getResources(@WorkspaceId() workspaceId: string) {
  return this.service.findAll(workspaceId);
}
```

### Frontend: Use Current Workspace
```typescript
function MyComponent() {
  const { currentWorkspace } = useWorkspace();
  
  useEffect(() => {
    if (currentWorkspace) {
      loadData(currentWorkspace.id);
    }
  }, [currentWorkspace]);
}
```

### Frontend: Switch Workspace
```typescript
function WorkspaceMenu() {
  const { workspaces, switchWorkspace } = useWorkspace();
  
  return (
    <select onChange={(e) => switchWorkspace(e.target.value)}>
      {workspaces.map(ws => (
        <option key={ws.id} value={ws.id}>{ws.name}</option>
      ))}
    </select>
  );
}
```

## Database Schema

### workspaces table
```sql
CREATE TABLE workspace (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  avatar_url VARCHAR,
  plan VARCHAR DEFAULT 'free',
  owner_id UUID NOT NULL REFERENCES user(id),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### workspace_members table
```sql
CREATE TABLE workspace_member (
  workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);
```

## Migration Notes

### Existing Users
- Khi user login lần đầu sau khi deploy, workspace sẽ tự động được tạo
- Workspace name: `"[UserName]'s Workspace"`
- Plan: `free`
- User tự động trở thành owner

### Existing Bots/Resources
- Cần migration script để gán `workspaceId` cho existing resources
- Hoặc handle null `workspaceId` trong code (fallback to user's default workspace)

## Testing

### Backend
```bash
# Test workspace creation on login
POST /api/v1/auth/casdoor/callback
# Should return workspace and workspaces in response

# Test workspace endpoints
GET /api/v1/workspaces
GET /api/v1/workspaces/current
POST /api/v1/workspaces
```

### Frontend
1. Login và check Redux DevTools
2. Verify workspace info trong state
3. Test workspace switcher
4. Create bot và verify workspaceId được gửi
5. Switch workspace và verify bots được filter

## Next Steps

1. **Workspace Settings Page** - UI để manage workspace settings
2. **Member Management** - Invite/remove members
3. **Workspace Permissions** - Role-based access control
4. **Workspace Analytics** - Usage stats per workspace
5. **Workspace Billing** - Plan upgrades/downgrades
6. **Multi-workspace Resource Sharing** - Share bots/flows between workspaces

## Troubleshooting

### Issue: Workspace not showing after login
- Check browser console for errors
- Verify backend returns workspace in login response
- Check Redux DevTools for workspace state

### Issue: Bots not loading
- Verify currentWorkspace is not null
- Check API call includes workspaceId parameter
- Verify user has access to workspace

### Issue: Cannot create bot
- Ensure workspaceId is included in request body
- Verify user is member of workspace
- Check backend logs for validation errors
