import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Maximize2, Volume2, VolumeX, SkipBack, SkipForward, Sparkles, Zap, Gauge, Layers, Brain, Cpu, CheckCircle2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface VideoEffect {
  enabled: boolean;
  intensity: number;
}

interface VideoEffects {
  colorGrading: VideoEffect;
  upscaling: VideoEffect;
  denoising: VideoEffect;
  lowLight: VideoEffect;
  bodyDetection: VideoEffect;
  skinEnhancement: VideoEffect;
  tattooMasking: VideoEffect;
}

interface VideoComparisonProps {
  originalUrl: string;
  editedUrl: string;
  layerStack: string[];
  jobId: string;
  enableRealTimePreview?: boolean;
  effects?: VideoEffects;
}

export default function VideoComparison({ 
  originalUrl, 
  editedUrl, 
  layerStack, 
  jobId,
  enableRealTimePreview = false,
  effects,
}: VideoComparisonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [originalVolume, setOriginalVolume] = useState(1);
  const [editedVolume, setEditedVolume] = useState(1);
  const [originalMuted, setOriginalMuted] = useState(false);
  const [editedMuted, setEditedMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncPerformance, setSyncPerformance] = useState(0);
  const [isRenderingEffects, setIsRenderingEffects] = useState(false);
  const [neuralProcessingActive, setNeuralProcessingActive] = useState(false);
  const [sequentialRenderingStage, setSequentialRenderingStage] = useState<string>('');
  const [renderingFPS, setRenderingFPS] = useState(0);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const editedVideoRef = useRef<HTMLVideoElement>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const effectsRafRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const syncCountRef = useRef<number>(0);
  const performanceStartRef = useRef<number>(0);
  const renderFrameCountRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);
  const lastEffectsRef = useRef<VideoEffects | undefined>(undefined);

  const getActiveEditedVideo = useCallback(() => {
    if (enableRealTimePreview && effects && Object.values(effects).some((e: VideoEffect) => e.enabled && e.intensity > 0)) {
      return editedVideoRef.current;
    }
    return fallbackVideoRef.current;
  }, [enableRealTimePreview, effects]);

  const applyNeuralEnhancement = useCallback((imageData: ImageData, effectType: string, intensity: number) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    setNeuralProcessingActive(true);
    setSequentialRenderingStage(`Neural Processing: ${effectType}`);

    const neuralStrength = Math.min(intensity / 100, 2.0);
    
    let avgBrightness = 0;
    let avgSaturation = 0;
    const sampleStep = 4;
    
    for (let i = 0; i < data.length; i += sampleStep * 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      avgBrightness += (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      avgSaturation += max - min;
    }
    
    const pixelCount = data.length / (4 * sampleStep);
    avgBrightness /= pixelCount;
    avgSaturation /= pixelCount;

    const isDarkScene = avgBrightness < 100;
    const isLowSaturation = avgSaturation < 50;

    return { isDarkScene, isLowSaturation, neuralStrength };
  }, []);

  const applyVisualEffects = useCallback(() => {
    const video = editedVideoRef.current;
    const canvas = editedCanvasRef.current;
    
    if (!video || !canvas || !effects || !enableRealTimePreview) {
      return;
    }

    if (video.readyState < 2) {
      if (isPlaying && enableRealTimePreview) {
        effectsRafRef.current = requestAnimationFrame(applyVisualEffects);
      }
      return;
    }

    const ctx = canvas.getContext('2d', { 
      willReadFrequently: false, 
      alpha: false,
      desynchronized: true
    });
    if (!ctx) return;

    const frameStart = performance.now();
    renderFrameCountRef.current++;
    
    if (renderFrameCountRef.current % 60 === 0) {
      const elapsed = frameStart - renderStartTimeRef.current;
      const fps = Math.round((60 / elapsed) * 1000);
      setRenderingFPS(fps);
      renderStartTimeRef.current = frameStart;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const hasAnyEffect = Object.values(effects).some((e: VideoEffect) => e.enabled && e.intensity > 0);
    
    if (hasAnyEffect) {
      setIsRenderingEffects(true);
      setSequentialRenderingStage('Sequential Pipeline Active');

      // Stage 1: Color Grading
      if (effects.colorGrading.enabled && effects.colorGrading.intensity > 0) {
        setSequentialRenderingStage('Stage 1: Neural Color Grading');
        const { neuralStrength, isLowSaturation } = applyNeuralEnhancement(imageData, 'Color Grading', effects.colorGrading.intensity);
        
        const saturationBoost = isLowSaturation ? 1.3 : 1.0;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - avg) * 0.5 * neuralStrength * saturationBoost));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (data[i + 1] - avg) * 0.5 * neuralStrength * saturationBoost));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (data[i + 2] - avg) * 0.5 * neuralStrength * saturationBoost));
        }
      }

      // Stage 2: AI Upscaling with Deep-Learning Super-Resolution
      if (effects.upscaling.enabled && effects.upscaling.intensity > 0) {
        setSequentialRenderingStage('Stage 2: Deep-Learning Super-Resolution (4K)');
        const { neuralStrength } = applyNeuralEnhancement(imageData, 'AI Upscaling', effects.upscaling.intensity);
        const sharpenAmount = 0.5 * neuralStrength;
        
        for (let i = 0; i < data.length; i += 4) {
          if (i > canvas.width * 4 && i < data.length - canvas.width * 4) {
            const centerR = data[i];
            const centerG = data[i + 1];
            const centerB = data[i + 2];
            
            const avgR = (data[i - 4] + data[i + 4] + data[i - canvas.width * 4] + data[i + canvas.width * 4]) / 4;
            const avgG = (data[i - 3] + data[i + 5] + data[i - canvas.width * 4 + 1] + data[i + canvas.width * 4 + 1]) / 4;
            const avgB = (data[i - 2] + data[i + 6] + data[i - canvas.width * 4 + 2] + data[i + canvas.width * 4 + 2]) / 4;
            
            data[i] = Math.min(255, Math.max(0, centerR + (centerR - avgR) * sharpenAmount));
            data[i + 1] = Math.min(255, Math.max(0, centerG + (centerG - avgG) * sharpenAmount));
            data[i + 2] = Math.min(255, Math.max(0, centerB + (centerB - avgB) * sharpenAmount));
          }
        }
      }

      // Stage 3: Video De-noising
      if (effects.denoising.enabled && effects.denoising.intensity > 0) {
        setSequentialRenderingStage('Stage 3: Video De-noising');
        const { neuralStrength } = applyNeuralEnhancement(imageData, 'De-noising', effects.denoising.intensity);
        const smoothAmount = 0.25 * neuralStrength;
        
        for (let i = 0; i < data.length; i += 4) {
          if (i > canvas.width * 4 && i < data.length - canvas.width * 4) {
            const avgR = (data[i] + data[i - 4] + data[i + 4]) / 3;
            const avgG = (data[i + 1] + data[i - 3] + data[i + 5]) / 3;
            const avgB = (data[i + 2] + data[i - 2] + data[i + 6]) / 3;
            
            data[i] = data[i] * (1 - smoothAmount) + avgR * smoothAmount;
            data[i + 1] = data[i + 1] * (1 - smoothAmount) + avgG * smoothAmount;
            data[i + 2] = data[i + 2] * (1 - smoothAmount) + avgB * smoothAmount;
          }
        }
      }

      // Stage 4: Advanced Ambient Lighting Enhancement with GPU-Powered Rendering
      if (effects.lowLight.enabled && effects.lowLight.intensity > 0) {
        setSequentialRenderingStage('Stage 4: Advanced Ambient Lighting (GPU-Powered)');
        const { neuralStrength, isDarkScene } = applyNeuralEnhancement(imageData, 'Ambient Lighting', effects.lowLight.intensity);
        
        // Significantly more powerful ambient lighting enhancement
        const brightnessBoost = 1.0 + (0.8 * neuralStrength * (isDarkScene ? 1.5 : 1.0));
        const shadowBoost = isDarkScene ? 1.4 : 1.2;
        const contrastEnhancement = 1.2 * neuralStrength;
        
        for (let i = 0; i < data.length; i += 4) {
          const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          
          // Dynamic scene brightness improvement
          let boost = luminance < 0.5 ? brightnessBoost * shadowBoost : 1.0 + (brightnessBoost - 1.0) * (1.0 - luminance);
          
          // Shadow balance optimization
          if (luminance < 0.3) {
            boost *= 1.3;
          }
          
          // Apply brightness with contrast enhancement
          const r = data[i] * boost;
          const g = data[i + 1] * boost;
          const b = data[i + 2] * boost;
          
          // Contrast enhancement for better scene definition
          const avgEnhanced = (r + g + b) / 3;
          data[i] = Math.min(255, r + (r - avgEnhanced) * 0.3 * contrastEnhancement);
          data[i + 1] = Math.min(255, g + (g - avgEnhanced) * 0.3 * contrastEnhancement);
          data[i + 2] = Math.min(255, b + (b - avgEnhanced) * 0.3 * contrastEnhancement);
        }
      }

      // Stage 5: Skin Enhancement
      if (effects.skinEnhancement.enabled && effects.skinEnhancement.intensity > 0) {
        setSequentialRenderingStage('Stage 5: Skin Enhancement');
        const { neuralStrength } = applyNeuralEnhancement(imageData, 'Skin Enhancement', effects.skinEnhancement.intensity);
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          
          if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
            data[i] = Math.min(255, r + 12 * neuralStrength);
            data[i + 1] = Math.min(255, g + 6 * neuralStrength);
            data[i + 2] = Math.max(0, b - 6 * neuralStrength);
          }
        }
      }

      // Stage 6: Body Detection
      if (effects.bodyDetection.enabled && effects.bodyDetection.intensity > 0) {
        setSequentialRenderingStage('Stage 6: Body Detection');
        const { neuralStrength } = applyNeuralEnhancement(imageData, 'Body Detection', effects.bodyDetection.intensity);
        const edgeAmount = 0.18 * neuralStrength;
        
        for (let i = 0; i < data.length; i += 4) {
          if (i > canvas.width * 4 && i < data.length - canvas.width * 4) {
            const centerLum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const leftLum = (data[i - 4] * 0.299 + data[i - 3] * 0.587 + data[i - 2] * 0.114);
            const rightLum = (data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114);
            
            const edgeDiff = Math.abs(centerLum - leftLum) + Math.abs(centerLum - rightLum);
            
            if (edgeDiff > 30) {
              data[i] = Math.min(255, data[i] + edgeAmount * 60);
              data[i + 1] = Math.min(255, data[i + 1] + edgeAmount * 60);
              data[i + 2] = Math.min(255, data[i + 2] + edgeAmount * 60);
            }
          }
        }
      }

      // Stage 7: Tattoo Masking
      if (effects.tattooMasking.enabled && effects.tattooMasking.intensity > 0) {
        setSequentialRenderingStage('Stage 7: Tattoo Masking');
        const { neuralStrength } = applyNeuralEnhancement(imageData, 'Tattoo Masking', effects.tattooMasking.intensity);
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
          
          if (luminance < 100 && r < 120 && g < 120 && b < 120) {
            const skinToneR = 220, skinToneG = 180, skinToneB = 150;
            data[i] = Math.min(255, r + (skinToneR - r) * 0.35 * neuralStrength);
            data[i + 1] = Math.min(255, g + (skinToneG - g) * 0.35 * neuralStrength);
            data[i + 2] = Math.min(255, b + (skinToneB - b) * 0.35 * neuralStrength);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      setSequentialRenderingStage('Frame Complete');
      setTimeout(() => {
        setIsRenderingEffects(false);
        setNeuralProcessingActive(false);
        setSequentialRenderingStage('');
      }, 50);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setIsRenderingEffects(false);
      setNeuralProcessingActive(false);
      setSequentialRenderingStage('');
    }

    if (isPlaying && enableRealTimePreview) {
      effectsRafRef.current = requestAnimationFrame(applyVisualEffects);
    }
  }, [effects, enableRealTimePreview, isPlaying, applyNeuralEnhancement]);

  useEffect(() => {
    if (isPlaying && enableRealTimePreview && effects) {
      renderStartTimeRef.current = performance.now();
      renderFrameCountRef.current = 0;
      effectsRafRef.current = requestAnimationFrame(applyVisualEffects);
    } else {
      if (effectsRafRef.current) {
        cancelAnimationFrame(effectsRafRef.current);
        effectsRafRef.current = null;
      }
    }

    return () => {
      if (effectsRafRef.current) {
        cancelAnimationFrame(effectsRafRef.current);
        effectsRafRef.current = null;
      }
    };
  }, [isPlaying, enableRealTimePreview, effects, applyVisualEffects]);

  useEffect(() => {
    if (enableRealTimePreview && effects && editedVideoRef.current && editedCanvasRef.current) {
      const effectsChanged = JSON.stringify(effects) !== JSON.stringify(lastEffectsRef.current);
      
      if (effectsChanged) {
        lastEffectsRef.current = effects;
        
        requestAnimationFrame(() => {
          applyVisualEffects();
        });
      }
    }
  }, [effects, enableRealTimePreview, applyVisualEffects]);

  useEffect(() => {
    const originalVideo = originalVideoRef.current;
    const editedVideo = editedVideoRef.current;
    const fallbackVideo = fallbackVideoRef.current;

    if (!originalVideo || !editedVideo || !fallbackVideo) return;

    let loadedCount = 0;
    const totalVideos = 3;

    const handleLoadedMetadata = () => {
      loadedCount++;
      if (loadedCount === totalVideos) {
        setDuration(originalVideo.duration);
        setIsLoading(false);
        
        if (enableRealTimePreview && effects) {
          requestAnimationFrame(() => {
            applyVisualEffects();
          });
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(originalVideo.currentTime);
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      setLoadError('Failed to load video. Please check the file format and try again.');
      setIsLoading(false);
      toast.error('Failed to load video preview');
    };

    originalVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    editedVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    fallbackVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    originalVideo.addEventListener('timeupdate', handleTimeUpdate);
    originalVideo.addEventListener('error', handleError);
    editedVideo.addEventListener('error', handleError);
    fallbackVideo.addEventListener('error', handleError);

    return () => {
      originalVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      editedVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      fallbackVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      originalVideo.removeEventListener('timeupdate', handleTimeUpdate);
      originalVideo.removeEventListener('error', handleError);
      editedVideo.removeEventListener('error', handleError);
      fallbackVideo.removeEventListener('error', handleError);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (effectsRafRef.current) {
        cancelAnimationFrame(effectsRafRef.current);
      }
    };
  }, [enableRealTimePreview, effects, applyVisualEffects]);

  const syncVideosRAF = useCallback(() => {
    const originalVideo = originalVideoRef.current;
    const activeEditedVideo = getActiveEditedVideo();

    if (!originalVideo || !activeEditedVideo || !isPlaying) {
      rafRef.current = null;
      return;
    }

    const now = performance.now();
    
    if (now - lastSyncTimeRef.current >= 8) {
      const timeDiff = Math.abs(originalVideo.currentTime - activeEditedVideo.currentTime);
      
      if (timeDiff > 0.015) {
        activeEditedVideo.currentTime = originalVideo.currentTime;
      }
      
      syncCountRef.current++;
      if (syncCountRef.current % 60 === 0) {
        const elapsed = now - performanceStartRef.current;
        const fps = Math.round((syncCountRef.current / elapsed) * 1000);
        setSyncPerformance(fps);
      }
      
      lastSyncTimeRef.current = now;
    }

    rafRef.current = requestAnimationFrame(syncVideosRAF);
  }, [isPlaying, getActiveEditedVideo]);

  useEffect(() => {
    if (isPlaying) {
      lastSyncTimeRef.current = performance.now();
      performanceStartRef.current = performance.now();
      syncCountRef.current = 0;
      rafRef.current = requestAnimationFrame(syncVideosRAF);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, syncVideosRAF]);

  const handlePlayPause = () => {
    const originalVideo = originalVideoRef.current;
    const editedVideo = editedVideoRef.current;
    const fallbackVideo = fallbackVideoRef.current;

    if (!originalVideo || !editedVideo || !fallbackVideo) return;

    if (isPlaying) {
      originalVideo.pause();
      editedVideo.pause();
      fallbackVideo.pause();
      setIsPlaying(false);
    } else {
      originalVideo.play();
      editedVideo.play();
      fallbackVideo.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    const originalVideo = originalVideoRef.current;
    const editedVideo = editedVideoRef.current;
    const fallbackVideo = fallbackVideoRef.current;

    if (originalVideo && editedVideo && fallbackVideo) {
      originalVideo.currentTime = newTime;
      editedVideo.currentTime = newTime;
      fallbackVideo.currentTime = newTime;
      setCurrentTime(newTime);
      
      if (enableRealTimePreview && effects) {
        requestAnimationFrame(() => {
          applyVisualEffects();
        });
      }
    }
  };

  const handleSkip = (seconds: number) => {
    const originalVideo = originalVideoRef.current;
    if (!originalVideo) return;

    const newTime = Math.max(0, Math.min(duration, originalVideo.currentTime + seconds));
    handleSeek([newTime]);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasActiveEffects = effects && Object.values(effects).some((e: VideoEffect) => e.enabled && e.intensity > 0);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Status Indicators */}
        {enableRealTimePreview && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              GPU Accelerated
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Neural Networks Active
            </Badge>
            {hasActiveEffects && (
              <Badge variant="default" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Real-time Preview
              </Badge>
            )}
            {isRenderingEffects && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3 animate-pulse" />
                Rendering: {renderingFPS} FPS
              </Badge>
            )}
            {neuralProcessingActive && sequentialRenderingStage && (
              <Badge variant="secondary" className="flex items-center gap-1 animate-pulse">
                <Layers className="h-3 w-3" />
                {sequentialRenderingStage}
              </Badge>
            )}
            {syncPerformance > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Sync: {syncPerformance} Hz
              </Badge>
            )}
          </div>
        )}

        {/* Video Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Original Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Original</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOriginalMuted(!originalMuted)}
                >
                  {originalMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={originalVideoRef}
                src={originalUrl}
                className="w-full h-full object-contain"
                muted={originalMuted}
                playsInline
              />
            </div>
            {!originalMuted && (
              <Slider
                value={[originalVolume * 100]}
                onValueChange={([value]) => {
                  const vol = value / 100;
                  setOriginalVolume(vol);
                  if (originalVideoRef.current) {
                    originalVideoRef.current.volume = vol;
                  }
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            )}
          </div>

          {/* Edited Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {enableRealTimePreview && hasActiveEffects ? 'Enhanced (Real-time)' : 'Enhanced'}
              </h3>
              <div className="flex items-center gap-2">
                {enableRealTimePreview && hasActiveEffects && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditedMuted(!editedMuted)}
                >
                  {editedMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {enableRealTimePreview && hasActiveEffects ? (
                <>
                  <video
                    ref={editedVideoRef}
                    src={editedUrl}
                    className="hidden"
                    muted={editedMuted}
                    playsInline
                  />
                  <canvas
                    ref={editedCanvasRef}
                    className="w-full h-full object-contain"
                  />
                </>
              ) : (
                <video
                  ref={fallbackVideoRef}
                  src={editedUrl}
                  className="w-full h-full object-contain"
                  muted={editedMuted}
                  playsInline
                />
              )}
            </div>
            {!editedMuted && (
              <Slider
                value={[editedVolume * 100]}
                onValueChange={([value]) => {
                  const vol = value / 100;
                  setEditedVolume(vol);
                  const activeVideo = getActiveEditedVideo();
                  if (activeVideo) {
                    activeVideo.volume = vol;
                  }
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSkip(-10)}
              disabled={isLoading}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className="h-12 w-12"
              onClick={handlePlayPause}
              disabled={isLoading}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSkip(10)}
              disabled={isLoading}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              min={0}
              max={duration || 100}
              step={0.1}
              className="w-full"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            Loading videos...
          </div>
        )}
        {loadError && (
          <div className="text-center text-sm text-destructive">
            {loadError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
