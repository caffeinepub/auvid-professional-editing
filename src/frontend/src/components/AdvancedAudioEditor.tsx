import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Volume2, Zap, Sparkles, Download, 
  CheckCircle2, AlertCircle, Loader2, Settings, Wand2, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { processAudioWithDSP } from '@/lib/audioProcessor';
import { autoTuneDSP } from '@/lib/autoDspAutoTune';
import { runTripleCheck, TripleCheckReport } from '@/lib/tripleCheckDiagnostics';
import { encodeWAV } from '@/lib/wavEncoder';
import AudioABPreviewPlayer from './AudioABPreviewPlayer';
import SpectralFrequencyDisplay from './SpectralFrequencyDisplay';
import DualWaveformDisplay from './DualWaveformDisplay';
import TripleCheckResults from './TripleCheckResults';

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
  dynamicEQ: boolean;
  dynamicEQStrength: number;
  deClickDeChirp: boolean;
  deClickDeChirpStrength: number;
  lowBand: number;
  midBand: number;
  highBand: number;
}

export default function AdvancedAudioEditor({ 
  originalFile, 
  onProcessingComplete,
  onExport 
}: AdvancedAudioEditorProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [autoIntensity, setAutoIntensity] = useState(75);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const [settings, setSettings] = useState<AudioSettings>({
    noiseSuppression: true,
    noiseSuppressionStrength: 80,
    transientSuppression: true,
    transientSuppressionStrength: 75,
    voiceIsolation: true,
    voiceIsolationStrength: 85,
    spectralRepair: true,
    spectralRepairStrength: 70,
    dynamicEQ: false,
    dynamicEQStrength: 50,
    deClickDeChirp: false,
    deClickDeChirpStrength: 50,
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

  // Triple Check state
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<TripleCheckReport | null>(null);

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

  // Cleanup diagnostics URLs
  useEffect(() => {
    return () => {
      if (diagnosticsReport) {
        diagnosticsReport.checkpoints.forEach(cp => {
          URL.revokeObjectURL(cp.audioUrl);
        });
      }
    };
  }, [diagnosticsReport]);

  // Auto-analyze when switching to auto mode
  useEffect(() => {
    if (mode === 'auto' && !analysisComplete && !isAnalyzing) {
      handleAutoAnalyze();
    }
  }, [mode]);

  const handleAutoAnalyze = async () => {
    if (!originalFile) return;

    try {
      setIsAnalyzing(true);
      setProcessingError(null);
      toast.info('Analyzing audio characteristics...');

      const result = await autoTuneDSP(originalFile, autoIntensity / 100);

      // Apply suggested settings
      setSettings({
        noiseSuppression: result.suggestions.noiseSuppression,
        noiseSuppressionStrength: result.suggestions.noiseSuppressionStrength,
        transientSuppression: result.suggestions.transientSuppression,
        transientSuppressionStrength: result.suggestions.transientSuppressionStrength,
        voiceIsolation: result.suggestions.voiceIsolation,
        voiceIsolationStrength: result.suggestions.voiceIsolationStrength,
        spectralRepair: result.suggestions.spectralRepair,
        spectralRepairStrength: result.suggestions.spectralRepairStrength,
        dynamicEQ: result.suggestions.dynamicEQ,
        dynamicEQStrength: result.suggestions.dynamicEQStrength,
        deClickDeChirp: result.suggestions.deClickDeChirp,
        deClickDeChirpStrength: result.suggestions.deClickDeChirpStrength,
        lowBand: result.suggestions.lowBand,
        midBand: result.suggestions.midBand,
        highBand: result.suggestions.highBand,
      });

      setAnalysisComplete(true);
      toast.success('Audio analysis complete! Settings optimized automatically.');
    } catch (error) {
      console.error('Auto-analysis error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Analysis failed');
      toast.error('Audio analysis failed. Falling back to default settings.');
      
      // Fall back to safe defaults
      setSettings({
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
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIntensityChange = async (newIntensity: number) => {
    setAutoIntensity(newIntensity);
    
    if (analysisComplete && mode === 'auto') {
      // Re-analyze with new intensity
      setAnalysisComplete(false);
    }
  };

  const handleProcess = async () => {
    if (!originalFile) return;

    let audioContext: AudioContext | null = null;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage('Initializing DSP pipeline...');
      setProcessingError(null);

      // Read file as array buffer
      const arrayBuffer = await originalFile.arrayBuffer();
      
      // Decode audio
      setProcessingStage('Decoding audio...');
      setProcessingProgress(10);
      
      audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Process with DSP
      const processedBuffer = await processAudioWithDSP(audioBuffer, {
        noiseSuppression: {
          enabled: settings.noiseSuppression,
          strength: settings.noiseSuppressionStrength,
        },
        transientSuppression: {
          enabled: settings.transientSuppression,
          strength: settings.transientSuppressionStrength,
        },
        voiceIsolation: {
          enabled: settings.voiceIsolation,
          strength: settings.voiceIsolationStrength,
        },
        spectralRepair: {
          enabled: settings.spectralRepair,
          strength: settings.spectralRepairStrength,
        },
        dynamicEQ: {
          enabled: settings.dynamicEQ,
          strength: settings.dynamicEQStrength,
        },
        deClickDeChirp: {
          enabled: settings.deClickDeChirp,
          strength: settings.deClickDeChirpStrength,
        },
        lowBandAdjustment: settings.lowBand,
        midBandAdjustment: settings.midBand,
        highBandAdjustment: settings.highBand,
        onProgress: (progress, stage) => {
          setProcessingProgress(10 + (progress * 0.8));
          setProcessingStage(stage);
        },
      });

      // Convert to blob using hardened encoder
      setProcessingStage('Encoding audio...');
      setProcessingProgress(95);

      const { blob, diagnostics } = encodeWAV(processedBuffer);

      // Warn if encoding had to sanitize samples
      if (diagnostics.sanitizedSamples > 0) {
        toast.warning(
          `Encoding sanitized ${diagnostics.sanitizedSamples} abnormal samples (NaN/Infinity). Consider lowering DSP strengths or running diagnostics.`
        );
      }

      if (diagnostics.clippedSamples > 0) {
        const clippingPercentage = (diagnostics.clippedSamples / diagnostics.totalSamples) * 100;
        if (clippingPercentage > 5) {
          toast.warning(
            `High clipping detected: ${clippingPercentage.toFixed(2)}% of samples. Consider lowering DSP strengths or running diagnostics.`
          );
        }
      }

      const url = URL.createObjectURL(blob);

      setProcessedBlob(blob);
      setProcessedAudioUrl(url);
      setProcessingProgress(100);
      setProcessingStage('Processing complete');
      setShowComparison(true);

      toast.success('Audio processing complete! Use A/B comparison to hear the difference.');

      if (onProcessingComplete) {
        onProcessingComplete(blob);
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Processing failed');
      toast.error('Audio processing failed. Please try again or run diagnostics to identify the issue.');
    } finally {
      setIsProcessing(false);
      
      // Always close AudioContext
      if (audioContext && audioContext.state !== 'closed') {
        try {
          await audioContext.close();
        } catch (closeError) {
          console.warn('Error closing AudioContext:', closeError);
        }
      }
    }
  };

  const handleRunDiagnostics = async () => {
    if (!originalFile) return;

    try {
      setIsRunningDiagnostics(true);
      toast.info('Running Triple Check diagnostics...');

      const report = await runTripleCheck(originalFile, {
        noiseSuppression: {
          enabled: settings.noiseSuppression,
          strength: settings.noiseSuppressionStrength,
        },
        transientSuppression: {
          enabled: settings.transientSuppression,
          strength: settings.transientSuppressionStrength,
        },
        voiceIsolation: {
          enabled: settings.voiceIsolation,
          strength: settings.voiceIsolationStrength,
        },
        spectralRepair: {
          enabled: settings.spectralRepair,
          strength: settings.spectralRepairStrength,
        },
        dynamicEQ: {
          enabled: settings.dynamicEQ,
          strength: settings.dynamicEQStrength,
        },
        deClickDeChirp: {
          enabled: settings.deClickDeChirp,
          strength: settings.deClickDeChirpStrength,
        },
        lowBandAdjustment: settings.lowBand,
        midBandAdjustment: settings.midBand,
        highBandAdjustment: settings.highBand,
      });

      setDiagnosticsReport(report);
      toast.success('Triple Check diagnostics complete!');
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error('Diagnostics failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunningDiagnostics(false);
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

  const activeFeatures = [
    settings.noiseSuppression ? 'Noise Suppression' : null,
    settings.transientSuppression ? 'Transient Suppression' : null,
    settings.voiceIsolation ? 'Voice Isolation' : null,
    settings.spectralRepair ? 'Spectral Repair' : null,
    settings.dynamicEQ ? 'Dynamic EQ' : null,
    settings.deClickDeChirp ? 'De-click/De-chirp' : null,
  ].filter((f): f is string => f !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Advanced Audio DSP Engine
              </CardTitle>
              <CardDescription>
                Automatic assessment and professional-grade digital signal processing
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Web Audio API
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Processing Mode
          </CardTitle>
          <CardDescription>
            Choose between automatic assessment or manual DSP controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Auto Mode
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manual Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Enhancement Amount</Label>
                    <span className="text-sm text-muted-foreground">{autoIntensity}%</span>
                  </div>
                  <Slider
                    value={[autoIntensity]}
                    onValueChange={([v]) => handleIntensityChange(v)}
                    min={0}
                    max={100}
                    step={5}
                    disabled={isAnalyzing || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls the overall intensity of automatic enhancements
                  </p>
                </div>

                {isAnalyzing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Analyzing audio characteristics and optimizing settings...
                    </AlertDescription>
                  </Alert>
                )}

                {analysisComplete && !isAnalyzing && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Audio analysis complete. Settings have been automatically optimized.
                    </AlertDescription>
                  </Alert>
                )}

                {activeFeatures.length > 0 && (
                  <div className="space-y-2">
                    <Label>Active Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeFeatures.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6 mt-4">
              {/* Noise Suppression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="noise-suppression">Noise Suppression</Label>
                  <Switch
                    id="noise-suppression"
                    checked={settings.noiseSuppression}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, noiseSuppression: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.noiseSuppression && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.noiseSuppressionStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.noiseSuppressionStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, noiseSuppressionStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Transient Suppression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transient-suppression">Transient Suppression</Label>
                  <Switch
                    id="transient-suppression"
                    checked={settings.transientSuppression}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, transientSuppression: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.transientSuppression && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.transientSuppressionStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.transientSuppressionStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, transientSuppressionStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Voice Isolation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-isolation">Voice Isolation</Label>
                  <Switch
                    id="voice-isolation"
                    checked={settings.voiceIsolation}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, voiceIsolation: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.voiceIsolation && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.voiceIsolationStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.voiceIsolationStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, voiceIsolationStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Spectral Repair */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spectral-repair">Spectral Repair</Label>
                  <Switch
                    id="spectral-repair"
                    checked={settings.spectralRepair}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, spectralRepair: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.spectralRepair && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.spectralRepairStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.spectralRepairStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, spectralRepairStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Dynamic EQ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dynamic-eq">Dynamic EQ</Label>
                  <Switch
                    id="dynamic-eq"
                    checked={settings.dynamicEQ}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, dynamicEQ: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.dynamicEQ && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.dynamicEQStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.dynamicEQStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, dynamicEQStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* De-click/De-chirp */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="de-click">De-click/De-chirp</Label>
                  <Switch
                    id="de-click"
                    checked={settings.deClickDeChirp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, deClickDeChirp: checked })
                    }
                    disabled={isProcessing}
                  />
                </div>
                {settings.deClickDeChirp && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{settings.deClickDeChirpStrength}%</span>
                    </div>
                    <Slider
                      value={[settings.deClickDeChirpStrength]}
                      onValueChange={([v]) =>
                        setSettings({ ...settings, deClickDeChirpStrength: v })
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* 3-Band Tone Profiling */}
              <div className="space-y-4">
                <Label>3-Band Tone Profiling</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low Band (20-250 Hz)</span>
                    <span className="text-sm font-medium">{settings.lowBand > 0 ? '+' : ''}{settings.lowBand} dB</span>
                  </div>
                  <Slider
                    value={[settings.lowBand]}
                    onValueChange={([v]) => setSettings({ ...settings, lowBand: v })}
                    min={-12}
                    max={12}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mid Band (250-4000 Hz)</span>
                    <span className="text-sm font-medium">{settings.midBand > 0 ? '+' : ''}{settings.midBand} dB</span>
                  </div>
                  <Slider
                    value={[settings.midBand]}
                    onValueChange={([v]) => setSettings({ ...settings, midBand: v })}
                    min={-12}
                    max={12}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">High Band (4000-20000 Hz)</span>
                    <span className="text-sm font-medium">{settings.highBand > 0 ? '+' : ''}{settings.highBand} dB</span>
                  </div>
                  <Slider
                    value={[settings.highBand]}
                    onValueChange={([v]) => setSettings({ ...settings, highBand: v })}
                    min={-12}
                    max={12}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Processing</CardTitle>
          <CardDescription>
            Apply DSP enhancements to your audio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{processingStage}</span>
                <span className="font-medium">{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || isAnalyzing || isRunningDiagnostics}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Process Audio
                </>
              )}
            </Button>

            {processedBlob && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Diagnostics
          </CardTitle>
          <CardDescription>
            Run Triple Check to identify and fix audio processing issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Triple Check analyzes your audio at three stages (decoded input, early pipeline, final output) 
            to identify where static or artifacts are introduced. Use this if you hear unwanted noise after processing.
          </p>

          <Button
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics || isProcessing || isAnalyzing}
            variant="outline"
            className="w-full"
          >
            {isRunningDiagnostics ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Triple Check...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Triple Check
              </>
            )}
          </Button>

          {diagnosticsReport && (
            <div className="mt-6">
              <TripleCheckResults report={diagnosticsReport} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* A/B Comparison */}
      {showComparison && originalAudioUrl && processedAudioUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              A/B Comparison
            </CardTitle>
            <CardDescription>
              Compare original and processed audio
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

            {audioElementRef.current && (
              <>
                <SpectralFrequencyDisplay audioElement={audioElementRef.current} />
                <DualWaveformDisplay audioElement={audioElementRef.current} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
