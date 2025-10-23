import math
from nidaqmx import Task
from nidaqmx.constants import AcquisitionType, TerminalConfiguration

# Voltage ranges (you can customize/extend this)
DEVICE_RANGE = {
    "± 10 V": (-10, 10), "± 5 V": (-5, 5), "± 2 V": (-2, 2),
    "0-10 V": (0, 10), "0-5 V": (0, 5), "0-2 V": (0, 2),
}

class DAQAcquisition:
    def __init__(self, config: dict):
        """
        config: dict, contains information for data acquisition
        """
        self.config = config # Need a default config
        self.update_parameters_from_config()
        self.acquire_task = None

    def __del__(self):
        if self.acquire_task is not None:
            self.acquire_task.close()
        self.acquire_task = None


    def update_parameters_from_config(self):
        # From config
        self.device_name = self.config['deviceName']
        self.sample_rate = self.config['sampleRate'] * 1000  # Convert kS/s to S/s
        self.n_samples = self.config['totalSamples']
        self.channels = [ch for ch in self.config['channels'] if ch['save']]  # Only saved channels
        self.channel_ids = [ch['id'] for ch in self.channels]
        self.channel_names = [ch['name'] for ch in self.channels]
        self.channel_ranges = {ch['id']: ch['range'] for ch in self.channels}


    def setup_task(self):
        self.acquire_task = Task(new_task_name=f"Acquire Data {self.device_name}")
        for ch in self.channels:
            full_name = f"{self.device_name}/{ch['id']}"
            ch_min, ch_max = DEVICE_RANGE.get(ch['range'], (-10, 10))
            self.acquire_task.ai_channels.add_ai_voltage_chan(
                physical_channel=full_name,
                terminal_config=TerminalConfiguration.DEFAULT,
                min_val=ch_min,
                max_val=ch_max,
                name_to_assign_to_channel=ch['name']
            )

        self.acquire_task.timing.cfg_samp_clk_timing(
            rate=self.sample_rate,
            sample_mode=AcquisitionType.FINITE,
            samps_per_chan=self.n_samples
        )

    def acquire_data(self):
        # Acquire DAQ data, format it, print preview, and return formatted dict.
        if self.acquire_task is None:
            self.setup_task()

        self.acquire_task.start()
        data = self.acquire_task.read(number_of_samples_per_channel=self.n_samples)
        self.acquire_task.stop()
        self.acquire_task.close()
        self.acquire_task = None
        formatted_data = self.format_daq_data(data)
        return formatted_data
    
    
    def format_daq_data(self, data):
        # Convert raw nested DAQ data to dict with time vector and quantized channel data.
        n_channels = len(data)
        n_samples = len(data[0]) if data else 0
        time_vector = [i / self.sample_rate for i in range(n_samples)]
        result = {"t": time_vector}

        for i, samples in enumerate(data):
            key = self.channel_names[i] if i < len(self.channel_names) else f"channel_{i}"
            ch_id = self.channel_ids[i] if i < len(self.channel_ids) else None
            range_str = self.channel_ranges.get(ch_id, None) if ch_id else None
            voltage_range = self.parse_voltage_range(range_str) if range_str else 20.0
            result[key] = self.quantize_signal(samples, voltage_range=voltage_range, resolution_bits=12)

        return result

    def quantize_signal(self, signal_list, voltage_range=20.0, resolution_bits=12):
        # Quantize signal and round to number of decimals matching the LSB
        levels = 2 ** resolution_bits
        lsb = voltage_range / levels
        decimals = max(0, math.ceil(-math.log10(lsb)) + 1)
        return [round(round(v / lsb) * lsb, decimals) for v in signal_list]


    def parse_voltage_range(self, range_str):
        # Parse string voltage range (e.g. "±10 V") into numeric total voltage.
        if not range_str:
            return 20.0
        try:
            if range_str.startswith("±"):
                return 2 * float(range_str[1:].split()[0])
            parts = range_str.split()[0].split('-')
            return float(parts[1]) - float(parts[0])
        except Exception:
            return 20.0