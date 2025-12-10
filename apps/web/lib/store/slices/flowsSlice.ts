/**
 * Flows Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction, type ActionReducerMapBuilder } from '@reduxjs/toolkit'
import type { Draft } from '@reduxjs/toolkit'
import { flowsApi, type Flow as FlowsApiFlow } from '@/lib/api/flows'
import type { PaginatedResponse, PaginationParams } from '@/lib/types/pagination'

// Use Flow type from flowsApi for consistency
type Flow = FlowsApiFlow

interface FlowsState {
  items: Flow[]
  currentFlow: Flow | null
  loading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  stats?: {
    total_flows: number
    total_published: number
    total_draft: number
    total_archived: number
  }
}

const initialState: FlowsState = {
  items: [],
  currentFlow: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  stats: undefined,
}

export const fetchFlows = createAsyncThunk<
  PaginatedResponse<Flow>,
  Partial<PaginationParams & { status?: string }> | void
>(
  'flows/fetchFlows',
  async (params) => {
    const flows = await flowsApi.getAll()
    console.log('flows from service', flows)
    if (Array.isArray(flows)) {
      return {
        items: flows,
        total: flows.length,
        page: 1,
        page_size: flows.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    }

    return {
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    }
  }
)

export const fetchFlow = createAsyncThunk<Flow, string>(
  'flows/fetchFlow',
  async (id: string) => {
    return await flowsApi.getOne(id)
  }
)

export const createFlow = createAsyncThunk<Flow, Partial<Flow>>(
  'flows/createFlow',
  async (data: Partial<Flow>) => {
    // TODO: Implement create in flowsApi
    throw new Error('createFlow not implemented in flowsApi')
  }
)

export const updateFlow = createAsyncThunk<Flow, { id: string; data: Partial<Flow> }>(
  'flows/updateFlow',
  async ({ id, data }: { id: string; data: Partial<Flow> }) => {
    return await flowsApi.update(id, data)
  }
)

export const deleteFlow = createAsyncThunk<string, string>(
  'flows/deleteFlow',
  async (id: string) => {
    await flowsApi.delete(id)
    return id
  }
)

export const duplicateFlow = createAsyncThunk<Flow, string>(
  'flows/duplicateFlow',
  async (id: string) => {
    // TODO: Implement duplicate in flowsApi
    throw new Error('duplicateFlow not implemented in flowsApi')
  }
)

export const archiveFlow = createAsyncThunk<Flow, string>(
  'flows/archiveFlow',
  async (id: string) => {
    // TODO: Implement archive in flowsApi
    throw new Error('archiveFlow not implemented in flowsApi')
  }
)

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    setCurrentFlow: (state: Draft<FlowsState>, action: PayloadAction<Flow | null>) => {
      state.currentFlow = action.payload
    },
    clearError: (state: Draft<FlowsState>) => {
      state.error = null
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<FlowsState>) => {
    builder
      .addCase(fetchFlows.pending, (state: Draft<FlowsState>) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlows.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<any>) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.page_size
        state.totalPages = action.payload.total_pages
        state.hasNext = action.payload.has_next
        state.hasPrev = action.payload.has_prev
        if (action.payload.stats) {
          state.stats = action.payload.stats
        }
      })
      .addCase(fetchFlows.rejected, (state: Draft<FlowsState>, action: any) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch flows'
      })

    builder.addCase(fetchFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.currentFlow = action.payload
    })

    builder.addCase(createFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.items.push(action.payload)
      state.currentFlow = action.payload
    })

    builder.addCase(updateFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      const index = state.items.findIndex((f: Flow) => f.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
      if (state.currentFlow?.id === action.payload.id) {
        state.currentFlow = action.payload
      }
    })

    builder.addCase(deleteFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<string>) => {
      state.items = state.items.filter((f: Flow) => f.id !== action.payload)
      if (state.currentFlow?.id === action.payload) {
        state.currentFlow = null
      }
    })

    builder.addCase(duplicateFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.items.push(action.payload)
    })

    builder.addCase(archiveFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      const index = state.items.findIndex((f: Flow) => f.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    })
  },
})

export const { setCurrentFlow, clearError } = flowsSlice.actions
export default flowsSlice.reducer

