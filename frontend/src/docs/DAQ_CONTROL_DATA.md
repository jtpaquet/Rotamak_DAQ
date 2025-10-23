# DAQ Control Data Structure

## Overview

The `DAQControlData` interface defines the complete data structure for all control parameters collected from the Control tab. This data is sent to the backend API endpoint `/api/daq-control` when the user clicks the "Send Settings" button.

## Data Structure

```typescript
interface DAQControlData {
  triggers: TriggersData;
  raspberryPi: RaspberryPiData;
  fileHandle: FileHandleData;
  shotInfo: ShotInfoData;
}
```

## Detailed Breakdown

### 1. Triggers Data

Controls the timing of all trigger signals.

```typescript
interface TriggersData {
  enable: TriggerConfig;
  dcField: TriggerConfig;
  rmfField: TriggerConfig;
  extra: TriggerConfig;
}

interface TriggerConfig {
  duration: number;  // Duration in milliseconds
  delay: number;     // Delay in milliseconds
}
```

**Example:**
```json
{
  "triggers": {
    "enable": { "duration": 100, "delay": 0 },
    "dcField": { "duration": 80, "delay": 10 },
    "rmfField": { "duration": 60, "delay": 20 },
    "extra": { "duration": 0, "delay": 0 }
  }
}
```

### 2. Raspberry Pi Data

Controls the Raspberry Pi RMF (Rotating Magnetic Field) parameters.

```typescript
interface RaspberryPiData {
  rmfFreq: number;      // RMF Frequency in kHz
  dutyCycle1: number;   // Duty Cycle 1 in %
  dutyCycle2: number;   // Duty Cycle 2 in %
}
```

**Example:**
```json
{
  "raspberryPi": {
    "rmfFreq": 100,
    "dutyCycle1": 25,
    "dutyCycle2": 25
  }
}
```

### 3. File Handle Data

Controls file naming and storage parameters.

```typescript
interface FileHandleData {
  date: string;           // Date in format "YYYY-MM-DD - HH:MM:SS"
  shotNumber?: number;    // Shot number (optional)
  fileName: string;       // Base file name
  fileAppend: string;     // Text to append to filename
  saveDirectory: string;  // Directory path for saving
  saveData: boolean;      // Whether to save data
}
```

**Example:**
```json
{
  "fileHandle": {
    "date": "2025-10-09 - 16:09:02",
    "shotNumber": 42,
    "fileName": "plasma_experiment",
    "fileAppend": "_run_001",
    "saveDirectory": "C:/Data/Experiments/",
    "saveData": true
  }
}
```

**Notes:**
- `date` is automatically generated on component mount
- `shotNumber` is optional (can be undefined)
- All other string fields can be empty

### 4. Shot Info Data

Records experimental parameters for each shot.

```typescript
interface ShotInfoData {
  gas: string;              // Gas type
  pressure?: number;        // Pressure in mTorr (optional)
  rfPower?: number;        // RF Power in Watts (optional)
  batteryVoltage?: number; // Battery Voltage in Volts (optional)
}
```

**Example:**
```json
{
  "shotInfo": {
    "gas": "argon",
    "pressure": 5.0,
    "rfPower": 100,
    "batteryVoltage": 12.5
  }
}
```

**Available Gas Options:**
- `"argon"`
- `"helium"`
- `"hydrogen"`
- `"air"`
- `"nitrogen"`
- `"oxygen"`

**Notes:**
- `gas` can be empty string if not selected
- Numeric fields are optional (can be undefined)

## Complete Example

```json
{
  "triggers": {
    "enable": { "duration": 100, "delay": 0 },
    "dcField": { "duration": 80, "delay": 10 },
    "rmfField": { "duration": 60, "delay": 20 },
    "extra": { "duration": 0, "delay": 0 }
  },
  "raspberryPi": {
    "rmfFreq": 100,
    "dutyCycle1": 25,
    "dutyCycle2": 25
  },
  "fileHandle": {
    "date": "2025-10-09 - 16:09:02",
    "shotNumber": 42,
    "fileName": "plasma_experiment",
    "fileAppend": "_run_001",
    "saveDirectory": "C:/Data/Experiments/",
    "saveData": true
  },
  "shotInfo": {
    "gas": "argon",
    "pressure": 5.0,
    "rfPower": 100,
    "batteryVoltage": 12.5
  }
}
```

## API Endpoint

**Endpoint:** `POST /api/daq-control`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
The complete `DAQControlData` object as JSON.

**Response:**
The backend should return appropriate success/error responses.

## Usage in Code

### Importing Types

```typescript
import { DAQControlData } from "../types/daq-control-data";
```

### Building the Data Object

```typescript
const daqControlData: DAQControlData = {
  triggers: {
    enable: { duration: enableDuration, delay: enableDelay },
    dcField: { duration: dcDuration, delay: dcDelay },
    rmfField: { duration: rmfDuration, delay: rmfDelay },
    extra: { duration: extraDuration, delay: extraDelay },
  },
  raspberryPi: {
    rmfFreq,
    dutyCycle1,
    dutyCycle2,
  },
  fileHandle: {
    date,
    shotNumber,
    fileName,
    fileAppend,
    saveDirectory,
    saveData,
  },
  shotInfo: {
    gas,
    pressure,
    rfPower,
    batteryVoltage,
  },
};
```

### Sending to Backend

```typescript
await fetch('/api/daq-control', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(daqControlData),
});
```

## State Management

All fields in the Control tab are managed with React state:

```typescript
// Trigger states
const [enableDuration, setEnableDuration] = useState(100);
const [enableDelay, setEnableDelay] = useState(0);
// ... etc

// Raspberry Pi states
const [rmfFreq, setRmfFreq] = useState(100);
const [dutyCycle1, setDutyCycle1] = useState(25);
const [dutyCycle2, setDutyCycle2] = useState(25);

// File Handle states (with placeholders)
const [date, setDate] = useState(formatDateTime());
const [shotNumber, setShotNumber] = useState<number | undefined>(undefined);
const [fileName, setFileName] = useState("");
const [fileAppend, setFileAppend] = useState("");
const [saveDirectory, setSaveDirectory] = useState("");
const [saveData, setSaveData] = useState(true);

// Shot Info states (with placeholders)
const [gas, setGas] = useState("");
const [pressure, setPressure] = useState<number | undefined>(undefined);
const [rfPower, setRfPower] = useState<number | undefined>(undefined);
const [batteryVoltage, setBatteryVoltage] = useState<number | undefined>(undefined);
```

## Default Values

### Fields with Default Values:
- **Triggers:** All have numeric default values (configurable in Settings)
- **Raspberry Pi:** All have numeric default values (configurable in Settings)
- **File Handle Date:** Automatically generated on mount in format `YYYY-MM-DD - HH:MM:SS`
- **File Handle Save Data checkbox:** Defaults to `true`

### Fields with Placeholders (No Defaults):
- **File Handle:** shotNumber, fileName, fileAppend, saveDirectory
- **Shot Info:** gas, pressure, rfPower, batteryVoltage

These fields start empty and display placeholder text to guide the user.

## Validation

Fields respect the configuration limits defined in the Settings tab:
- Triggers: min/max/step from `config.triggers.*`
- Raspberry Pi: min/max/step from `config.raspberryPi.*`

Numeric inputs are validated through the `NumberInput` component which enforces these constraints.

## Type Safety

The TypeScript interface ensures type safety when:
1. Building the data object
2. Sending to the backend
3. Processing the data on the backend (if using TypeScript)

This prevents common errors like:
- Missing required fields
- Wrong data types
- Misspelled property names
