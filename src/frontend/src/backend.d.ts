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
export enum Mode {
    audio = "audio",
    video = "video"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadMediaFile(filename: string, contentType: string, size: bigint, blob: ExternalBlob, mode: Mode, aiPromptText: string, aiSelectedSpeechEnhancement: boolean, aiSelectedDeepNoiseSuppression: boolean, aiSelectedPhaseAwareMasking: boolean, aiSelectedTimeDomainAdjustments: boolean, aiSelectedProfessionalGradeDenoising: boolean, aiSelectedTransientReduction: boolean, aiSelectedDynamicRangeCompression: boolean, aiSelectedSpectralRepair: boolean, aiSelectedAdaptiveFiltering: boolean, aiSelectedNormalization: boolean, aiSelectedVoiceIsolation: boolean, aiSelectedFrequencyTargeting: boolean, aiSelectedVoiceClarityEnhancement: boolean, aiSelectedEqCurveOptimization: boolean, aiSelectedVolumeConsistency: boolean, aiSelectedPrePostGainControl: boolean, aiSelectedPhaseAlignment: boolean, aiSelectedFrequencyResponseAdjustment: boolean, aiSelectedSpectralDataGeneration: boolean, effectProvider: string, effectProviderLogo: string): Promise<string>;
}
