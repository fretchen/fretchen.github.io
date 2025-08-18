# Leaf History Feature Design

## Overview
Foldable sidebar to display LLM request history with status tracking (pending/processed).

## UI Design: Foldable Sidebar

### Layout States
```
Collapsed (Default):                 Expanded (On Click):
┌─────────────────────┬─┐           ┌─────────────────┬──────────────────┐
│ Chat Interface      │📊│           │ Chat Interface  │ 📊 Request History│
│                     │ │           │                 │ ┌──────────────┐  │
│ User: Hi            │ │           │ User: Hi        │ │✓ Just now    │  │
│ AI: Hello!          │ │           │ AI: Hello!      │ │  0.001 ETH   │  │
│                     │ │           │                 │ │  Tree #2     │  │
│ [Input field...]    │ │           │ [Input field]   │ └──────────────┘  │
└─────────────────────┴─┘           │                 │ [View All...]    │
                                    └─────────────────┴──────────────────┘
```

### Sidebar Content Structure
```
┌──────────────────┐
│ 📊 History       ✕│
├──────────────────┤
│ [🔄] Auto-refresh │
├──────────────────┤
│ Recent (Last 10): │
│                  │
│ ✅ 14:30         │ <- Status + time
│ "What is..."     │ <- Truncated prompt
│ 0.001 ETH        │ <- Cost
│ Tree 2, Leaf 3   │ <- Technical details
│ ───────────────  │
│ ⏳ 14:25         │
│ "How does..."    │
│ 0.002 ETH        │
│ Tree 3, Leaf 0   │
│ ───────────────  │
│ [View Full History]│
└──────────────────┘
```

## Backend: New Scaleway Function

### Function: `leaf_history.js`
```javascript
export async function handle(event, context) {
  const method = event.httpMethod;
  const query = event.queryStringParameters || {};
  
  switch (method) {
    case 'GET': return getLeafHistory(query);
    case 'OPTIONS': return corsResponse();
    default: return methodNotAllowed();
  }
}
```

### API Endpoints
```
GET /api/leaf-history?address=0x123...&limit=5
GET /api/leaf-history?address=0x123...&status=pending
GET /api/leaf-history/stats?address=0x123...
```

### Response Format
```json
{
  "leaves": [
    {
      "id": 3,
      "treeIndex": 2,
      "timestamp": "2025-08-18T14:30:00Z",
      "promptPreview": "What is blockchain technology?",
      "cost": "1000000000000000",
      "status": "processed",
      "transactionHash": "0x456...",
      "tokenCount": 150
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalRequests": 25,
    "totalSpent": "25000000000000000",
    "pendingRequests": 2
  }
}
```

## Frontend Implementation

### State Management
```javascript
const [sidebarOpen, setSidebarOpen] = useState(false);
const [leafHistory, setLeafHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [autoRefresh, setAutoRefresh] = useState(false);
```

### Component Structure
```
+Page.tsx
├── ChatInterface (main area)
├── SidebarToggle (always visible)
└── LeafHistorySidebar (conditional)
    ├── HistoryHeader
    ├── RefreshToggle
    ├── LeafList
    │   └── LeafItem (repeated)
    └── ViewAllLink
```

### CSS Animation
```css
.sidebar {
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  width: 300px;
}
.sidebar.open {
  transform: translateX(0);
}
.chat-area.sidebar-open {
  margin-right: 300px;
}
```

### Data Fetching Strategy
- **On Sidebar Open**: Fetch recent 10 leaves
- **Auto-refresh**: Poll every 30s if enabled
- **After Message**: Trigger refresh for new leaf
- **Caching**: 5-minute cache to avoid excessive API calls

## Enhanced Data Structure

### Extended Leaf Format
```javascript
{
  id: 0,
  user: "0x...",
  serviceProvider: "0x...",
  tokenCount: 150,
  cost: BigInt("1000000000000000"),
  timestamp: "2025-08-18T14:30:00Z",
  
  // New fields for history
  promptPreview: "What is blockchain technology?", // First 50 chars
  responsePreview: "Blockchain is a distributed...", // First 50 chars
  model: "meta-llama/Llama-3.3-70B-Instruct",
  
  // Status tracking
  treeIndex: 2,
  status: "processed", // "pending" | "processed" | "failed"
  transactionHash: "0x123...", // If available
  processedAt: "2025-08-18T15:00:00Z"
}
```

## Deployment Strategy

### 1. Serverless.yml Update
```yaml
functions:
  llm:
    handler: sc_llm.handle
  leaf-history:
    handler: leaf_history.handle
    timeout: 15s
    memoryLimit: 256
```

### 2. Implementation Steps
1. Deploy leaf-history function
2. Add toggle button (non-functional first)
3. Implement basic sidebar with mock data
4. Connect to real API
5. Add auto-refresh and advanced features

### 3. Integration Points
```javascript
// After successful sendMessage():
if (sidebarOpen || autoRefresh) {
  await fetchLeafHistory();
}

// Toggle function:
const toggleSidebar = () => {
  setSidebarOpen(!sidebarOpen);
  if (!sidebarOpen) {
    fetchLeafHistory();
  }
};
```

## Responsive Design
- **Desktop**: Sidebar slides from right, pushes chat area
- **Mobile**: Overlay mode, covers part of chat
- **Tablet**: Hybrid approach based on screen width

## Features
- ✅ Non-intrusive default state
- ✅ On-demand loading
- ✅ Real-time updates option
- ✅ Status indicators (✅ processed, ⏳ pending)
- ✅ Cost tracking
- ✅ Tree/Leaf technical details
- ✅ Pagination support
- ✅ Mobile responsive
