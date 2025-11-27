# Flow Data Field - Backend vs Frontend

## ⚠️ QUAN TRỌNG: Field Name Mismatch

Backend model sử dụng field `data` nhưng một số code cũ có thể dùng `flow_data`. 

### Backend Model (SQLModel)

```python
class Flow(FlowBase, table=True):
    # ...
    data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
```

**Field name:** `data`

### Frontend Usage

Khi gửi/nhận data từ API:

```typescript
// ✅ ĐÚNG - Dùng 'data'
const flowData = {
    name: 'My Flow',
    description: 'Description',
    channel_id: 1,
    data: {  // ← Đúng field name
        nodes: [...],
        edges: [...]
    }
}

// ❌ SAI - Không dùng 'flow_data'
const flowData = {
    name: 'My Flow',
    flow_data: {  // ← Sai! Backend không nhận field này
        nodes: [...],
        edges: [...]
    }
}
```

### Khi Load Flow từ API

```typescript
// Load flow
const flow = await axiosInstance.get(`/flows/${id}`)

// ✅ ĐÚNG - Đọc từ 'data'
const nodes = flow.data?.nodes || []
const edges = flow.data?.edges || []

// ❌ SAI - Đọc từ 'flow_data'
const nodes = flow.flow_data?.nodes || []  // undefined!
```

### Khi Save Flow

```typescript
// ✅ ĐÚNG
await axiosInstance.post('/flows/', {
    name: workflowName,
    description: description,
    channel_id: channelId,
    data: {  // ← Đúng
        nodes: nodes,
        edges: edges
    }
})

// ❌ SAI
await axiosInstance.post('/flows/', {
    name: workflowName,
    flow_data: {  // ← Sai! Backend sẽ ignore field này
        nodes: nodes,
        edges: edges
    }
})
```

## Backward Compatibility

Để support code cũ, có thể dùng fallback:

```typescript
// Safe way - check both fields
const flowData = flow.data || flow.flow_data || {}
const nodes = flowData.nodes || []
const edges = flowData.edges || []
```

## Migration Note

Nếu database có data cũ với field `flow_data`, cần migration:

```sql
-- Nếu cần migrate từ flow_data sang data
UPDATE flows 
SET data = flow_data 
WHERE data IS NULL OR data = '{}';
```

## Checklist

Khi làm việc với Flow data:

- [ ] Luôn dùng field `data` khi gửi lên backend
- [ ] Luôn đọc từ field `data` khi nhận từ backend
- [ ] Không dùng `flow_data` (deprecated)
- [ ] Test save và load để đảm bảo data không bị mất
