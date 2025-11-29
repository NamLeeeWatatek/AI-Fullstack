# WebSocket API - Real-time Collaboration

WebSocket server cho phép real-time collaboration khi edit workflows.

## 🔌 Connection

**Endpoint:** `ws://localhost:8000/flows`

**Frontend Example:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000/flows', {
  withCredentials: true,
});
```

## 📡 Events

### Client → Server

#### 1. Join Flow
Tham gia vào một flow để nhận updates real-time.

```typescript
socket.emit('join-flow', {
  flowId: '123',
  userId: 'user-456'
});

// Response
socket.on('join-flow', (data) => {
  console.log('Active users:', data.activeUsers);
});
```

#### 2. Leave Flow
Rời khỏi flow.

```typescript
socket.emit('leave-flow', {
  flowId: '123',
  userId: 'user-456'
});
```

#### 3. Flow Update
Gửi thay đổi workflow (nodes/edges) đến các users khác.

```typescript
socket.emit('flow-update', {
  flowId: '123',
  userId: 'user-456',
  nodes: [...],
  edges: [...],
  timestamp: Date.now()
});
```

#### 4. Cursor Move
Chia sẻ vị trí cursor với users khác.

```typescript
socket.emit('cursor-move', {
  flowId: '123',
  userId: 'user-456',
  x: 100,
  y: 200
});
```

#### 5. Node Select
Thông báo khi select một node.

```typescript
socket.emit('node-select', {
  flowId: '123',
  userId: 'user-456',
  nodeId: 'node-789'
});
```

### Server → Client

#### 1. User Joined
Khi có user mới join flow.

```typescript
socket.on('user-joined', (data) => {
  console.log('User joined:', data.userId);
  // data: { userId, socketId, timestamp }
});
```

#### 2. User Left
Khi có user rời flow.

```typescript
socket.on('user-left', (data) => {
  console.log('User left:', data.userId);
  // data: { userId, socketId, timestamp }
});
```

#### 3. Flow Updated
Khi flow được update bởi user khác.

```typescript
socket.on('flow-updated', (data) => {
  console.log('Flow updated by:', data.userId);
  // Update local state with data.nodes and data.edges
  // data: { userId, nodes, edges, timestamp }
});
```

#### 4. Cursor Moved
Khi cursor của user khác di chuyển.

```typescript
socket.on('cursor-moved', (data) => {
  // Show cursor at position (data.x, data.y)
  // data: { userId, socketId, x, y, timestamp }
});
```

#### 5. Node Selected
Khi user khác select một node.

```typescript
socket.on('node-selected', (data) => {
  // Highlight node for this user
  // data: { userId, nodeId, timestamp }
});
```

#### 6. Flow Saved
Khi flow được save thành công.

```typescript
socket.on('flow-saved', (data) => {
  console.log('Flow saved:', data.flowId);
  // data: { flowId, data, timestamp }
});
```

#### 7. Execution Events
Khi workflow được execute.

```typescript
// Execution started
socket.on('execution-started', (data) => {
  console.log('Execution started:', data.executionId);
  // data: { flowId, executionId, timestamp }
});

// Execution completed
socket.on('execution-completed', (data) => {
  console.log('Execution completed:', data.result);
  // data: { flowId, executionId, result, timestamp }
});

// Execution error
socket.on('execution-error', (data) => {
  console.error('Execution error:', data.error);
  // data: { flowId, executionId, error, timestamp }
});
```

## 🎯 Usage Example

### Complete Flow Editor Integration

```typescript
import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

function FlowEditor({ flowId, userId }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [cursors, setCursors] = useState<Map<string, {x: number, y: number}>>(new Map());

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:8000/flows', {
      withCredentials: true,
    });

    // Join flow
    newSocket.emit('join-flow', { flowId, userId });
    
    // Listen for active users
    newSocket.on('join-flow', (data) => {
      setActiveUsers(data.activeUsers);
    });

    // Listen for user joined
    newSocket.on('user-joined', (data) => {
      setActiveUsers(prev => [...prev, data.socketId]);
    });

    // Listen for user left
    newSocket.on('user-left', (data) => {
      setActiveUsers(prev => prev.filter(id => id !== data.socketId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
    });

    // Listen for flow updates
    newSocket.on('flow-updated', (data) => {
      // Update nodes and edges
      updateFlow(data.nodes, data.edges);
    });

    // Listen for cursor movements
    newSocket.on('cursor-moved', (data) => {
      setCursors(prev => new Map(prev).set(data.userId, { x: data.x, y: data.y }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-flow', { flowId, userId });
      newSocket.disconnect();
    };
  }, [flowId, userId]);

  // Send flow updates
  const handleFlowChange = (nodes, edges) => {
    if (socket) {
      socket.emit('flow-update', {
        flowId,
        userId,
        nodes,
        edges,
        timestamp: Date.now()
      });
    }
  };

  // Send cursor position
  const handleMouseMove = (e) => {
    if (socket) {
      socket.emit('cursor-move', {
        flowId,
        userId,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  return (
    <div onMouseMove={handleMouseMove}>
      {/* Flow editor UI */}
      <div>Active users: {activeUsers.length}</div>
      {/* Render other users' cursors */}
      {Array.from(cursors.entries()).map(([userId, pos]) => (
        <Cursor key={userId} x={pos.x} y={pos.y} userId={userId} />
      ))}
    </div>
  );
}
```

## 🔐 Authentication

WebSocket hiện tại chưa có authentication. Để thêm JWT auth:

```typescript
// Backend: flows.gateway.ts
import { WsGuard } from './ws.guard';

@UseGuards(WsGuard)
@WebSocketGateway(...)
export class FlowsGateway { ... }

// Frontend: Connect with token
const socket = io('http://localhost:8000/flows', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## 📊 Features

- ✅ Real-time collaboration
- ✅ Multi-user editing
- ✅ Cursor tracking
- ✅ Node selection sync
- ✅ Execution notifications
- ⏳ Conflict resolution (coming soon)
- ⏳ Undo/Redo sync (coming soon)
- ⏳ Comments/Chat (coming soon)
