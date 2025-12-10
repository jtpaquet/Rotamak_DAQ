from nidaqmx import Task
from nidaqmx.system import System
from nidaqmx.constants import AcquisitionType, LineGrouping
import numpy as np


class RMFPulseGeneratorDAQ:
    """
    RMF pulse generator that outputs from the DAQ.
    Using the waveform-generation method from main clock division:
    → 4 square waves
    → 90° phase shifts (0°, 90°, 180°, 270°)
    → Repeated to fill a buffer
    """

    def __init__(self, daq: System, clk_task: Task):
        self.daq = daq
        self.clk_task = clk_task

        # Device running the clock
        self.module = self.clk_task.devices[0]

        # Clock info
        self.clk_rate = self.clk_task.co_channels[0].co_pulse_freq  # Hz
        self.clk_channel = self.clk_task.co_channels[0].name
        self.available_mainclk_frequency = [1000.0, 952.4, 909.1, 869.6, 833.3, 800.0, 769.2, 740.7, 714.3, 689.7, 666.7, 645.2, 625.0, 606.1, 588.2, 571.4, 555.6, 540.5, 526.3, 512.8, 500.0] # kHz

        # Internal
        self.len_buffer = 2048
        self.data_list = []
        self.channel_list = []
        self.rmf_task = None

        # Parameters
        self.rmf_freq = None
        self.duty_cycles = None

    def generate_waveforms(self):
        """
        - Determine samples_per_waveform from f_clk / f_RMF
        - Create 4 square waves with 90° phase shift
        - Repeat pattern to fill buffer
        """

        sample_rate = self.clk_rate
        rmf_freq = self.rmf_freq
        duty = [self.duty_cycle_1, self.duty_cycle_2] * 2

        # How many samples per period?
        samples_per_waveform = max(4, int(sample_rate // rmf_freq))

        # Ensure integer buffer
        spb = 2048
        spb = min(samples_per_waveform, (spb // samples_per_waveform) * samples_per_waveform)
        self.len_buffer = spb

        waveforms = []

        for i in range(4):
            # Base square wave
            pattern = [
                n < round(samples_per_waveform * duty[i])
                for n in range(samples_per_waveform)
            ]

            # 90° shift = shift by ¼ period
            shift = i * int(samples_per_waveform // 4)
            waveform = np.roll(pattern, shift)

            # Repeat to fill buffer
            waveform_full = waveform.tolist() * (spb // samples_per_waveform)
            waveforms.append(waveform_full)
        
        self.data_list = waveforms
        self._print_waveforms(waveforms)

    def setup_task(self):
        self.rmf_task = Task(new_task_name="RMF_Task")
        self.define_channels()
        self.define_timing()

    def define_channels(self, num_lines=4):
        """Use last N digital lines of module."""
        do_lines = self.module.do_lines
        ch_names = [d.name for d in do_lines[-num_lines:]]

        self.channel_list = ch_names

        self.rmf_task.do_channels.add_do_chan(
            ",".join(ch_names),
            line_grouping=LineGrouping.CHAN_PER_LINE
        )

        print("Channels:", ch_names)

    def define_timing(self):
        """Use the main clock task as the sample clock."""
        self.rmf_task.timing.cfg_samp_clk_timing(
            rate=self.clk_rate,
            source=f"/{self.clk_channel}InternalOutput",
            sample_mode=AcquisitionType.CONTINUOUS,
            samps_per_chan=self.len_buffer
        )
        print(f"Clock: {self.clk_rate/1e3:.1f} kHz")

    def start_rmf(self):
        if not self.data_list:
            raise ValueError("No RMF waveform. Call configure_from_dict().")
        self.rmf_task.start()
        print("🚀 RMF started.")

    def wait_and_stop(self):
        self.rmf_task.wait_until_done()
        print("✅ RMF done.")
        self.rmf_task.stop()
        self.rmf_task.close()
        self.rmf_task = None

    def _print_waveforms(self, waveforms):
        """
        Simple ASCII representation of first cycles
        """
        print("\n--- Waveform preview ---")
        n = 10
        segment_len = min(200, len(waveforms[0])*2)

        for i, w in enumerate(waveforms):
            line = "".join(n*"█" if x else n*" " for x in w[:segment_len])
            print(f"Ch{i+1}: {2*line}")
        print("------------------------\n")

    def choose_best_main_clock_and_divider(self, requested_rmf_hz):
        """
        Finds the best main clock frequency and divider n (1..N)
        such that main_clk / (4*n) is closest to the requested RMF frequency.

        Returns:
            best_clk_hz, best_n, best_rmf_hz
        """

        best_error = float("inf")
        best_clk = None
        best_n = None
        best_rmf = None

        for f_clk_khz in self.available_mainclk_frequency:
            f_clk = f_clk_khz * 1e3   # convert kHz → Hz

            # Try dividers n = 1..20 (enough for your 21 clock frequencies)
            for n in range(1, 21):
                f_rmf_candidate = f_clk / (4 * n)
                error = abs(f_rmf_candidate - requested_rmf_hz)

                if error < best_error:
                    best_error = error
                    best_clk = f_clk
                    best_n = n
                    best_rmf = f_rmf_candidate

        return best_clk, best_n, best_rmf

    def select_best_rmf_frequency(self, requested_rmf_hz):
        """
        Automatically selects the best:
          - main clock frequency
          - integer divider n
          - resulting RMF frequency

        so that the final generated RMF freq matches the user's desired RMF freq
        as closely as possible.
        """

        best_clk, best_n, best_rmf = self.choose_best_main_clock_and_divider(requested_rmf_hz)
        self.clk_rate = best_clk
        self.rmf_divider = best_n
        self.rmf_freq = best_rmf

        self.update_main_clk_task()

        print(f"Requested RMF frequency: {requested_rmf_hz/1e3:.3f} kHz")
        print(f"Selected main clock    : {best_clk/1e3:.3f} kHz")
        print(f"Selected divider n     : {best_n}")
        print(f"Final RMF frequency    : {best_rmf/1e3:.3f} kHz\n")

        return best_rmf

    def configure_from_dict(self, config):
        config=config['control']
        print('===================')
        print(config["raspberryPi"])
        print('===================')
        req_f0_hz = config["raspberryPi"]["rmfFreq"] * 1000

        # 1. pick main clock & divider for best RMF match
        self.select_best_rmf_frequency(req_f0_hz)

        # 2. snap DC1/DC2
        req_dc1 = min(50, config["raspberryPi"].get("dutyCycle1", 0)) / 100
        req_dc2 = min(50, config["raspberryPi"].get("dutyCycle2", 0)) / 100

        self.duty_cycle_1 = self.select_rmf_duty_cycle(req_dc1)
        self.duty_cycle_2 = self.select_rmf_duty_cycle(req_dc2)

        # 3. generate waveforms with snapped values
        self.generate_waveforms()

    def update_main_clk_task(self):
        """Update the DAQ RMF clock frequency."""
        try:
            self.clk_task.stop()
            self.clk_task.co_channels.all.co_pulse_freq = self.clk_rate
            self.clk_task.co_channels.all.co_pulse_duty_cyc = 0.5
            self.clk_task.start()
            self.clk_rate = self.clk_task.co_channels.all.co_pulse_freq
            print(f"DAQ RMF clock updated to {self.clk_rate/1e3:.1f} kHz - {0.5*100:.1f}% duty cycle")
        except Exception as e:
            print("Failed to update DAQ RMF clock:", e)

    def select_rmf_duty_cycle(self, requested_dc):
        """
        Selects the closest valid duty cycle for the current RMF frequency.
        
        Valid duty cycles are:
            dc = i * min_dc
            where min_dc = 1 / int(clk_rate / rmf_freq)
            and 0 < dc <= 0.5

        Args:
            requested_dc (float): requested duty cycle (0..1)

        Returns:
            float: closest achievable duty cycle (0..1)
        """

        # number of samples in 1 RMF period
        try:
            samples_per_period = int(self.clk_rate / self.rmf_freq)
        except ZeroDivisionError:
            samples_per_period = 1

        if samples_per_period < 1:
            samples_per_period = 1

        # minimum achievable duty cycle
        min_dc = 1.0 / samples_per_period

        # build all achievable duty cycles <= 0.5
        max_i = int(0.5 / min_dc)
        valid_dcs = [i * min_dc for i in range(1, max_i + 1)]

        # clamp requested value
        req = max(0, min(0.5, requested_dc))

        # pick closest valid
        closest_dc = min(valid_dcs, key=lambda x: abs(x - req))

        print(f"Requested DC: {requested_dc:.4f}  →  Selected: {closest_dc:.4f}  "
            f"(min step={min_dc:.4f}, samples_per_period={samples_per_period})")

        return closest_dc

    def cleanup(self):
        if self.rmf_task:
            self.rmf_task.close()