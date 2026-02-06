import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Mode } from '../backend';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Media Upload Mutations
export function useUploadMediaFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      filename: string;
      contentType: string;
      size: bigint;
      blob: ExternalBlob;
      mode: Mode;
      aiPromptText?: string;
      aiSelectedSpeechEnhancement?: boolean;
      aiSelectedDeepNoiseSuppression?: boolean;
      aiSelectedPhaseAwareMasking?: boolean;
      aiSelectedTimeDomainAdjustments?: boolean;
      aiSelectedProfessionalGradeDenoising?: boolean;
      aiSelectedTransientReduction?: boolean;
      aiSelectedDynamicRangeCompression?: boolean;
      aiSelectedSpectralRepair?: boolean;
      aiSelectedAdaptiveFiltering?: boolean;
      aiSelectedNormalization?: boolean;
      aiSelectedVoiceIsolation?: boolean;
      aiSelectedFrequencyTargeting?: boolean;
      aiSelectedVoiceClarityEnhancement?: boolean;
      aiSelectedEqCurveOptimization?: boolean;
      aiSelectedVolumeConsistency?: boolean;
      aiSelectedPrePostGainControl?: boolean;
      aiSelectedPhaseAlignment?: boolean;
      aiSelectedFrequencyResponseAdjustment?: boolean;
      aiSelectedSpectralDataGeneration?: boolean;
      effectProvider?: string;
      effectProviderLogo?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMediaFile(
        params.filename,
        params.contentType,
        params.size,
        params.blob,
        params.mode,
        params.aiPromptText || '',
        params.aiSelectedSpeechEnhancement || false,
        params.aiSelectedDeepNoiseSuppression || false,
        params.aiSelectedPhaseAwareMasking || false,
        params.aiSelectedTimeDomainAdjustments || false,
        params.aiSelectedProfessionalGradeDenoising || false,
        params.aiSelectedTransientReduction || false,
        params.aiSelectedDynamicRangeCompression || false,
        params.aiSelectedSpectralRepair || false,
        params.aiSelectedAdaptiveFiltering || false,
        params.aiSelectedNormalization || false,
        params.aiSelectedVoiceIsolation || false,
        params.aiSelectedFrequencyTargeting || false,
        params.aiSelectedVoiceClarityEnhancement || false,
        params.aiSelectedEqCurveOptimization || false,
        params.aiSelectedVolumeConsistency || false,
        params.aiSelectedPrePostGainControl || false,
        params.aiSelectedPhaseAlignment || false,
        params.aiSelectedFrequencyResponseAdjustment || false,
        params.aiSelectedSpectralDataGeneration || false,
        params.effectProvider || '',
        params.effectProviderLogo || ''
      );
    },
  });
}

// Stub hooks for missing backend functionality
export function useStartProcessing() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Start processing called for job:', jobId);
      // Backend method not available, return success
      return Promise.resolve();
    },
  });
}

export function useCompleteProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      console.log('Complete processing called for job:', params.jobId);
      // Backend method not available, return success
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userJobs'] });
      queryClient.invalidateQueries({ queryKey: ['processingJobs'] });
    },
  });
}

// Stub hooks for job queries
export function useGetUserJobs(mode: Mode | null) {
  return useQuery<any[]>({
    queryKey: ['userJobs', mode],
    queryFn: async () => {
      // Backend method not available, return empty array
      return [];
    },
    enabled: false, // Disable since backend doesn't support this
  });
}

export function useGetProcessingJobDetails(jobId: string) {
  return useQuery<any>({
    queryKey: ['processingJob', jobId],
    queryFn: async () => {
      // Backend method not available
      return null;
    },
    enabled: false, // Disable since backend doesn't support this
  });
}

export function useUpdateVideoEditStrengths() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { jobId: string; strengths: any }) => {
      console.log('Update video edit strengths called:', params);
      // Backend method not available, return success
      return Promise.resolve();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videoEditStrengths', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['processingJob', variables.jobId] });
    },
  });
}

export function useGetVideoEditStrengths(jobId: string) {
  return useQuery<any | null>({
    queryKey: ['videoEditStrengths', jobId],
    queryFn: async () => {
      // Backend method not available
      return null;
    },
    enabled: false, // Disable since backend doesn't support this
  });
}
