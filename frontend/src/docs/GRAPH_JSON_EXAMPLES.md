# Graph JSON Examples

This document provides ready-to-use JSON examples for the graph API endpoints.

## Example 1: Simple Line Plot

**Endpoint**: `/api/graph-json/1`

```json
{
  "data": [
    {
      "x": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      "y": [0, 2.5, 5.0, 7.5, 10.0, 7.5, 5.0, 2.5, 0, -2.5, -5.0],
      "type": "scatter",
      "mode": "lines",
      "name": "Voltage",
      "line": {
        "color": "#3b82f6",
        "width": 2
      }
    }
  ],
  "layout": {
    "title": "Voltage vs Time",
    "xaxis": {
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Voltage (V)"
    }
  }
}
```

## Example 2: Scatter Plot with Markers

**Endpoint**: `/api/graph-json/2`

```json
{
  "data": [
    {
      "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [5.1, 5.3, 5.2, 5.4, 5.5, 5.3, 5.6, 5.4, 5.7, 5.5],
      "type": "scatter",
      "mode": "markers",
      "name": "Pressure",
      "marker": {
        "size": 8,
        "color": "#10b981",
        "symbol": "circle"
      }
    }
  ],
  "layout": {
    "title": "Chamber Pressure",
    "xaxis": {
      "title": "Sample Number"
    },
    "yaxis": {
      "title": "Pressure (mTorr)"
    }
  }
}
```

## Example 3: Line Plot with Markers

**Endpoint**: `/api/graph-json/3`

```json
{
  "data": [
    {
      "x": [0, 20, 40, 60, 80, 100],
      "y": [12.5, 12.3, 12.1, 11.9, 11.7, 11.5],
      "type": "scatter",
      "mode": "lines+markers",
      "name": "Battery Voltage",
      "line": {
        "color": "#f59e0b",
        "width": 2
      },
      "marker": {
        "size": 6,
        "color": "#f59e0b"
      }
    }
  ],
  "layout": {
    "title": "Battery Voltage Over Time",
    "xaxis": {
      "title": "Time (s)"
    },
    "yaxis": {
      "title": "Voltage (V)"
    }
  }
}
```

## Example 4: Multiple Traces (Dual Channel)

**Endpoint**: `/api/graph-json/4`

```json
{
  "data": [
    {
      "x": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      "y": [0, 3.1, 5.9, 8.1, 9.5, 9.5, 8.1, 5.9, 3.1, 0, -3.1],
      "type": "scatter",
      "mode": "lines",
      "name": "Channel A",
      "line": {
        "color": "#3b82f6",
        "width": 2
      }
    },
    {
      "x": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      "y": [5.0, 4.5, 3.1, 1.0, -1.0, -3.1, -4.5, -5.0, -4.5, -3.1, -1.0],
      "type": "scatter",
      "mode": "lines",
      "name": "Channel B",
      "line": {
        "color": "#ef4444",
        "width": 2
      }
    }
  ],
  "layout": {
    "title": "Dual Channel Measurement",
    "xaxis": {
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Voltage (V)"
    }
  }
}
```

## Example 5: Exponential Decay

**Endpoint**: `/api/graph-json/5`

```json
{
  "data": [
    {
      "x": [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      "y": [10.0, 8.2, 6.7, 5.5, 4.5, 3.7, 3.0, 2.5, 2.0, 1.7, 1.4],
      "type": "scatter",
      "mode": "lines",
      "name": "Signal Decay",
      "line": {
        "color": "#8b5cf6",
        "width": 2
      }
    }
  ],
  "layout": {
    "title": "Signal Decay",
    "xaxis": {
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Amplitude"
    }
  }
}
```

## Example 6: Noisy Signal

**Endpoint**: `/api/graph-json/6`

```json
{
  "data": [
    {
      "x": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "y": [5.1, 4.9, 5.2, 5.0, 4.8, 5.1, 5.3, 4.9, 5.0, 5.2, 4.8],
      "type": "scatter",
      "mode": "lines",
      "name": "Noisy Measurement",
      "line": {
        "color": "#06b6d4",
        "width": 1.5
      }
    }
  ],
  "layout": {
    "title": "Pressure with Noise",
    "xaxis": {
      "title": "Time (s)"
    },
    "yaxis": {
      "title": "Pressure (mTorr)"
    }
  }
}
```

## Example 7: Step Response

**Endpoint**: `/api/graph-json/7`

```json
{
  "data": [
    {
      "x": [0, 10, 10, 20, 20, 30, 30, 40, 40, 50],
      "y": [0, 0, 5, 5, 0, 0, 7, 7, 0, 0],
      "type": "scatter",
      "mode": "lines",
      "name": "Control Signal",
      "line": {
        "color": "#ec4899",
        "width": 2,
        "shape": "hv"
      }
    }
  ],
  "layout": {
    "title": "Control Signal",
    "xaxis": {
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Voltage (V)"
    }
  }
}
```

## Example 8: Three Traces with Different Styles

**Endpoint**: `/api/graph-json/8`

```json
{
  "data": [
    {
      "x": [0, 10, 20, 30, 40, 50],
      "y": [0, 2, 4, 6, 8, 10],
      "type": "scatter",
      "mode": "lines",
      "name": "Linear",
      "line": {
        "color": "#3b82f6",
        "width": 2,
        "dash": "solid"
      }
    },
    {
      "x": [0, 10, 20, 30, 40, 50],
      "y": [0, 1, 4, 9, 16, 25],
      "type": "scatter",
      "mode": "lines",
      "name": "Quadratic",
      "line": {
        "color": "#10b981",
        "width": 2,
        "dash": "dash"
      }
    },
    {
      "x": [0, 10, 20, 30, 40, 50],
      "y": [1, 2, 4, 8, 16, 32],
      "type": "scatter",
      "mode": "lines",
      "name": "Exponential",
      "line": {
        "color": "#f59e0b",
        "width": 2,
        "dash": "dot"
      }
    }
  ],
  "layout": {
    "title": "Multiple Functions",
    "xaxis": {
      "title": "X"
    },
    "yaxis": {
      "title": "Y"
    }
  }
}
```

## Example 9: Bar Chart

**Endpoint**: `/api/graph-json/9`

```json
{
  "data": [
    {
      "x": ["Argon", "Helium", "Hydrogen", "Nitrogen", "Oxygen"],
      "y": [5.2, 3.8, 2.1, 4.5, 3.2],
      "type": "bar",
      "name": "Average Pressure",
      "marker": {
        "color": "#3b82f6"
      }
    }
  ],
  "layout": {
    "title": "Average Pressure by Gas",
    "xaxis": {
      "title": "Gas Type"
    },
    "yaxis": {
      "title": "Pressure (mTorr)"
    }
  }
}
```

## Example 10: Sinusoidal Wave

**Endpoint**: `/api/graph-json/10`

```json
{
  "data": [
    {
      "x": [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
      "y": [0, 2.9, 4.8, 5.0, 2.9, 0, -2.9, -4.8, -5.0, -2.9, 0, 2.9, 4.8, 5.0, 2.9, 0, -2.9, -4.8, -5.0, -2.9, 0],
      "type": "scatter",
      "mode": "lines",
      "name": "RMF Signal",
      "line": {
        "color": "#8b5cf6",
        "width": 2.5
      }
    }
  ],
  "layout": {
    "title": "RMF Signal Waveform",
    "xaxis": {
      "title": "Time (ms)"
    },
    "yaxis": {
      "title": "Amplitude (V)"
    }
  }
}
```

## Example 11-16: Generic Templates

For graphs 11-16, use similar patterns with different data:

```json
{
  "data": [
    {
      "x": [/* array of x values */],
      "y": [/* array of y values */],
      "type": "scatter",
      "mode": "lines",
      "name": "Graph N",
      "line": {
        "color": "#3b82f6",
        "width": 2
      }
    }
  ],
  "layout": {
    "title": "Graph N: Description",
    "xaxis": {
      "title": "X Axis Label"
    },
    "yaxis": {
      "title": "Y Axis Label"
    }
  }
}
```

## Color Palette

Suggested colors for different graphs:

- Graph 1: `#3b82f6` (Blue)
- Graph 2: `#10b981` (Green)
- Graph 3: `#f59e0b` (Amber)
- Graph 4: `#ef4444` (Red)
- Graph 5: `#8b5cf6` (Purple)
- Graph 6: `#06b6d4` (Cyan)
- Graph 7: `#ec4899` (Pink)
- Graph 8: `#f97316` (Orange)
- Graph 9: `#14b8a6` (Teal)
- Graph 10: `#a855f7` (Violet)
- Graph 11: `#84cc16` (Lime)
- Graph 12: `#0ea5e9` (Sky)
- Graph 13: `#f43f5e` (Rose)
- Graph 14: `#eab308` (Yellow)
- Graph 15: `#22c55e` (Emerald)
- Graph 16: `#6366f1` (Indigo)

## Error Response Example

When an error occurs, return a valid graph structure with error information:

```json
{
  "data": [
    {
      "x": [0, 1],
      "y": [0, 0],
      "type": "scatter",
      "mode": "lines",
      "name": "No Data"
    }
  ],
  "layout": {
    "title": "Graph N - Error: Data not available",
    "xaxis": {
      "title": "X"
    },
    "yaxis": {
      "title": "Y"
    }
  }
}
```

## Testing Your Backend

You can test these examples by:

1. Setting up a simple HTTP server
2. Creating endpoints that return these JSON responses
3. Testing with curl: `curl http://localhost:5000/api/graph-json/1`
4. Verifying the response matches the expected format
5. Testing in the frontend by clicking "Plot Graphs"

## Notes

- All x and y arrays must be the same length
- Use numeric arrays for continuous data
- Use string arrays for categorical x-axis (like in bar charts)
- Colors can be hex (#3b82f6), rgb (rgb(59, 130, 246)), or names (blue)
- Line width is in pixels
- Marker size is in pixels
