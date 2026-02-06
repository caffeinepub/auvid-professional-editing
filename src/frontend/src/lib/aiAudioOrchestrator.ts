/**
 * AI Audio Orchestrator
 * 
 * Deterministic front-end AI system that converts user prompts into audio processing plans.
 * Analyzes prompts and optional audio characteristics to select optimal processing stages.
 */

export interface AudioPlan {
  deepNoiseSuppression: boolean;
  voiceIsolation: boolean;
  transientReduction: boolean;
  spectralRepair: boolean;
  speechEnhancement: boolean;
  professionalGradeDenoising: boolean;
  dynamicRangeCompression: boolean;
  adaptiveFiltering: boolean;
  normalization: boolean;
  frequencyTargeting: boolean;
  voiceClarityEnhancement: boolean;
  eqCurveOptimization: boolean;
  volumeConsistency: boolean;
  prePostGainControl: boolean;
  phaseAlignment: boolean;
  frequencyResponseAdjustment: boolean;
  spectralDataGeneration: boolean;
}

export interface AudioAnalysis {
  duration: number;
  hasLoudTransients: boolean;
  hasLowFrequencyNoise: boolean;
  hasHighFrequencyNoise: boolean;
}

/**
 * Analyze audio file for characteristics that inform processing decisions
 */
export async function analyzeAudio(file: File): Promise<AudioAnalysis> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    
    // Simple transient detection (look for sudden amplitude spikes)
    let hasLoudTransients = false;
    const threshold = 0.7;
    for (let i = 1; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold && Math.abs(channelData[i] - channelData[i - 1]) > 0.3) {
        hasLoudTransients = true;
        break;
      }
    }
    
    // Simple frequency analysis proxy (check for sustained low/high energy)
    const firstQuarter = channelData.slice(0, Math.floor(channelData.length / 4));
    const avgAmplitude = firstQuarter.reduce((sum, val) => sum + Math.abs(val), 0) / firstQuarter.length;
    
    const hasLowFrequencyNoise = avgAmplitude > 0.1;
    const hasHighFrequencyNoise = avgAmplitude > 0.05;
    
    await audioContext.close();
    
    return {
      duration,
      hasLoudTransients,
      hasLowFrequencyNoise,
      hasHighFrequencyNoise,
    };
  } catch (error) {
    console.warn('Audio analysis failed, using defaults:', error);
    return {
      duration: 0,
      hasLoudTransients: false,
      hasLowFrequencyNoise: false,
      hasHighFrequencyNoise: false,
    };
  }
}

/**
 * Generate a human-readable summary of the AI plan
 */
export function generatePlanSummary(plan: AudioPlan): string {
  const features: string[] = [];
  
  if (plan.deepNoiseSuppression) features.push('Deep noise suppression');
  if (plan.voiceIsolation) features.push('Voice isolation');
  if (plan.transientReduction) features.push('Transient reduction');
  if (plan.spectralRepair) features.push('Spectral repair');
  if (plan.speechEnhancement) features.push('Speech clarity');
  
  if (features.length === 0) {
    return 'AI plan: Standard audio processing';
  }
  
  return `AI plan: ${features.join(' + ')}`;
}

/**
 * Convert user prompt into deterministic audio processing plan
 */
export function promptToPlan(prompt: string, audioAnalysis?: AudioAnalysis): AudioPlan {
  const lowerPrompt = prompt.toLowerCase();
  
  // Initialize plan with defaults
  const plan: AudioPlan = {
    deepNoiseSuppression: false,
    voiceIsolation: false,
    transientReduction: false,
    spectralRepair: false,
    speechEnhancement: false,
    professionalGradeDenoising: false,
    dynamicRangeCompression: false,
    adaptiveFiltering: false,
    normalization: true, // Always normalize
    frequencyTargeting: false,
    voiceClarityEnhancement: false,
    eqCurveOptimization: false,
    volumeConsistency: true, // Always ensure volume consistency
    prePostGainControl: true, // Always control gain
    phaseAlignment: true, // Always preserve phase
    frequencyResponseAdjustment: false,
    spectralDataGeneration: false,
  };
  
  // Detect intent from prompt keywords
  const wantsNoiseRemoval = /\b(noise|background|clean|remove|suppress|eliminate|quiet|hiss|hum|buzz|static)\b/.test(lowerPrompt);
  const wantsVoiceIsolation = /\b(voice|speech|dialogue|vocal|isolate|extract|separate|only)\b/.test(lowerPrompt);
  const wantsClarity = /\b(clear|clarity|crisp|sharp|enhance|improve|quality|better|professional)\b/.test(lowerPrompt);
  const wantsTransientRemoval = /\b(bang|slam|knock|click|pop|thump|bump|impact|transient)\b/.test(lowerPrompt);
  const wantsSpectralRepair = /\b(repair|fix|restore|artifact|distortion|glitch)\b/.test(lowerPrompt);
  
  // Apply AI logic based on prompt analysis
  if (wantsNoiseRemoval) {
    plan.deepNoiseSuppression = true;
    plan.professionalGradeDenoising = true;
    plan.adaptiveFiltering = true;
    plan.spectralRepair = true;
  }
  
  if (wantsVoiceIsolation) {
    plan.voiceIsolation = true;
    plan.deepNoiseSuppression = true;
    plan.frequencyTargeting = true;
  }
  
  if (wantsClarity) {
    plan.speechEnhancement = true;
    plan.voiceClarityEnhancement = true;
    plan.eqCurveOptimization = true;
    plan.frequencyResponseAdjustment = true;
  }
  
  if (wantsTransientRemoval) {
    plan.transientReduction = true;
    plan.dynamicRangeCompression = true;
  }
  
  if (wantsSpectralRepair) {
    plan.spectralRepair = true;
    plan.spectralDataGeneration = true;
  }
  
  // Refine plan based on audio analysis if available
  if (audioAnalysis) {
    if (audioAnalysis.hasLoudTransients && !plan.transientReduction) {
      plan.transientReduction = true;
      plan.dynamicRangeCompression = true;
    }
    
    if (audioAnalysis.hasLowFrequencyNoise && !plan.deepNoiseSuppression) {
      plan.deepNoiseSuppression = true;
      plan.adaptiveFiltering = true;
    }
    
    if (audioAnalysis.hasHighFrequencyNoise && !plan.spectralRepair) {
      plan.spectralRepair = true;
    }
  }
  
  // If no specific features detected, apply comprehensive processing
  if (!wantsNoiseRemoval && !wantsVoiceIsolation && !wantsClarity && !wantsTransientRemoval && !wantsSpectralRepair) {
    plan.deepNoiseSuppression = true;
    plan.voiceIsolation = true;
    plan.speechEnhancement = true;
    plan.spectralRepair = true;
    plan.transientReduction = true;
    plan.professionalGradeDenoising = true;
    plan.adaptiveFiltering = true;
    plan.frequencyTargeting = true;
    plan.voiceClarityEnhancement = true;
    plan.eqCurveOptimization = true;
    plan.frequencyResponseAdjustment = true;
  }
  
  return plan;
}
