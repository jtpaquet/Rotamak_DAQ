# Rotamak Data Acquisition System

This Django-based system manages real-time data acquisition and hardware control using National Instruments PXI hardware and a Raspberry Pi. It is designed for experimental plasma control in the Rotamak project.

## 🔧 Architecture Overview

- **`RotamakController`**: A custom Python class that:
  - Initializes the DAQ system (NI PXI).
  - Communicates with a Raspberry Pi via serial.
  - Sets up hardware triggers and pulse generation.
  - Manages DAQ data acquisition via NI-DAQmx.

- **Django REST API**: The backend provides HTTP endpoints to:
  - Update configuration (`daq_controls.json`).
  - Start data acquisition.
  - Return or save recorded data.

## 🚀 Key Components

### 1. `daq_python/rotamak_controller.py`

This is the main controller class. It:
- Reads configuration from JSON (`daq_controls.json`).
- Initializes PXI tasks and clocks.
- Connects to Raspberry Pi over USB serial.
- Can start/stop trigger sequences.
- Acquires analog voltage signals from PXI modules.

### 2. `daq_python/controller_manager.py`

Handles **singleton initialization** of the `RotamakController` so it's shared across all Django views.

Also registers shutdown/interrupt (`SIGINT`, `SIGTERM`) and cleanup handlers to ensure hardware tasks and serial ports are safely closed on exit.

### 3. API Endpoint: `start_recording`

Defined in `frontend/views.py`:

```http
POST /api/start-recording/


### 4. To access database

> py manage.py runserver

In browser open: http://127.0.0.1:8000/admin
Username: SESL_admin
Password: QREX



