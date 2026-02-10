/**
 * Advanced Audio DSP Processing Engine
 * 
 * Browser-based audio processing using Web Audio API and OfflineAudioContext
 * Implements professional-grade DSP techniques for audio enhancement
 * 
 * KEY FEATURES:
 * - Multi-stage noise suppression with adaptive filtering
 * - Transient suppression for impulse noise reduction
 * - Voice/dialogue isolation via frequency-domain filtering
 * - Spectral repair for distortion correction
 * - Dynamic EQ for frequency-dependent compression
 * - De-click/de-chirp for artifact removal
 * - 3-band parametric EQ
 * - Real-time progress reporting
 * - Diagnostics mode for checkpoint rendering
 */

import { DSPProcessingOptions } from './dsp/dspTypes';
import {
  buildNoiseSuppressionChain,
  buildTransientSuppressionChain,
  buildVoiceIsolationChain,
  buildSpectralRepairChain,
  buildDynamicEQChain,
  buildDeClickDeChirpChain,
  build3BandEQ,
  buildPreNormalization,
  buildFinalNormalization,
} from './dsp/stageBuilders';

/**
 * Main audio processing function with DSP enhancements
 */
export async function processAudioWithDSP(
  audioBuffer: AudioBuffer,
  options: DSPProcessingOptions = {}
): Promise<AudioBuffer> {
  const {
    noiseSuppression = { enabled: true, strength: 80 },
    transientSuppression = { enabled: true, strength: 75 },
    voiceIsolation = { enabled: true, strength: 85 },
    spectralRepair = { enabled: true, strength: 70 },
    dynamicEQ = { enabled: false, strength: 50 },
    deClickDeChirp = { enabled: false, strength: 50 },
    lowBandAdjustment = 0,
    midBandAdjustment = 0,
    highBandAdjustment = 0,
    onProgress = () => {},
    diagnosticsMode = false,
  } = options;

  try {
    onProgress(5, 'Initializing DSP pipeline...');

    // Create offline context for processing
    // Note: OfflineAudioContext does not have a close() method and is automatically
    // cleaned up after rendering completes
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    let currentNode: AudioNode = source;
    let progressStep = 10;
    const stageIncrement = 12;

    // Stage 1: Pre-normalization
    onProgress(progressStep, 'Applying input normalization...');
    currentNode = buildPreNormalization(offlineContext, currentNode);
    progressStep += stageIncrement;

    // In diagnostics mode, skip all DSP stages except normalization
    if (!diagnosticsMode) {
      // Stage 2: Noise Suppression
      if (noiseSuppression.enabled && noiseSuppression.strength > 0) {
        onProgress(progressStep, 'Suppressing background noise...');
        currentNode = buildNoiseSuppressionChain(offlineContext, currentNode, noiseSuppression.strength);
      }
      progressStep += stageIncrement;

      // Stage 3: Transient Suppression
      if (transientSuppression.enabled && transientSuppression.strength > 0) {
        onProgress(progressStep, 'Reducing transient sounds...');
        currentNode = buildTransientSuppressionChain(offlineContext, currentNode, transientSuppression.strength);
      }
      progressStep += stageIncrement;

      // Stage 4: Voice Isolation
      if (voiceIsolation.enabled && voiceIsolation.strength > 0) {
        onProgress(progressStep, 'Isolating voice frequencies...');
        currentNode = buildVoiceIsolationChain(offlineContext, currentNode, voiceIsolation.strength);
      }
      progressStep += stageIncrement;

      // Stage 5: Spectral Repair
      if (spectralRepair.enabled && spectralRepair.strength > 0) {
        onProgress(progressStep, 'Repairing spectral distortion...');
        currentNode = buildSpectralRepairChain(offlineContext, currentNode, spectralRepair.strength);
      }
      progressStep += stageIncrement;

      // Stage 6: Dynamic EQ
      if (dynamicEQ.enabled && dynamicEQ.strength > 0) {
        onProgress(progressStep, 'Applying dynamic equalization...');
        currentNode = buildDynamicEQChain(offlineContext, currentNode, dynamicEQ.strength);
      }
      progressStep += stageIncrement;

      // Stage 7: De-click/De-chirp
      if (deClickDeChirp.enabled && deClickDeChirp.strength > 0) {
        onProgress(progressStep, 'Removing clicks and chirps...');
        currentNode = buildDeClickDeChirpChain(offlineContext, currentNode, deClickDeChirp.strength);
      }
      progressStep += stageIncrement;

      // Stage 8: 3-Band Tone Profiling
      if (lowBandAdjustment !== 0 || midBandAdjustment !== 0 || highBandAdjustment !== 0) {
        onProgress(progressStep, 'Applying tone profiling...');
        currentNode = build3BandEQ(offlineContext, currentNode, {
          low: lowBandAdjustment,
          mid: midBandAdjustment,
          high: highBandAdjustment,
        });
      }
      progressStep += stageIncrement;
    }

    // Stage 9: Final Normalization
    onProgress(90, 'Applying output normalization...');
    currentNode = buildFinalNormalization(offlineContext, currentNode);

    // Connect to destination
    currentNode.connect(offlineContext.destination);
    source.start(0);

    onProgress(95, 'Rendering audio...');
    const processedBuffer = await offlineContext.startRendering();

    onProgress(100, 'Processing complete');
    return processedBuffer;
  } catch (error) {
    console.error('Audio processing error:', error);
    throw new Error('Failed to process audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
  // Note: OfflineAudioContext does not need explicit cleanup via close()
  // It is automatically cleaned up after startRendering() completes
}

// Export legacy name for backward compatibility
export const processAudioWithAI = processAudioWithDSP;
