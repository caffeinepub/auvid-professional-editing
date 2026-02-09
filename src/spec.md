# Specification

## Summary
**Goal:** Improve the in-browser audio DSP tools (noise suppression, transient control, voice/dialogue isolation, spectral repair, dynamic EQ, and de-click/de-chirp) while keeping all video editing behavior and UI unchanged.

**Planned changes:**
- Upgrade `frontend/src/lib/audioProcessor.ts` to implement a stronger multi-stage DSP pipeline with distinct stages for noise suppression, transient/impulse suppression, voice/dialogue isolation, spectral repair, dynamic EQ, and de-click/de-chirp, all using browser-native Web Audio (e.g., `OfflineAudioContext`).
- Wire existing strength sliders in `frontend/src/components/AdvancedAudioEditor.tsx` into the DSP pipeline so slider movement (0–100%) measurably changes processing intensity rather than only toggling stages.
- Extend `AdvancedAudioEditor` UI to add missing controls for dynamic EQ and de-click/de-chirp (enable/disable + at least one strength/intensity control each), following the existing Switch + Slider pattern.
- Replace AI/deep-learning/GPU marketing copy and progress-stage labels in advanced audio surfaces with accurate DSP wording (English-only), including labels emitted from `audioProcessor.ts`.
- Ensure no changes that affect video editor UI, preview behavior, or video job-history comparison flows.

**User-visible outcome:** Users can apply noticeably stronger browser-based audio cleanup/enhancement with per-tool enable/disable and working strength controls (including new dynamic EQ and de-click/de-chirp controls), with accurate DSP labeling and no changes to video editing.
