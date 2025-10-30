from nidaqmx import Task
from nidaqmx.system import System
from nidaqmx.constants import AcquisitionType, LineGrouping
import numpy as np

class RMFPulseGenerator:
    """
    Generates RMF pulses synchronized to an existing DAQ clock task.
    Configured from a dictionary similar to TriggerGenerator.
    """
    def __init__(self, daq: System, clk_task: Task):
        self.daq = daq
        self.clk_task = clk_task
        self.module = self.clk_task.devices[0]  # run on same module as clk_task
        self.rmf_task = None

        # Clock info
        self.clk_rate = self.clk_task.co_channels[0].co_pulse_freq  # Hz
        self.clk_channel = self.clk_task.co_channels[0].name

        # Internal vars
        self.len_buffer = 120_000
        self.data_list = []
        self.channel_list = []

        # RMF config
        self.rmf_freq = None
        self.duty_cycles = []

    def configure_from_dict(self, config: dict):
        """
        Reads RMF configuration and generates 4 waveforms 90° apart:
        CH1: 0°  → dutyCycle1
        CH2: 90° → dutyCycle2
        CH3: 180° → dutyCycle1
        CH4: 270° → dutyCycle2
        """
        self.rmf_freq = config['raspberryPi']['rmfFreq'] * 1000
        dc1 = config['raspberryPi'].get('dutyCycle1', 0)/100.0
        dc2 = config['raspberryPi'].get('dutyCycle2', 0)/100.0
        duty_cycles = [dc1, dc2, dc1, dc2]
        
        freq_multiplier = self.clk_rate//self.rmf_freq
        self.rmf_freq = self.clk_rate / freq_multiplier

        # Determine samples per waveform
        samples_per_waveform = max(4, int(self.clk_rate / self.rmf_freq))
        samples_per_buffer = 2048
        samples_per_buffer = samples_per_buffer // samples_per_waveform * samples_per_waveform  # integer multiple

        waveforms = []
        for i in range(4):
            pattern = [n < round(samples_per_waveform*duty_cycles[i]) for n in range(samples_per_waveform)]
            # Create a square wave pattern for each line
            waveform = np.roll(pattern, i*int(samples_per_waveform//4))
            waveforms.append(waveform.tolist() * (samples_per_buffer // samples_per_waveform))  # Repeat to fill the buffer

        self.data_list = waveforms
        self.len_buffer = samples_per_buffer

        print(f"RMF prepared: {len(self.data_list)} channels, {self.len_buffer} samples")
        self._print_waveforms(waveforms)


    def setup_task(self):
        self.rmf_task = Task(new_task_name='RMF_Task')

    def define_channels(self, num_lines=4):
        """
        Picks digital lines for RMF output (default 4 channels)
        """
        do_lines = self.module.do_lines
        ch_names = [d.name for d in do_lines[-num_lines:]]
        self.channel_list = ch_names
        self.rmf_task.do_channels.add_do_chan(','.join(ch_names),
                                              line_grouping=LineGrouping.CHAN_PER_LINE)
        print(f"Channels: {[ch.name for ch in list(self.rmf_task.do_channels)]}")

    def define_timing(self):
        """
        Use the main clock task as sample clock.
        """
        self.rmf_task.timing.cfg_samp_clk_timing(
            rate=self.clk_rate,
            source=f'/{self.clk_channel}InternalOutput',
            sample_mode=AcquisitionType.CONTINUOUS,
            samps_per_chan=self.len_buffer
        )
        print(f"Clock rate: {self.clk_rate/1e3:.1f} kHz")

    def start_rmf(self):
        """
        Writes data and starts RMF output.
        """
        if not self.data_list:
            raise ValueError("⚠ No RMF data. Call configure_from_dict() first.")
        self.rmf_task.write(self.data_list, auto_start=False)
        self.rmf_task.start()
        print("🚀 RMF output started.")

    def wait_and_stop(self):
        """
        Wait until RMF output is done, then stop and close task.
        """
        self.rmf_task.wait_until_done()
        print("✅ RMF output completed.")
        self.rmf_task.stop()
        self.rmf_task.close()
        self.rmf_task = None

    def _print_waveforms(self, waveforms):
        """
        Print a list of boolean waveforms as ASCII art in the console.
        Each waveform is downsampled to fit `width` characters.
        """
        n = self._second_cluster_length(waveforms[0])
        for i, w in enumerate(waveforms):
            line = ''.join('█'*5 if x else ' '*5 for x in w[:2*n])
            print(f"Ch{i+1:02d} | {line} |")

    def _second_cluster_length(self, waveform):
        count = 0
        cluster_count = 0
        in_cluster = False

        for val in waveform:
            if val:
                if not in_cluster:
                    cluster_count += 1
                    in_cluster = True
            else:
                in_cluster = False

            if cluster_count == 2:
                count += 1
            elif cluster_count > 2:
                break

        return count

    def generate_waveforms(self, config):
        
        # -----------------------------
        # Parameters
        # -----------------------------
        f_clk = self.clk_rate
        W = 10

        f0 = config['raspberryPi']['rmfFreq'] * 1000
        dc1 = config['raspberryPi'].get('dutyCycle1', 0)/100.0
        dc2 = config['raspberryPi'].get('dutyCycle2', 0)/100.0
        
        M = 2**W
        INC = int(round(f0 * M / f_clk))
        P90  = 3 * M // 4
        P180 = M // 2
        P270 = M // 4

        self.rmf_freq = int(INC*self.clk_rate/M)
        self.duty_cycle_1 = np.round(int(dc1*M)/M, 4)
        self.duty_cycle_2 = np.round(int(dc2*M)/M, 4)

        samples_per_buffer = M

        # -----------------------------
        # Initialize arrays
        # -----------------------------
        out0   = np.zeros(samples_per_buffer, dtype=int)
        out180 = np.zeros(samples_per_buffer, dtype=int)
        out90  = np.zeros(samples_per_buffer, dtype=int)
        out270 = np.zeros(samples_per_buffer, dtype=int)

        # -----------------------------
        # Helper function: generate centered pulse with deadtime
        # -----------------------------
        def generate_pulse(acc, phase_offset, dc, deadtime_frac):
            a = (acc + phase_offset) % M
            pulse_width = int(dc * M)
            dead_width = int(deadtime_frac * M)
            start = dead_width
            end   = pulse_width + dead_width
            return 1 if start <= a < end else 0

        # -----------------------------
        # Generate waveforms
        # -----------------------------
        acc = 0
        for i in range(samples_per_buffer):
            # 0° / 180° pair
            out0[i]   = generate_pulse(acc, 0, dc1, deadtime_frac=0)
            out180[i] = generate_pulse(acc, P180, dc1, deadtime_frac=0)
            
            # 90° / 270° pair
            out90[i]  = generate_pulse(acc, P90, dc2, deadtime_frac=0)
            out270[i] = generate_pulse(acc, P270, dc2, deadtime_frac=0)
            
            acc = (acc + INC) % M
        
        waveforms = [out0.astype(bool).tolist(), out90.astype(bool).tolist(), out180.astype(bool).tolist(), out270.astype(bool).tolist()]
        self.data_list = waveforms
        self.len_buffer = samples_per_buffer
        print(f"RMF prepared: {len(self.data_list)} channels, {self.len_buffer} samples")
        print(f"f0: {self.rmf_freq/1e3:.2f} kHz, dc1: {self.duty_cycle_1:.3f}, dc2: {self.duty_cycle_2:.3f}")
        self._print_waveforms(waveforms)
