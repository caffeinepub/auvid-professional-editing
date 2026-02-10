/**
 * Audio Metrics Utilities
 * 
 * Reusable audio analysis utilities for computing numeric metrics
 * from AudioBuffer/Float32Array data.
 */

export interface AudioMetrics {
  sampleRate: number;
  channels: number;
  duration: number;
  peakLevel: number;
  rmsLevel: number;
  dcOffset: number;
  nanCount: number;
  infinityCount: number;
  clippingCount: number;
  clippingPercentage: number;
}

/**
 * Compute comprehensive metrics from an AudioBuffer
 */
export function computeAudioMetrics(buffer: AudioBuffer): AudioMetrics {
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const duration = buffer.duration;
  
  let peakLevel = 0;
  let sumSquares = 0;
  let dcSum = 0;
  let nanCount = 0;
  let infinityCount = 0;
  let clippingCount = 0;
  let totalSamples = 0;

  const clippingThreshold = 0.99; // Consider samples above 0.99 as clipping

  for (let ch = 0; ch < channels; ch++) {
    const channelData = buffer.getChannelData(ch);
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      totalSamples++;

      // Check for abnormal values
      if (isNaN(sample)) {
        nanCount++;
        continue;
      }
      
      if (!isFinite(sample)) {
        infinityCount++;
        continue;
      }

      // Peak level
      const absSample = Math.abs(sample);
      peakLevel = Math.max(peakLevel, absSample);

      // RMS calculation
      sumSquares += sample * sample;

      // DC offset
      dcSum += sample;

      // Clipping detection
      if (absSample >= clippingThreshold) {
        clippingCount++;
      }
    }
  }

  const rmsLevel = Math.sqrt(sumSquares / totalSamples);
  const dcOffset = dcSum / totalSamples;
  const clippingPercentage = (clippingCount / totalSamples) * 100;

  return {
    sampleRate,
    channels,
    duration,
    peakLevel,
    rmsLevel,
    dcOffset,
    nanCount,
    infinityCount,
    clippingCount,
    clippingPercentage,
  };
}

/**
 * Compute metrics from Float32Array channel data
 */
export function computeChannelMetrics(channelData: Float32Array): Omit<AudioMetrics, 'sampleRate' | 'channels' | 'duration'> {
  let peakLevel = 0;
  let sumSquares = 0;
  let dcSum = 0;
  let nanCount = 0;
  let infinityCount = 0;
  let clippingCount = 0;
  const totalSamples = channelData.length;

  const clippingThreshold = 0.99;

  for (let i = 0; i < channelData.length; i++) {
    const sample = channelData[i];

    if (isNaN(sample)) {
      nanCount++;
      continue;
    }
    
    if (!isFinite(sample)) {
      infinityCount++;
      continue;
    }

    const absSample = Math.abs(sample);
    peakLevel = Math.max(peakLevel, absSample);
    sumSquares += sample * sample;
    dcSum += sample;

    if (absSample >= clippingThreshold) {
      clippingCount++;
    }
  }

  const rmsLevel = Math.sqrt(sumSquares / totalSamples);
  const dcOffset = dcSum / totalSamples;
  const clippingPercentage = (clippingCount / totalSamples) * 100;

  return {
    peakLevel,
    rmsLevel,
    dcOffset,
    nanCount,
    infinityCount,
    clippingCount,
    clippingPercentage,
  };
}

/**
 * Detect if metrics indicate abnormal audio
 */
export function detectAbnormalities(metrics: AudioMetrics): {
  hasAbnormalities: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (metrics.nanCount > 0) {
    issues.push(`${metrics.nanCount} NaN samples detected`);
  }

  if (metrics.infinityCount > 0) {
    issues.push(`${metrics.infinityCount} Infinity samples detected`);
  }

  if (metrics.clippingPercentage > 5) {
    issues.push(`${metrics.clippingPercentage.toFixed(2)}% clipping detected (threshold: 5%)`);
  }

  if (Math.abs(metrics.dcOffset) > 0.1) {
    issues.push(`High DC offset: ${metrics.dcOffset.toFixed(4)}`);
  }

  if (metrics.peakLevel > 1.0) {
    issues.push(`Peak level exceeds 1.0: ${metrics.peakLevel.toFixed(4)}`);
  }

  return {
    hasAbnormalities: issues.length > 0,
    issues,
  };
}
