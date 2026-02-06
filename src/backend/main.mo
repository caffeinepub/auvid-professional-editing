import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";


// Unified Professional Grade Video Editor


actor {
  include MixinStorage();

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

  let processingJobs = Map.empty<Text, ProcessingJob>();
  let userFiles = Map.empty<Principal, List.List<MediaFile>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let videoComparisons = Map.empty<Text, VideoComparisonData>();
  let videoComparisonConfigs = Map.empty<Text, VideoComparisonConfig>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  private func filterProcessingJobs(predicate : (ProcessingJob) -> Bool) : [ProcessingJob] {
    let jobs = List.empty<ProcessingJob>();
    let iter = processingJobs.values();
    iter.forEach(
      func(job) {
        if (predicate(job)) {
          jobs.add(job);
        };
      }
    );
    jobs.toArray();
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // File Upload
  public shared ({ caller }) func uploadMediaFile(
    filename : Text,
    contentType : Text,
    size : Nat,
    blob : Storage.ExternalBlob,
    mode : Mode,
    aiPromptText : Text,
    aiSelectedSpeechEnhancement : Bool,
    aiSelectedDeepNoiseSuppression : Bool,
    aiSelectedPhaseAwareMasking : Bool,
    aiSelectedTimeDomainAdjustments : Bool,
    aiSelectedProfessionalGradeDenoising : Bool,
    aiSelectedTransientReduction : Bool,
    aiSelectedDynamicRangeCompression : Bool,
    aiSelectedSpectralRepair : Bool,
    aiSelectedAdaptiveFiltering : Bool,
    aiSelectedNormalization : Bool,
    aiSelectedVoiceIsolation : Bool,
    aiSelectedFrequencyTargeting : Bool,
    aiSelectedVoiceClarityEnhancement : Bool,
    aiSelectedEqCurveOptimization : Bool,
    aiSelectedVolumeConsistency : Bool,
    aiSelectedPrePostGainControl : Bool,
    aiSelectedPhaseAlignment : Bool,
    aiSelectedFrequencyResponseAdjustment : Bool,
    aiSelectedSpectralDataGeneration : Bool,
    effectProvider : Text,
    effectProviderLogo : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload files");
    };

    let mediaFile : MediaFile = {
      filename;
      contentType;
      size;
      uploadTime = Time.now();
    };

    let jobId = filename # Time.now().toText();

    let processingJob : ProcessingJob = {
      jobId;
      user = caller;
      originalFile = blob;
      processedFile = null;
      status = #pending;
      startTime = Time.now();
      endTime = null;
      mode;
      outputFormat = if (mode == #audio) { "mp3" } else { "mp4" };
      processingTimeAfterUpload = null;
      statusRelevantForUser = true;
      fullAudioTrack = null;
      dialogueOnlyTrack = null;
      spectralData = null;
      videoComparisonData = null;
      speechEnhancementApplied = false;
      deepNoiseSuppressionApplied = false;
      phaseAwareMaskingApplied = false;
      timeDomainAdjusted = false;
      professionalGradeDenoising = false;
      transientReduction = false;
      dynamicRangeCompression = false;
      spectralRepair = false;
      adaptiveFiltering = false;
      normalizationApplied = false;
      voiceIsolation = false;
      frequencyTargeting = false;
      voiceClarityEnhancement = false;
      eqCurveOptimized = false;
      volumeConsistencyValidated = false;
      prePostGainControl = false;
      phaseAlignmentPreserved = false;
      frequencyResponseAdjustment = false;
      spectralDataGenerated = false;
      colorGradingApplied = false;
      videoUpscalingApplied = false;
      enhancedResolution = null;
      videoDenoisingApplied = false;
      lowLightEnhancementApplied = false;
      humanBodyEditingApplied = false;
      tattooMaskingApplied = false;
      skinEnhancementApplied = false;
      skinToneAnalysisApplied = false;
      blemishCorrectionApplied = false;
      resolutionConversionCompleted = false;
      audioVideoSynchronizationMaintained = false;
      videoCompressionOptimization = false;
      frameMappingCompleted = false;
      videoFormatStandardization = false;
      renderingOptimized = false;
      bodyModificationDetails = null;
      originalJobId = null;
      comparisonTimestamp = null;
      colorGradingStrength = 100;
      upscalingStrength = 100;
      denoisingStrength = 100;
      bodyEditingStrength = 100;
      lowLightEnhancementStrength = 100;
      skinEnhancementStrength = 100;
      tattooMaskingStrength = 100;
      aiPromptText;
      aiSelectedSpeechEnhancement;
      aiSelectedDeepNoiseSuppression;
      aiSelectedPhaseAwareMasking;
      aiSelectedTimeDomainAdjustments;
      aiSelectedProfessionalGradeDenoising;
      aiSelectedTransientReduction;
      aiSelectedDynamicRangeCompression;
      aiSelectedSpectralRepair;
      aiSelectedAdaptiveFiltering;
      aiSelectedNormalization;
      aiSelectedVoiceIsolation;
      aiSelectedFrequencyTargeting;
      aiSelectedVoiceClarityEnhancement;
      aiSelectedEqCurveOptimization;
      aiSelectedVolumeConsistency;
      aiSelectedPrePostGainControl;
      aiSelectedPhaseAlignment;
      aiSelectedFrequencyResponseAdjustment;
      aiSelectedSpectralDataGeneration;
      effectProvider;
      effectProviderLogo;
    };

    let files = switch (userFiles.get(caller)) {
      case (null) { List.empty<MediaFile>() };
      case (?existingList) { existingList };
    };

    files.add(mediaFile);
    userFiles.add(caller, files);
    processingJobs.add(jobId, processingJob);
    jobId;
  };
};
