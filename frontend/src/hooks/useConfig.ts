import { useState } from 'react';

export interface ConfigLimits {
  min: number;
  max: number;
  step: number;
  decimals?: number;
  default: number;
  unit?: string;
}

export interface Config {
  triggers: {
    enable: {
      duration: ConfigLimits;
      delay: ConfigLimits;
    };
    dcField: {
      duration: ConfigLimits;
      delay: ConfigLimits;
    };
    rmfField: {
      duration: ConfigLimits;
      delay: ConfigLimits;
    };
    extra: {
      duration: ConfigLimits;
      delay: ConfigLimits;
    };
  };
  raspberryPi: {
    rmfFreq: ConfigLimits;
    dutyCycle: ConfigLimits;
  };
  pxi: {
    sampleRate: ConfigLimits;
    totalSamples: ConfigLimits;
    acquisitionTime: ConfigLimits;
    pxi1: {
      channelNames: string[];
      defaultRange: string;
    };
    pxi2: {
      channelNames: string[];
      defaultRange: string;
    };
    pxi3: {
      channelNames: string[];
      defaultRange: string;
    };
  };
  picoscope: {
    sampleRate: ConfigLimits;
    totalSamples: ConfigLimits;
    acquisitionTime: ConfigLimits;
  };
  visualization: {
    tracesPerGraph: ConfigLimits;
    graphsToDisplay: ConfigLimits;
  };
}

const defaultConfig: Config = {
  triggers: {
    enable: {
      duration: {
        min: 0,
        max: 500,
        step: 5,
        default: 200
      },
      delay: {
        min: 0,
        max: 500,
        step: 5,
        default: 0
      }
    },
    dcField: {
      duration: {
        min: 0,
        max: 500,
        step: 5,
        default: 60
      },
      delay: {
        min: 0,
        max: 500,
        step: 5,
        default: 80
      }
    },
    rmfField: {
      duration: {
        min: 0,
        max: 500,
        step: 5,
        default: 40
      },
      delay: {
        min: 0,
        max: 500,
        step: 5,
        default: 80
      }
    },
    extra: {
      duration: {
        min: 0,
        max: 500,
        step: 5,
        default: 100
      },
      delay: {
        min: 0,
        max: 500,
        step: 5,
        default: 80
      }
    }
  },
  raspberryPi: {
    rmfFreq: {
      min: 1,
      max: 2500,
      step: 0.5,
      decimals: 1,
      default: 125
    },
    dutyCycle: {
      min: 15,
      max: 85,
      step: 1,
      decimals: 0,
      default: 25
    }
  },
  pxi: {
    sampleRate: {
      min: 1,
      max: 2500,
      step: 100,
      default: 1000,
      unit: "kS/s"
    },
    totalSamples: {
      min: 0,
      max: 1000000,
      step: 50000,
      default: 100000
    },
    acquisitionTime: {
      min: 0,
      max: 10000,
      step: 20,
      decimals: 2,
      default: 100,
      unit: "ms"
    },
    pxi1: {
      channelNames: ['ai0', 'ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6', 'ai7'],
      defaultRange: '10v'
    },
    pxi2: {
      channelNames: ['ai0', 'ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6', 'ai7'],
      defaultRange: '10v'
    },
    pxi3: {
      channelNames: ['ai0', 'ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6', 'ai7'],
      defaultRange: '10v'
    }
  },
  picoscope: {
    sampleRate: {
      min: 1,
      max: 100,
      step: 1,
      default: 100,
      unit: "kS/s"
    },
    totalSamples: {
      min: 0,
      max: 1000000,
      step: 50000,
      default: 5000
    },
    acquisitionTime: {
      min: 0,
      max: 10000,
      step: 20,
      decimals: 4,
      default: 0.05,
      unit: "ms"
    }
  },
  visualization: {
    tracesPerGraph: {
      min: 1,
      max: 10,
      step: 1,
      default: 2
    },
    graphsToDisplay: {
      min: 1,
      max: 16,
      step: 1,
      default: 16
    }
  }
};

export function useConfig() {
  const [config, setConfig] = useState<Config>(defaultConfig);

  // Function to save config to user_settings.json
  const saveConfig = async (newConfig: Config) => {
    try {
      // This would save to config/user_settings.json
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      
      if (response.ok) {
        setConfig(newConfig);
        console.log('Configuration saved to user_settings.json');
      } else {
        console.log('Backend not available, config updated locally only');
        setConfig(newConfig);
      }
    } catch (error) {
      console.log('Backend not available, config updated locally only');
      setConfig(newConfig);
    }
  };

  // Function to load default settings
  const loadDefaultSettings = async () => {
    try {
      const response = await fetch('/config/default_settings.json');
      if (response.ok) {
        const defaultSettings = await response.json() as Config;
        setConfig(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.log('Using built-in defaults');
    }
    setConfig(defaultConfig);
    return defaultConfig;
  };

  // Function to load user settings
  const loadUserSettings = async () => {
    try {
      const response = await fetch('/config/user_settings.json');
      if (response.ok) {
        const userSettings = await response.json() as Config;
        setConfig(userSettings);
        return userSettings;
      }
    } catch (error) {
      console.log('No user settings found, using defaults');
    }
    return loadDefaultSettings();
  };

  return { config, setConfig, saveConfig, loadDefaultSettings, loadUserSettings };
}