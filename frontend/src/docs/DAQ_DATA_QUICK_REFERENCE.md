# DAQ Control Data - Quick Reference

## API Endpoint
```
POST /api/daq-control
Content-Type: application/json
```

## Data Structure Overview

```typescript
DAQControlData {
  triggers: {
    enable:   { duration: number, delay: number }
    dcField:  { duration: number, delay: number }
    rmfField: { duration: number, delay: number }
    extra:    { duration: number, delay: number }
  }
  raspberryPi: {
    rmfFreq:    number  // kHz
    dutyCycle1: number  // %
    dutyCycle2: number  // %
  }
  fileHandle: {
    date:          string            // "YYYY-MM-DD - HH:MM:SS"
    shotNumber?:   number            // Optional
    fileName:      string
    fileAppend:    string
    saveDirectory: string
    saveData:      boolean
  }
  shotInfo: {
    gas:             string          // Empty or gas name
    pressure?:       number          // mTorr, Optional
    rfPower?:        number          // W, Optional
    batteryVoltage?: number          // V, Optional
  }
}
```

## Example Payload

```json
{
  "triggers": {
    "enable":   { "duration": 100, "delay": 0 },
    "dcField":  { "duration": 80,  "delay": 10 },
    "rmfField": { "duration": 60,  "delay": 20 },
    "extra":    { "duration": 0,   "delay": 0 }
  },
  "raspberryPi": {
    "rmfFreq": 100,
    "dutyCycle1": 25,
    "dutyCycle2": 25
  },
  "fileHandle": {
    "date": "2025-10-09 - 16:09:02",
    "shotNumber": 42,
    "fileName": "plasma_exp",
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
```

## Field Details

### Triggers
- All values in milliseconds
- All fields required (numeric)

### Raspberry Pi
- rmfFreq: 0 to 1000 kHz (configurable)
- dutyCycle1/2: 0 to 50% (configurable)
- All fields required (numeric)

### File Handle
- date: Auto-generated, format "YYYY-MM-DD - HH:MM:SS"
- shotNumber: Optional (can be undefined)
- fileName: Empty string or user input
- fileAppend: Empty string or user input
- saveDirectory: Empty string or user input
- saveData: Boolean (defaults to true)

### Shot Info
- gas: Empty string or one of: argon, helium, hydrogen, air, nitrogen, oxygen
- pressure: Optional number (mTorr)
- rfPower: Optional number (W)
- batteryVoltage: Optional number (V)

## Default vs Empty Fields

### Have Defaults:
- ✓ All trigger duration/delay values (from config)
- ✓ All Raspberry Pi values (from config)
- ✓ File Handle: date (auto-generated)
- ✓ File Handle: saveData (true)

### Start Empty (Placeholders Only):
- File Handle: shotNumber, fileName, fileAppend, saveDirectory
- Shot Info: All fields (gas, pressure, rfPower, batteryVoltage)

## Import Path
```typescript
import { DAQControlData } from "../types/daq-control-data";
```

## Full Documentation
See `/docs/DAQ_CONTROL_DATA.md` for complete details.
