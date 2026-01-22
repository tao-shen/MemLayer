# Tacit Knowledge Visualization Frontend

A comprehensive React-based visualization interface for the Agent Tacit Knowledge Platform, providing interactive views of agent tacit knowledge including timeline, graph, list, and statistics views.

## Features

- **Timeline View**: Visualize tacit knowledge chronologically with D3.js
- **Graph View**: Interactive force-directed graph showing tacit knowledge relationships
- **List View**: Efficient virtual scrolling list with sorting and filtering
- **Statistics View**: Comprehensive charts and metrics using Recharts
- **Real-time Updates**: WebSocket integration for live tacit knowledge updates
- **Advanced Filtering**: Filter by type, time range, importance, and search
- **Export Functionality**: Export data as JSON or CSV
- **Responsive Design**: Mobile-friendly with adaptive layouts
- **Keyboard Shortcuts**: Quick navigation and actions
- **Error Handling**: Robust error boundaries and loading states

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **D3.js** - Data visualization
- **Recharts** - Chart library
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **React Window** - Virtual scrolling

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Running instance of the Tacit Knowledge Visualization Service

### Installation

```bash
# Install dependencies
npm install

# or with pnpm
pnpm install
```

### Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_WS_URL=ws://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Basic Usage

```tsx
import { TacitVisualizationDashboard } from '@agent-memory/tacit-visualization';

function App() {
  return (
    <TacitVisualizationDashboard 
      agentId="your-agent-id"
      initialView="timeline"
    />
  );
}
```

### Using Individual Components

```tsx
import { TimelineView, GraphView, ListView, StatisticsView } from '@agent-memory/tacit-visualization';

// Timeline View
<TimelineView
  data={timelineData}
  onTacitClick={(tacit) => console.log(tacit)}
  width={1200}
  height={600}
/>

// Graph View
<GraphView
  data={graphData}
  onNodeClick={(node) => console.log(node)}
  width={1200}
  height={600}
/>

// List View
<ListView
  memories={memories}
  onTacitClick={(tacit) => console.log(tacit)}
  sortBy="timestamp"
  sortOrder="desc"
/>

// Statistics View
<StatisticsView statistics={statistics} />
```

### Using the API Client

```tsx
import { apiClient } from '@agent-memory/tacit-visualization';

// Get visualization data
const data = await apiClient.getVisualizationData(agentId, filters);

// Get timeline data
const timeline = await apiClient.getTimelineData(agentId, filters);

// Get graph data
const graph = await apiClient.getGraphData(agentId, filters, {
  layout: 'force-directed',
  showSimilarityEdges: true,
});

// Get statistics
const stats = await apiClient.getStatistics(agentId, {
  timeGranularity: 'day',
  includeAccessFrequency: true,
});

// Export data
const blob = await apiClient.exportData(agentId, 'json', filters);
```

### Filtering

```tsx
import { TacitFilters } from '@agent-memory/tacit-visualization';

const filters: TacitFilters = {
  types: ['episodic', 'semantic'],
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  importanceRange: {
    min: 5,
    max: 10,
  },
  searchQuery: 'important meeting',
};
```

## Keyboard Shortcuts

- `Ctrl+1` - Switch to Timeline view
- `Ctrl+2` - Switch to Graph view
- `Ctrl+3` - Switch to List view
- `Ctrl+4` - Switch to Statistics view
- `Ctrl+F` - Toggle filters panel
- `Escape` - Close detail panel

## Component API

### TacitVisualizationDashboard

Main dashboard component that includes all views and controls.

**Props:**
- `agentId: string` - The agent ID to visualize memories for
- `initialView?: 'timeline' | 'graph' | 'list' | 'statistics'` - Initial view to display (default: 'timeline')

### TimelineView

Timeline visualization using D3.js.

**Props:**
- `data: TimelineData` - Timeline data including memories and milestones
- `onTacitClick?: (tacit: TimelineTacit) => void` - Callback when tacit knowledge is clicked
- `width?: number` - Width of the visualization (default: 1200)
- `height?: number` - Height of the visualization (default: 600)

### GraphView

Force-directed graph visualization using D3.js.

**Props:**
- `data: TacitGraph` - Graph data including nodes and edges
- `onNodeClick?: (node: GraphNode) => void` - Callback when node is clicked
- `width?: number` - Width of the visualization (default: 1200)
- `height?: number` - Height of the visualization (default: 600)

### ListView

Virtual scrolling list view.

**Props:**
- `memories: AggregatedTacit[]` - Array of memories to display
- `onTacitClick?: (tacit knowledge: AggregatedTacit) => void` - Callback when tacit knowledge is clicked
- `sortBy?: SortField` - Field to sort by (default: 'timestamp')
- `sortOrder?: 'asc' | 'desc'` - Sort order (default: 'desc')
- `height?: number` - Height of the list (default: 600)

### StatisticsView

Statistics and charts view using Recharts.

**Props:**
- `statistics: Statistics` - Statistics data to display

### FilterPanel

Filter controls panel.

**Props:**
- `filters: TacitFilters` - Current filter values
- `onChange: (filters: TacitFilters) => void` - Callback when filters change
- `onReset?: () => void` - Callback when filters are reset

### TacitDetailPanel

Detail panel for viewing individual tacit knowledge information.

**Props:**
- `tacit: AggregatedTacit` - Tacit knowledge to display
- `onClose: () => void` - Callback when panel is closed
- `onNavigateToTacit?: (tacitId: string) => void` - Callback to navigate to related tacit knowledge

## State Management

The application uses Zustand for state management. The main store includes:

```tsx
interface VisualizationState {
  currentView: ViewType;
  selectedTacit: AggregatedTacit | null;
  filters: TacitFilters;
  setCurrentView: (view: ViewType) => void;
  setSelectedTacit: (tacit: AggregatedTacit | null) => void;
  setFilters: (filters: TacitFilters) => void;
  updateFilters: (partial: Partial<TacitFilters>) => void;
  resetFilters: () => void;
}
```

## Real-time Updates

The application supports real-time updates via WebSocket:

```tsx
import { useRealtimeUpdates } from '@agent-memory/tacit-visualization';

// Enable real-time updates
useRealtimeUpdates(agentId, true);
```

## Performance Optimization

- **Virtual Scrolling**: List view uses react-window for efficient rendering of large lists
- **Data Caching**: React Query caches API responses with 5-minute stale time
- **Lazy Loading**: Components are code-split for faster initial load
- **Debounced Search**: Search input is debounced to reduce API calls
- **Canvas Rendering**: Graph view can use Canvas for large graphs (1000+ nodes)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

Please read the main project CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is part of the Agent Tacit Platform. See the main project LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-org/tacit-layer/issues)
- Documentation: [Full Documentation](https://docs.tacit-layer.com)
