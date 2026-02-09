/**
 * DSP Types and Utilities
 * 
 * Shared TypeScript types for browser-based audio DSP processing
 * using Web Audio API and OfflineAudioContext
 */

export interface DSPStageOptions {
  enabled: boolean;
  strength: number; // 0-100
}

export interface DSPProcessingOptions {
  noiseSuppression?: DSPStageOptions;
  transientSuppression?: DSPStageOptions;
  voiceIsolation?: DSPStageOptions;
  spectralRepair?: DSPStageOptions;
  dynamicEQ?: DSPStageOptions;
  deClickDeChirp?: DSPStageOptions;
  lowBandAdjustment?: number; // -12 to +12 dB
  midBandAdjustment?: number; // -12 to +12 dB
  highBandAdjustment?: number; // -12 to +12 dB
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Normalize strength value (0-100) to a usable range
 */
export function normalizeStrength(strength: number, min: number, max: number): number {
  return min + (strength / 100) * (max - min);
}

/**
 * Map strength to threshold value (inverted - higher strength = lower threshold)
 */
export function strengthToThreshold(strength: number, minThreshold: number, maxThreshold: number): number {
  // Invert: 0% strength = maxThreshold (lenient), 100% strength = minThreshold (aggressive)
  return maxThreshold - (strength / 100) * (maxThreshold - minThreshold);
}

/**
 * Map strength to ratio value
 */
export function strengthToRatio(strength: number, minRatio: number, maxRatio: number): number {
  return minRatio + (strength / 100) * (maxRatio - minRatio);
}

/**
 * Map strength to Q factor
 */
export function strengthToQ(strength: number, minQ: number, maxQ: number): number {
  return minQ + (strength / 100) * (maxQ - minQ);
}

/**
 * Map strength to gain value
 */
export function strengthToGain(strength: number, minGain: number, maxGain: number): number {
  return minGain + (strength / 100) * (maxGain - minGain);
}

/**
 * Map strength to frequency value
 */
export function strengthToFrequency(strength: number, minFreq: number, maxFreq: number): number {
  return minFreq + (strength / 100) * (maxFreq - minFreq);
}
