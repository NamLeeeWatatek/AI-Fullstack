# Backend Filtering Standard

## Nguyên tắc: TẤT CẢ logic xử lý ở Backend

**QUAN TRỌNG:** Mọi search, filter, sort, và tính toán đều phải được xử lý ở backend. Frontend chỉ gửi params và hiển thị kết quả.

## ❌ KHÔNG BAO GIỜ làm ở Frontend

```typescript
// ❌ WRONG - Filtering on frontend
const filteredFlows = flows.filter(f => f.status === 'published')

// ❌ WRONG - Searching on frontend  
const searchResults = flows.filter(f => 
  f.name.toLowerCase().includes(search.toLowerCase())
)

// ❌ WRONG - Sorting on frontend
const sortedFlows = [...flows].sort((a, b) => 
  a.created_at > b.created_at ? -1 : 1
)

// ❌ WRONG - Calculating stats on frontend
const stats = {
  total: flows.length,
  active: flows.filter(f => f.status === 'published').length
}
```

## ✅ ĐÚNG - Xử lý ở Backend

### Backend (Python/FastAPI)

```python
@router.get("/flows/")
async def list_flows(
    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    
    # Search - Backend xử lý
    search: Optional[str] = Query(None),
    
    # Filter - Backend xử lý
    status: Optional[str] = Query(None),
    channel_id: Optional[int] = Query(None),
    
    # Sort - Backend xử lý
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    
    session: AsyncSession = Depends(get_session)
):
    # Build query
    query = select(Flow)
    
    # Apply search
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Flow.name.ilike(search_filter)) |
            (Flow.description.ilike(search_filter))
        )
    
    # Apply filters
    if status:
        query = query.where(Flow.status == status)
    if channel_id:
        query = query.where(Flow.channel_id == channel_id)
    
    # Apply sorting
    sort_column = getattr(Flow, sort_by, Flow.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await session.execute(query)
    items = result.scalars().all()
    
    # Calculate stats (for ALL items, not just current page)
    stats_query = select(
        func.count(Flow.id).label('total'),
        func.sum(func.case((Flow.status == 'published', 1), else_=0)).label('active'),
        func.sum(func.case((Flow.status == 'draft', 1), else_=0)).label('draft'),
    )
    stats_result = await session.execute(stats_query)
    stats_row = stats_result.first()
    
    # Return paginated response
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "has_next": page < (total + page_size - 1) // page_size,
        "has_prev": page > 1,
        "stats": {
            "total": int(stats_row.total or 0),
            "active": int(stats_row.active or 0),
            "draft": int(stats_row.draft or 0),
        }
    }
```

### Frontend (React/TypeScript)

```typescript
// ✅ CORRECT - Frontend chỉ gửi params
const [statusFilter, setStatusFilter] = useState<string>('all')

useEffect(() => {
  // Gửi tất cả params lên backend
  dispatch(fetchFlows({
    page: pagination.page,
    page_size: pagination.pageSize,
    search: pagination.search,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  }))
}, [pagination.page, pagination.pageSize, pagination.search, statusFilter])

// ✅ CORRECT - Hiển thị kết quả trực tiếp từ backend
const displayFlows = flows // Không filter, không sort

// ✅ CORRECT - Dùng stats từ backend
const stats = backendStats || { total: 0, active: 0, draft: 0 }
```

## Lợi ích

1. **Performance**: Database query nhanh hơn JavaScript filter
2. **Scalability**: Không load toàn bộ data lên frontend
3. **Consistency**: Logic tập trung ở một nơi
4. **Security**: Không expose toàn bộ data cho client
5. **Caching**: Có thể cache ở backend/CDN level

## Checklist

Khi implement feature mới, đảm bảo:

- [ ] Search được xử lý ở backend (SQL LIKE/ILIKE)
- [ ] Filter được xử lý ở backend (SQL WHERE)
- [ ] Sort được xử lý ở backend (SQL ORDER BY)
- [ ] Pagination được xử lý ở backend (SQL OFFSET/LIMIT)
- [ ] Stats được tính ở backend (SQL aggregation)
- [ ] Frontend chỉ gửi params và hiển thị kết quả
- [ ] Không có `.filter()`, `.sort()`, `.map()` logic ở frontend

## Ví dụ thực tế

### Flows List
- ✅ Backend: `/flows/?page=1&page_size=25&status=published&search=test`
- ✅ Frontend: Hiển thị `flows` từ response

### Executions List  
- ✅ Backend: `/executions/?page=1&page_size=10&flow_id=123&status=completed`
- ✅ Frontend: Hiển thị `executions` từ response

### Archives List
- ✅ Backend: `/archives/?page=1&page_size=25&entity_type=flow`
- ✅ Frontend: Hiển thị `archives` từ response

## Ngoại lệ

Chỉ xử lý ở frontend khi:
- UI state (expanded/collapsed, selected items)
- Client-side validation
- Formatting/display logic (date format, currency)
- Animation/transition states

**KHÔNG BAO GIỜ** xử lý business logic, filtering, hoặc data transformation ở frontend.
