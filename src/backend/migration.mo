import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Storage "blob-storage/Storage";

module {
  type DecodedAudio = {
    samples : [Float];
  };

  type DspBuffer = {
    processedSamples : [Float];
  };

  type EncodedAudio = {
    wavData : [Float];
  };

  type TripleCheckAnalysisResult = {
    decodedInput : DecodedAudio;
    earlyPipelineOutput : DspBuffer;
    finalEncodedOutput : EncodedAudio;
    noiseDifferences : [Float];
  };

  type MediaFile = {
    filename : Text;
    contentType : Text;
    size : Nat;
    uploadTime : Time.Time;
  };

  type ProcessingStatus = {
    #pending;
    #processing;
    #completed;
    #failed;
  };

  type Mode = {
    #audio;
    #video;
  };

  type VideoComparisonData = {
    jobId : Text;
    originalVideoUrl : Text;
    editedVideoUrl : Text;
    activeLayerStack : [Text];
    lastModified : Time.Time;
    previewGenerated : Bool;
  };

  type ProcessingJob = {
    jobId : Text;
    user : Principal;
    originalFile : Storage.ExternalBlob;
    processedFile : ?Storage.ExternalBlob;
    status : ProcessingStatus;
    startTime : Time.Time;
    endTime : ?Time.Time;
    mode : Mode;
    outputFormat : Text;
    processingTimeAfterUpload : ?Int;
    statusRelevantForUser : Bool;
    fullAudioTrack : ?Storage.ExternalBlob;
    dialogueOnlyTrack : ?Storage.ExternalBlob;
    spectralData : ?SpectralData;
    videoComparisonData : ?VideoComparisonData;
    speechEnhancementApplied : Bool;
    deepNoiseSuppressionApplied : Bool;
    phaseAwareMaskingApplied : Bool;
    timeDomainAdjusted : Bool;
    professionalGradeDenoising : Bool;
    transientReduction : Bool;
    dynamicRangeCompression : Bool;
    spectralRepair : Bool;
    adaptiveFiltering : Bool;
    normalizationApplied : Bool;
    voiceIsolation : Bool;
    frequencyTargeting : Bool;
    voiceClarityEnhancement : Bool;
    eqCurveOptimized : Bool;
    volumeConsistencyValidated : Bool;
    prePostGainControl : Bool;
    phaseAlignmentPreserved : Bool;
    frequencyResponseAdjustment : Bool;
    spectralDataGenerated : Bool;
    colorGradingApplied : Bool;
    videoUpscalingApplied : Bool;
    enhancedResolution : ?Text;
    videoDenoisingApplied : Bool;
    lowLightEnhancementApplied : Bool;
    humanBodyEditingApplied : Bool;
    tattooMaskingApplied : Bool;
    skinEnhancementApplied : Bool;
    skinToneAnalysisApplied : Bool;
    blemishCorrectionApplied : Bool;
    resolutionConversionCompleted : Bool;
    audioVideoSynchronizationMaintained : Bool;
    videoCompressionOptimization : Bool;
    frameMappingCompleted : Bool;
    videoFormatStandardization : Bool;
    renderingOptimized : Bool;
    bodyModificationDetails : ?BodyModificationDetails;
    originalJobId : ?Text;
    comparisonTimestamp : ?Time.Time;
    colorGradingStrength : Nat;
    upscalingStrength : Nat;
    denoisingStrength : Nat;
    bodyEditingStrength : Nat;
    lowLightEnhancementStrength : Nat;
    skinEnhancementStrength : Nat;
    tattooMaskingStrength : Nat;
    aiPromptText : Text;
    aiSelectedSpeechEnhancement : Bool;
    aiSelectedDeepNoiseSuppression : Bool;
    aiSelectedPhaseAwareMasking : Bool;
    aiSelectedTimeDomainAdjustments : Bool;
    aiSelectedProfessionalGradeDenoising : Bool;
    aiSelectedTransientReduction : Bool;
    aiSelectedDynamicRangeCompression : Bool;
    aiSelectedSpectralRepair : Bool;
    aiSelectedAdaptiveFiltering : Bool;
    aiSelectedNormalization : Bool;
    aiSelectedVoiceIsolation : Bool;
    aiSelectedFrequencyTargeting : Bool;
    aiSelectedVoiceClarityEnhancement : Bool;
    aiSelectedEqCurveOptimization : Bool;
    aiSelectedVolumeConsistency : Bool;
    aiSelectedPrePostGainControl : Bool;
    aiSelectedPhaseAlignment : Bool;
    aiSelectedFrequencyResponseAdjustment : Bool;
    aiSelectedSpectralDataGeneration : Bool;
    effectProvider : Text;
    effectProviderLogo : Text;
  };

  type BodyModificationDetails = {
    bodyShapeAdjusted : Bool;
    sizeAdjusted : Bool;
    proportionsMaintained : Bool;
    frameTransitionSmoothed : Bool;
    tattooAreasDetected : Bool;
    skinToneMatched : Bool;
    inkColorCorrected : Bool;
    complexionAnalysisDone : Bool;
    personalizedEnhancement : Bool;
    blemishCorrectionDone : Bool;
    adaptiveFilteringApplied : Bool;
  };

  type VideoComparisonConfig = {
    owner : Principal;
    sideBySideEnabled : Bool;
    synchronizedPlayback : Bool;
    defaultFilters : [Text];
    intensityLevel : Float;
    lastConfigUpdate : Time.Time;
    active : Bool;
  };

  type UserProfile = {
    name : Text;
  };

  type SpectralData = {
    frequencyBins : [Nat];
    intensityValues : [Float];
    timestamp : Time.Time;
    duration : Float;
    frequencyCrossoverPoints : [Nat];
  };

  type VideoEditStrengths = {
    colorGrading : Nat;
    upscaling : Nat;
    denoising : Nat;
    bodyEditing : Nat;
    lowLightEnhancement : Nat;
    skinEnhancement : Nat;
    tattooMasking : Nat;
  };

  type OldActor = {
    processingJobs : Map.Map<Text, ProcessingJob>;
    userFiles : Map.Map<Principal, List.List<MediaFile>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    videoComparisons : Map.Map<Text, VideoComparisonData>;
    videoComparisonConfigs : Map.Map<Text, VideoComparisonConfig>;
  };

  type NewProcessingJob = {
    jobId : Text;
    user : Principal;
    originalFile : Storage.ExternalBlob;
    processedFile : ?Storage.ExternalBlob;
    status : ProcessingStatus;
    startTime : Time.Time;
    endTime : ?Time.Time;
    mode : Mode;
    outputFormat : Text;
    processingTimeAfterUpload : ?Int;
    statusRelevantForUser : Bool;
    fullAudioTrack : ?Storage.ExternalBlob;
    dialogueOnlyTrack : ?Storage.ExternalBlob;
    spectralData : ?SpectralData;
    videoComparisonData : ?VideoComparisonData;
    speechEnhancementApplied : Bool;
    deepNoiseSuppressionApplied : Bool;
    phaseAwareMaskingApplied : Bool;
    timeDomainAdjusted : Bool;
    professionalGradeDenoising : Bool;
    transientReduction : Bool;
    dynamicRangeCompression : Bool;
    spectralRepair : Bool;
    adaptiveFiltering : Bool;
    normalizationApplied : Bool;
    voiceIsolation : Bool;
    frequencyTargeting : Bool;
    voiceClarityEnhancement : Bool;
    eqCurveOptimized : Bool;
    volumeConsistencyValidated : Bool;
    prePostGainControl : Bool;
    phaseAlignmentPreserved : Bool;
    frequencyResponseAdjustment : Bool;
    spectralDataGenerated : Bool;
    colorGradingApplied : Bool;
    videoUpscalingApplied : Bool;
    enhancedResolution : ?Text;
    videoDenoisingApplied : Bool;
    lowLightEnhancementApplied : Bool;
    humanBodyEditingApplied : Bool;
    tattooMaskingApplied : Bool;
    skinEnhancementApplied : Bool;
    skinToneAnalysisApplied : Bool;
    blemishCorrectionApplied : Bool;
    resolutionConversionCompleted : Bool;
    audioVideoSynchronizationMaintained : Bool;
    videoCompressionOptimization : Bool;
    frameMappingCompleted : Bool;
    videoFormatStandardization : Bool;
    renderingOptimized : Bool;
    bodyModificationDetails : ?BodyModificationDetails;
    originalJobId : ?Text;
    comparisonTimestamp : ?Time.Time;
    colorGradingStrength : Nat;
    upscalingStrength : Nat;
    denoisingStrength : Nat;
    bodyEditingStrength : Nat;
    lowLightEnhancementStrength : Nat;
    skinEnhancementStrength : Nat;
    tattooMaskingStrength : Nat;
    aiPromptText : Text;
    aiSelectedSpeechEnhancement : Bool;
    aiSelectedDeepNoiseSuppression : Bool;
    aiSelectedPhaseAwareMasking : Bool;
    aiSelectedTimeDomainAdjustments : Bool;
    aiSelectedProfessionalGradeDenoising : Bool;
    aiSelectedTransientReduction : Bool;
    aiSelectedDynamicRangeCompression : Bool;
    aiSelectedSpectralRepair : Bool;
    aiSelectedAdaptiveFiltering : Bool;
    aiSelectedNormalization : Bool;
    aiSelectedVoiceIsolation : Bool;
    aiSelectedFrequencyTargeting : Bool;
    aiSelectedVoiceClarityEnhancement : Bool;
    aiSelectedEqCurveOptimization : Bool;
    aiSelectedVolumeConsistency : Bool;
    aiSelectedPrePostGainControl : Bool;
    aiSelectedPhaseAlignment : Bool;
    aiSelectedFrequencyResponseAdjustment : Bool;
    aiSelectedSpectralDataGeneration : Bool;
    effectProvider : Text;
    effectProviderLogo : Text;
    tripleCheckAnalysisResult : ?TripleCheckAnalysisResult;
  };

  type NewActor = {
    processingJobs : Map.Map<Text, NewProcessingJob>;
    userFiles : Map.Map<Principal, List.List<MediaFile>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    videoComparisons : Map.Map<Text, VideoComparisonData>;
    videoComparisonConfigs : Map.Map<Text, VideoComparisonConfig>;
  };

  public func run(old : OldActor) : NewActor {
    let newProcessingJobs = old.processingJobs.map<Text, ProcessingJob, NewProcessingJob>(
      func(_jobId, oldJob) {
        { oldJob with tripleCheckAnalysisResult = null };
      }
    );
    { old with processingJobs = newProcessingJobs };
  };
};
