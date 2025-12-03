/**
 * Knowledge Base Redux Slice
 * Manages KB state, folders, documents, and operations
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
  KnowledgeBase,
  KBFolder,
  KBDocument,
  KnowledgeBaseStats,
} from '@/lib/types/knowledge-base'
import {
  getKnowledgeBase,
  getKBFolders,
  getKBDocuments,
  getKnowledgeBaseStats,
  createKBFolder,
  createKBDocument,
  updateKBFolder,
  updateKBDocument,
  deleteKBFolder,
  deleteKBDocument,
  moveKBFolder,
  moveKBDocument,
  uploadKBDocument,
} from '@/lib/api/knowledge-base'

// Types
interface KnowledgeBaseState {
  // Current KB
  currentKB: KnowledgeBase | null
  stats: KnowledgeBaseStats | null
  
  // Navigation
  currentFolderId: string | null
  breadcrumbs: Array<{ id: string | null; name: string }>
  
  // Data
  folders: KBFolder[]
  documents: KBDocument[]
  
  // UI State
  loading: boolean
  autoRefreshing: boolean
  uploading: boolean
  viewMode: 'grid' | 'table'
  searchQuery: string
  selectedIds: string[]
  
  // Drag & Drop
  draggedItem: { type: 'folder' | 'document'; id: string } | null
  dragOverFolder: string | null
  
  // Error
  error: string | null
}

const initialState: KnowledgeBaseState = {
  currentKB: null,
  stats: null,
  currentFolderId: null,
  breadcrumbs: [],
  folders: [],
  documents: [],
  loading: false,
  autoRefreshing: false,
  uploading: false,
  viewMode: 'table',
  searchQuery: '',
  selectedIds: [],
  draggedItem: null,
  dragOverFolder: null,
  error: null,
}

// Async Thunks
export const loadKnowledgeBase = createAsyncThunk(
  'knowledgeBase/load',
  async ({ kbId, folderId }: { kbId: string; folderId?: string | null }) => {
    const [kbRes, statsRes, foldersRes, documentsRes] = await Promise.all([
      getKnowledgeBase(kbId),
      getKnowledgeBaseStats(kbId),
      getKBFolders(kbId),
      getKBDocuments(kbId, folderId || undefined),
    ])
    
    // Handle both response.data and direct response
    const kb = (kbRes as any)?.data || kbRes
    const stats = (statsRes as any)?.data || statsRes
    const folders = Array.isArray(foldersRes) ? foldersRes : ((foldersRes as any)?.data || [])
    const documents = Array.isArray(documentsRes) ? documentsRes : ((documentsRes as any)?.data || [])
    
    return { kb, stats, folders, documents, folderId: folderId || null }
  }
)

export const refreshData = createAsyncThunk(
  'knowledgeBase/refresh',
  async ({ kbId, folderId }: { kbId: string; folderId?: string | null }) => {
    const [statsRes, foldersRes, documentsRes] = await Promise.all([
      getKnowledgeBaseStats(kbId),
      getKBFolders(kbId),
      getKBDocuments(kbId, folderId || undefined),
    ])
    
    // Handle both response.data and direct response
    const stats = (statsRes as any)?.data || statsRes
    const folders = Array.isArray(foldersRes) ? foldersRes : ((foldersRes as any)?.data || [])
    const documents = Array.isArray(documentsRes) ? documentsRes : ((documentsRes as any)?.data || [])
    
    return { stats, folders, documents }
  }
)

export const createFolder = createAsyncThunk(
  'knowledgeBase/createFolder',
  async (data: {
    knowledgeBaseId: string
    name: string
    description?: string
    parentFolderId?: string
  }) => {
    const folder = await createKBFolder(data)
    return folder
  }
)

export const createDocument = createAsyncThunk(
  'knowledgeBase/createDocument',
  async (data: {
    knowledgeBaseId: string
    name: string
    content: string
    folderId?: string
  }) => {
    const document = await createKBDocument(data)
    return document
  }
)

export const uploadDocument = createAsyncThunk(
  'knowledgeBase/uploadDocument',
  async (data: { file: File; kbId: string; folderId?: string }) => {
    const result = await uploadKBDocument(data.file, data.kbId, data.folderId)
    return result
  }
)

export const updateFolder = createAsyncThunk(
  'knowledgeBase/updateFolder',
  async (data: { id: string; updates: { name?: string; description?: string; icon?: string } }) => {
    const folder = await updateKBFolder(data.id, data.updates)
    return folder
  }
)

export const updateDocument = createAsyncThunk(
  'knowledgeBase/updateDocument',
  async (data: { id: string; updates: { name?: string; description?: string; icon?: string } }) => {
    const document = await updateKBDocument(data.id, data.updates)
    return document
  }
)

export const removeFolder = createAsyncThunk(
  'knowledgeBase/removeFolder',
  async (id: string) => {
    await deleteKBFolder(id)
    return id
  }
)

export const removeDocument = createAsyncThunk(
  'knowledgeBase/removeDocument',
  async (id: string) => {
    await deleteKBDocument(id)
    return id
  }
)

export const moveFolderToFolder = createAsyncThunk(
  'knowledgeBase/moveFolder',
  async (data: { folderId: string; targetFolderId: string | null }) => {
    await moveKBFolder(data.folderId, data.targetFolderId)
    return data
  }
)

export const moveDocumentToFolder = createAsyncThunk(
  'knowledgeBase/moveDocument',
  async (data: { documentId: string; targetFolderId: string | null }) => {
    await moveKBDocument(data.documentId, data.targetFolderId)
    return data
  }
)

// Slice
const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    // Navigation
    setCurrentFolder: (state, action: PayloadAction<string | null>) => {
      state.currentFolderId = action.payload
    },
    
    navigateToFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.breadcrumbs.push(action.payload)
      state.currentFolderId = action.payload.id
    },
    
    navigateToBreadcrumb: (state, action: PayloadAction<number>) => {
      const index = action.payload
      if (index === -1) {
        state.breadcrumbs = []
        state.currentFolderId = null
      } else {
        state.breadcrumbs = state.breadcrumbs.slice(0, index + 1)
        state.currentFolderId = state.breadcrumbs[index].id
      }
    },
    
    // UI State
    setViewMode: (state, action: PayloadAction<'grid' | 'table'>) => {
      state.viewMode = action.payload
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    
    toggleSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.selectedIds.indexOf(id)
      if (index > -1) {
        state.selectedIds.splice(index, 1)
      } else {
        state.selectedIds.push(id)
      }
    },
    
    toggleSelectAll: (state) => {
      const allIds = [...state.folders.map(f => f.id), ...state.documents.map(d => d.id)]
      if (state.selectedIds.length === allIds.length) {
        state.selectedIds = []
      } else {
        state.selectedIds = allIds
      }
    },
    
    clearSelection: (state) => {
      state.selectedIds = []
    },
    
    // Drag & Drop
    setDraggedItem: (state, action: PayloadAction<{ type: 'folder' | 'document'; id: string } | null>) => {
      state.draggedItem = action.payload
    },
    
    setDragOverFolder: (state, action: PayloadAction<string | null>) => {
      state.dragOverFolder = action.payload
    },
    
    // Auto-refresh
    setAutoRefreshing: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshing = action.payload
    },
    
    // Reset
    resetState: () => initialState,
  },
  
  extraReducers: (builder) => {
    // Load Knowledge Base
    builder
      .addCase(loadKnowledgeBase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadKnowledgeBase.fulfilled, (state, action) => {
        state.loading = false
        state.currentKB = action.payload.kb
        state.stats = action.payload.stats
        state.currentFolderId = action.payload.folderId
        
        // Ensure folders is an array
        const folders = Array.isArray(action.payload.folders) ? action.payload.folders : []
        
        // Filter folders based on current location
        // Show only folders that belong to current parent
        if (action.payload.folderId === null) {
          // Root level - show folders without parent
          state.folders = folders.filter(f => !f.parentId && !f.parentFolderId)
        } else {
          // Inside a folder - show folders with this parent
          state.folders = folders.filter(
            f => f.parentId === action.payload.folderId || f.parentFolderId === action.payload.folderId
          )
        }
        
        // Ensure documents is an array
        state.documents = Array.isArray(action.payload.documents) ? action.payload.documents : []
      })
      .addCase(loadKnowledgeBase.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load knowledge base'
      })
    
    // Refresh Data
    builder
      .addCase(refreshData.fulfilled, (state, action) => {
        state.stats = action.payload.stats
        
        // Ensure folders is an array
        const folders = Array.isArray(action.payload.folders) ? action.payload.folders : []
        
        // Filter folders based on current location
        if (state.currentFolderId === null) {
          // Root level - show folders without parent
          state.folders = folders.filter(f => !f.parentId && !f.parentFolderId)
        } else {
          // Inside a folder - show folders with this parent
          state.folders = folders.filter(
            f => f.parentId === state.currentFolderId || f.parentFolderId === state.currentFolderId
          )
        }
        
        // Ensure documents is an array
        state.documents = Array.isArray(action.payload.documents) ? action.payload.documents : []
      })
    
    // Create Folder
    builder
      .addCase(createFolder.pending, (state) => {
        state.loading = true
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.loading = false
        state.folders.push(action.payload)
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create folder'
      })
    
    // Create Document
    builder
      .addCase(createDocument.pending, (state) => {
        state.loading = true
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading = false
        state.documents.push(action.payload)
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create document'
      })
    
    // Upload Document
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false
        // Add uploaded document to state
        state.documents.push(action.payload)
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploading = false
        state.error = action.error.message || 'Failed to upload document'
      })
    
    // Update Folder
    builder
      .addCase(updateFolder.fulfilled, (state, action) => {
        const index = state.folders.findIndex(f => f.id === action.payload.id)
        if (index !== -1) {
          state.folders[index] = action.payload
        }
      })
    
    // Update Document
    builder
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(d => d.id === action.payload.id)
        if (index !== -1) {
          state.documents[index] = action.payload
        }
      })
    
    // Remove Folder
    builder
      .addCase(removeFolder.pending, (state) => {
        state.loading = true
      })
      .addCase(removeFolder.fulfilled, (state, action) => {
        state.loading = false
        state.folders = state.folders.filter(f => f.id !== action.payload)
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload)
      })
      .addCase(removeFolder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete folder'
      })
    
    // Remove Document
    builder
      .addCase(removeDocument.pending, (state) => {
        state.loading = true
      })
      .addCase(removeDocument.fulfilled, (state, action) => {
        state.loading = false
        state.documents = state.documents.filter(d => d.id !== action.payload)
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload)
      })
      .addCase(removeDocument.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete document'
      })
  },
})

// Actions
export const {
  setCurrentFolder,
  navigateToFolder,
  navigateToBreadcrumb,
  setViewMode,
  setSearchQuery,
  toggleSelection,
  toggleSelectAll,
  clearSelection,
  setDraggedItem,
  setDragOverFolder,
  setAutoRefreshing,
  resetState,
} = knowledgeBaseSlice.actions

// Selectors
export const selectCurrentKB = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.currentKB
export const selectStats = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.stats
export const selectFolders = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.folders
export const selectDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.documents
export const selectLoading = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.loading
export const selectAutoRefreshing = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.autoRefreshing
export const selectViewMode = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.viewMode
export const selectSearchQuery = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.searchQuery
export const selectSelectedIds = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.selectedIds
export const selectBreadcrumbs = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.breadcrumbs
export const selectCurrentFolderId = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.currentFolderId
export const selectDraggedItem = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.draggedItem
export const selectDragOverFolder = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.dragOverFolder

// Filtered selectors
export const selectFilteredFolders = (state: { knowledgeBase: KnowledgeBaseState }) => {
  const { folders, searchQuery } = state.knowledgeBase
  if (!searchQuery) return folders
  return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
}

export const selectFilteredDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => {
  const { documents, searchQuery } = state.knowledgeBase
  if (!searchQuery) return documents
  return documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
}

export const selectHasProcessingDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => {
  return state.knowledgeBase.documents.some(doc => doc.processingStatus === 'processing')
}

export default knowledgeBaseSlice.reducer
