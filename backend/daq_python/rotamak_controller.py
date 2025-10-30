import json
import time
import serial
import nidaqmx
from nidaqmx import Task
from nidaqmx.system import System
from nidaqmx.constants import AcquisitionType, Level, TerminalConfiguration, Edge, LineGrouping
from pathlib import Path
from daq_python.daq_acquisition import DAQAcquisition, DEVICE_RANGE
from daq_python.daq_triggering import TriggerGenerator
from daq_python.daq_rmf import RMFPulseGenerator

# from triggerGenerator import triggerGenerator

class RotamakController:
    def __init__(self):
        self.json_path = self.get_config_path()
        self.config = {}
        self.system = System.local()
        self.daq = self.system
        self.main_clk_task = None
        self.discharge_task = None
        self.rpi = None
        self.rpi_port = None
        self.device_names = [d.name for d in self.daq.devices]

        self.reset_daq_tasks()
        self.setup()

    def get_config_path(self, filename="daq_controls.json"):
        return Path(__file__).resolve().parent.parent / "config" / filename

    def reset_daq_tasks(self):
        """Close all tasks created by the NI DAQ Assistant to prevent conflicts."""
        for task in self.daq.tasks:
            print(f"Found task: {task.name}, Author: {task.author}")
            if task.author == 'DAQ assistant':
                print(f"Closing DAQ assistant task: {task.name}")
                try:
                    task_obj = nidaqmx.Task(task.name)
                    task_obj.close()
                except Exception as e:
                    print(f"Error closing task {task.name}: {e}")

    def setup(self):
        self.initialize_main_clock()
        self.connect_rpi()
        pass

    def load_config(self):
        """Load parameters from JSON config."""
        with open(self.json_path, 'r') as f:
            self.config = json.load(f)
        print("Config loaded:", self.config)

    def initialize_main_clock(self):
        """Initialize main DAQ clock."""
        freq_hz = 1000e3  # default to 1 MHz
        self.main_clk_task = nidaqmx.Task(new_task_name='mainClkTask')
        self.main_clk_task.co_channels.add_co_pulse_chan_freq(
            'PXI1Slot5/Ctr1', idle_state=Level.LOW, freq=freq_hz
        )
        self.main_clk_task.timing.cfg_implicit_timing(sample_mode=AcquisitionType.CONTINUOUS)
        self.main_clk_task.start()
        print(f"Main clock initialized at {freq_hz/1e3:.1f} kHz")

    def connect_rpi(self):
        import serial.tools.list_ports
        ports = serial.tools.list_ports.comports()
        for p in ports:
            if 'USB Serial Device' in p.description or 'ttyUSB' in p.device:
                self.rpi_port = p.device
                self.rpi = serial.Serial(port=self.rpi_port, baudrate=115200, timeout=1)
                time.sleep(1)
                print(f"Connected to RPi on {self.rpi_port}")
                return True
        print("Warning: RPI serial port not found")
        self.rpi = None
        return False
    
    def acquire_data(self, daq_config):
        print(daq_config)
        print([d.name for d in self.daq.devices])
        try:
            self.validate_daq_config(daq_config)
            daq_acquisition = DAQAcquisition(daq_config)
            data = daq_acquisition.acquire_data()
        except Exception as e:
            raise RuntimeError(f"DAQ acquisition failed: {e}") from e
        return data
    
    def validate_daq_config(self, config):
        required_keys = ['deviceName', 'sampleRate', 'totalSamples', 'channels']
        for key in required_keys:
            if key not in config:
                raise ValueError(f"Missing required config key: {key}")

        if config['deviceName'] not in self.device_names:
            raise ValueError(f"Invalid slot number {config['deviceName']}")
        
        if not isinstance(config['channels'], list) or not config['channels']:
            raise ValueError("Channels list must not be empty")

        for ch in config['channels']:
            if 'id' not in ch or 'name' not in ch or 'range' not in ch or 'save' not in ch:
                raise ValueError(f"Incomplete channel config: {ch}")
            if ch['range'] not in DEVICE_RANGE:
                raise ValueError(f"Invalid range {ch['range']} in channel {ch['id']}")

    def initialize_daq_cards(self, settings):
        print('Initializing acquisition tasks')
        daq_list = []
        for slot_settings in settings:
            daq_ = DAQAcquisition(slot_settings)
            daq_.setup_task()
            daq_list.append(daq_)
        return daq_list
    
    def acquire_PXI_data(self, settings):
        daq_list = self.initialize_daq_cards(settings)
        print("Acquire PXI cards")        
        # Identify and assign master/slave tasks
        self.master_task = None
        self.slave_tasks = []
        self.master_daq = None
        self.slave_daqs = []

        for daq_ in daq_list:
            print(f"Task name: {daq_.acquire_task.name}")

            if daq_.acquire_task.name == "Acquire Data PXI1Slot5":
                self.master_task = daq_.acquire_task
                self.master_daq = daq_
            else:
                self.slave_tasks.append(daq_.acquire_task)
                self.slave_daqs.append(daq_)

        # Check assignment
        if self.master_task is None:
            raise ValueError("No master task found in slot 5!")
        if not self.slave_tasks:
            print("Warning: No slave tasks found.")
                
        # Start slaves first, then master
        for slave in self.slave_tasks:
            slave.start()
        self.master_task.start()

        # Read data
        master_data = self.master_task.read(
            number_of_samples_per_channel=self.master_task.timing.samp_quant_samp_per_chan
        )
        slave_data = [
            s.read(number_of_samples_per_channel=s.timing.samp_quant_samp_per_chan)
            for s in self.slave_tasks
        ]
        
        self.master_task.wait_until_done()
        for slave in self.slave_tasks:
            slave.wait_until_done()

        self.master_task.stop()
        for s in self.slave_tasks:
            s.stop()

        # Format data using each DAQAcquisition instance’s own method
        combined_data = {}
        combined_data[self.master_daq.device_name] = self.master_daq.format_daq_data(master_data)
        for slave_daq, data in zip(self.slave_daqs, slave_data):
            combined_data[slave_daq.device_name] = slave_daq.format_daq_data(data)
        
        # Clear references correctly
        self.master_task = None
        self.slave_tasks.clear()

        """Close all tasks created by the NI DAQ Assistant to prevent conflicts."""
        for task in self.daq.tasks:
            print(f"Found task: {task.name}, Author: {task.author}")

        return combined_data

    def send_rpi_command(self, cmd):
        """Send a command to the Raspberry Pi and read response."""
        self.rpi.write((cmd + '\n').encode())
        time.sleep(0.1)
        response = self.rpi.readlines()
        print(f"RPi response to '{cmd}':", response)
        return response
    
    def start_discharge(self, data):
        # Setup
        self.setup_discharge(data)

        # Start the shared DO task
        self.combined_task.start()
        print("🚀 Combined RMF + triggers started.")

        # Wait for completion
        self.combined_task.wait_until_done()
        self.combined_task.stop()
        self.combined_task.close()
        self.combined_task = None
        print("✅ Combined output completed.")
        pass

    def setup_discharge(self, data):
        # Setup triggers (generate waveforms only)
        self.triggers = TriggerGenerator(daq=self.system, clk_task=self.main_clk_task)
        self.triggers.configure_from_dict(data)
        
        # Setup RMF (generate waveforms only)
        self.rmfPulses = RMFPulseGenerator(daq=self.system, clk_task=self.main_clk_task)
        self.rmfPulses.generate_waveforms(data)

        self.setup_discharge_task()
        self.write_discharge_pulses()
        self.configure_discharge_timing()
        self.combined_task.write(self.combined_data, auto_start=False)
        pass

    def setup_discharge_task(self):
        # Setup combined triggers and waveforms task
        self.combined_task = Task(new_task_name='Combined_DO')
        module = self.main_clk_task.devices[0]
        do_lines = module.do_lines
        ch_names = [d.name for d in do_lines[:8]] # Use all lines (port0/line0:7), first 4 for triggers, last 4 for RMF
        self.combined_channels = ch_names
        self.combined_task.do_channels.add_do_chan(','.join(ch_names),
                                               line_grouping=LineGrouping.CHAN_PER_LINE)
        # print(f"Channels: {[ch.name for ch in list(self.combined_task.do_channels)]}")

    def write_discharge_pulses(self):
        combined_data = [[] for i in range(8)]
        combined_len = len(self.triggers.data_list[0])
        for i in range(4):
            combined_data[i] = self.triggers.data_list[i]
        for i in range(4,8):
            rmf_waveform = self.rmfPulses.data_list[i-4]
            new_rmf_waveform = rmf_waveform * (combined_len//len(rmf_waveform)+1)
            new_rmf_waveform = new_rmf_waveform[:combined_len]
            combined_data[i] = new_rmf_waveform
        for w in combined_data:
            w[-100:] = [0] * 100
        self.combined_data = combined_data
        pass

    def configure_discharge_timing(self):
        # Configure timing
        clk_rate = self.main_clk_task.co_channels[0].co_pulse_freq
        clk_channel = self.main_clk_task.co_channels[0].name
        combined_len = len(self.combined_data[0])

        self.combined_task.timing.cfg_samp_clk_timing(
            rate=clk_rate,
            source=f'/{clk_channel}InternalOutput',
            sample_mode=AcquisitionType.FINITE,
            samps_per_chan=combined_len
        )

    def start_discharge_RPI(self):
        """Start the discharge sequence."""
        # Send waveform params to RPi
        rmf_freq = float(self.config['raspberryPi']['rmfFreq']) * 1e3
        dc1 = self.config['raspberryPi']['dutyCycle1'] / 100
        dc2 = self.config['raspberryPi']['dutyCycle2'] / 100
        self.send_rpi_command(f"FREQ {rmf_freq} {dc1:.2f} {dc2:.2f}")
        self.send_rpi_command("PIO_TRIGGER 1")

        # Start triggers
        self.triggers.prepare_triggers()
        time.sleep(0.1)
        self.triggers.start_triggers()
        print("Triggers started")

        # Wait for total duration of triggers (max of duration + delay)
        total_duration = max([
            v['duration'] + v['delay']
            for v in self.config.get('triggers', {}).values()
        ]) / 1000.0  # ms to s
        time.sleep(total_duration)

        self.triggers.end_triggers()
        print("Triggers ended")

        self.send_rpi_command("PIO_TRIGGER 0")
        print("Discharge completed")

    def update_parameters(self, new_json_path):
        """Reload config from a new JSON file and update system accordingly."""
        self.json_path = new_json_path
        self.load_config()
        self.update_main_clk_freq()

    def update_main_clk_freq(self):
        """Update the DAQ main clock frequency."""
        freq_hz = float(self.config['raspberryPi']['rmfFreq']) * 1e3
        try:
            self.main_clk_task.stop()
            self.main_clk_task.co_channels.all.co_pulse_freq = freq_hz
            self.main_clk_task.start()
            print(f"Main clock updated to {freq_hz/1e3:.1f} kHz")
        except Exception as e:
            print("Failed to update main clock:", e)

    def cleanup(self):
        """Stop and close all tasks, disconnect devices, close serial."""
        try:
            self.reset_daq_tasks()
            if self.main_clk_task:
                self.main_clk_task.close()
            if hasattr(self, 'triggers') and self.triggers:
                self.triggers.cleanup()  # if defined inside the class
            if self.rpi:
                self.rpi.close()
            print("Cleanup completed.")
        except Exception as e:
            print("Cleanup error:", e)

    def __enter__(self):
        # Enables use of the `with` statement for this class,
        # ensuring that resources are properly initialized and
        # will be automatically cleaned up by __exit__() even if
        # an error or interruption (e.g. Ctrl+C) occurs.
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.cleanup()


if __name__ == "__main__":
    with RotamakController() as controller:
        print(controller)
