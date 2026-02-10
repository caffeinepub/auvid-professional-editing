/**
 * Automatic Audio Assessment
 * 
 * In-browser audio feature extraction and analysis to suggest
 * optimal DSP settings without requiring user input.
 */

export interface AudioFeatures {
  rmsLevel: number;           // Overall loudness (0-1)
  peakLevel: number;          // Peak amplitude (0-1)
  dynamicRange: number;       // Peak/RMS ratio (dB)
  noiseFloor: number;         // Estimated noise floor (0-1)
  spectralCentroid: number;   // Brightness measure (Hz)
  spectralRolloff: number;    // High-frequency content (Hz)
  zeroCrossingRate: number;   // Noisiness indicator (0-1)
  lowEnergyRatio: number;     // Low-frequency content (0-1)
  midEnergyRatio: number;     // Mid-frequency content (0-1)
  highEnergyRatio: number;    // High-frequency content (0-1)
  sibilanceEnergy: number;    // Harsh high-frequency content (0-1)
  transientDensity: number;   // Impulsive sound density (0-1)
}

export interface SuggestedSettings {
  noiseSuppression: boolean;
  noiseSuppressionStrength: number;
  transientSuppression: boolean;
  transientSuppressionStrength: number;
  voiceIsolation: boolean;
  voiceIsolationStrength: number;
  spectralRepair: boolean;
  spectralRepairStrength: number;
  dynamicEQ: boolean;
  dynamicEQStrength: number;
  deClickDeChirp: boolean;
  deClickDeChirpStrength: number;
  lowBand: number;
  midBand: number;
  highBand: number;
  confidence: number; // 0-1 confidence in suggestions
}

/**
 * Analyze audio file and extract features
 */
export async function analyzeAudioFile(file: File): Promise<AudioFeatures> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get channel data (mix to mono for analysis)
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const length = channelData.length;

    // Calculate RMS level
    let sumSquares = 0;
    let peakLevel = 0;
    let zeroCrossings = 0;
    let previousSample = 0;

    for (let i = 0; i < length; i++) {
      const sample = channelData[i];
      sumSquares += sample * sample;
      peakLevel = Math.max(peakLevel, Math.abs(sample));
      
      // Zero crossing detection
      if ((previousSample >= 0 && sample < 0) || (previousSample < 0 && sample >= 0)) {
        zeroCrossings++;
      }
      previousSample = sample;
    }

    const rmsLevel = Math.sqrt(sumSquares / length);
    const zeroCrossingRate = zeroCrossings / length;

    // Calculate dynamic range
    const dynamicRange = peakLevel > 0 && rmsLevel > 0 
      ? 20 * Math.log10(peakLevel / rmsLevel) 
      : 0;

    // Estimate noise floor (lowest 10% of RMS values in 100ms windows)
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const windowCount = Math.floor(length / windowSize);
    const windowRMS: number[] = [];

    for (let w = 0; w < windowCount; w++) {
      let windowSum = 0;
      const start = w * windowSize;
      const end = Math.min(start + windowSize, length);
      
      for (let i = start; i < end; i++) {
        windowSum += channelData[i] * channelData[i];
      }
      
      windowRMS.push(Math.sqrt(windowSum / (end - start)));
    }

    windowRMS.sort((a, b) => a - b);
    const noiseFloor = windowRMS[Math.floor(windowRMS.length * 0.1)] || 0;

    // FFT-based spectral analysis
    const fftSize = 2048;
    const fftCount = Math.floor(length / fftSize);
    let spectralCentroidSum = 0;
    let spectralRolloffSum = 0;
    let lowEnergySum = 0;
    let midEnergySum = 0;
    let highEnergySum = 0;
    let sibilanceEnergySum = 0;

    for (let f = 0; f < Math.min(fftCount, 50); f++) { // Sample up to 50 windows
      const offset = f * fftSize;
      const fftData = channelData.slice(offset, offset + fftSize);
      
      // Simple magnitude spectrum calculation
      const spectrum = computeMagnitudeSpectrum(fftData);
      const freqBinWidth = sampleRate / fftSize;

      let totalEnergy = 0;
      let weightedFreqSum = 0;
      let rolloffEnergy = 0;
      const rolloffThreshold = 0.85;

      for (let i = 0; i < spectrum.length; i++) {
        const freq = i * freqBinWidth;
        const magnitude = spectrum[i];
        const energy = magnitude * magnitude;

        totalEnergy += energy;
        weightedFreqSum += freq * energy;

        // Band energy calculations
        if (freq < 250) {
          lowEnergySum += energy;
        } else if (freq < 4000) {
          midEnergySum += energy;
        } else {
          highEnergySum += energy;
        }

        // Sibilance detection (6-10 kHz)
        if (freq >= 6000 && freq <= 10000) {
          sibilanceEnergySum += energy;
        }
      }

      // Spectral centroid
      if (totalEnergy > 0) {
        spectralCentroidSum += weightedFreqSum / totalEnergy;
      }

      // Spectral rolloff (frequency below which 85% of energy is contained)
      let cumulativeEnergy = 0;
      for (let i = 0; i < spectrum.length; i++) {
        cumulativeEnergy += spectrum[i] * spectrum[i];
        if (cumulativeEnergy >= rolloffThreshold * totalEnergy) {
          spectralRolloffSum += i * freqBinWidth;
          break;
        }
      }
    }

    const avgCount = Math.min(fftCount, 50);
    const spectralCentroid = spectralCentroidSum / avgCount;
    const spectralRolloff = spectralRolloffSum / avgCount;

    const totalSpectralEnergy = lowEnergySum + midEnergySum + highEnergySum;
    const lowEnergyRatio = totalSpectralEnergy > 0 ? lowEnergySum / totalSpectralEnergy : 0;
    const midEnergyRatio = totalSpectralEnergy > 0 ? midEnergySum / totalSpectralEnergy : 0;
    const highEnergyRatio = totalSpectralEnergy > 0 ? highEnergySum / totalSpectralEnergy : 0;
    const sibilanceEnergy = totalSpectralEnergy > 0 ? sibilanceEnergySum / totalSpectralEnergy : 0;

    // Transient density (count rapid amplitude changes)
    let transientCount = 0;
    const transientThreshold = rmsLevel * 3;
    const transientWindowSize = Math.floor(sampleRate * 0.01); // 10ms

    for (let i = transientWindowSize; i < length - transientWindowSize; i += transientWindowSize) {
      const prevWindow = channelData.slice(i - transientWindowSize, i);
      const currWindow = channelData.slice(i, i + transientWindowSize);
      
      const prevPeak = Math.max(...prevWindow.map(Math.abs));
      const currPeak = Math.max(...currWindow.map(Math.abs));
      
      if (currPeak > transientThreshold && currPeak > prevPeak * 2) {
        transientCount++;
      }
    }

    const transientDensity = transientCount / (length / sampleRate); // transients per second

    await audioContext.close();

    return {
      rmsLevel,
      peakLevel,
      dynamicRange,
      noiseFloor,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      lowEnergyRatio,
      midEnergyRatio,
      highEnergyRatio,
      sibilanceEnergy,
      transientDensity: Math.min(transientDensity / 10, 1), // Normalize to 0-1
    };
  } catch (error) {
    console.error('Audio analysis error:', error);
    throw new Error('Failed to analyze audio file');
  }
}

/**
 * Simple magnitude spectrum calculation using DFT
 */
function computeMagnitudeSpectrum(samples: Float32Array): number[] {
  const N = samples.length;
  const spectrum: number[] = [];

  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;

    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += samples[n] * Math.cos(angle);
      imag -= samples[n] * Math.sin(angle);
    }

    spectrum.push(Math.sqrt(real * real + imag * imag) / N);
  }

  return spectrum;
}

/**
 * Generate suggested settings based on audio features
 */
export function generateSuggestedSettings(features: AudioFeatures): SuggestedSettings {
  // Noise suppression: Enable if noise floor is significant
  const noiseSuppressionNeeded = features.noiseFloor > 0.02 || features.zeroCrossingRate > 0.15;
  const noiseSuppressionStrength = Math.min(
    100,
    Math.max(30, Math.round((features.noiseFloor / 0.1) * 100))
  );

  // Transient suppression: Enable if high transient density
  const transientSuppressionNeeded = features.transientDensity > 0.3;
  const transientSuppressionStrength = Math.min(
    100,
    Math.max(40, Math.round(features.transientDensity * 150))
  );

  // Voice isolation: Enable if mid-range energy is dominant (speech indicator)
  const voiceIsolationNeeded = features.midEnergyRatio > 0.4 && features.spectralCentroid < 2500;
  const voiceIsolationStrength = Math.min(
    100,
    Math.max(50, Math.round(features.midEnergyRatio * 120))
  );

  // Spectral repair: Enable if high sibilance or harsh high frequencies
  const spectralRepairNeeded = features.sibilanceEnergy > 0.08 || features.spectralRolloff > 8000;
  const spectralRepairStrength = Math.min(
    100,
    Math.max(40, Math.round((features.sibilanceEnergy / 0.2) * 100))
  );

  // Dynamic EQ: Enable if unbalanced frequency distribution
  const frequencyImbalance = Math.max(
    Math.abs(features.lowEnergyRatio - 0.33),
    Math.abs(features.midEnergyRatio - 0.33),
    Math.abs(features.highEnergyRatio - 0.33)
  );
  const dynamicEQNeeded = frequencyImbalance > 0.15;
  const dynamicEQStrength = Math.min(
    100,
    Math.max(30, Math.round(frequencyImbalance * 200))
  );

  // De-click/De-chirp: Enable if high zero-crossing rate (indicates clicks/pops)
  const deClickDeChirpNeeded = features.zeroCrossingRate > 0.2 || features.transientDensity > 0.5;
  const deClickDeChirpStrength = Math.min(
    100,
    Math.max(35, Math.round(features.zeroCrossingRate * 300))
  );

  // Tone profiling adjustments
  // Low band: Reduce if excessive, boost if deficient
  let lowBand = 0;
  if (features.lowEnergyRatio > 0.45) {
    lowBand = -Math.min(6, Math.round((features.lowEnergyRatio - 0.45) * 30));
  } else if (features.lowEnergyRatio < 0.25) {
    lowBand = Math.min(4, Math.round((0.25 - features.lowEnergyRatio) * 20));
  }

  // Mid band: Boost for voice clarity if needed
  let midBand = 0;
  if (voiceIsolationNeeded && features.midEnergyRatio < 0.4) {
    midBand = Math.min(5, Math.round((0.4 - features.midEnergyRatio) * 25));
  } else if (features.midEnergyRatio > 0.5) {
    midBand = -Math.min(4, Math.round((features.midEnergyRatio - 0.5) * 20));
  }

  // High band: Reduce if excessive sibilance, boost if dull
  let highBand = 0;
  if (features.sibilanceEnergy > 0.12) {
    highBand = -Math.min(6, Math.round((features.sibilanceEnergy - 0.12) * 40));
  } else if (features.spectralCentroid < 1500 && features.highEnergyRatio < 0.2) {
    highBand = Math.min(4, Math.round((0.2 - features.highEnergyRatio) * 20));
  }

  // Calculate confidence based on feature clarity
  const confidence = Math.min(
    1,
    (features.rmsLevel > 0.01 ? 0.3 : 0) +
    (features.dynamicRange > 6 ? 0.3 : 0) +
    (Math.abs(features.lowEnergyRatio + features.midEnergyRatio + features.highEnergyRatio - 1) < 0.1 ? 0.4 : 0)
  );

  return {
    noiseSuppression: noiseSuppressionNeeded,
    noiseSuppressionStrength,
    transientSuppression: transientSuppressionNeeded,
    transientSuppressionStrength,
    voiceIsolation: voiceIsolationNeeded,
    voiceIsolationStrength,
    spectralRepair: spectralRepairNeeded,
    spectralRepairStrength,
    dynamicEQ: dynamicEQNeeded,
    dynamicEQStrength,
    deClickDeChirp: deClickDeChirpNeeded,
    deClickDeChirpStrength,
    lowBand,
    midBand,
    highBand,
    confidence,
  };
}
