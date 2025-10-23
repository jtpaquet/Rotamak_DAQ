# Graph API Documentation

## Overview

The Data Visualization tab fetches graph data from the backend API and displays it using Plotly.js. Each graph is fetched individually from its own endpoint.

## API Endpoints

### GET /api/graph-json/<graphId>

Fetches JSON data for a specific graph.

**Parameters:**
- `graphId`: Graph number (1-16, or up to the configured number of graphs)

**Example Endpoints:**
- `/api/graph-json/1` - Graph 1 data
- `/api/graph-json/2` - Graph 2 data
- `/api/graph-json/16` - Graph 16 data

## Expected Response Format

The API should return a JSON object with Plotly.js-compatible structure:

```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4, 5],
      "y": [0, 1, 4, 9, 16, 25],
      "type": "scatter",
      "mode": "lines+markers",
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
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Voltage (V)"
    }
  }
}
```

## Data Structure

### Root Object

```typescript
interface GraphData {
  data: PlotlyData[];
  layout: PlotlyLayout;
}
```

### PlotlyData (Trace)

Each element in the `data` array represents a trace (line/curve) on the graph.

```typescript
interface PlotlyData {
  x?: number[];           // X-axis values
  y?: number[];           // Y-axis values
  type?: string;          // Plot type: 'scatter', 'bar', 'line', etc.
  mode?: string;          // For scatter: 'lines', 'markers', 'lines+markers'
  name?: string;          // Legend name for this trace
  line?: {
    color?: string;       // Line color (hex, rgb, or color name)
    width?: number;       // Line width
    dash?: string;        // Line style: 'solid', 'dot', 'dash'
  };
  marker?: {
    color?: string;       // Marker color
    size?: number;        // Marker size
  };
}
```

### PlotlyLayout

Layout configuration for the graph.

```typescript
interface PlotlyLayout {
  title?: string;         // Graph title
  xaxis?: {
    title?: string;       // X-axis label
    range?: [number, number];  // X-axis range [min, max]
  };
  yaxis?: {
    title?: string;       // Y-axis label
    range?: [number, number];  // Y-axis range [min, max]
  };
  showlegend?: boolean;   // Show/hide legend
  width?: number;         // Graph width (optional, defaults to responsive)
  height?: number;        // Graph height (optional, defaults to 300px)
}
```

## Common Plot Types

### 1. Line Plot (Scatter with lines)

```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4],
      "y": [0, 2, 4, 6, 8],
      "type": "scatter",
      "mode": "lines",
      "name": "Linear",
      "line": { "color": "#3b82f6" }
    }
  ],
  "layout": {
    "title": "Linear Function",
    "xaxis": { "title": "X" },
    "yaxis": { "title": "Y" }
  }
}
```

### 2. Scatter Plot with Markers

```json
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5],
      "y": [1, 4, 2, 5, 3],
      "type": "scatter",
      "mode": "markers",
      "marker": { "size": 10, "color": "#ef4444" }
    }
  ],
  "layout": {
    "title": "Data Points",
    "xaxis": { "title": "Sample" },
    "yaxis": { "title": "Value" }
  }
}
```

### 3. Multiple Traces

```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4],
      "y": [0, 1, 4, 9, 16],
      "type": "scatter",
      "mode": "lines",
      "name": "x²",
      "line": { "color": "#3b82f6" }
    },
    {
      "x": [0, 1, 2, 3, 4],
      "y": [0, 1, 2, 3, 4],
      "type": "scatter",
      "mode": "lines",
      "name": "x",
      "line": { "color": "#ef4444" }
    }
  ],
  "layout": {
    "title": "Multiple Series",
    "xaxis": { "title": "X" },
    "yaxis": { "title": "Y" }
  }
}
```

## Example Mock Data

Here are some examples you can use for testing:

### Graph 1 - Voltage vs Time
```json
{
  "data": [
    {
      "x": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      "y": [0, 2.5, 5.0, 7.5, 10.0, 7.5, 5.0, 2.5, 0, -2.5, -5.0],
      "type": "scatter",
      "mode": "lines+markers",
      "name": "Channel A",
      "line": { "color": "#3b82f6", "width": 2 }
    }
  ],
  "layout": {
    "title": "Voltage vs Time - Channel A",
    "xaxis": { "title": "Time (ms)" },
    "yaxis": { "title": "Voltage (V)" }
  }
}
```

### Graph 2 - Pressure Over Time
```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [5.0, 5.2, 5.1, 5.3, 5.2, 5.4, 5.3, 5.5, 5.4, 5.6, 5.5],
      "type": "scatter",
      "mode": "lines",
      "name": "Pressure",
      "line": { "color": "#10b981", "width": 2 }
    }
  ],
  "layout": {
    "title": "Chamber Pressure",
    "xaxis": { "title": "Time (s)" },
    "yaxis": { "title": "Pressure (mTorr)" }
  }
}
```

## Frontend Implementation

### Fetching Data

When the user clicks "Plot Graphs", the frontend:

1. Sets loading state to true
2. Fetches data from `/api/graph-json/1` through `/api/graph-json/N` (where N is the configured number of graphs)
3. Stores the data in component state
4. Renders the graphs using Plotly.js

### Error Handling

If a graph fails to load:
- A placeholder error graph is displayed
- The error is logged to the console
- Other graphs continue to load normally

### Example Fetch Code

```typescript
const graphId = 1;
const response = await fetch(`/api/graph-json/${graphId}`);
const data = await response.json();

// data should have structure:
// {
//   data: [...],
//   layout: {...}
// }
```

## Plotly.js Features

The graphs support all standard Plotly.js interactions:

- **Zoom**: Click and drag to zoom
- **Pan**: Shift + drag to pan
- **Reset**: Double-click to reset view
- **Hover**: Hover over points to see values
- **Legend**: Click legend items to show/hide traces
- **Download**: Click camera icon to download as PNG

## Styling

The graphs automatically adapt to the application's dark/light theme:
- Background is transparent
- Text color uses CSS variables
- Grid lines use border color from theme

## Configuration

The number of graphs displayed is configurable in the Settings tab:
- Default: 16 graphs
- Can be adjusted via `config.visualization.graphsToDisplay.default`

## Backend Implementation Example

Here's a simple Python Flask example:

```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/graph-json/<int:graph_id>')
def get_graph_data(graph_id):
    # Generate or retrieve graph data
    data = {
        "data": [
            {
                "x": list(range(0, 100)),
                "y": [i ** 2 for i in range(0, 100)],
                "type": "scatter",
                "mode": "lines",
                "name": f"Graph {graph_id}",
                "line": {"color": "#3b82f6", "width": 2}
            }
        ],
        "layout": {
            "title": f"Graph {graph_id}: Sample Data",
            "xaxis": {"title": "X Axis"},
            "yaxis": {"title": "Y Axis"}
        }
    }
    return jsonify(data)
```

## Troubleshooting

### Graph Not Displaying
- Check browser console for errors
- Verify API endpoint is returning valid JSON
- Ensure `data` array is not empty
- Check that `x` and `y` arrays have the same length

### Styling Issues
- Ensure colors are valid CSS colors
- Check that layout properties are correctly named
- Verify no conflicting CSS is applied

### Performance Issues
- Limit number of points per trace (< 10,000 recommended)
- Use `mode: 'lines'` instead of `'markers'` for large datasets
- Consider data decimation for very large datasets

## Additional Resources

- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Plot Types Reference](https://plotly.com/javascript/basic-charts/)
- [Layout Options](https://plotly.com/javascript/reference/layout/)
