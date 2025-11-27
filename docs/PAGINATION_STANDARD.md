# Pagination Standard

## Overview
Standardized pagination system for backend (FastAPI) and frontend (React/Redux).

## Backend Implementation

### 1. Utility (`app/utils/pagination.py`)
```python
from app.utils.pagination import paginate, create_paginated_response

# In your endpoint
items, meta = paginate(query, page=page, page_size=page_size)
return create_paginated_response(items, meta)
```

### 2. Endpoint Pattern
```python
@router.get("/resource/")
def get_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),  # Default varies by resource
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Model)
    
    # Apply filters
    if search:
        query = query.filter(Model.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Model.status == status)
    
    # Apply sorting
    sort_column = getattr(Model, sort_by, Model.created_at)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())
    
    # Paginate
    items, meta = paginate(query, page=page, page_size=page_size)
    
    return create_paginated_response(items, meta)
```

### 3. Response Format
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 25,
  "total_pages": 4,
  "has_next": true,
  "has_prev": false
}
```

## Frontend Implementation

### 1. Redux Slice Pattern
```typescript
// In your slice
export const fetchResources = createAsyncThunk<
  PaginatedResponse<Resource>,
  Partial<PaginationParams> | void
>(
  'resources/fetch',
  async (params) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    // ... add other params
    
    const response: any = await axiosInstance.get(`/resources/?${queryParams}`)
    return response as PaginatedResponse<Resource>
  }
)

// State
interface ResourcesState {
  items: Resource[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Reducer
.addCase(fetchResources.fulfilled, (state, action) => {
  state.items = action.payload.items
  state.total = action.payload.total
  state.page = action.payload.page
  state.pageSize = action.payload.page_size
  state.totalPages = action.payload.total_pages
  state.hasNext = action.payload.has_next
  state.hasPrev = action.payload.has_prev
})
```

### 2. Component Pattern
```typescript
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'

function ResourcesPage() {
  const dispatch = useAppDispatch()
  const { items, total, page, pageSize, totalPages } = useAppSelector(state => state.resources)
  
  // Use pagination hook with custom page size
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 25,  // Customize per resource
    onParamsChange: (params) => {
      dispatch(fetchResources(params))
    }
  })
  
  return (
    <div>
      {/* Your content */}
      
      {/* Pagination UI */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={pagination.handlePageChange}
        onPageSizeChange={pagination.handlePageSizeChange}
      />
    </div>
  )
}
```

## Default Page Sizes by Resource

| Resource | Default | Max | Reason |
|----------|---------|-----|--------|
| Flows | 25 | 100 | Medium-sized list |
| Executions | 10 | 100 | Detailed view, less per page |
| Logs | 50 | 200 | Quick scanning, more per page |
| Bots | 25 | 100 | Standard list |
| Channels | 50 | 100 | Usually small total count |

## Usage Examples

### Backend
```python
# Flows endpoint (page_size=25)
@router.get("/flows/")
def get_flows(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Flow)
    items, meta = paginate(query, page=page, page_size=page_size)
    return create_paginated_response(items, meta)

# Executions endpoint (page_size=10)
@router.get("/executions/")
def get_executions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Execution)
    items, meta = paginate(query, page=page, page_size=page_size)
    return create_paginated_response(items, meta)
```

### Frontend
```typescript
// Flows page (page_size=25)
const pagination = usePagination({
  initialPageSize: 25,
  onParamsChange: (params) => dispatch(fetchFlows(params))
})

// Executions page (page_size=10)
const pagination = usePagination({
  initialPageSize: 10,
  onParamsChange: (params) => dispatch(fetchExecutions(params))
})
```

## Benefits

1. **Consistent API**: All endpoints follow same pattern
2. **Flexible**: Easy to customize page size per resource
3. **Reusable**: One utility for all endpoints
4. **Type-safe**: Full TypeScript support
5. **Performance**: Only load what's needed
6. **Scalable**: Handle thousands of records

## Migration Checklist

### Backend
- [ ] Copy `app/utils/pagination.py`
- [ ] Update each endpoint to use `paginate()`
- [ ] Test pagination with different page sizes
- [ ] Verify response format matches standard

### Frontend
- [ ] Update Redux slice with pagination state
- [ ] Update thunk to accept PaginationParams
- [ ] Use `usePagination` hook in component
- [ ] Add `<Pagination>` UI component
- [ ] Remove client-side filtering/pagination
