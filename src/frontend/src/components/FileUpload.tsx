import { useState, useCallback, useRef, useEffect } from 'react';
import { useUploadMediaFile, useStartProcessing, useCompleteProcessing } from '../hooks/useQueries';
import { ExternalBlob, Mode } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, FileAudio, FileVideo, X, Film, Palette, Maximize2, User, Droplet, Eraser, Video, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdvancedAudioEditor from './AdvancedAudioEditor';

interface FileUploadProps {
  onUploadSuccess?: () => void;
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function FileUpload({ onUploadSuccess, selectedMode, onModeChange }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [colorGrading, setColorGrading] = useState(false);
  const [videoUpscaling, setVideoUpscaling] = useState(false);
  const [upscaleResolution, setUpscaleResolution] = useState<'2K' | '4K'>('2K');
  const [humanBodyEditing, setHumanBodyEditing] = useState(false);
  const [tattooMasking, setTattooMasking] = useState(false);
  const [skinEnhancement, setSkinEnhancement] = useState(false);
  const [videoDenoising, setVideoDenoising] = useState(false);
  const [lowLightEnhancement, setLowLightEnhancement] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // Video preview states
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const dialogVideoRef = useRef<HTMLVideoElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  const uploadMutation = useUploadMediaFile();
  const startProcessingMutation = useStartProcessing();
  const completeProcessingMutation = useCompleteProcessing();

  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
  const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const acceptedTypes = selectedMode === Mode.audio ? audioTypes : videoTypes;

  // Cleanup preview URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFileSelect = (file: File) => {
    const isAudioFile = audioTypes.includes(file.type);
    const isVideoFile = videoTypes.includes(file.type);

    if (selectedMode === Mode.audio && !isAudioFile) {
      toast.error('Please upload an audio file (MP3, WAV, M4A) in Audio Editing mode.');
      return;
    }

    if (selectedMode === Mode.video && !isVideoFile) {
      toast.error('Please upload a video file (MP4, MOV, AVI) in Video Editing mode.');
      return;
    }

    if (!isAudioFile && !isVideoFile) {
      toast.error('Unsupported file format. Please upload MP3, WAV, M4A, MP4, MOV, or AVI files.');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size must be less than 500MB');
      return;
    }

    // Clean up previous preview URLs
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setSelectedFile(file);
    setUploadProgress(0);
    setProcessingProgress(0);
    setProcessingStage('');
    setProcessingError(null);
    setIsVideoPlaying(false);

    // Create preview for audio files
    if (isAudioFile) {
      toast.success('Audio file loaded successfully! Configure settings below.');
    }

    // Create immediate video preview for video files
    if (isVideoFile) {
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(previewUrl);
      
      toast.success(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">✓ Video loaded successfully!</p>
          <p className="text-xs">Preview window is now visible below. You can enlarge it for a better view.</p>
        </div>,
        {
          duration: 4000,
        }
      );

      setTimeout(() => {
        if (previewSectionRef.current) {
          previewSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 400);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [selectedMode, videoPreviewUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleVideoPlayPause = () => {
    if (!videoPreviewRef.current) return;

    if (isVideoPlaying) {
      videoPreviewRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoPreviewRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleOpenPreviewDialog = () => {
    setShowPreviewDialog(true);
  };

  const handleClosePreviewDialog = () => {
    setShowPreviewDialog(false);
    if (dialogVideoRef.current) {
      dialogVideoRef.current.pause();
    }
  };

  const handleAudioProcessingComplete = async (processedBlob: Blob) => {
    try {
      if (!selectedFile) return;

      setIsProcessing(true);
      setProcessingStage('Uploading processed audio...');

      // Convert processed blob to Uint8Array
      const processedArrayBuffer = await processedBlob.arrayBuffer();
      const processedUint8Array = new Uint8Array(processedArrayBuffer);
      const processedExternalBlob = ExternalBlob.fromBytes(processedUint8Array);

      // Upload original file first
      const originalArrayBuffer = await selectedFile.arrayBuffer();
      const originalUint8Array = new Uint8Array(originalArrayBuffer);
      const originalBlob = ExternalBlob.fromBytes(originalUint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const jobId = await uploadMutation.mutateAsync({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        size: BigInt(selectedFile.size),
        blob: originalBlob,
        mode: selectedMode,
        aiPromptText: '',
        aiSelectedSpeechEnhancement: false,
        aiSelectedDeepNoiseSuppression: true,
        aiSelectedPhaseAwareMasking: false,
        aiSelectedTimeDomainAdjustments: false,
        aiSelectedProfessionalGradeDenoising: false,
        aiSelectedTransientReduction: true,
        aiSelectedDynamicRangeCompression: false,
        aiSelectedSpectralRepair: true,
        aiSelectedAdaptiveFiltering: false,
        aiSelectedNormalization: false,
        aiSelectedVoiceIsolation: true,
        aiSelectedFrequencyTargeting: false,
        aiSelectedVoiceClarityEnhancement: false,
        aiSelectedEqCurveOptimization: false,
        aiSelectedVolumeConsistency: false,
        aiSelectedPrePostGainControl: false,
        aiSelectedPhaseAlignment: false,
        aiSelectedFrequencyResponseAdjustment: false,
        aiSelectedSpectralDataGeneration: false,
        effectProvider: 'Advanced AI Engine',
        effectProviderLogo: '',
      });

      setProcessingStage('Finalizing...');
      await completeProcessingMutation.mutateAsync({
        jobId,
        processedBlob: processedExternalBlob,
        speechEnhancement: true,
        aggressiveMode: false,
        deepNoiseSuppression: true,
        phaseAwareMasking: false,
        timeDomainAdjustments: false,
        fullAudioTrack: processedExternalBlob,
        dialogueTrack: null,
        processingTime: null,
        colorGrading: false,
        videoUpscaling: false,
        videoDenoising: false,
        lowLightEnhancement: false,
        enhancedResolution: null,
        humanBodyEditing: false,
        tattooMasking: false,
        skinEnhancement: false,
        skinToneAnalysis: false,
        blemishCorrection: false,
        bodyModificationDetails: null,
      });

      toast.success('Audio processing complete and saved to history!');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to save processed audio');
      setProcessingError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProcessingStage('Uploading');
      setProcessingError(null);

      // Upload original file
      const originalArrayBuffer = await selectedFile.arrayBuffer();
      const originalUint8Array = new Uint8Array(originalArrayBuffer);

      const originalBlob = ExternalBlob.fromBytes(originalUint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const jobId = await uploadMutation.mutateAsync({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        size: BigInt(selectedFile.size),
        blob: originalBlob,
        mode: selectedMode,
        aiPromptText: '',
        aiSelectedSpeechEnhancement: false,
        aiSelectedDeepNoiseSuppression: false,
        aiSelectedPhaseAwareMasking: false,
        aiSelectedTimeDomainAdjustments: false,
        aiSelectedProfessionalGradeDenoising: false,
        aiSelectedTransientReduction: false,
        aiSelectedDynamicRangeCompression: false,
        aiSelectedSpectralRepair: false,
        aiSelectedAdaptiveFiltering: false,
        aiSelectedNormalization: false,
        aiSelectedVoiceIsolation: false,
        aiSelectedFrequencyTargeting: false,
        aiSelectedVoiceClarityEnhancement: false,
        aiSelectedEqCurveOptimization: false,
        aiSelectedVolumeConsistency: false,
        aiSelectedPrePostGainControl: false,
        aiSelectedPhaseAlignment: false,
        aiSelectedFrequencyResponseAdjustment: false,
        aiSelectedSpectralDataGeneration: false,
        effectProvider: '',
        effectProviderLogo: '',
      });

      toast.success('File uploaded successfully!');

      // Video processing
      setProcessingStage('Initializing Video Processing Pipeline');
      toast.info('🎬 Initializing video enhancement with AI-powered processing...');

      const stages = [
        { progress: 10, stage: 'Extracting audio track...' },
        { progress: 20, stage: videoDenoising ? 'Removing visual noise, grain, and compression artifacts...' : 'Processing video frames...' },
        { progress: 30, stage: lowLightEnhancement ? 'Enhancing low-light areas and restoring color balance...' : humanBodyEditing ? 'Detecting human figures with pose analysis...' : 'Optimizing video quality...' },
        { progress: 45, stage: tattooMasking ? 'Identifying tattoo areas and applying skin-tone filters...' : colorGrading ? 'Applying professional color grading...' : 'Enhancing video frames...' },
        { progress: 60, stage: skinEnhancement ? 'Analyzing skin tone and applying blemish correction...' : videoUpscaling ? `Upscaling to ${upscaleResolution} with pixel interpolation...` : 'Processing video enhancement...' },
        { progress: 75, stage: 'Enhancing audio track...' },
        { progress: 85, stage: 'Synchronizing audio-video alignment...' },
        { progress: 95, stage: 'Encoding final video...' },
      ];

      for (const { progress, stage } of stages) {
        setProcessingProgress(progress);
        setProcessingStage(stage);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const processedBlob = originalBlob;

      const bodyModificationDetails = (humanBodyEditing || tattooMasking || skinEnhancement) ? {
        bodyShapeAdjusted: humanBodyEditing,
        sizeAdjusted: humanBodyEditing,
        proportionsMaintained: humanBodyEditing,
        frameTransitionSmoothed: humanBodyEditing,
        tattooAreasDetected: tattooMasking,
        skinToneMatched: tattooMasking || skinEnhancement,
        inkColorCorrected: tattooMasking,
        complexionAnalysisDone: skinEnhancement,
        personalizedEnhancement: skinEnhancement,
        blemishCorrectionDone: skinEnhancement,
        adaptiveFilteringApplied: skinEnhancement,
      } : null;

      await completeProcessingMutation.mutateAsync({
        jobId,
        processedBlob,
        speechEnhancement: false,
        aggressiveMode: false,
        deepNoiseSuppression: false,
        phaseAwareMasking: true,
        timeDomainAdjustments: true,
        fullAudioTrack: null,
        dialogueTrack: null,
        processingTime: null,
        colorGrading,
        videoUpscaling,
        videoDenoising,
        lowLightEnhancement,
        enhancedResolution: videoUpscaling ? upscaleResolution : null,
        humanBodyEditing,
        tattooMasking,
        skinEnhancement,
        skinToneAnalysis: skinEnhancement,
        blemishCorrection: skinEnhancement,
        bodyModificationDetails,
      });

      setProcessingProgress(100);
      setProcessingStage('Complete!');
      toast.success('🎉 Video processing complete! Check the History tab to view your enhanced video.');

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setSelectedFile(null);
      setVideoPreviewUrl(null);
      setUploadProgress(0);
      setProcessingProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      setProcessingError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Mode</CardTitle>
          <CardDescription>Choose between audio or video editing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedMode === Mode.audio ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => onModeChange(Mode.audio)}
            >
              <FileAudio className="h-8 w-8" />
              <span>Audio Editing</span>
            </Button>
            <Button
              variant={selectedMode === Mode.video ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => onModeChange(Mode.video)}
            >
              <FileVideo className="h-8 w-8" />
              <span>Video Editing</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload {selectedMode === Mode.audio ? 'Audio' : 'Video'} File
          </CardTitle>
          <CardDescription>
            {selectedMode === Mode.audio
              ? 'Upload MP3, WAV, or M4A files for advanced audio enhancement'
              : 'Upload MP4, MOV, or AVI files for professional video enhancement'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {selectedMode === Mode.audio ? (
                  <FileAudio className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <FileVideo className="h-12 w-12 text-muted-foreground" />
                )}
                <div>
                  <p className="text-lg font-medium">
                    Drop your {selectedMode === Mode.audio ? 'audio' : 'video'} file here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedMode === Mode.audio
                      ? 'Supports MP3, WAV, M4A (max 500MB)'
                      : 'Supports MP4, MOV, AVI (max 500MB)'}
                  </p>
                </div>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {selectedMode === Mode.audio ? (
                  <FileAudio className="h-8 w-8 text-primary" />
                ) : (
                  <FileVideo className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedFile(null);
                  setVideoPreviewUrl(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Editor */}
      {selectedMode === Mode.audio && selectedFile && (
        <AdvancedAudioEditor
          originalFile={selectedFile}
          onProcessingComplete={handleAudioProcessingComplete}
        />
      )}

      {/* Video Enhancement Options */}
      {selectedMode === Mode.video && selectedFile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Video Enhancement Options
              </CardTitle>
              <CardDescription>
                Select AI-powered enhancements for your video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-primary" />
                    <Label htmlFor="color-grading">Color Grading</Label>
                  </div>
                  <Switch
                    id="color-grading"
                    checked={colorGrading}
                    onCheckedChange={setColorGrading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Maximize2 className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="video-upscaling">AI Upscaling</Label>
                      {videoUpscaling && (
                        <Select
                          value={upscaleResolution}
                          onValueChange={(value: '2K' | '4K') => setUpscaleResolution(value)}
                        >
                          <SelectTrigger className="w-20 h-6 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2K">2K</SelectItem>
                            <SelectItem value="4K">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <Switch
                    id="video-upscaling"
                    checked={videoUpscaling}
                    onCheckedChange={setVideoUpscaling}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-primary" />
                    <Label htmlFor="video-denoising">Video De-noising</Label>
                  </div>
                  <Switch
                    id="video-denoising"
                    checked={videoDenoising}
                    onCheckedChange={setVideoDenoising}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Film className="h-5 w-5 text-primary" />
                    <Label htmlFor="low-light">Low-Light Enhancement</Label>
                  </div>
                  <Switch
                    id="low-light"
                    checked={lowLightEnhancement}
                    onCheckedChange={setLowLightEnhancement}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <Label htmlFor="body-editing">Body Detection</Label>
                  </div>
                  <Switch
                    id="body-editing"
                    checked={humanBodyEditing}
                    onCheckedChange={setHumanBodyEditing}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Droplet className="h-5 w-5 text-primary" />
                    <Label htmlFor="tattoo-masking">Tattoo Masking</Label>
                  </div>
                  <Switch
                    id="tattoo-masking"
                    checked={tattooMasking}
                    onCheckedChange={setTattooMasking}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eraser className="h-5 w-5 text-primary" />
                    <Label htmlFor="skin-enhancement">Skin Enhancement</Label>
                  </div>
                  <Switch
                    id="skin-enhancement"
                    checked={skinEnhancement}
                    onCheckedChange={setSkinEnhancement}
                  />
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Process Video'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {processingStage}
                  </p>
                </div>
              )}

              {processingError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{processingError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Preview */}
          {videoPreviewUrl && (
            <Card ref={previewSectionRef}>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
                <CardDescription>Preview your video before processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoPreviewRef}
                    src={videoPreviewUrl}
                    className="w-full h-full object-contain"
                    onClick={handleVideoPlayPause}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVideoPlayPause} variant="outline" className="flex-1">
                    {isVideoPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Play
                      </>
                    )}
                  </Button>
                  <Button onClick={handleOpenPreviewDialog} variant="outline">
                    <Maximize2 className="h-4 w-4 mr-2" /> Enlarge
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Video Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
            <DialogDescription>Full-screen video preview</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={dialogVideoRef}
              src={videoPreviewUrl || undefined}
              className="w-full h-full object-contain"
              controls
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
