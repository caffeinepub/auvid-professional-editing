# Specification

## Summary
**Goal:** Restore the prior video editor behavior while adding an advanced, user-controlled in-browser audio enhancement editor with reliable cross-browser playback and job history integration.

**Planned changes:**
- Revert/adjust frontend video editing surfaces so the Video Editor tab UI, controls, preview behavior, and History video comparison/download flow match the pre-audio-editor experience (no audio-editor UI/copy bleeding into video).
- Add an advanced Audio mode editor UI with controls for: Noise Suppression, Transient Suppression, Voice Isolation, Spectral Repair, and 3-band (Low/Mid/High) tone profiling, plus play/pause, seeking/scrubbing, and A/B preview (original vs edited).
- Implement export/download for edited audio output from Audio mode.
- Wire audio enhancement settings into the existing upload/job lifecycle so processed audio jobs complete with a processed file and applied audio flags reflected in History; surface processing failures as a clear error state.
- Ensure audio preview uses a browser-native in-DOM audio element so waveform/spectrum visualizations can attach and playback works across Chrome/Firefox/Safari (including iOS/Safari interaction constraints).

**User-visible outcome:** Video editing works as it did before the recent audio changes, and in Audio mode users can preview, A/B compare, enhance (noise/transient/voice/spectral/tone), process, and download edited audio—with completed jobs and applied enhancement indicators shown in History.
