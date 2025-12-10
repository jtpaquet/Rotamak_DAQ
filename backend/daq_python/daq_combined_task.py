from daq_python.daq_rmf_simple import RMFPulseGeneratorDAQ
from daq_python.daq_triggering import TriggerGenerator
from nidaqmx import Task
from nidaqmx.constants import AcquisitionType, LineGrouping


class RMFCombinedTaskGenerator:

    def __init__(self, rmf_ : RMFPulseGeneratorDAQ, triggers_ : TriggerGenerator):
        self.rmf_ = rmf_
        self.triggers_ = triggers_
        self.combined_task = None
        
    def setup_discharge(self, data):
        # Setup RMF
        self.rmf_.configure_from_dict(data)

        # Setup triggers (generate waveforms only)
        self.triggers_.configure_from_dict(data)

        # Setup combined task (Triggers + RMF Pulses)
        self.setup_combined_task()         
        pass
    
    def setup_combined_task(self):
        self.combined_task = Task(new_task_name="Combined_Task")
        self.define_channels()
        self.define_timing()
        self.setup_waveforms()

    def define_channels(self):
        module = self.rmf_.clk_task.devices[0]
        do_lines = module.do_lines
        ch_names = [d.name for d in do_lines]
        self.combined_task.do_channels.add_do_chan(','.join(ch_names), line_grouping=LineGrouping.CHAN_PER_LINE)
        print(f"Channels: {[ch.name for ch in list(self.combined_task.do_channels)]}")

    def define_timing(self):
        clk_rate = self.rmf_.clk_task.co_channels.all.co_pulse_freq
        clk_channel = self.rmf_.clk_task.co_channels[0].name
        len_buffer = len(self.triggers_.data_list[0])
        self.combined_task.timing.cfg_samp_clk_timing(
            rate=clk_rate,
            source=f"/{clk_channel}InternalOutput",
            sample_mode=AcquisitionType.FINITE,
            samps_per_chan=len_buffer
        )

    def setup_waveforms(self):
        trigger_waveforms = self.triggers_.data_list
        rmf_waveforms = self.rmf_.data_list

        enable_trigger = trigger_waveforms[0]
        dc_trigger = trigger_waveforms[1]        
        rmf_trigger = trigger_waveforms[2]
        extra_trigger = trigger_waveforms[3]

        rmf_0 = rmf_waveforms[0]
        rmf_90 = rmf_waveforms[1]
        rmf_180 = rmf_waveforms[2]
        rmf_270 = rmf_waveforms[3]

        len_buffer = len(enable_trigger)
        len_rmf = len(rmf_0)

        rmf_0 = self.rmf_.data_list[0] * (len_buffer//len_rmf + 1)
        rmf_0 = rmf_0[:len_buffer]
        rmf_0 = [rmf_0[i] * rmf_trigger[i] for i in range(len_buffer)]
        
        rmf_90 = self.rmf_.data_list[1] * (len_buffer//len_rmf + 1)
        rmf_90 = rmf_90[:len_buffer]
        rmf_90 = [rmf_90[i] * rmf_trigger[i] for i in range(len_buffer)]

        rmf_180 = self.rmf_.data_list[2] * (len_buffer//len_rmf + 1)
        rmf_180 = rmf_180[:len_buffer]
        rmf_180 = [rmf_180[i] * rmf_trigger[i] for i in range(len_buffer)]

        rmf_270 = self.rmf_.data_list[3] * (len_buffer//len_rmf + 1)
        rmf_270 = rmf_270[:len_buffer]
        rmf_270 = [rmf_270[i] * rmf_trigger[i] for i in range(len_buffer)]

        self.data_list = [enable_trigger, dc_trigger, rmf_trigger, extra_trigger, rmf_0, rmf_90, rmf_180, rmf_270]
        print(self.combined_task.timing.samp_clk_rate)
        for d in self.data_list:
            print(len(d))

    def write_data(self):
        self.combined_task.write(self.data_list, auto_start=False)
        print("Data written in combined task")

    def start_task(self):
        """
        Starts combined task.
        """
        if not self.data_list:
            raise ValueError("⚠ No data loaded. Call configure_from_dict() first.")
        self.combined_task.start()
        print("🚀 Triggers started.")

    def wait_and_stop(self):
        """
        Wait until done, then stop and reset the trigger task.
        """
        self.combined_task.wait_until_done()
        print("✅ Triggers completed.")
        self.combined_task.stop()
        self.combined_task.close()
        self.combined_task = None  # reinit
    
    def cleanup(self):
        if self.combined_task:
            self.combined_task.close()
