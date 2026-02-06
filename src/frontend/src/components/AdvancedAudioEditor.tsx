import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, Zap, Sparkles, Download, 
  Play, Pause, SkipBack, SkipForward, Brain, 
  Cpu, Gauge, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { processAudioWithAI } from '@/lib/audioProcessor';
import AudioABPreviewPlayer from './AudioABPreviewPlayer';
import SpectralFrequencyDisplay from './SpectralFrequencyDisplay';
import DualWaveformDisplay from './DualWaveformDisplay';

interface AdvancedAudioEditorProps {
  originalFile: File;
  onProcessingComplete?: (processedBlob: Blob) => void;
  onExport?: (blob: Blob) => void;
}

interface AudioSettings {
  noiseSuppression: boolean;
  noiseSuppressionStrength: number;
  transientSuppression: boolean;
  transientSuppressionStrength: number;
  voiceIsolation: boolean;
  voiceIsolationStrength: number;
  spectralRepair: boolean;
  spectralRepairStrength: number;
  lowBand: number;
  midBand: number;
  highBand: number;
}

export default function AdvancedAudioEditor({ 
  originalFile, 
  onProcessingComplete,
  onExport 
}: AdvancedAudioEditorProps) {
  const [settings, setSettings] = useState<AudioSettings>({
    noiseSuppression: true,
    noiseSuppressionStrength: 80,
    transientSuppression: true,
    transientSuppressionStrength: 75,
    voiceIsolation: true,
    voiceIsolationStrength: 85,
    spectralRepair: true,
    spectralRepairStrength: 70,
    lowBand: 0,
    midBand: 0,
    highBand: 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Create original audio URL on mount
  useEffect(() => {
    const url = URL.createObjectURL(originalFile);
    setOriginalAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [originalFile]);

  // Cleanup processed audio URL
  useEffect(() => {
    return () => {
      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }
    };
  }, [processedAudioUrl]);

  const handleProcess = async () => {
    if (!originalFile) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage('Initializing AI Engine...');
      setProcessingError(null);

      // Read file as array buffer
      const arrayBuffer = await originalFile.arrayBuffer();
      
      // Decode audio
      setProcessingStage('Decoding Audio...');
      setProcessingProgress(10);
      
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Process with AI
      const processedBuffer = await processAudioWithAI(audioBuffer, {
        deepNoiseSuppression: settings.noiseSuppression,
        speechEnhancement: settings.voiceIsolation,
        voiceIsolation: settings.voiceIsolation,
        transientReduction: settings.transientSuppression,
        spectralRepair: settings.spectralRepair,
        lowBandAdjustment: settings.lowBand,
        midBandAdjustment: settings.midBand,
        highBandAdjustment: settings.highBand,
        onProgress: (progress, stage) => {
          setProcessingProgress(10 + (progress * 0.8));
          setProcessingStage(stage);
        },
      });

      // Convert to blob
      setProcessingStage('Encoding Audio...');
      setProcessingProgress(95);

      const blob = await audioBufferToBlob(processedBuffer);
      const url = URL.createObjectURL(blob);

      setProcessedBlob(blob);
      setProcessedAudioUrl(url);
      setProcessingProgress(100);
      setProcessingStage('Complete!');
      setShowComparison(true);

      toast.success('Audio processing complete! Use A/B comparison to hear the difference.');

      if (onProcessingComplete) {
        onProcessingComplete(blob);
      }

      await audioContext.close();
    } catch (error) {
      console.error('Audio processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Processing failed');
      toast.error('Audio processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!processedBlob) {
      toast.error('No processed audio to export');
      return;
    }

    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${originalFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Audio exported successfully!');

    if (onExport) {
      onExport(processedBlob);
    }
  };

  const audioBufferToBlob = async (buffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const activeFeatures = [
    settings.noiseSuppression ? 'Noise Suppression' : null,
    settings.transientSuppression ? 'Transient Suppression' : null,
    settings.voiceIsolation ? 'Voice Isolation' : null,
    settings.spectralRepair ? 'Spectral Repair' : null,
  ].filter((f): f is string => f !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Advanced Audio Enhancement Engine
              </CardTitle>
              <CardDescription>
                Deep learning-powered audio processing with real-time GPU/CPU acceleration
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                GPU Accelerated
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Real-time
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Enhancement Controls
          </CardTitle>
          <CardDescription>
            Configure deep learning models for optimal audio quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Noise Suppression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.noiseSuppression}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, noiseSuppression: checked })
                  }
                />
                <Label className="font-semibold">Heavy Duty Noise Suppression</Label>
              </div>
              <Badge variant={settings.noiseSuppression ? 'default' : 'secondary'}>
                {settings.noiseSuppression ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {settings.noiseSuppression && (
              <div className="space-y-2 pl-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suppression Strength</span>
                  <span className="font-medium">{settings.noiseSuppressionStrength}%</span>
                </div>
                <Slider
                  value={[settings.noiseSuppressionStrength]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, noiseSuppressionStrength: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Deep suppresses background sounds using multi-level AI filtering
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Transient Suppression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.transientSuppression}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, transientSuppression: checked })
                  }
                />
                <Label className="font-semibold">Transient Shaping</Label>
              </div>
              <Badge variant={settings.transientSuppression ? 'default' : 'secondary'}>
                {settings.transientSuppression ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {settings.transientSuppression && (
              <div className="space-y-2 pl-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suppression Strength</span>
                  <span className="font-medium">{settings.transientSuppressionStrength}%</span>
                </div>
                <Slider
                  value={[settings.transientSuppressionStrength]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, transientSuppressionStrength: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Removes loud banging sounds and impulsive noises
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Voice Isolation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.voiceIsolation}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, voiceIsolation: checked })
                  }
                />
                <Label className="font-semibold">Source Separation (Voice Isolation)</Label>
              </div>
              <Badge variant={settings.voiceIsolation ? 'default' : 'secondary'}>
                {settings.voiceIsolation ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {settings.voiceIsolation && (
              <div className="space-y-2 pl-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Isolation Strength</span>
                  <span className="font-medium">{settings.voiceIsolationStrength}%</span>
                </div>
                <Slider
                  value={[settings.voiceIsolationStrength]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, voiceIsolationStrength: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Separates voice/speech from all other sounds using AI
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Spectral Repair */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.spectralRepair}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, spectralRepair: checked })
                  }
                />
                <Label className="font-semibold">Spectral Repair</Label>
              </div>
              <Badge variant={settings.spectralRepair ? 'default' : 'secondary'}>
                {settings.spectralRepair ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {settings.spectralRepair && (
              <div className="space-y-2 pl-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Repair Strength</span>
                  <span className="font-medium">{settings.spectralRepairStrength}%</span>
                </div>
                <Slider
                  value={[settings.spectralRepairStrength]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, spectralRepairStrength: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Repairs distortion and artifacts in speech using AI
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* 3-Band Tone Control */}
          <div className="space-y-4">
            <Label className="font-semibold">3-Band Tone Profiling</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Low (20-250 Hz)</span>
                <span className="font-medium">{settings.lowBand > 0 ? '+' : ''}{settings.lowBand} dB</span>
              </div>
              <Slider
                value={[settings.lowBand]}
                onValueChange={([value]) => setSettings({ ...settings, lowBand: value })}
                min={-12}
                max={12}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mid (250-4000 Hz)</span>
                <span className="font-medium">{settings.midBand > 0 ? '+' : ''}{settings.midBand} dB</span>
              </div>
              <Slider
                value={[settings.midBand]}
                onValueChange={([value]) => setSettings({ ...settings, midBand: value })}
                min={-12}
                max={12}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">High (4000-20000 Hz)</span>
                <span className="font-medium">{settings.highBand > 0 ? '+' : ''}{settings.highBand} dB</span>
              </div>
              <Slider
                value={[settings.highBand]}
                onValueChange={([value]) => setSettings({ ...settings, highBand: value })}
                min={-12}
                max={12}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Process Button */}
          <div className="space-y-3">
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Process Audio with AI
                </>
              )}
            </Button>

            {activeFeatures.length > 0 && !isProcessing && (
              <div className="flex flex-wrap gap-2">
                {activeFeatures.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={processingProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  {processingStage}
                </p>
              </div>
            )}

            {processingError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{processingError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Preview & Comparison */}
      {(originalAudioUrl || processedAudioUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Preview & A/B Comparison
            </CardTitle>
            <CardDescription>
              Compare original and processed audio in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AudioABPreviewPlayer
              originalUrl={originalAudioUrl}
              editedUrl={processedAudioUrl}
              onAudioElementReady={(element) => {
                audioElementRef.current = element;
              }}
            />

            {/* Visualizations */}
            {audioElementRef.current && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Spectral Frequency Analysis</Label>
                  <SpectralFrequencyDisplay audioElement={audioElementRef.current} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Waveform Display</Label>
                  <DualWaveformDisplay audioElement={audioElementRef.current} />
                </div>
              </div>
            )}

            {/* Export Button */}
            {processedBlob && (
              <Button
                onClick={handleExport}
                variant="default"
                size="lg"
                className="w-full"
              >
                <Download className="h-5 w-5 mr-2" />
                Export Processed Audio
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
