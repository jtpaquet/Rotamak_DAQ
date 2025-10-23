# QREX DAQ Control Dashboard

## Project Overview

The QREX DAQ Control Dashboard is a comprehensive web-based application for controlling a Data Acquisition (DAQ) system. It provides interfaces for configuring triggers, managing file handling, controlling Raspberry Pi devices, monitoring acquisition parameters, visualizing data, and managing system logs.

## Build Configuration

### Icon Setup

1. Place your application icon as `icon.png` in the `/public/static/assets/` directory
2. When you run `npm run build`, the build output will be organized as:
   - `/static/assets/icon-[hash].png` - Application icon
   - `/static/assets/index-[hash].js` - Main JavaScript bundle
   - `/static/assets/index-[hash].css` - Main CSS bundle
   - Other assets follow: `/static/assets/[name]-[hash].[ext]`

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The built application will be in the `/dist` directory with all assets properly organized under `/static/assets/`.

## Project Structure

```
/
├── App.tsx                          # Main application entry point
├── components/                      # React components directory
│   ├── ControlsTab.tsx             # Main control interface
│   ├── DAQTab.tsx                  # Data acquisition configuration
│   ├── DataVisualizationTab.tsx    # Data visualization display
│   ├── SettingsTab.tsx             # Application settings
│   ├── LogsTab.tsx                 # System logs viewer
│   ├── TimingDiagram.tsx           # Trigger timing visualization
│   ├── NumberInput.tsx             # Custom number input component
│   └── ui/                         # Shadcn UI components library
├── config/                         # Configuration files
│   ├── default_settings.json       # Default system configuration
│   └── user_settings.json          # User-customized settings
├── hooks/                          # Custom React hooks
│   └── useConfig.ts                # Configuration management hook
├── lib/                            # Utility libraries
│   └── utils.ts                    # Helper functions
└── styles/                         # CSS styles
    └── globals.css                 # Global styles and Tailwind config
```

## Architecture

### Main Application (App.tsx)

The main application component manages:
- **Tab Navigation**: 5 main tabs (Control, DAQ, Data, Settings, Logs)
- **Sidebar**: Collapsible sidebar with tab icons and labels
- **Dark Mode**: Theme toggle functionality
- **Configuration Context**: Provides global configuration state to all components

### Configuration System (useConfig.ts & ConfigContext)

The configuration system is central to the application:

```typescript
interface Config {
  triggers: {
    enable: { duration, delay }      // Enable trigger settings
    dcField: { duration, delay }     // DC Field trigger settings
    rmfField: { duration, delay }    // RMF Field trigger settings
    extra: { duration, delay }       // Extra trigger settings
  }
  raspberryPi: {
    rmfFreq: { min, max, step, decimals, default }
    dutyCycle: { min, max, step, decimals, default }
  }
  pxi: {
    sampleRate, totalSamples, acquisitionTime
    pxi1, pxi2, pxi3: { channelNames[], defaultRange }
  }
  picoscope: {
    sampleRate, totalSamples, acquisitionTime
  }
  visualization: {
    tracesPerGraph, graphsToDisplay
  }
}
```

**Configuration Flow**:
1. Default configuration is loaded from `defaultConfig` in `useConfig.ts`
2. User settings can be loaded from `default_settings.json` or `user_settings.json`
3. Configuration is provided to all components via `ConfigContext`
4. Components read config limits/defaults to validate and initialize inputs

## Tab Components

### 1. ControlsTab.tsx

**Purpose**: Main control interface for trigger configuration and system operation

**Layout Structure**:
```
- Discharge Button (centered, top)
- Send Settings Button (left-aligned, above Triggers card)
- Grid (2 columns):
  - Left Column:
    - Triggers Card
      - Header row: Duration | Delay | Channel labels
      - Enable row
      - DC Field row
      - RMF Freq row
      - Extra Trig row
      - Timing Diagram visualization
  - Right Column:
    - File Handle Card
      - Date, Shot #, File Name, File Append, Save Directory
      - Save Data checkbox
- Grid (2 columns):
  - Raspberry Pi Controls Card
  - Shot Info Card
```

**Key Widgets**:
- **Discharge Button**: Large red button for initiating discharge
- **Trigger Controls**: NumberInput fields for duration/delay, Select dropdowns for channels
- **Timing Diagram**: Canvas-based visualization showing trigger waveforms
- **File Handle**: Text inputs for file management
- **Shot Info**: Gas selection, pressure, RF power, battery voltage inputs

**Value Sources**:
- Trigger limits: `config.triggers.{enable|dcField|rmfField|extra}.{duration|delay}.{min|max|step}`
- Raspberry Pi limits: `config.raspberryPi.{rmfFreq|dutyCycle}.{min|max|step}`
- State: Component-level state variables (enableDuration, enableDelay, etc.)

**Data Submission**:
- `handleSendData()` function packages all trigger, Raspberry Pi, and file handle data
- Sends POST request to `/api/controls` endpoint

### 2. DAQTab.tsx

**Purpose**: Configure data acquisition parameters for PXI slots and Picoscope channels

**Layout Structure**:
```
- Grid (varies by configuration):
  - PXI Slot Cards (1-3 slots)
    - Connection status indicator
    - Voltage range selector
    - Sample rate, Total samples, Acquisition time inputs
    - Channel enable checkboxes (ai0-ai7)
    - Save All checkbox
  - Picoscope Cards (1-2 scopes)
    - Connection status indicator
    - Sample rate, Total samples, Acquisition time inputs
    - Channel A/B configuration
```

**Key Widgets**:
- **Connection Indicators**: CheckCircle2/XCircle icons showing device status
- **Voltage Range Selectors**: Select dropdowns with options (±10V, ±5V, ±2.5V, ±1.25V)
- **NumberInputs**: Sample rate, total samples, acquisition time (auto-calculates relationships)
- **Channel Checkboxes**: Individual channel enable/disable with "Save All" master control

**Value Sources**:
- PXI limits: `config.pxi.{sampleRate|totalSamples|acquisitionTime}.{min|max|step}`
- Picoscope limits: `config.picoscope.{sampleRate|totalSamples|acquisitionTime}.{min|max|step}`
- Channel names: `config.pxi.{pxi1|pxi2|pxi3}.channelNames[]`
- Default ranges: `config.pxi.{pxi1|pxi2|pxi3}.defaultRange`

**Data Relationships**:
- Acquisition Time (ms) = (Total Samples / Sample Rate) × 1000
- Automatically updates when sample rate or total samples change

### 3. DataVisualizationTab.tsx

**Purpose**: Display and visualize graph data from the DAQ system using Plotly.js

**Layout Structure**:
```
- Header with "Plot Graphs" button
- Dynamic grid (2 columns) based on config.visualization.graphsToDisplay.default
  - Multiple rows, each containing 2 graph cards
  - Each card contains a Plotly.js interactive graph
```

**Key Features**:
- **Auto-Load**: Graphs automatically fetch when Data tab is clicked (first time)
- **Manual Refresh**: "Plot Graphs" button to reload/refresh data
- **Interactive Graphs**: Plotly.js graphs with zoom, pan, hover, and download capabilities
- **Loading States**: Shows loading indicator while fetching data
- **Error Handling**: Displays error graphs if data fails to load
- **Theme Integration**: Graphs automatically adapt to dark/light mode

**Key Widgets**:
- **Plot Button**: Manual refresh of all graph data
- **Graph Cards**: Interactive Plotly.js visualizations
- **Loading Indicator**: Animated spinner during data fetch

**Value Sources**:
- Number of graphs: `config.visualization.graphsToDisplay.default` (configurable in Settings)
- Graph data: Fetched from `/api/graph-json/<graphId>` endpoints

**API Integration**:
- Endpoint pattern: `GET /api/graph-json/<graphId>` where graphId is 1 to N
- Returns Plotly.js-compatible JSON with `data` and `layout` objects
- See `/docs/GRAPH_API.md` for complete API documentation

### 4. SettingsTab.tsx

**Purpose**: Configure system-wide settings and default limits

**Layout Structure**:
```
- Grid (2 columns):
  - General Settings Card
    - Default save directory
    - Experiment name
    - Dark mode toggle
  - Visualization Settings Card
    - Number of graphs to display
    - Number of traces per graph
    - Real-time plotting toggle

- Default Limits & Settings Card
  - Enable Trigger limits (8 columns: default/min/max/step for duration and delay)
  - DC Field Trigger limits (same structure)
  - RMF Field Trigger limits (same structure)
  - Extra Trigger limits (same structure)
  - Raspberry Pi Controls limits
  - PXI Settings (sample rate, total samples, acquisition time limits)
  - PXI Default Voltage Ranges (3 selectors for pxi1/pxi2/pxi3)
  - Picoscope Settings limits
  - Default Channel Names - PXI Slot 1 (8 inputs)
  - Default Channel Names - PXI Slot 2 (8 inputs)
  - Default Channel Names - PXI Slot 3 (8 inputs)

- Action Buttons
  - Save Configuration
  - Load User Settings
  - Load Default Settings
```

**Key Features**:
- **Live Editing**: All changes update local config state immediately
- **Configuration Persistence**: Save button writes to `user_settings.json` via API
- **Reset Functions**: Load defaults or user settings

**Value Sources**:
- All values read from and write to `localConfig` state
- Uses `updateConfigValue()` helper to update nested config properties
- Channel names use special `updateChannelName()` helper

### 5. LogsTab.tsx

**Purpose**: Display and manage system logs

**Layout Structure**:
```
- System Logs Card
  - Header with Export/Clear buttons
  - ScrollArea with log entries
- Log Settings Card
  - Log level selector
  - Max log entries input
```

**Key Features**:
- Auto-scrolling log display (last 100 entries)
- Simulated heartbeat messages every 10 seconds
- Export logs to text file
- Clear logs functionality

## Custom Components

### NumberInput (NumberInput.tsx)

Custom number input component with increment/decrement buttons:

**Props**:
- `value`: Current number value
- `onChange`: Callback when value changes
- `min`: Minimum allowed value
- `max`: Maximum allowed value
- `step`: Increment/decrement step size
- `decimals`: Number of decimal places (optional)
- `placeholder`: Placeholder text (e.g., "ms", "kHz", "%")

**Features**:
- Custom chevron up/down buttons
- Enforces min/max constraints
- Supports decimal precision
- Keyboard input with validation

### TimingDiagram (TimingDiagram.tsx)

Canvas-based visualization of trigger timing:

**Props**:
- Duration and delay values for all 4 triggers (enable, DC field, RMF freq, extra trig)

**Rendering**:
- Draws horizontal timeline with labeled waveforms
- Shows pulse timing relative to t=0
- Color-coded triggers (blue, green, orange, red)
- Auto-scales to fit longest trigger sequence

## Configuration Management

### Loading Configuration

1. **Default Settings** (`default_settings.json`):
   - Factory defaults for all parameters
   - Loaded via `loadDefaultSettings()` function
   - Fetches from `/config/default_settings.json`

2. **User Settings** (`user_settings.json`):
   - Customized settings saved by user
   - Loaded via `loadUserSettings()` function
   - Fetches from `/config/user_settings.json`

### Saving Configuration

- **Save Function**: `saveConfig(newConfig)`
- **Endpoint**: POST to `/api/config/save`
- **Behavior**: Saves to `user_settings.json` and updates context state

### Configuration Structure Details

Each configurable parameter has:
```typescript
{
  min: number,        // Minimum allowed value
  max: number,        // Maximum allowed value
  step: number,       // Increment step
  decimals?: number,  // Decimal precision (optional)
  default: number,    // Default value
  unit?: string       // Unit label (optional)
}
```

## Data Flow

### Reading Configuration Values

```typescript
// In any component:
const configContext = useContext(ConfigContext);
const config = configContext?.config;

// Access specific values:
const maxDuration = config.triggers.dcField.duration.max;
const channelNames = config.pxi.pxi1.channelNames;
```

### Updating Component State

```typescript
// Component maintains local state:
const [enableDuration, setEnableDuration] = useState(100);

// NumberInput updates state:
<NumberInput
  value={enableDuration}
  onChange={setEnableDuration}
  min={config.triggers.enable.duration.min}
  max={config.triggers.enable.duration.max}
  step={config.triggers.enable.duration.step}
/>
```

### Saving User Modifications

```typescript
// In SettingsTab:
const [localConfig, setLocalConfig] = useState<Config>(config);

// Update nested value:
updateConfigValue(['triggers', 'dcField', 'duration', 'max'], newValue);

// Save to backend:
handleSaveConfig(); // Calls saveConfig(localConfig)
```

## API Endpoints

The application expects the following backend endpoints:

### POST /api/daq-control
**Purpose**: Receive complete DAQ control data (triggers, Raspberry Pi, file handle, shot info)
**Payload**: DAQControlData JSON object (see `/docs/DAQ_CONTROL_DATA.md`)
**Response**: Success/failure status

### GET /api/graph-json/<graphId>
**Purpose**: Retrieve graph data for visualization
**Parameters**: 
- `graphId`: Graph number (1 to N, where N is configured number of graphs)
**Response**: Plotly.js-compatible JSON object with `data` and `layout` properties
**Documentation**: See `/docs/GRAPH_API.md` for complete details and examples

### POST /api/config/save
**Purpose**: Save user configuration
**Payload**: Complete Config object
**Response**: Success/failure status

### GET /config/default_settings.json
**Purpose**: Retrieve default configuration
**Response**: Config JSON object

### GET /config/user_settings.json
**Purpose**: Retrieve user configuration
**Response**: Config JSON object

## Styling

### Tailwind CSS v4
- Global styles in `styles/globals.css`
- Dark mode support via `.dark` class
- Custom CSS variables for colors, spacing, and radii
- Typography defaults for h1-h4, p, label, button, input

### Theme Colors
- Background/Foreground: Page and text colors
- Card: Component container colors
- Primary/Secondary: Action button colors
- Muted/Accent: Subtle background colors
- Destructive: Error/danger colors
- Border/Input: Control border colors

## Development Guidelines

### Adding New Configuration Parameters

1. Update `Config` interface in `hooks/useConfig.ts`
2. Add default values to `defaultConfig` object
3. Update `default_settings.json` file
4. Add UI controls in relevant tab component
5. Add settings controls in `SettingsTab.tsx`

### Adding New Widgets

1. Create component in `/components` directory
2. Import and use in relevant tab component
3. Connect to config context if needed
4. Use existing UI components from `/components/ui`

### Accessing Config Values

Always access configuration through the ConfigContext:
```typescript
const configContext = useContext(ConfigContext);
const config = configContext?.config;
```

## Future Enhancements

Potential areas for expansion:
- Real backend API integration
- Actual data acquisition implementation
- Real-time data plotting with matplotlib integration
- User authentication and multi-user support
- Experiment templates and presets
- Historical data playback
- Alert and notification system
- Advanced trigger sequencing
