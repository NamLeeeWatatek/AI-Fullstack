# 🚀 Global Loading State Implementation Guide

## 📋 **Overview**

Global loading state đã được implement vào Redux UI slice để provide consistent loading experience across the entire application.

## 🏗️ **Components Created**

### 1. **Redux UI Slice** (`uiSlice.ts`)
```typescript
interface UiState {
    isGlobalLoading: boolean     // Master loading flag
    loadingMessage: string | null // Current message
    loadingActions: string[]     // Stack of active actions
}

// Actions available:
- setGlobalLoading({ actionId, isLoading, message })
- clearGlobalLoading()
```

### 2. **Loading Overlay Components**
- `LoadingOverlay` - Semi-transparent overlay with backdrop
- `LoadingFullscreen` - Full screen replacement
- `GlobalLoadingOverlay` - Connected to Redux state

### 3. **Loading Hooks** (`useLoadingAction()`, `useGlobalLoading()`)
```typescript
const { isLoading, message } = useGlobalLoading()  // Get current state
const { startLoading, stopLoading, withLoading } = useLoadingAction()  // Control loading
```

## 🎯 **Usage Patterns**

### **Pattern 1: Manual Loading Control**

```typescript
import { useLoadingAction } from '@/lib/store/hooks'

function MyComponent() {
    const { startLoading, stopLoading } = useLoadingAction()

    const handleAction = async () => {
        startLoading('my-action', 'Doing something...')

        try {
            await someAsyncOperation()
        } finally {
            stopLoading('my-action')
        }
    }

    return <button onClick={handleAction}>Do Action</button>
}
```

### **Pattern 2: Wrapper Function (Recommended)**

```typescript
import { useLoadingAction } from '@/lib/store/hooks'

function MyComponent() {
    const { withLoading } = useLoadingAction()

    const handleAction = async () => {
        await withLoading(
            'my-action',
            async () => {
                // Your async code here
                await apiCall()
                return result
            },
            'Custom message...'
        )
    }

    return <button onClick={handleAction}>Do Action</button>
}
```

### **Pattern 3: Redux Async Thunk Integration**

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit'

export const myAsyncThunk = createAsyncThunk(
    'mySlice/action',
    async (payload, { dispatch }) => {
        // Add to loading state via middleware or manual dispatch
        dispatch(setGlobalLoading({
            actionId: 'my-thunk',
            isLoading: true,
            message: 'Processing...'
        }))

        try {
            const result = await apiCall(payload)
            return result
        } finally {
            dispatch(setGlobalLoading({
                actionId: 'my-thunk',
                isLoading: false
            }))
        }
    }
)
```

## 🔧 **Best Practices**

### 1. **Unique Action IDs**
```typescript
// ✅ GOOD: Unique ID per action
startLoading('upload-file-123', 'Uploading...')
startLoading('save-document', 'Saving...')

// ❌ BAD: Same ID causes conflicts
startLoading('loading', 'First action')
startLoading('loading', 'Second action')  // Overrides first
```

### 2. **Always Cleanup**
```typescript
// ✅ GOOD: Proper cleanup
const { startLoading, stopLoading } = useLoadingAction()
startLoading('action-id')
try {
    await apiCall()
} finally {
    stopLoading('action-id')  // Always cleanup
}

// ❌ BAD: Forget cleanup
startLoading('action-id')
await apiCall()
// Loading stays forever!
```

### 3. **Use withLoading Wrapper**
```typescript
// ✅ RECOMMENDED: Wrapper handles cleanup automatically
await withLoading('action-id', async () => {
    // Loading starts automatically
    const result = await apiCall()
    return result
    // Loading stops automatically even on error
}, 'Loading message...')
```

## 🧪 **Testing**

### **Manual Test**
```typescript
// Test in browser console or component
import { useLoadingAction } from '@/lib/store/hooks'

// In component:
const { withLoading } = useLoadingAction()

// Test loading overlay
await withLoading('test', () => new Promise(r => setTimeout(r, 3000)), 'Test loading...')

// Overlay should appear for 3 seconds
```

### **Integration Test**
```typescript
// Test with real API call
const { withLoading } = useLoadingAction()

const handleUpload = async () => {
    const file = new File(['test'], 'test.txt')
    await withLoading(
        'file-upload',
        async () => {
            await uploadKBDocument(file, 'kb-id')
        },
        'Uploading file...'
    )
}
```

## 🚫 **Anti-Patterns to Avoid**

### 1. **Don't Use Auth Loading for UI Actions**
```typescript
// ❌ BAD: Don't do this in components
const { isLoading } = useAuth()  // Auth loading only for initial boot
if (isLoading) return <Spinner />

// ✅ GOOD: Use global loading only for UI actions
const { isLoading, message } = useGlobalLoading()
```

### 2. **Don't Nest Loading States Improperly**
```typescript
// ❌ BAD: Nested with same ID
await withLoading('action', async () => {
    await withLoading('action', () => {})  // Conflicts!
})

// ✅ GOOD: Different IDs
await withLoading('parent-action', async () => {
    await withLoading('child-action', childTask, 'Child task...')
})
```

### 3. **Don't Forget Error Handling**
```typescript
// ⚠️  WARNING: withLoading doesn't handle errors in business logic
const { withLoading } = useLoadingAction()

// Manual error handling still needed
try {
    await withLoading('action', async () => {
        const result = await mayThrowError()
        if (!result.success) throw new Error('Business error')
        return result
    })
} catch (error) {
    // Handle business errors here
    showToast(error.message)
}
```

## 📊 **Migration Guide**

### **Before** (No Global Loading)
```typescript
function Component() {
    const [localLoading, setLocalLoading] = useState(false)

    const handleAction = async () => {
        setLocalLoading(true)
        try {
            await apiCall()
        } finally {
            setLocalLoading(false)
        }
    }

    if (localLoading) return <Spinner />
    return <UI />
}
```

### **After** (Global Loading)
```typescript
function Component() {
    const { withLoading } = useLoadingAction()

    const handleAction = async () => {
        await withLoading(
            'component-action',
            async () => {
                await apiCall()
            },
            'Please wait...'
        )
    }

    return <UI />
}
```

## 🎨 **Customization**

### **Custom Loading Messages**
```typescript
// Multiple actions with different messages
await withLoading('saving', saveAction, 'Saving changes...')
await withLoading('uploading', uploadAction, 'Uploading files...')
await withLoading('processing', processAction, 'AI is thinking...')
```

### **Loading with Progress** (Future Enhancement)
```typescript
// IDEA: Support progress indicators
await withLoading('upload', uploadAction, 'Uploading...', {
    progress: (percent) => console.log(`${percent}% uploaded`)
})
```

---

## ✅ **Global Loading State - COMPLETED!**

- ✅ Redux UI slice with loading state
- ✅ Loading overlay components
- ✅ React hooks for easy access
- ✅ Usage patterns & best practices
- ✅ Anti-patterns to avoid
- ✅ Migration examples

**System now has centralized loading management! 🚀**
