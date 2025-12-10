import json
import time
import serial
import nidaqmx
from nidaqmx import Task
from nidaqmx.system import System
from nidaqmx.constants import AcquisitionType, Level
from pathlib import Path
from daq_python.daq_acquisition import DAQAcquisition, DEVICE_RANGE
from daq_python.daq_triggering import TriggerGenerator
from daq_python.pw2102 import FunctionGenerator
from daq_python.daq_rmf_simple import RMFPulseGeneratorDAQ
from daq_python.daq_combined_task import RMFCombinedTaskGenerator

class RotamakController:
    def __init__(self):
        self.json_path = self.get_config_path()
        self.config = {}
        self.system = System.local()
        self.daq = self.system
        self.main_clk_task = None
        self.discharge_task = None
        self.rpi_port = None
        self.device_names = [d.name for d in self.daq.devices]
        self.daq_list = []

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
        self.load_config()
        self.initialize_main_clk_task()
        self.initialize_function_generator()
        pass

    def load_config(self):
        """Load parameters from JSON config."""
        with open(self.json_path, 'r') as f:
            self.config = json.load(f)
        print("Config loaded:")
        print('control', ':', self.config["control"])
        print('pxi', ':', self.config["pxi"][0], '...')

    def get_pxi_default_config(self):
        print("Return default config")
        return self.config

    def initialize_main_clk_task(self):
        """Initialize RMF DAQ clock."""
        freq_hz = 10e3
        duty_cycle = 0.5

        self.main_clk_task = nidaqmx.Task(new_task_name='mainClkTask')
        try: 
            self.main_clk_task.co_channels.add_co_pulse_chan_freq(
                'PXI1Slot5/Ctr0', idle_state=Level.LOW, freq=freq_hz, duty_cycle=duty_cycle
            )
            self.main_clk_task.timing.cfg_implicit_timing(sample_mode=AcquisitionType.CONTINUOUS)
            self.main_clk_task.start()
            _freq_hz = self.main_clk_task.co_channels.all.co_pulse_freq
            _duty_cycle = self.main_clk_task.co_channels.all.co_pulse_duty_cyc
            print(f"Main DAQ clock updated to {_freq_hz/1e3:.1f} kHz - {_duty_cycle*100:.1f}% duty cycle")
        except Exception as e:
            print("Failed to update main DAQ clock:", e)

    def initialize_function_generator(self):
        try:
            self.fg = FunctionGenerator(port='COM2')
        except Exception as e:
            print("Failed to initialized function generator:", e)
        self.update_function_generator()
    
    def acquire_data(self, daq_config):
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
            self.daq_list.append(daq_)
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
    
    def start_discharge(self, data):
        print(data['control'])
        print(data['pxi'][0])
        # Setup
        self.setup_discharge(data)

        # Start the shared DO task
        # self.triggers.start_triggers()
        # self.rmf.start_rmf()
        self.triggers_and_rmf.start_task()

        # Wait for completion
        # self.triggers.wait_and_stop()
        # self.rmf.wait_and_stop()
        self.triggers_and_rmf.wait_and_stop()
        pass

    def setup_discharge(self, data):
        # Setup RMF (generate main clock only)
        self.update_function_generator()

        # Setup RMF
        self.rmf = RMFPulseGeneratorDAQ(daq=self.system, clk_task=self.main_clk_task)
        self.rmf.configure_from_dict(data)

        # Setup triggers (generate waveforms only)
        self.triggers = TriggerGenerator(daq=self.system, timing_task=self.main_clk_task)
        self.triggers.configure_from_dict(data)

        # Setup combined task (Triggers + RMF Pulses)
        self.triggers_and_rmf = RMFCombinedTaskGenerator(rmf_=self.rmf, triggers_=self.triggers)
        self.triggers_and_rmf.setup_combined_task()

        # Write data
        self.triggers_and_rmf.write_data()
        pass
        
    def update_parameters(self):
        """Reload config from a JSON file and update system accordingly."""
        self.load_config()
        self.update_function_generator()

    def update_function_generator(self):
        """Update the function generator frequency."""
        freq_hz = float(self.config['control']['raspberryPi']['rmfFreq']) * 1e3
        duty_cycle = float(self.config['control']['raspberryPi']['dutyCycle1']) / 100
        try:
            self.fg.set_frequency(int(freq_hz))
            self.fg.set_duty_cycle(int(duty_cycle*100))
            self.fg.set_cmos_level(5)
            _freq_hz = self.fg.get_frequency()
            _duty_cycle = self.fg.get_duty_cycle() / 100
            print(f"Function generator updated to {_freq_hz/1e3:.1f} kHz - {_duty_cycle*100:.1f}% duty cycle")
        except Exception as e:
            print("Failed to update function generator:", e)

    def cleanup(self):
        """Stop and close all tasks, disconnect devices, close serial."""
        try:
            self.reset_daq_tasks()
            if self.main_clk_task:
                self.main_clk_task.close()
            if hasattr(self, 'triggers') and self.triggers:
                self.triggers.cleanup()  # if defined inside the class
            if hasattr(self, 'rmf') and self.rmf:
                self.rmf.cleanup()  # if defined inside the class
            if hasattr(self, 'combined_waveforms') and self.triggers_and_rmf:
                self.triggers_and_rmf.cleanup()  # if defined inside the class
            print("Cleanup completed.")
            if self.fg:
                self.fg.close()
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
