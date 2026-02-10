/**
 * Automatic DSP Auto-Tuning
 * 
 * Deterministic in-browser auto-tuning that produces concrete
 * DSPProcessingOptions from audio feature extraction.
 */

import { DSPProcessingOptions } from './dsp/dspTypes';
import { analyzeAudioFile, generateSuggestedSettings, AudioFeatures, SuggestedSettings } from './autoAudioAssessment';

export interface AutoTuneResult {
  dspOptions: DSPProcessingOptions;
  features: AudioFeatures;
  suggestions: SuggestedSettings;
  appliedIntensity: number;
}

/**
 * Auto-tune DSP parameters from audio file with intensity scaling
 */
export async function autoTuneDSP(
  file: File,
  intensity: number = 1.0 // 0-1 scale for overall enhancement amount
): Promise<AutoTuneResult> {
  try {
    // Clamp intensity to valid range
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // Analyze audio features
    const features = await analyzeAudioFile(file);

    // Generate base suggestions
    const suggestions = generateSuggestedSettings(features);

    // Scale strengths and adjustments by intensity
    const scaledSuggestions: SuggestedSettings = {
      ...suggestions,
      noiseSuppressionStrength: Math.round(suggestions.noiseSuppressionStrength * clampedIntensity),
      transientSuppressionStrength: Math.round(suggestions.transientSuppressionStrength * clampedIntensity),
      voiceIsolationStrength: Math.round(suggestions.voiceIsolationStrength * clampedIntensity),
      spectralRepairStrength: Math.round(suggestions.spectralRepairStrength * clampedIntensity),
      dynamicEQStrength: Math.round(suggestions.dynamicEQStrength * clampedIntensity),
      deClickDeChirpStrength: Math.round(suggestions.deClickDeChirpStrength * clampedIntensity),
      lowBand: suggestions.lowBand * clampedIntensity,
      midBand: suggestions.midBand * clampedIntensity,
      highBand: suggestions.highBand * clampedIntensity,
    };

    // Build DSPProcessingOptions
    const dspOptions: DSPProcessingOptions = {
      noiseSuppression: {
        enabled: scaledSuggestions.noiseSuppression && clampedIntensity > 0.1,
        strength: scaledSuggestions.noiseSuppressionStrength,
      },
      transientSuppression: {
        enabled: scaledSuggestions.transientSuppression && clampedIntensity > 0.1,
        strength: scaledSuggestions.transientSuppressionStrength,
      },
      voiceIsolation: {
        enabled: scaledSuggestions.voiceIsolation && clampedIntensity > 0.1,
        strength: scaledSuggestions.voiceIsolationStrength,
      },
      spectralRepair: {
        enabled: scaledSuggestions.spectralRepair && clampedIntensity > 0.1,
        strength: scaledSuggestions.spectralRepairStrength,
      },
      dynamicEQ: {
        enabled: scaledSuggestions.dynamicEQ && clampedIntensity > 0.1,
        strength: scaledSuggestions.dynamicEQStrength,
      },
      deClickDeChirp: {
        enabled: scaledSuggestions.deClickDeChirp && clampedIntensity > 0.1,
        strength: scaledSuggestions.deClickDeChirpStrength,
      },
      lowBandAdjustment: scaledSuggestions.lowBand,
      midBandAdjustment: scaledSuggestions.midBand,
      highBandAdjustment: scaledSuggestions.highBand,
      onProgress: undefined, // Will be set by caller
    };

    return {
      dspOptions,
      features,
      suggestions: scaledSuggestions,
      appliedIntensity: clampedIntensity,
    };
  } catch (error) {
    console.error('Auto-tune error:', error);
    
    // Return safe defaults on failure
    return {
      dspOptions: {
        noiseSuppression: { enabled: true, strength: 50 },
        transientSuppression: { enabled: true, strength: 50 },
        voiceIsolation: { enabled: true, strength: 50 },
        spectralRepair: { enabled: true, strength: 50 },
        dynamicEQ: { enabled: false, strength: 50 },
        deClickDeChirp: { enabled: false, strength: 50 },
        lowBandAdjustment: 0,
        midBandAdjustment: 0,
        highBandAdjustment: 0,
      },
      features: {
        rmsLevel: 0,
        peakLevel: 0,
        dynamicRange: 0,
        noiseFloor: 0,
        spectralCentroid: 0,
        spectralRolloff: 0,
        zeroCrossingRate: 0,
        lowEnergyRatio: 0,
        midEnergyRatio: 0,
        highEnergyRatio: 0,
        sibilanceEnergy: 0,
        transientDensity: 0,
      },
      suggestions: {
        noiseSuppression: true,
        noiseSuppressionStrength: 50,
        transientSuppression: true,
        transientSuppressionStrength: 50,
        voiceIsolation: true,
        voiceIsolationStrength: 50,
        spectralRepair: true,
        spectralRepairStrength: 50,
        dynamicEQ: false,
        dynamicEQStrength: 50,
        deClickDeChirp: false,
        deClickDeChirpStrength: 50,
        lowBand: 0,
        midBand: 0,
        highBand: 0,
        confidence: 0,
      },
      appliedIntensity: intensity,
    };
  }
}
