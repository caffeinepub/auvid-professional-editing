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
import Migration "migration";

// Unified Professional Grade Video Editor

(with migration = Migration.run)
actor {
  include MixinStorage();

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
    tripleCheckAnalysisResult : ?TripleCheckAnalysisResult;
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
      tripleCheckAnalysisResult = null;
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

  // Get processing job by ID - users can only access their own jobs
  public query ({ caller }) func getProcessingJob(jobId : Text) : async ?ProcessingJob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view processing jobs");
    };

    switch (processingJobs.get(jobId)) {
      case (null) { null };
      case (?job) {
        if (job.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own processing jobs");
        };
        ?job;
      };
    };
  };

  // Get all processing jobs for the caller
  public query ({ caller }) func getMyProcessingJobs() : async [ProcessingJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view processing jobs");
    };

    filterProcessingJobs(func(job) { job.user == caller });
  };

  // Get triple check analysis result for a specific job
  public query ({ caller }) func getTripleCheckAnalysis(jobId : Text) : async ?TripleCheckAnalysisResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view analysis results");
    };

    switch (processingJobs.get(jobId)) {
      case (null) { null };
      case (?job) {
        if (job.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own analysis results");
        };
        job.tripleCheckAnalysisResult;
      };
    };
  };

  // Update triple check analysis result - admin only or system internal
  public shared ({ caller }) func updateTripleCheckAnalysis(
    jobId : Text,
    analysisResult : TripleCheckAnalysisResult
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update analysis results");
    };

    switch (processingJobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) {
        let updatedJob = {
          job with
          tripleCheckAnalysisResult = ?analysisResult;
        };
        processingJobs.add(jobId, updatedJob);
      };
    };
  };

  // Get all processing jobs - admin only
  public query ({ caller }) func getAllProcessingJobs() : async [ProcessingJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all processing jobs");
    };

    filterProcessingJobs(func(_job) { true });
  };

  // Get user's media files
  public query ({ caller }) func getMyMediaFiles() : async [MediaFile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view media files");
    };

    switch (userFiles.get(caller)) {
      case (null) { [] };
      case (?files) { files.toArray() };
    };
  };

  // Delete processing job - users can only delete their own jobs
  public shared ({ caller }) func deleteProcessingJob(jobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete jobs");
    };

    switch (processingJobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) {
        if (job.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own jobs");
        };
        processingJobs.remove(jobId);
      };
    };
  };

  // Update job status - admin only
  public shared ({ caller }) func updateJobStatus(
    jobId : Text,
    status : ProcessingStatus
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update job status");
    };

    switch (processingJobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) {
        let updatedJob = {
          job with
          status = status;
          endTime = if (status == #completed or status == #failed) { ?Time.now() } else {
            job.endTime;
          };
        };
        processingJobs.add(jobId, updatedJob);
      };
    };
  };

  // Get video comparison config - users can only access their own configs
  public query ({ caller }) func getVideoComparisonConfig(configId : Text) : async ?VideoComparisonConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view comparison configs");
    };

    switch (videoComparisonConfigs.get(configId)) {
      case (null) { null };
      case (?config) {
        if (config.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own comparison configs");
        };
        ?config;
      };
    };
  };

  // Save video comparison config - users can only save their own configs
  public shared ({ caller }) func saveVideoComparisonConfig(
    configId : Text,
    config : VideoComparisonConfig
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save comparison configs");
    };

    if (config.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only save your own comparison configs");
    };

    videoComparisonConfigs.add(configId, config);
  };
};
