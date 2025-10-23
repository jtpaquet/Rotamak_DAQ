# Graph Plotting Feature - Implementation Summary

## Overview

The Data Visualization tab automatically fetches graph data from backend API endpoints when clicked, and displays interactive Plotly.js graphs. A "Plot Graphs" button is also available for manual refresh.

## What Was Added

### 1. Interactive Graph Plotting

**Location**: `/components/DataVisualizationTab.tsx`

**Features**:
- ✅ **Auto-fetch on tab activation**: Graphs automatically load when Data tab is clicked (first time)
- ✅ "Plot Graphs" button for manual refresh/reload
- ✅ Loading state with animated spinner
- ✅ Error handling with user-friendly messages
- ✅ Fetches data from `/api/graph-json/1` through `/api/graph-json/N`
- ✅ Displays graphs using react-plotly.js
- ✅ Automatic dark/light theme adaptation
- ✅ Responsive graph sizing

### 2. User Interface

**Auto-Load Behavior**:
- Graphs automatically load when you first click on the Data tab
- Subsequent clicks on the Data tab don't reload (use "Plot Graphs" button to refresh)
- Loading indicator shows during initial fetch

**Button Features**:
- Icon: BarChart3 from lucide-react
- Purpose: Manual refresh/reload of graph data
- Loading state: Shows spinner and "Loading Graphs..." text
- Disabled during loading to prevent multiple requests

**Graph Display**:
- Before loading: Shows placeholder text "Click 'Plot Graphs' to load data"
- During loading: Shows loading indicator
- After loading: Shows interactive Plotly.js graph
- On error: Shows error graph with error message in title

### 3. Interactive Graph Features

All graphs include:
- **Zoom**: Click and drag to zoom into a region
- **Pan**: Shift + click and drag to pan
- **Reset**: Double-click to reset view to original
- **Hover**: Hover over data points to see exact values
- **Legend**: Click legend items to show/hide traces
- **Download**: Click camera icon in toolbar to download as PNG
- **Auto-resize**: Graphs automatically resize to fit container

## API Specification

### Endpoint Pattern

```
GET /api/graph-json/<graphId>
```

**Parameters**:
- `graphId`: Integer from 1 to N (where N is the configured number of graphs)

**Example URLs**:
- `/api/graph-json/1`
- `/api/graph-json/2`
- `/api/graph-json/16`

### Response Format

```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4],
      "y": [0, 1, 4, 9, 16],
      "type": "scatter",
      "mode": "lines",
      "name": "Series 1",
      "line": {
        "color": "#3b82f6",
        "width": 2
      }
    }
  ],
  "layout": {
    "title": "Graph 1: Sample Data",
    "xaxis": {
      "title": "X Axis Label"
    },
    "yaxis": {
      "title": "Y Axis Label"
    }
  }
}
```

### Data Structure

**Root Object**:
- `data`: Array of trace objects (lines/curves on the graph)
- `layout`: Layout configuration object

**Trace Object** (in `data` array):
- `x`: Array of x-axis values
- `y`: Array of y-axis values
- `type`: Plot type (e.g., "scatter", "bar", "line")
- `mode`: Display mode (e.g., "lines", "markers", "lines+markers")
- `name`: Name for legend
- `line`: Line styling object
  - `color`: Line color (hex, rgb, or name)
  - `width`: Line width in pixels
- `marker`: Marker styling object (optional)

**Layout Object**:
- `title`: Graph title string
- `xaxis`: X-axis configuration
  - `title`: X-axis label
- `yaxis`: Y-axis configuration
  - `title`: Y-axis label

## Implementation Details

### State Management

```typescript
const [graphData, setGraphData] = useState<{ [key: number]: GraphData }>({});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Data Fetching Flow

**Automatic (on tab click)**:
1. User clicks on Data tab
2. `useEffect` detects tab is active (first time only)
3. Automatically triggers `fetchGraphData()`
4. Graphs load without user interaction

**Manual (via button)**:
1. User clicks "Plot Graphs" button
2. `fetchGraphData()` is called
3. Refreshes all graph data

**Fetch Process**:
1. `setLoading(true)` to show loading state
2. Fetch data from all graph endpoints in parallel using `Promise.all()`
3. Store successfully fetched data in `graphData` state
4. If a graph fails to load, create an error placeholder graph
5. `setLoading(false)` to hide loading state
6. Graphs are rendered with the fetched data

### Error Handling

- **Network errors**: Caught and logged to console
- **Invalid responses**: Creates placeholder error graph
- **Individual graph failures**: Don't prevent other graphs from loading
- **User feedback**: Error message displayed at top of page

### Theme Integration

Graphs automatically use CSS variables for colors:
- Background: Transparent (inherits from card)
- Text: `var(--color-foreground)`
- Grid lines: `var(--color-border)`

This ensures graphs look correct in both light and dark modes.

## Usage Example

### Frontend (User Interaction)

**First Time**:
1. Click on "Data" tab
2. Graphs automatically start loading (loading indicator shows)
3. Wait for graphs to load
4. Interact with loaded graphs

**Manual Refresh**:
1. Click "Plot Graphs" button to reload data
2. Wait for graphs to refresh
3. Continue interacting with updated graphs

**Graph Interactions**:
- Zoom into regions of interest
- Hover to see exact values
- Pan to explore data
- Download graphs as needed

### Backend (Example Response)

```python
from flask import Flask, jsonify
import numpy as np

@app.route('/api/graph-json/<int:graph_id>')
def get_graph_data(graph_id):
    # Generate sample data
    x = np.linspace(0, 100, 100).tolist()
    y = (5 * np.sin(2 * np.pi * np.array(x) / 20)).tolist()
    
    return jsonify({
        "data": [{
            "x": x,
            "y": y,
            "type": "scatter",
            "mode": "lines",
            "name": f"Channel {graph_id}",
            "line": {"color": "#3b82f6", "width": 2}
        }],
        "layout": {
            "title": f"Graph {graph_id}: Voltage vs Time",
            "xaxis": {"title": "Time (ms)"},
            "yaxis": {"title": "Voltage (V)"}
        }
    })
```

## Configuration

The number of graphs is configurable:
- **Setting**: `config.visualization.graphsToDisplay.default`
- **Default**: 16 graphs
- **Adjustable in**: Settings tab
- **Range**: Typically 1-16 graphs

## File Changes

### Modified Files
1. `/components/DataVisualizationTab.tsx`
   - Added graph plotting functionality
   - Integrated react-plotly.js
   - Added state management
   - Added loading and error states

2. `/README.md`
   - Updated DataVisualizationTab section
   - Added API endpoint documentation

3. `/CHANGELOG.md`
   - Added graph plotting feature documentation

### New Files
1. `/docs/GRAPH_API.md`
   - Complete API documentation
   - Response format specification
   - Example data structures
   - Plotly.js features guide

2. `/docs/BACKEND_EXAMPLE.md`
   - Flask implementation example
   - Express.js implementation example
   - Testing examples
   - Production considerations

3. `/docs/GRAPH_PLOTTING_SUMMARY.md`
   - This file

## Dependencies

### Added Package
- `react-plotly.js`: For rendering interactive graphs

**Import statement**:
```typescript
import Plot from 'react-plotly.js';
```

**Note**: plotly.js is included as a peer dependency of react-plotly.js

## Testing

### Manual Testing Steps

1. ✅ Click "Plot Graphs" button
2. ✅ Verify loading state appears
3. ✅ Verify graphs load and display correctly
4. ✅ Test zoom functionality
5. ✅ Test pan functionality
6. ✅ Test hover to see values
7. ✅ Test legend toggle
8. ✅ Test download functionality
9. ✅ Test in dark mode
10. ✅ Test in light mode
11. ✅ Test error handling (invalid endpoint)
12. ✅ Test with different numbers of graphs (via Settings)

### Backend Testing

Use the provided examples in `/docs/BACKEND_EXAMPLE.md` to:
1. Set up a test backend server
2. Test graph data endpoints
3. Verify response format
4. Test error conditions

## Future Enhancements

Potential additions:
- Real-time graph updates (WebSocket connection)
- Graph export in multiple formats
- Custom date range selection
- Graph type selection (line, bar, scatter, etc.)
- Multiple y-axes support
- Annotation tools
- Comparison mode (overlay multiple shots)
- Zoom synchronization across graphs
- Graph templates/presets

## Troubleshooting

### Graphs Not Displaying
- Check browser console for errors
- Verify API endpoints are accessible
- Check network tab for failed requests
- Ensure response format matches specification

### Performance Issues
- Limit data points per graph (< 10,000 recommended)
- Use line mode instead of markers for large datasets
- Consider data decimation for very dense data

### Styling Issues
- Verify CSS variables are defined
- Check dark mode class is applied correctly
- Ensure no conflicting styles

## Documentation Links

- **Complete API Docs**: `/docs/GRAPH_API.md`
- **Backend Examples**: `/docs/BACKEND_EXAMPLE.md`
- **DAQ Control Data**: `/docs/DAQ_CONTROL_DATA.md`
- **Quick Reference**: `/docs/DAQ_DATA_QUICK_REFERENCE.md`

## Support

For questions or issues:
1. Check the documentation files listed above
2. Review the example implementations
3. Check browser console for error messages
4. Verify API endpoints are returning correct format
