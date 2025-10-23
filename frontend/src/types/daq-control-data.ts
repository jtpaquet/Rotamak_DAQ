/**
 * DAQ Control Data Types
 * 
 * This file defines the structure for all data collected from the Control tab
 * that will be sent to the DAQ system.
 */

export interface TriggerConfig {
  duration: number;
  delay: number;
}

export interface TriggersData {
  enable: TriggerConfig;
  dcField: TriggerConfig;
  rmfField: TriggerConfig;
  extra: TriggerConfig;
}

export interface RaspberryPiData {
  rmfFreq: number;
  dutyCycle1: number;
  dutyCycle2: number;
}

export interface FileHandleData {
  date: string;
  shotNumber?: number;
  fileName: string;
  fileAppend: string;
  saveDirectory: string;
  saveData: boolean;
}

export interface ShotInfoData {
  gas: string;
  pressure?: number;
  rfPower?: number;
  batteryVoltage?: number;
}

/**
 * Complete DAQ Control Data structure
 * 
 * This is the main data object that encapsulates all control parameters
 * for the DAQ system. It is sent to the backend when the user clicks
 * "Send Settings" button.
 */
export interface DAQControlData {
  triggers: TriggersData;
  raspberryPi: RaspberryPiData;
  fileHandle: FileHandleData;
  shotInfo: ShotInfoData;
}
