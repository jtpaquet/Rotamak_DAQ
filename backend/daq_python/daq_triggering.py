from nidaqmx import Task
from nidaqmx.system import System
from nidaqmx.constants import AcquisitionType, LineGrouping
import numpy as np

class TriggerGenerator:
    """
    Reads timing info from a dict and generates digital triggers on NI-DAQ lines.
    """

    def __init__(self, daq: System, timing_task: Task):
        self.daq = daq
        self.module = timing_task.devices[0]  # same module as clock
        self.timing_task = timing_task
        self.trigger_task = None

        # Clock info
        self.clk_rate = self.timing_task.co_channels[0].co_pulse_freq

        # Internal vars
        self.max_len_buffer = 500_000
        self.data_list = []
        self.channel_list = []


    def setup_trigger_task(self):
        self.trigger_task = Task(new_task_name='Trigger_Task')
        self.define_channels()
        self.define_timing()
        
    def define_channels(self, num_lines=4):
        """
        Automatically picks the last few digital lines from the module.
        """
        do_lines = self.module.do_lines
        ch_names = [d.name for d in do_lines[:num_lines]]  # first 4 lines
        self.channel_list = ch_names
        self.trigger_task.do_channels.add_do_chan(','.join(ch_names),
                                               line_grouping=LineGrouping.CHAN_PER_LINE)
        print(f"Channels: {[ch.name for ch in list(self.trigger_task.do_channels)]}")

    def define_timing(self):
        """
        Configures timing to use the main clock from clk_task.
        """
        counter_name = self.timing_task.co_channels[0].name
        source_channel = f'/{counter_name}InternalOutput'

        print(source_channel)
        self.trigger_task.timing.cfg_samp_clk_timing(
            rate=self.clk_rate,
            source=source_channel,
            sample_mode=AcquisitionType.FINITE,
            samps_per_chan=self.len_buffer
        )
        print(f"Clock rate: {self.clk_rate/1e3:.1f} kHz")

    def configure_from_dict(self, config: dict):
        """
        Reads a configuration dict with trigger delays/durations and Raspberry Pi parameters.
        Example expected format:
            config = {
                'triggers': {
                    'enable': {'duration': 200, 'delay': 0},
                    'dcField': {'duration': 80, 'delay': 60},
                    'rmfField': {'duration': 40, 'delay': 80},
                    'extra': {'duration': 0, 'delay': 0}
                }
            }
        """
        trig_order = ['enable', 'dcField', 'rmfField', 'extra']
        durations = []
        delays = []

        enable_trig = config['triggers'].get('enable', {'duration': 0, 'delay': 0})
        enable_total = enable_trig['duration']  # in ms

        for key in trig_order:
            trig = config['triggers'].get(key, {'duration': 0, 'delay': 0})
            
            # Enforce that dcField, rmfField, extra do not exceed enable
            if key != 'enable':
                max_total = enable_total
                actual_total = trig['delay'] + trig['duration']
                if actual_total > max_total:
                    # Scale down duration to fit within enable
                    trig['duration'] = max(0, max_total - trig['delay'])
            
            durations.append(trig['duration'] * 1e-3)  # convert ms → s
            delays.append(trig['delay'] * 1e-3)
        
        # Build trigger waveforms
        N_safety = 100
        N_delay = int(delays[0] * self.clk_rate)
        total_duration = durations[0]

        self.len_buffer = int(N_delay + total_duration * self.clk_rate + N_safety)
        if self.len_buffer > self.max_len_buffer:
            print(f"Buffer capped at {self.max_len_buffer} samples.")
            self.len_buffer = self.max_len_buffer

        data_list = []
        for dt, delay in zip(durations, delays):
            N_delay = int(delay * self.clk_rate)
            N_on = min(self.len_buffer - N_delay - N_safety, int(dt * self.clk_rate))
            N_off = max(0, self.len_buffer - N_delay - N_on - N_safety)
            data = [False]*N_delay + [True]*N_on + [False]*(N_off + N_safety)
            data_list.append(data)

        self.data_list = data_list
        print(np.sum(self.data_list[1]))
        print(f"Triggers prepared ({len(data_list)} channels, {self.len_buffer} samples).")
        self._print_waveforms(data_list)

    def start_triggers(self):
        """
        Writes data and starts trigger task.
        """
        if not self.data_list:
            raise ValueError("⚠ No data loaded. Call configure_from_dict() first.")
        self.trigger_task.start()
        print("🚀 Triggers started.")

    def wait_and_stop(self):
        """
        Wait until done, then stop and reset the trigger task.
        """
        self.trigger_task.wait_until_done()
        print("✅ Triggers completed.")
        self.trigger_task.stop()
        self.trigger_task.close()
        self.trigger_task = None  # reinit
    
    def _print_waveforms(self, waveforms, width=100):
        """
        Print a list of boolean waveforms as ASCII art in the console.
        Each waveform is downsampled to fit `width` characters.
        """
        n = len(waveforms[0])
        step = max(1, n // width)

        for i, w in enumerate(waveforms):
            # Downsample and convert True/False → symbols
            reduced = w[::step]
            line = ''.join('█' if x else ' ' for x in reduced)
            print(f"Ch{i+1:02d} | {line} |")
        print()


if __name__ == '__main__':
    daq = System.local()
    import nidaqmx
    rmf_clk_task = nidaqmx.Task(new_task_name='rmfClkTask')
    rmf_clk_task.co_channels.add_co_pulse_chan_freq(
        'PXI1Slot5/Ctr0', idle_state=nidaqmx.constants.Level.LOW, freq=200e3, duty_cycle=0.5
    )
    rmf_clk_task.timing.cfg_implicit_timing(sample_mode=AcquisitionType.CONTINUOUS)
    rmf_clk_task.start()

    t = TriggerGenerator(daq=daq, rmf_clk_task=rmf_clk_task)
    t.start_triggers()