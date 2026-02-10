/**
 * Triple Check Diagnostics
 * 
 * In-browser audio diagnostics runner that compares:
 * 1. Decoded input
 * 2. Early pipeline checkpoint (after pre-normalization)
 * 3. Final processed output (after full DSP + encode/decode cycle)
 * 
 * Identifies which stage introduces abnormal values (NaN, clipping, etc.)
 */

import { DSPProcessingOptions } from './dsp/dspTypes';
import { processAudioWithDSP } from './audioProcessor';
import { computeAudioMetrics, detectAbnormalities, AudioMetrics } from './audioMetrics';
import { encodeWAV, decodeWAV } from './wavEncoder';

export interface CheckpointResult {
  name: string;
  stage: 'input' | 'early-pipeline' | 'final-output';
  metrics: AudioMetrics;
  abnormalities: {
    hasAbnormalities: boolean;
    issues: string[];
  };
  audioUrl: string; // For auditioning
}

export interface TripleCheckReport {
  checkpoints: CheckpointResult[];
  sourceStage: 'input' | 'early-pipeline' | 'final-output' | 'none';
  summary: string;
  processingSettings: DSPProcessingOptions;
  timestamp: string;
}

/**
 * Run Triple Check diagnostics on an audio file
 */
export async function runTripleCheck(
  file: File,
  settings: DSPProcessingOptions
): Promise<TripleCheckReport> {
  const checkpoints: CheckpointResult[] = [];
  
  try {
    // Checkpoint 1: Decoded Input
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const inputMetrics = computeAudioMetrics(decodedBuffer);
    const inputAbnormalities = detectAbnormalities(inputMetrics);
    
    // Create audio URL for input
    const inputWav = encodeWAV(decodedBuffer);
    const inputUrl = URL.createObjectURL(inputWav.blob);
    
    checkpoints.push({
      name: 'Decoded Input',
      stage: 'input',
      metrics: inputMetrics,
      abnormalities: inputAbnormalities,
      audioUrl: inputUrl,
    });

    // Checkpoint 2: Early Pipeline (minimal processing)
    const earlyPipelineBuffer = await processAudioWithDSP(decodedBuffer, {
      noiseSuppression: { enabled: false, strength: 0 },
      transientSuppression: { enabled: false, strength: 0 },
      voiceIsolation: { enabled: false, strength: 0 },
      spectralRepair: { enabled: false, strength: 0 },
      dynamicEQ: { enabled: false, strength: 0 },
      deClickDeChirp: { enabled: false, strength: 0 },
      lowBandAdjustment: 0,
      midBandAdjustment: 0,
      highBandAdjustment: 0,
      diagnosticsMode: true,
    });

    const earlyMetrics = computeAudioMetrics(earlyPipelineBuffer);
    const earlyAbnormalities = detectAbnormalities(earlyMetrics);
    
    const earlyWav = encodeWAV(earlyPipelineBuffer);
    const earlyUrl = URL.createObjectURL(earlyWav.blob);
    
    checkpoints.push({
      name: 'Early Pipeline (Pre-norm + Final-norm only)',
      stage: 'early-pipeline',
      metrics: earlyMetrics,
      abnormalities: earlyAbnormalities,
      audioUrl: earlyUrl,
    });

    // Checkpoint 3: Final Processed Output (full DSP + encode/decode)
    const finalProcessedBuffer = await processAudioWithDSP(decodedBuffer, settings);
    
    // Encode and decode to isolate encoding artifacts
    const finalWav = encodeWAV(finalProcessedBuffer);
    const finalDecodedBuffer = await decodeWAV(finalWav.blob);
    
    const finalMetrics = computeAudioMetrics(finalDecodedBuffer);
    const finalAbnormalities = detectAbnormalities(finalMetrics);
    
    const finalUrl = URL.createObjectURL(finalWav.blob);
    
    checkpoints.push({
      name: 'Final Processed Output (Full DSP + Encode/Decode)',
      stage: 'final-output',
      metrics: finalMetrics,
      abnormalities: finalAbnormalities,
      audioUrl: finalUrl,
    });

    await audioContext.close();

    // Determine source stage
    const sourceStage = determineSourceStage(checkpoints);
    const summary = generateSummary(checkpoints, sourceStage);

    return {
      checkpoints,
      sourceStage,
      summary,
      processingSettings: settings,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Triple Check error:', error);
    throw new Error('Triple Check diagnostics failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Determine which stage first introduces abnormalities
 */
function determineSourceStage(checkpoints: CheckpointResult[]): 'input' | 'early-pipeline' | 'final-output' | 'none' {
  for (const checkpoint of checkpoints) {
    if (checkpoint.abnormalities.hasAbnormalities) {
      return checkpoint.stage;
    }
  }
  return 'none';
}

/**
 * Generate human-readable summary
 */
function generateSummary(checkpoints: CheckpointResult[], sourceStage: string): string {
  if (sourceStage === 'none') {
    return 'No abnormalities detected in any checkpoint. Audio processing is clean.';
  }

  const sourceCheckpoint = checkpoints.find(c => c.stage === sourceStage);
  if (!sourceCheckpoint) {
    return 'Unable to determine source of abnormalities.';
  }

  const issues = sourceCheckpoint.abnormalities.issues.join(', ');
  
  if (sourceStage === 'input') {
    return `Abnormalities detected in the decoded input: ${issues}. The source file may be corrupted or contain invalid audio data.`;
  }
  
  if (sourceStage === 'early-pipeline') {
    return `Abnormalities first appear in the early pipeline (pre-normalization + final-normalization): ${issues}. Consider adjusting normalization settings or disabling pre-processing.`;
  }
  
  if (sourceStage === 'final-output') {
    return `Abnormalities first appear in the final processed output: ${issues}. This suggests DSP processing or encoding is introducing artifacts. Try lowering DSP strengths or disabling specific stages.`;
  }

  return 'Diagnostic analysis complete.';
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(report: TripleCheckReport): Blob {
  const exportData = {
    timestamp: report.timestamp,
    summary: report.summary,
    sourceStage: report.sourceStage,
    processingSettings: report.processingSettings,
    checkpoints: report.checkpoints.map(cp => ({
      name: cp.name,
      stage: cp.stage,
      metrics: cp.metrics,
      abnormalities: cp.abnormalities,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Export report as text
 */
export function exportReportAsText(report: TripleCheckReport): Blob {
  let text = '=== TRIPLE CHECK DIAGNOSTICS REPORT ===\n\n';
  text += `Timestamp: ${report.timestamp}\n`;
  text += `Source Stage: ${report.sourceStage}\n`;
  text += `Summary: ${report.summary}\n\n`;
  
  text += '=== CHECKPOINTS ===\n\n';
  
  for (const checkpoint of report.checkpoints) {
    text += `--- ${checkpoint.name} ---\n`;
    text += `Stage: ${checkpoint.stage}\n`;
    text += `Sample Rate: ${checkpoint.metrics.sampleRate} Hz\n`;
    text += `Channels: ${checkpoint.metrics.channels}\n`;
    text += `Duration: ${checkpoint.metrics.duration.toFixed(3)} s\n`;
    text += `Peak Level: ${checkpoint.metrics.peakLevel.toFixed(4)}\n`;
    text += `RMS Level: ${checkpoint.metrics.rmsLevel.toFixed(4)}\n`;
    text += `DC Offset: ${checkpoint.metrics.dcOffset.toFixed(6)}\n`;
    text += `NaN Count: ${checkpoint.metrics.nanCount}\n`;
    text += `Infinity Count: ${checkpoint.metrics.infinityCount}\n`;
    text += `Clipping Count: ${checkpoint.metrics.clippingCount} (${checkpoint.metrics.clippingPercentage.toFixed(2)}%)\n`;
    text += `Abnormalities: ${checkpoint.abnormalities.hasAbnormalities ? 'YES' : 'NO'}\n`;
    
    if (checkpoint.abnormalities.hasAbnormalities) {
      text += `Issues:\n`;
      for (const issue of checkpoint.abnormalities.issues) {
        text += `  - ${issue}\n`;
      }
    }
    
    text += '\n';
  }
  
  text += '=== PROCESSING SETTINGS ===\n\n';
  text += JSON.stringify(report.processingSettings, null, 2);
  text += '\n';

  return new Blob([text], { type: 'text/plain' });
}
