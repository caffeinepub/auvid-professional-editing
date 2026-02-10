# Specification

## Summary
**Goal:** Add an in-browser “Triple Check” audio diagnostics flow to pinpoint where post-processing static/artifacts are introduced, and harden the decode → DSP → encode pipeline to prevent invalid sample data from creating artifacts.

**Planned changes:**
- Add a “Triple Check” diagnostics run that compares three audio checkpoints: decoded input, an early/intermediate DSP stage, and final processed/encoded output.
- Extend the in-browser DSP processing function to optionally produce deterministic intermediate checkpoint renders while preserving the existing normal (non-diagnostics) processing path.
- Compute and display per-checkpoint metrics (sample rate, channels, duration, peak, RMS, DC offset estimate, NaN/Infinity count, clipping estimate) and highlight the first checkpoint that introduces abnormalities.
- Add checkpoint audition/playback so users can listen to each stage to confirm where static begins.
- Add a Diagnostics section in the Advanced Audio Editor with controls to run Triple Check, view results, and download a diagnostics report (JSON/text) including metrics and the settings used.
- Fix static-causing errors by hardening the decode/DSP/encode pipeline: ensure AudioContext cleanup on all code paths, sanitize/clamp samples during WAV encoding, and surface clear English warnings/errors when abnormal values are detected.

**User-visible outcome:** Users can run “Triple Check” from the Advanced Audio Editor to see and hear where static/artifacts first appear across the pipeline, get a clear flagged likely source stage with metrics, download a diagnostics report, and experience fewer/no newly introduced static artifacts after processing due to safer validation and encoding.
