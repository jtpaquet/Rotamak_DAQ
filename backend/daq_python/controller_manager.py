import signal
import sys
import atexit
from daq_python.rotamak_controller import RotamakController

controller = None  # Lazy-loaded controller


def get_controller():
    global controller
    if controller is None:
        print("[DAQ] Creating RotamakController...")
        controller = RotamakController()
        print("[DAQ] RotamakController initialized")
    return controller


def cleanup(signum=None, frame=None):
    global controller
    if controller is not None:
        print("[DAQ] Cleaning up RotamakController...")
        try:
            controller.cleanup()
        except Exception as e:
            print(f"[DAQ] Error during cleanup: {e}")
        controller = None
    else:
        print("[DAQ] No controller to clean up.")

    # Exit if signal-based
    if signum is not None:
        sys.exit(0)


# Register cleanup handlers
atexit.register(cleanup)
signal.signal(signal.SIGINT, cleanup)   # Ctrl+C
signal.signal(signal.SIGTERM, cleanup)  # Termination signal
