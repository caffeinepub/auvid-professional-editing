/**
 * DSP Stage Builders
 * 
 * Reusable Web Audio node chain builders for common DSP operations
 * All processing is browser-native using OfflineAudioContext
 */

import {
  strengthToThreshold,
  strengthToRatio,
  strengthToQ,
  strengthToGain,
  strengthToFrequency,
} from './dspTypes';

/**
 * Build noise suppression chain
 */
export function buildNoiseSuppressionChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // High-pass filter to remove low-frequency rumble
  const highPass = context.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = strengthToFrequency(strength, 80, 120);
  highPass.Q.value = strengthToQ(strength, 0.7, 10.0);

  // Noise gate
  const noiseGate = context.createDynamicsCompressor();
  noiseGate.threshold.value = strengthToThreshold(strength, -85, -50);
  noiseGate.knee.value = 0.2;
  noiseGate.ratio.value = strengthToRatio(strength, 20, 150);
  noiseGate.attack.value = 0.00005;
  noiseGate.release.value = 0.005;

  // Low-pass filter to remove high-frequency hiss
  const lowPass = context.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = strengthToFrequency(strength, 8000, 6000);
  lowPass.Q.value = strengthToQ(strength, 0.7, 8.0);

  // Notch filters for AC hum (60Hz and 120Hz)
  const notch60Hz = context.createBiquadFilter();
  notch60Hz.type = 'notch';
  notch60Hz.frequency.value = 60;
  notch60Hz.Q.value = strengthToQ(strength, 1, 15);

  const notch120Hz = context.createBiquadFilter();
  notch120Hz.type = 'notch';
  notch120Hz.frequency.value = 120;
  notch120Hz.Q.value = strengthToQ(strength, 1, 15);

  inputNode.connect(highPass);
  highPass.connect(noiseGate);
  noiseGate.connect(lowPass);
  lowPass.connect(notch60Hz);
  notch60Hz.connect(notch120Hz);

  return notch120Hz;
}

/**
 * Build transient suppression chain
 */
export function buildTransientSuppressionChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // Fast attack compressor for transients
  const transientCompressor = context.createDynamicsCompressor();
  transientCompressor.threshold.value = strengthToThreshold(strength, -65, -40);
  transientCompressor.knee.value = 0.2;
  transientCompressor.ratio.value = strengthToRatio(strength, 10, 100);
  transientCompressor.attack.value = 0.000007;
  transientCompressor.release.value = 0.008;

  // Peaking filter to reduce impulsive frequencies
  const impulsiveFilter = context.createBiquadFilter();
  impulsiveFilter.type = 'peaking';
  impulsiveFilter.frequency.value = 3800;
  impulsiveFilter.Q.value = strengthToQ(strength, 1.5, 8.0);
  impulsiveFilter.gain.value = strengthToGain(strength, -3, -18);

  // Additional transient limiter
  const transientLimiter = context.createDynamicsCompressor();
  transientLimiter.threshold.value = strengthToThreshold(strength, -55, -35);
  transientLimiter.knee.value = 0.4;
  transientLimiter.ratio.value = strengthToRatio(strength, 10, 95);
  transientLimiter.attack.value = 0.00002;
  transientLimiter.release.value = 0.012;

  inputNode.connect(transientCompressor);
  transientCompressor.connect(impulsiveFilter);
  impulsiveFilter.connect(transientLimiter);

  return transientLimiter;
}

/**
 * Build voice isolation chain
 */
export function buildVoiceIsolationChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // Bandpass filter for voice frequencies
  const voiceBandpass = context.createBiquadFilter();
  voiceBandpass.type = 'bandpass';
  voiceBandpass.frequency.value = 1700;
  voiceBandpass.Q.value = strengthToQ(strength, 0.7, 5.0);

  // Fundamental frequency enhancement
  const fundamentalEnhancer = context.createBiquadFilter();
  fundamentalEnhancer.type = 'peaking';
  fundamentalEnhancer.frequency.value = 145;
  fundamentalEnhancer.Q.value = strengthToQ(strength, 1.0, 6.5);
  fundamentalEnhancer.gain.value = strengthToGain(strength, 0.5, 3.5);

  // First formant (vowel clarity)
  const formant1 = context.createBiquadFilter();
  formant1.type = 'peaking';
  formant1.frequency.value = 780;
  formant1.Q.value = strengthToQ(strength, 1.0, 5.5);
  formant1.gain.value = strengthToGain(strength, 0.5, 4.0);

  // Second formant (vowel distinction)
  const formant2 = context.createBiquadFilter();
  formant2.type = 'peaking';
  formant2.frequency.value = 1200;
  formant2.Q.value = strengthToQ(strength, 1.0, 5.8);
  formant2.gain.value = strengthToGain(strength, 0.5, 4.2);

  // Third formant (consonant clarity)
  const formant3 = context.createBiquadFilter();
  formant3.type = 'peaking';
  formant3.frequency.value = 2500;
  formant3.Q.value = strengthToQ(strength, 1.0, 6.0);
  formant3.gain.value = strengthToGain(strength, 0.5, 4.5);

  inputNode.connect(voiceBandpass);
  voiceBandpass.connect(fundamentalEnhancer);
  fundamentalEnhancer.connect(formant1);
  formant1.connect(formant2);
  formant2.connect(formant3);

  return formant3;
}

/**
 * Build spectral repair chain
 */
export function buildSpectralRepairChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // De-esser for harsh sibilance
  const deEsser = context.createBiquadFilter();
  deEsser.type = 'peaking';
  deEsser.frequency.value = 7000;
  deEsser.Q.value = strengthToQ(strength, 1.0, 4.5);
  deEsser.gain.value = strengthToGain(strength, -1, -10);

  // Harmonic enhancer
  const harmonicEnhancer = context.createBiquadFilter();
  harmonicEnhancer.type = 'peaking';
  harmonicEnhancer.frequency.value = 3000;
  harmonicEnhancer.Q.value = strengthToQ(strength, 1.0, 3.5);
  harmonicEnhancer.gain.value = strengthToGain(strength, 0.5, 3.5);

  // Clarity enhancer
  const clarityEnhancer = context.createBiquadFilter();
  clarityEnhancer.type = 'highshelf';
  clarityEnhancer.frequency.value = 5000;
  clarityEnhancer.gain.value = strengthToGain(strength, 0.5, 4.0);

  inputNode.connect(deEsser);
  deEsser.connect(harmonicEnhancer);
  harmonicEnhancer.connect(clarityEnhancer);

  return clarityEnhancer;
}

/**
 * Build dynamic EQ chain
 */
export function buildDynamicEQChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // Dynamic low-frequency control
  const lowDynamicComp = context.createDynamicsCompressor();
  lowDynamicComp.threshold.value = strengthToThreshold(strength, -30, -15);
  lowDynamicComp.knee.value = 6;
  lowDynamicComp.ratio.value = strengthToRatio(strength, 2, 8);
  lowDynamicComp.attack.value = 0.005;
  lowDynamicComp.release.value = 0.1;

  // Low-frequency filter
  const lowFilter = context.createBiquadFilter();
  lowFilter.type = 'lowshelf';
  lowFilter.frequency.value = 200;
  lowFilter.gain.value = strengthToGain(strength, -1, -6);

  // Dynamic mid-frequency control
  const midDynamicComp = context.createDynamicsCompressor();
  midDynamicComp.threshold.value = strengthToThreshold(strength, -25, -10);
  midDynamicComp.knee.value = 8;
  midDynamicComp.ratio.value = strengthToRatio(strength, 2, 6);
  midDynamicComp.attack.value = 0.003;
  midDynamicComp.release.value = 0.08;

  // Mid-frequency notch for problem frequencies
  const midNotch = context.createBiquadFilter();
  midNotch.type = 'peaking';
  midNotch.frequency.value = 500;
  midNotch.Q.value = strengthToQ(strength, 1.0, 4.0);
  midNotch.gain.value = strengthToGain(strength, -0.5, -4);

  // Dynamic high-frequency control
  const highDynamicComp = context.createDynamicsCompressor();
  highDynamicComp.threshold.value = strengthToThreshold(strength, -20, -8);
  highDynamicComp.knee.value = 6;
  highDynamicComp.ratio.value = strengthToRatio(strength, 2, 5);
  highDynamicComp.attack.value = 0.001;
  highDynamicComp.release.value = 0.05;

  inputNode.connect(lowDynamicComp);
  lowDynamicComp.connect(lowFilter);
  lowFilter.connect(midDynamicComp);
  midDynamicComp.connect(midNotch);
  midNotch.connect(highDynamicComp);

  return highDynamicComp;
}

/**
 * Build de-click/de-chirp chain
 */
export function buildDeClickDeChirpChain(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  strength: number
): AudioNode {
  // Ultra-fast attack compressor for clicks
  const clickSuppressor = context.createDynamicsCompressor();
  clickSuppressor.threshold.value = strengthToThreshold(strength, -50, -30);
  clickSuppressor.knee.value = 0;
  clickSuppressor.ratio.value = strengthToRatio(strength, 20, 150);
  clickSuppressor.attack.value = 0.000001;
  clickSuppressor.release.value = 0.002;

  // High-frequency click filter
  const clickFilter = context.createBiquadFilter();
  clickFilter.type = 'peaking';
  clickFilter.frequency.value = 8000;
  clickFilter.Q.value = strengthToQ(strength, 2.0, 10.0);
  clickFilter.gain.value = strengthToGain(strength, -2, -12);

  // Chirp suppressor (rapid frequency sweeps)
  const chirpFilter = context.createBiquadFilter();
  chirpFilter.type = 'peaking';
  chirpFilter.frequency.value = 5000;
  chirpFilter.Q.value = strengthToQ(strength, 1.5, 8.0);
  chirpFilter.gain.value = strengthToGain(strength, -1.5, -10);

  // Additional limiter for impulse control
  const impulseLimiter = context.createDynamicsCompressor();
  impulseLimiter.threshold.value = strengthToThreshold(strength, -40, -25);
  impulseLimiter.knee.value = 0;
  impulseLimiter.ratio.value = strengthToRatio(strength, 30, 200);
  impulseLimiter.attack.value = 0.000001;
  impulseLimiter.release.value = 0.001;

  inputNode.connect(clickSuppressor);
  clickSuppressor.connect(clickFilter);
  clickFilter.connect(chirpFilter);
  chirpFilter.connect(impulseLimiter);

  return impulseLimiter;
}

/**
 * Build 3-band EQ
 */
export function build3BandEQ(
  context: OfflineAudioContext,
  inputNode: AudioNode,
  bands: { low: number; mid: number; high: number }
): AudioNode {
  // Low band (20-250 Hz)
  const lowBand = context.createBiquadFilter();
  lowBand.type = 'lowshelf';
  lowBand.frequency.value = 250;
  lowBand.gain.value = bands.low;

  // Mid band (250-4000 Hz)
  const midBand = context.createBiquadFilter();
  midBand.type = 'peaking';
  midBand.frequency.value = 1500;
  midBand.Q.value = 0.7;
  midBand.gain.value = bands.mid;

  // High band (4000-20000 Hz)
  const highBand = context.createBiquadFilter();
  highBand.type = 'highshelf';
  highBand.frequency.value = 4000;
  highBand.gain.value = bands.high;

  inputNode.connect(lowBand);
  lowBand.connect(midBand);
  midBand.connect(highBand);

  return highBand;
}

/**
 * Build pre-normalization chain
 */
export function buildPreNormalization(
  context: OfflineAudioContext,
  inputNode: AudioNode
): AudioNode {
  const inputGain = context.createGain();
  inputGain.gain.value = 0.316; // -10 dB

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -32;
  compressor.knee.value = 6;
  compressor.ratio.value = 5.5;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.06;

  inputNode.connect(inputGain);
  inputGain.connect(compressor);

  return compressor;
}

/**
 * Build final normalization chain
 */
export function buildFinalNormalization(
  context: OfflineAudioContext,
  inputNode: AudioNode
): AudioNode {
  const finalCompressor = context.createDynamicsCompressor();
  finalCompressor.threshold.value = -18;
  finalCompressor.knee.value = 8;
  finalCompressor.ratio.value = 3;
  finalCompressor.attack.value = 0.003;
  finalCompressor.release.value = 0.15;

  const finalLimiter = context.createDynamicsCompressor();
  finalLimiter.threshold.value = -3;
  finalLimiter.knee.value = 0;
  finalLimiter.ratio.value = 20;
  finalLimiter.attack.value = 0.001;
  finalLimiter.release.value = 0.1;

  const outputGain = context.createGain();
  outputGain.gain.value = 0.9;

  inputNode.connect(finalCompressor);
  finalCompressor.connect(finalLimiter);
  finalLimiter.connect(outputGain);

  return outputGain;
}
