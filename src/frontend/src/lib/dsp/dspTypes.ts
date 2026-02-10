/**
 * DSP Type Definitions and Utilities
 */

export interface StageConfig {
  enabled: boolean;
  strength: number; // 0-100
}

export interface DSPProcessingOptions {
  noiseSuppression?: StageConfig;
  transientSuppression?: StageConfig;
  voiceIsolation?: StageConfig;
  spectralRepair?: StageConfig;
  dynamicEQ?: StageConfig;
  deClickDeChirp?: StageConfig;
  lowBandAdjustment?: number; // -12 to +12 dB
  midBandAdjustment?: number; // -12 to +12 dB
  highBandAdjustment?: number; // -12 to +12 dB
  onProgress?: (progress: number, stage: string) => void;
  diagnosticsMode?: boolean; // Enable checkpoint rendering
}

/**
 * Map strength (0-100) to threshold value (dB)
 */
export function strengthToThreshold(strength: number, minThreshold: number, maxThreshold: number): number {
  const normalized = strength / 100;
  return minThreshold + (maxThreshold - minThreshold) * normalized;
}

/**
 * Map strength (0-100) to compression ratio
 */
export function strengthToRatio(strength: number, minRatio: number, maxRatio: number): number {
  const normalized = strength / 100;
  return minRatio + (maxRatio - minRatio) * normalized;
}

/**
 * Map strength (0-100) to filter Q value
 */
export function strengthToQ(strength: number, minQ: number, maxQ: number): number {
  const normalized = strength / 100;
  return minQ + (maxQ - minQ) * normalized;
}

/**
 * Map strength (0-100) to gain value (dB)
 */
export function strengthToGain(strength: number, minGain: number, maxGain: number): number {
  const normalized = strength / 100;
  return minGain + (maxGain - minGain) * normalized;
}

/**
 * Map strength (0-100) to frequency value (Hz)
 */
export function strengthToFrequency(strength: number, minFreq: number, maxFreq: number): number {
  const normalized = strength / 100;
  return minFreq + (maxFreq - minFreq) * normalized;
}
