import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export interface DspBuffer {
    processedSamples: Array<number>;
}
export interface MediaFile {
    contentType: string;
    size: bigint;
    filename: string;
    uploadTime: Time;
}
export type Time = bigint;
export interface BodyModificationDetails {
    bodyShapeAdjusted: boolean;
    complexionAnalysisDone: boolean;
    sizeAdjusted: boolean;
    frameTransitionSmoothed: boolean;
    skinToneMatched: boolean;
    proportionsMaintained: boolean;
    inkColorCorrected: boolean;
    personalizedEnhancement: boolean;
    tattooAreasDetected: boolean;
    adaptiveFilteringApplied: boolean;
    blemishCorrectionDone: boolean;
}
export interface SpectralData {
    frequencyBins: Array<bigint>;
    duration: number;
    frequencyCrossoverPoints: Array<bigint>;
    timestamp: Time;
    intensityValues: Array<number>;
}
export interface VideoComparisonData {
    activeLayerStack: Array<string>;
    jobId: string;
    editedVideoUrl: string;
    lastModified: Time;
    originalVideoUrl: string;
    previewGenerated: boolean;
}
export interface DecodedAudio {
    samples: Array<number>;
}
export interface TripleCheckAnalysisResult {
    decodedInput: DecodedAudio;
    earlyPipelineOutput: DspBuffer;
    noiseDifferences: Array<number>;
    finalEncodedOutput: EncodedAudio;
}
export interface VideoComparisonConfig {
    active: boolean;
    owner: Principal;
    defaultFilters: Array<string>;
    lastConfigUpdate: Time;
    synchronizedPlayback: boolean;
    sideBySideEnabled: boolean;
    intensityLevel: number;
}
export interface ProcessingJob {
    outputFormat: string;
    aiSelectedEqCurveOptimization: boolean;
    startTime: Time;
    status: ProcessingStatus;
    denoisingStrength: bigint;
    tripleCheckAnalysisResult?: TripleCheckAnalysisResult;
    aiPromptText: string;
    dynamicRangeCompression: boolean;
    transientReduction: boolean;
    originalFile: ExternalBlob;
    upscalingStrength: bigint;
    dialogueOnlyTrack?: ExternalBlob;
    skinEnhancementApplied: boolean;
    endTime?: Time;
    aiSelectedVoiceClarityEnhancement: boolean;
    enhancedResolution?: string;
    renderingOptimized: boolean;
    speechEnhancementApplied: boolean;
    aiSelectedFrequencyResponseAdjustment: boolean;
    fullAudioTrack?: ExternalBlob;
    phaseAlignmentPreserved: boolean;
    tattooMaskingStrength: bigint;
    deepNoiseSuppressionApplied: boolean;
    skinToneAnalysisApplied: boolean;
    aiSelectedFrequencyTargeting: boolean;
    spectralRepair: boolean;
    aiSelectedNormalization: boolean;
    professionalGradeDenoising: boolean;
    mode: Mode;
    user: Principal;
    jobId: string;
    aiSelectedPhaseAwareMasking: boolean;
    aiSelectedAdaptiveFiltering: boolean;
    aiSelectedPrePostGainControl: boolean;
    aiSelectedPhaseAlignment: boolean;
    adaptiveFiltering: boolean;
    lowLightEnhancementStrength: bigint;
    frameMappingCompleted: boolean;
    frequencyTargeting: boolean;
    aiSelectedVoiceIsolation: boolean;
    videoUpscalingApplied: boolean;
    bodyEditingStrength: bigint;
    effectProvider: string;
    processingTimeAfterUpload?: bigint;
    aiSelectedDynamicRangeCompression: boolean;
    videoComparisonData?: VideoComparisonData;
    statusRelevantForUser: boolean;
    audioVideoSynchronizationMaintained: boolean;
    prePostGainControl: boolean;
    frequencyResponseAdjustment: boolean;
    aiSelectedVolumeConsistency: boolean;
    resolutionConversionCompleted: boolean;
    originalJobId?: string;
    voiceClarityEnhancement: boolean;
    eqCurveOptimized: boolean;
    bodyModificationDetails?: BodyModificationDetails;
    skinEnhancementStrength: bigint;
    aiSelectedTimeDomainAdjustments: boolean;
    timeDomainAdjusted: boolean;
    spectralDataGenerated: boolean;
    videoCompressionOptimization: boolean;
    processedFile?: ExternalBlob;
    videoFormatStandardization: boolean;
    volumeConsistencyValidated: boolean;
    aiSelectedSpeechEnhancement: boolean;
    colorGradingApplied: boolean;
    lowLightEnhancementApplied: boolean;
    voiceIsolation: boolean;
    aiSelectedTransientReduction: boolean;
    humanBodyEditingApplied: boolean;
    normalizationApplied: boolean;
    blemishCorrectionApplied: boolean;
    aiSelectedProfessionalGradeDenoising: boolean;
    comparisonTimestamp?: Time;
    colorGradingStrength: bigint;
    effectProviderLogo: string;
    aiSelectedSpectralRepair: boolean;
    spectralData?: SpectralData;
    aiSelectedSpectralDataGeneration: boolean;
    tattooMaskingApplied: boolean;
    phaseAwareMaskingApplied: boolean;
    videoDenoisingApplied: boolean;
    aiSelectedDeepNoiseSuppression: boolean;
}
export interface EncodedAudio {
    wavData: Array<number>;
}
export enum Mode {
    audio = "audio",
    video = "video"
}
export enum ProcessingStatus {
    pending = "pending",
    completed = "completed",
    processing = "processing",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProcessingJob(jobId: string): Promise<void>;
    getAllProcessingJobs(): Promise<Array<ProcessingJob>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyMediaFiles(): Promise<Array<MediaFile>>;
    getMyProcessingJobs(): Promise<Array<ProcessingJob>>;
    getProcessingJob(jobId: string): Promise<ProcessingJob | null>;
    getTripleCheckAnalysis(jobId: string): Promise<TripleCheckAnalysisResult | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoComparisonConfig(configId: string): Promise<VideoComparisonConfig | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveVideoComparisonConfig(configId: string, config: VideoComparisonConfig): Promise<void>;
    updateJobStatus(jobId: string, status: ProcessingStatus): Promise<void>;
    updateTripleCheckAnalysis(jobId: string, analysisResult: TripleCheckAnalysisResult): Promise<void>;
    uploadMediaFile(filename: string, contentType: string, size: bigint, blob: ExternalBlob, mode: Mode, aiPromptText: string, aiSelectedSpeechEnhancement: boolean, aiSelectedDeepNoiseSuppression: boolean, aiSelectedPhaseAwareMasking: boolean, aiSelectedTimeDomainAdjustments: boolean, aiSelectedProfessionalGradeDenoising: boolean, aiSelectedTransientReduction: boolean, aiSelectedDynamicRangeCompression: boolean, aiSelectedSpectralRepair: boolean, aiSelectedAdaptiveFiltering: boolean, aiSelectedNormalization: boolean, aiSelectedVoiceIsolation: boolean, aiSelectedFrequencyTargeting: boolean, aiSelectedVoiceClarityEnhancement: boolean, aiSelectedEqCurveOptimization: boolean, aiSelectedVolumeConsistency: boolean, aiSelectedPrePostGainControl: boolean, aiSelectedPhaseAlignment: boolean, aiSelectedFrequencyResponseAdjustment: boolean, aiSelectedSpectralDataGeneration: boolean, effectProvider: string, effectProviderLogo: string): Promise<string>;
}
