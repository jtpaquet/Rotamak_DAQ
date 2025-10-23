# Backend Implementation Example

This document provides example backend implementations for the DAQ Control Dashboard API endpoints.

## Python Flask Example

### Complete Flask Application

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for development

# ============================================================================
# DAQ Control Endpoint
# ============================================================================

@app.route('/api/daq-control', methods=['POST'])
def receive_daq_control():
    """
    Receives complete DAQ control data from the frontend.
    
    Expected data structure:
    {
        "triggers": {
            "enable": {"duration": 100, "delay": 0},
            "dcField": {"duration": 80, "delay": 10},
            "rmfField": {"duration": 60, "delay": 20},
            "extra": {"duration": 0, "delay": 0}
        },
        "raspberryPi": {
            "rmfFreq": 100,
            "dutyCycle1": 25,
            "dutyCycle2": 25
        },
        "fileHandle": {
            "date": "2025-10-09 - 16:09:02",
            "shotNumber": 42,
            "fileName": "experiment",
            "fileAppend": "_001",
            "saveDirectory": "C:/Data/",
            "saveData": true
        },
        "shotInfo": {
            "gas": "argon",
            "pressure": 5.0,
            "rfPower": 100,
            "batteryVoltage": 12.5
        }
    }
    """
    try:
        data = request.get_json()
        
        # Process the control data
        print("Received DAQ Control Data:")
        print(json.dumps(data, indent=2))
        
        # Here you would:
        # 1. Validate the data
        # 2. Configure hardware based on trigger settings
        # 3. Set up Raspberry Pi parameters
        # 4. Prepare file saving settings
        # 5. Record shot information
        
        # Example: Extract and use the data
        triggers = data.get('triggers', {})
        raspberry_pi = data.get('raspberryPi', {})
        file_handle = data.get('fileHandle', {})
        shot_info = data.get('shotInfo', {})
        
        # Configure your DAQ system here
        # configure_triggers(triggers)
        # configure_raspberry_pi(raspberry_pi)
        # setup_file_saving(file_handle)
        # record_shot_info(shot_info)
        
        return jsonify({
            'success': True,
            'message': 'DAQ control data received and processed'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# ============================================================================
# Graph Data Endpoints
# ============================================================================

@app.route('/api/graph-json/<int:graph_id>', methods=['GET'])
def get_graph_data(graph_id):
    """
    Returns Plotly.js-compatible graph data for the specified graph ID.
    
    Args:
        graph_id: Graph number (1-16)
    
    Returns:
        JSON object with 'data' and 'layout' properties
    """
    try:
        # Generate sample data based on graph_id
        # In production, this would fetch actual DAQ data
        
        x_data = np.linspace(0, 100, 100)
        
        # Different data for different graphs
        if graph_id == 1:
            # Sine wave
            y_data = 5 * np.sin(2 * np.pi * x_data / 20)
            title = "Channel A - Voltage"
            y_label = "Voltage (V)"
        elif graph_id == 2:
            # Exponential decay
            y_data = 10 * np.exp(-x_data / 30)
            title = "Signal Decay"
            y_label = "Amplitude"
        elif graph_id == 3:
            # Noisy data
            y_data = 5 + np.random.randn(100) * 0.5
            title = "Pressure Measurement"
            y_label = "Pressure (mTorr)"
        elif graph_id == 4:
            # Multiple traces example
            y_data1 = np.sin(2 * np.pi * x_data / 20)
            y_data2 = np.cos(2 * np.pi * x_data / 20)
            
            graph_data = {
                "data": [
                    {
                        "x": x_data.tolist(),
                        "y": y_data1.tolist(),
                        "type": "scatter",
                        "mode": "lines",
                        "name": "Channel A",
                        "line": {"color": "#3b82f6", "width": 2}
                    },
                    {
                        "x": x_data.tolist(),
                        "y": y_data2.tolist(),
                        "type": "scatter",
                        "mode": "lines",
                        "name": "Channel B",
                        "line": {"color": "#ef4444", "width": 2}
                    }
                ],
                "layout": {
                    "title": f"Graph {graph_id}: Dual Channel",
                    "xaxis": {"title": "Time (ms)"},
                    "yaxis": {"title": "Voltage (V)"}
                }
            }
            return jsonify(graph_data)
        else:
            # Generic data for other graphs
            y_data = graph_id * np.sin(2 * np.pi * x_data / (10 + graph_id))
            title = f"Graph {graph_id}: Sample Data"
            y_label = "Value"
        
        # Standard single-trace response
        graph_data = {
            "data": [
                {
                    "x": x_data.tolist(),
                    "y": y_data.tolist(),
                    "type": "scatter",
                    "mode": "lines",
                    "name": f"Graph {graph_id}",
                    "line": {
                        "color": "#3b82f6",
                        "width": 2
                    }
                }
            ],
            "layout": {
                "title": title,
                "xaxis": {"title": "Time (ms)"},
                "yaxis": {"title": y_label}
            }
        }
        
        return jsonify(graph_data)
        
    except Exception as e:
        # Return error graph
        return jsonify({
            "data": [{
                "x": [0, 1],
                "y": [0, 0],
                "type": "scatter",
                "mode": "lines",
                "name": "Error"
            }],
            "layout": {
                "title": f"Graph {graph_id} - Error: {str(e)}",
                "xaxis": {"title": "X"},
                "yaxis": {"title": "Y"}
            }
        }), 200  # Return 200 to avoid frontend error handling

# ============================================================================
# Configuration Endpoints
# ============================================================================

@app.route('/api/config/save', methods=['POST'])
def save_config():
    """Save user configuration to file."""
    try:
        config = request.get_json()
        
        # Save to user_settings.json
        with open('config/user_settings.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Configuration saved successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/config/default_settings.json', methods=['GET'])
def get_default_settings():
    """Load default settings."""
    try:
        with open('config/default_settings.json', 'r') as f:
            config = json.load(f)
        return jsonify(config)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/config/user_settings.json', methods=['GET'])
def get_user_settings():
    """Load user settings."""
    try:
        with open('config/user_settings.json', 'r') as f:
            config = json.load(f)
        return jsonify(config)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# Run Server
# ============================================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

## Node.js/Express Example

### Complete Express Application

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// DAQ Control Endpoint
// ============================================================================

app.post('/api/daq-control', async (req, res) => {
  try {
    const data = req.body;
    
    console.log('Received DAQ Control Data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Process the control data
    const { triggers, raspberryPi, fileHandle, shotInfo } = data;
    
    // Configure your DAQ system here
    // await configureTriggers(triggers);
    // await configureRaspberryPi(raspberryPi);
    // await setupFileSaving(fileHandle);
    // await recordShotInfo(shotInfo);
    
    res.json({
      success: true,
      message: 'DAQ control data received and processed'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Graph Data Endpoints
// ============================================================================

app.get('/api/graph-json/:graphId', (req, res) => {
  const graphId = parseInt(req.params.graphId);
  
  try {
    // Generate sample data
    const xData = Array.from({ length: 100 }, (_, i) => i);
    let yData, title, yLabel;
    
    switch (graphId) {
      case 1:
        // Sine wave
        yData = xData.map(x => 5 * Math.sin(2 * Math.PI * x / 20));
        title = "Channel A - Voltage";
        yLabel = "Voltage (V)";
        break;
      
      case 2:
        // Exponential decay
        yData = xData.map(x => 10 * Math.exp(-x / 30));
        title = "Signal Decay";
        yLabel = "Amplitude";
        break;
      
      case 3:
        // Noisy data
        yData = xData.map(() => 5 + (Math.random() - 0.5));
        title = "Pressure Measurement";
        yLabel = "Pressure (mTorr)";
        break;
      
      default:
        // Generic data
        yData = xData.map(x => graphId * Math.sin(2 * Math.PI * x / (10 + graphId)));
        title = `Graph ${graphId}: Sample Data`;
        yLabel = "Value";
    }
    
    const graphData = {
      data: [{
        x: xData,
        y: yData,
        type: 'scatter',
        mode: 'lines',
        name: `Graph ${graphId}`,
        line: {
          color: '#3b82f6',
          width: 2
        }
      }],
      layout: {
        title: title,
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: yLabel }
      }
    };
    
    res.json(graphData);
  } catch (error) {
    // Return error graph
    res.json({
      data: [{
        x: [0, 1],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: 'Error'
      }],
      layout: {
        title: `Graph ${graphId} - Error: ${error.message}`,
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
      }
    });
  }
});

// ============================================================================
// Configuration Endpoints
// ============================================================================

app.post('/api/config/save', async (req, res) => {
  try {
    const config = req.body;
    const configPath = path.join(__dirname, 'config', 'user_settings.json');
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    res.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/config/default_settings.json', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'config', 'default_settings.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/config/user_settings.json', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'config', 'user_settings.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Run Server
// ============================================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing the API

### Using curl

```bash
# Test graph endpoint
curl http://localhost:5000/api/graph-json/1

# Test DAQ control endpoint
curl -X POST http://localhost:5000/api/daq-control \
  -H "Content-Type: application/json" \
  -d '{
    "triggers": {
      "enable": {"duration": 100, "delay": 0}
    },
    "raspberryPi": {
      "rmfFreq": 100,
      "dutyCycle1": 25,
      "dutyCycle2": 25
    },
    "fileHandle": {
      "date": "2025-10-09 - 16:09:02",
      "saveData": true
    },
    "shotInfo": {
      "gas": "argon",
      "pressure": 5.0
    }
  }'
```

### Using Python requests

```python
import requests

# Fetch graph data
response = requests.get('http://localhost:5000/api/graph-json/1')
graph_data = response.json()
print(graph_data)

# Send DAQ control data
control_data = {
    'triggers': {
        'enable': {'duration': 100, 'delay': 0}
    },
    'raspberryPi': {
        'rmfFreq': 100,
        'dutyCycle1': 25,
        'dutyCycle2': 25
    }
}
response = requests.post('http://localhost:5000/api/daq-control', json=control_data)
print(response.json())
```

## Production Considerations

1. **Authentication**: Add authentication/authorization middleware
2. **Validation**: Validate all incoming data
3. **Error Handling**: Implement comprehensive error handling
4. **Logging**: Add proper logging for debugging and monitoring
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Database**: Store configuration and data in a database
7. **WebSockets**: Consider WebSockets for real-time data streaming
8. **HTTPS**: Use HTTPS in production
9. **CORS**: Configure CORS properly for production domains

## Integration with Actual DAQ Hardware

When integrating with real hardware, you'll need to:

1. **Replace mock data** with actual DAQ readings
2. **Implement hardware control** based on trigger settings
3. **Handle real-time data streaming** for live graphs
4. **Implement data persistence** for shot data
5. **Add error handling** for hardware failures
6. **Implement calibration** routines
7. **Add safety interlocks** where necessary
