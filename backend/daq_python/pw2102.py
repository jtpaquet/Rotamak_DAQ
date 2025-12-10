import serial
import time

DT = 0.05

class FunctionGenerator:
    SYMBOL_MAP = {
        '0': '0', '1': '1', '2': '2', '3': '3',
        '4': '4', '5': '5', '6': '6', '7': '7',
        '8': '8', '9': '9', 'A': ':', 'B': ';',
        'C': '<', 'D': '=', 'E': '>', 'F': '?'
    }
    
    REVERSE_SYMBOL_MAP = {v: k for k, v in SYMBOL_MAP.items()}
    
    WAVEFORMS = {
        'square': '1',
        'triangle': '2',
        'sine': '4',
    }
    FREQUENCY_RANGES = [
        (0, 2, 1),           # 2.2 Hz
        (1, 20, 10),           # 22 Hz
        (2, 200, 100),         # 220 Hz
        (3, 2000, 1e3),        # 2.2 kHz
        (4, 20000, 1e4),       # 22 kHz
        (5, 200000, 1e5),      # 220 kHz
        (6, 2000000, 1e6),     # 2.2 MHz
    ]

    def __init__(self, port='COM2', baudrate=9600):
        self.ser = serial.Serial(
            port=port,
            baudrate=baudrate,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=1,
            xonxoff=False,
            rtscts=False,
            dsrdtr=False
        )
        time.sleep(DT)

    def _encode_hex(self, value: int, digits: int = 4) -> str:
        hexstr = f"{value:0{digits}X}"
        try:
            return ''.join(self.SYMBOL_MAP[c] for c in hexstr)
        except KeyError as e:
            raise ValueError(f"Invalid hex digit '{e.args[0]}' in value: {hexstr}")
    
    def _decode_hex(self, symbol_str: str) -> str:
        """
        Decode a generator-encoded hex symbol string into a regular hex.
        Allows any number of characters.
        """
        try:
            return ''.join(self.REVERSE_SYMBOL_MAP[c] for c in symbol_str).upper()
        except KeyError as e:
            raise ValueError(f"Invalid encoded character: {e}")

    def _send(self, cmd: str):
        if not cmd.endswith('.'):
            cmd += '.'
        self.ser.write(cmd.encode())
        time.sleep(DT)

    def set_frequency(self, freq_hz: int):
        for range_code, max_freq, f_scale in self.FREQUENCY_RANGES:
            if freq_hz <= max_freq:
                break
        else:
            raise ValueError("Frequency must be between 0 and 2.2 MHz")
    
        self._send(f'/G0{range_code}')
        code = int((freq_hz/f_scale) * 1e4)# convert to correct decimal
        
        #hexstr = f"{code:04X}"
        encoded = self._encode_hex(code, 4)  # 4-digit encoded hex
        self._send(f'/DK{encoded}')

    def set_waveform(self, wave: str):
        code = self.WAVEFORMS.get(wave.lower())
        if not code:
            raise ValueError(f"Unknown waveform '{wave}'")
        self._send(f'/G2{code}')

    def set_output_level(self, vpp: float, att: int = 0):
        """
        Set amplitude in Vpp (0–20 Vpp range).
        att: 0 (default) or 1 for attenuated output.
        """
        if not (0 <= vpp <= 20):
            raise ValueError("Amplitude must be between 0 and 20 Vpp.")
    
        if att not in (0, 1):
            raise ValueError("Attenuation must be 0 or 1.")

        code = int((vpp / 0.2) + 128)  # Convert to 128–228
        encoded = self._encode_hex(code, 2)  # 2-digit encoded hex
        self._send(f'/DB{encoded}{att}')

    def set_offset(self, offset_v: float, att: int = 0):
        """
        Set DC offset from -10V to +10V.
        Linearly mapped from:
          -10V → code 28
          +10V → code 228
        Sends /DD<encoded><att> (att = 0).
        """
        if not (-10.0 <= offset_v <= 10.0):
            raise ValueError("Offset must be between -10V and +10V.")
    
        ratio = (offset_v + 10.0) / 20.0
        code = int(ratio * 200 + 28)
        code = max(28, min(code, 228))  # Clamp for safety
    
        encoded = self._encode_hex(code, 2)
        self._send(f'/DD{encoded}{att}')  # '0' is pad/correction byte


    def get_frequency(self) -> float:
        self._send('/AK')
        #resp = self.ser.read_until(b'.')
        # Read everything currently in the input buffer
        buffer = self.ser.read_all()
        messages = buffer.split(b'.')
        
        # Remove empty entries and reattach trailing '.' to each message
        messages = [m + b'.' for m in messages if m]
        
        if not messages:
            raise RuntimeError("No response received")
        
        # Only consider the last full message
        last_msg = messages[-1]
        #print("Last message received:", last_msg)
    
        if not last_msg.startswith(b'/AK') or not last_msg.endswith(b'.'):
            raise ValueError(f"Unexpected response: {last_msg}")
            
        #resp = self.ser.read_all()
        #print(resp)
        resp = last_msg.decode()
        body = self._decode_hex(resp[3:-1])
        raw_hex = body[:-1]; scale = self.FREQUENCY_RANGES[int(body[-1])][2]
        frequency = (int(raw_hex, 16) / 1e4) * scale
        return frequency
    
    def set_duty_cycle(self, duty_percent: float):
        """
        Set the duty cycle of the waveform output.
        Input range: 15 to 85 (%)
        """
        if not (15 <= duty_percent <= 85):
            raise ValueError("Duty cycle must be between 15% and 85%.")
    
        ratio = (85.0 - duty_percent) / 70.0
        code = int(ratio * (231 - 25) + 25)
        code = max(25, min(code, 231))  # Clamp for safety
        
        encoded = self._encode_hex(code, digits=2)
        self._send(f'/DC{encoded}')
        
    def get_duty_cycle(self) -> float:
        duty_max = 93.5
        duty_min = 6.8
        self._send('/AC')
        #resp = self.ser.read_until(b'.')
        time.sleep(DT)
        # Read everything currently in the input buffer
        buffer = self.ser.read_all()
        messages = buffer.split(b'.')
        
        # Remove empty entries and reattach trailing '.' to each message
        messages = [m + b'.' for m in messages if m]
        
        if not messages:
            raise RuntimeError("No response received")
        
        # Only consider the last full message
        last_msg = messages[-1]
        #print("Last message received:", last_msg)
    
        if not last_msg.startswith(b'/AC') or not last_msg.endswith(b'.'):
            raise ValueError(f"Unexpected response: {last_msg}")
        
        resp = last_msg.decode()
        body = self._decode_hex(resp[3:-1]) # this is hex

        value = int(body, 16)
        duty = duty_max - (value / 255) * (duty_max - duty_min)
        return round(duty, 1)
    
        
    def set_cmos_level(self, voltage: float):
        """
        Set the CMOS level output voltage.
        Input range: 4V (128) to 14V (28).
        """
        if not (4.0 <= voltage <= 14.0):
            raise ValueError("CMOS level must be between 4V and 14V.")
    
        # Inverse mapping from 4–14V to 128–28
        ratio = (14.0 - voltage) / 10.0
        code = int(ratio * 100 + 28)
    
        encoded = self._encode_hex(code, digits=2)
        self._send(f'/DG{encoded}')

    def close(self):
        time.sleep(DT)
        self.ser.close()
