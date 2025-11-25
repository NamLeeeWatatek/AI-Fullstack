# TODO: Features to Complete

## 🔴 Priority 1: Critical Features

### 1. Flow Executions (Backend + Frontend)
**Status**: Mock data only

**Backend Tasks**:
- [ ] Create `/api/v1/flows/{id}/executions` endpoint
- [ ] Create `/api/v1/executions/{id}` endpoint for details
- [ ] Store execution results in `workflow_executions` table
- [ ] Track node execution status in `node_executions` table

**Frontend Tasks**:
- [ ] Replace mock data in `/flows/[id]/page.tsx` with real API calls
- [ ] Update `/flows/[id]/executions/page.tsx` to fetch real data
- [ ] Update `/flows/[id]/executions/[executionId]/page.tsx` for execution details

**Files to Update**:
- `apps/backend/app/api/v1/executions.py` - Add missing endpoints
- `apps/web/app/(dashboard)/flows/[id]/page.tsx` - Line 123-135 (recentExecutions)
- `apps/web/app/(dashboard)/flows/[id]/executions/page.tsx`
- `apps/web/app/(dashboard)/flows/[id]/executions/[executionId]/page.tsx`

---

### 2. Channel Selection in Flow Editor
**Status**: Missing UI

**Problem**: 
- Users can configure Facebook/Instagram/WhatsApp
- Users can connect channels
- But flow editor doesn't let users select which channel to use

**Solution**:
Add channel selector in flow editor:
```typescript
// In flow edit page, add:
- Channel dropdown to select connected channels
- Save selected channel_id with flow
- Display channel icon/name in flow header
```

**Files to Update**:
- `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx` - Add channel selector
- `apps/backend/app/models/flow.py` - Add `channel_id` field (optional)
- `apps/backend/migrations/` - Add migration for channel_id

**UI Mockup**:
```
┌─────────────────────────────────────┐
│ Flow Editor                         │
│ ┌─────────────────────────────────┐ │
│ │ Channel: [WhatsApp ▼]           │ │
│ │          - WhatsApp Business    │ │
│ │          - Facebook Messenger   │ │
│ │          - Instagram DM         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 3. Bot Functionality
**Status**: Only CRUD, no actual bot logic

**Current State**:
- ✅ Can create/edit/delete bots
- ❌ Bots don't actually respond to messages
- ❌ No connection between bots and flows
- ❌ No connection between bots and channels

**What's Needed**:

#### A. Connect Bot to Flow
```typescript
// Bot should have:
- flow_id: which flow to execute
- channel_connections: which channels this bot monitors
```

#### B. Message Handler
```python
# When message arrives:
1. Identify which bot should handle it (by channel)
2. Load bot's flow
3. Execute flow with message as input
4. Send response back to channel
```

#### C. Webhook Integration
```python
# apps/backend/app/api/v1/webhooks.py
# Already exists but needs to:
1. Find bot for incoming channel
2. Trigger bot's flow execution
3. Return bot's response
```

**Files to Update**:
- `apps/backend/app/models/bot.py` - Add `flow_id`, `channel_connections`
- `apps/backend/app/api/v1/webhooks.py` - Add bot execution logic
- `apps/backend/app/services/bot_executor.py` - NEW: Bot execution service
- `apps/web/app/(dashboard)/bots/page.tsx` - Add flow selector

---

### 4. Flow Editor: Save Button Logic
**Status**: Button appears/disappears incorrectly

**Problem**:
- Save button should only show when there are unsaved changes
- Currently shows/hides randomly

**Solution**:
```typescript
// Track changes properly:
const [hasChanges, setHasChanges] = useState(false)
const [savedState, setSavedState] = useState(null)

// On any node/edge change:
useEffect(() => {
  const currentState = JSON.stringify({ nodes, edges })
  setHasChanges(currentState !== savedState)
}, [nodes, edges, savedState])

// After save:
setSavedState(JSON.stringify({ nodes, edges }))
setHasChanges(false)
```

**Files to Update**:
- `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx` - Fix save button logic

---

## 🟡 Priority 2: Important Features

### 5. Flow Versions
**Status**: UI exists, backend incomplete

**Backend Tasks**:
- [ ] Implement `/api/v1/flows/{id}/versions` endpoint
- [ ] Store versions in `flow_versions` table
- [ ] Implement version restore functionality

**Frontend Tasks**:
- [ ] Connect versions tab to real API
- [ ] Add version comparison view

---

### 6. Flow Testing
**Status**: Button exists, no functionality

**What's Needed**:
- [ ] Test run endpoint: `POST /api/v1/flows/{id}/test`
- [ ] Mock input data for testing
- [ ] Show test results in UI
- [ ] Debug mode to see each node execution

---

### 7. Flow Export/Import
**Status**: Button exists, no functionality

**What's Needed**:
- [ ] Export flow as JSON
- [ ] Import flow from JSON
- [ ] Template marketplace (future)

---

## 🟢 Priority 3: Nice to Have

### 8. Analytics & Metrics
**Status**: Mock data

**What's Needed**:
- [ ] Real execution statistics
- [ ] Success/failure rates
- [ ] Average duration tracking
- [ ] Charts and graphs

---

### 9. Collaboration Features
**Status**: Not started

**What's Needed**:
- [ ] Share flows with team members
- [ ] Comments on flows
- [ ] Activity log
- [ ] Permissions (view/edit)

---

### 10. Advanced Node Types
**Status**: Basic nodes only

**What's Needed**:
- [ ] API call node
- [ ] Database query node
- [ ] Delay/Wait node
- [ ] Loop node
- [ ] Variable storage node

---

## 📋 Implementation Order

### Week 1: Core Bot Functionality
1. ✅ Fix database schema issues
2. ✅ Fix authentication issues
3. ⏳ Connect bots to flows
4. ⏳ Implement message handling
5. ⏳ Test end-to-end bot flow

### Week 2: Flow Editor Improvements
1. ⏳ Add channel selector
2. ⏳ Fix save button logic
3. ⏳ Implement flow testing
4. ⏳ Add real execution data

### Week 3: Polish & Testing
1. ⏳ Flow versions
2. ⏳ Export/Import
3. ⏳ Analytics
4. ⏳ Bug fixes

---

## 🚀 Quick Wins (Can do now)

### 1. Fix Flow Editor Save Button
**Time**: 30 minutes
**Impact**: High (UX improvement)
**File**: `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx`

### 2. Add Channel Selector
**Time**: 1 hour
**Impact**: High (enables channel-specific flows)
**Files**: 
- `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx`
- `apps/backend/app/models/flow.py`

### 3. Connect Executions API
**Time**: 2 hours
**Impact**: High (shows real data)
**Files**:
- `apps/backend/app/api/v1/executions.py`
- `apps/web/app/(dashboard)/flows/[id]/page.tsx`

---

## 📝 Notes

- All database tables already exist (from migration)
- Most API endpoints have placeholders
- Frontend UI is mostly complete
- Main work is connecting everything together

---

## 🎯 MVP Definition

For a working MVP, we need:
1. ✅ User authentication (Casdoor)
2. ✅ Create/edit flows
3. ⏳ Connect channels (Facebook, WhatsApp, etc.)
4. ⏳ Create bots that use flows
5. ⏳ Bots respond to messages
6. ⏳ View execution history

**Current Progress**: ~60% complete
**Estimated time to MVP**: 2-3 weeks
