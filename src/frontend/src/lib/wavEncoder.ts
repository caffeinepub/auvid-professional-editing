/**
 * Hardened WAV Encoder
 * 
 * Centralized WAV encoding with NaN/Infinity sanitization,
 * safe int16 conversion, and diagnostic reporting.
 */

export interface EncodingDiagnostics {
  sanitizedSamples: number;
  clippedSamples: number;
  totalSamples: number;
}

/**
 * Encode AudioBuffer to WAV with sanitization and diagnostics
 */
export function encodeWAV(buffer: AudioBuffer): { blob: Blob; diagnostics: EncodingDiagnostics } {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numberOfChannels * 2; // 16-bit samples
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  let sanitizedSamples = 0;
  let clippedSamples = 0;
  let totalSamples = 0;

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
  view.setUint16(32, numberOfChannels * 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write audio data with sanitization
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      totalSamples++;

      // Sanitize NaN and Infinity
      if (isNaN(sample) || !isFinite(sample)) {
        sample = 0;
        sanitizedSamples++;
      }

      // Clamp to [-1, 1]
      if (sample > 1.0 || sample < -1.0) {
        clippedSamples++;
        sample = Math.max(-1, Math.min(1, sample));
      }

      // Convert to int16 with proper rounding
      const int16Value = Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      
      // Ensure value is within int16 range
      const clampedInt16 = Math.max(-32768, Math.min(32767, int16Value));
      
      view.setInt16(offset, clampedInt16, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  
  return {
    blob,
    diagnostics: {
      sanitizedSamples,
      clippedSamples,
      totalSamples,
    },
  };
}

/**
 * Decode WAV blob back to AudioBuffer for verification
 */
export async function decodeWAV(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();
  return audioBuffer;
}
