# Video Editing Smoke Test Checklist

This checklist verifies that video editing functionality remains unchanged after audio DSP upgrades or other modifications.

## Pre-Test Setup
- [ ] Clear browser cache and local storage
- [ ] Ensure test video files are available (various formats: MP4, MOV, etc.)
- [ ] Verify backend canister is running and accessible

## 1. Video Upload
- [ ] Navigate to Dashboard → Upload tab
- [ ] Select "Video" mode
- [ ] Upload a test video file
- [ ] Verify upload progress indicator displays correctly
- [ ] Confirm upload completes without errors

## 2. Video Preview
- [ ] After upload, verify video preview loads
- [ ] Check that video playback controls work (play/pause/seek)
- [ ] Verify video dimensions and duration display correctly
- [ ] Test volume control functionality

## 3. Video Effects & Editing
- [ ] Open Unified Video Editor tab
- [ ] Import a video clip
- [ ] Verify NLE timeline displays correctly
- [ ] Test drag-and-drop clip management
- [ ] Apply color grading effect
- [ ] Apply upscaling effect
- [ ] Apply denoising effect
- [ ] Apply low-light enhancement
- [ ] Verify real-time preview updates with effects

## 4. Video Comparison
- [ ] Process a video with effects applied
- [ ] Open video comparison view
- [ ] Verify side-by-side comparison displays both original and edited videos
- [ ] Test synchronized playback (both videos play in sync)
- [ ] Verify effect intensity controls work
- [ ] Test toggling effects on/off in comparison view

## 5. Job History
- [ ] Navigate to Processing History tab
- [ ] Verify processed video jobs appear in history
- [ ] Check that job status displays correctly
- [ ] Verify job metadata (timestamp, file name, effects applied)
- [ ] Test opening a completed job from history

## 6. Video Export
- [ ] Process a video with multiple effects
- [ ] Click Export button
- [ ] Verify export progress indicator
- [ ] Confirm exported file downloads successfully
- [ ] Verify exported video plays correctly in external player
- [ ] Check that exported video includes all applied effects

## 7. Edge Cases
- [ ] Test with very short video (< 5 seconds)
- [ ] Test with longer video (> 2 minutes)
- [ ] Test with different aspect ratios (16:9, 4:3, vertical)
- [ ] Test with different resolutions (720p, 1080p, 4K)
- [ ] Verify error handling for unsupported formats

## 8. UI/UX Verification
- [ ] Verify all video-related buttons are clickable and not blocked
- [ ] Check that video controls are not obscured by overlays
- [ ] Verify responsive layout on different screen sizes
- [ ] Test keyboard shortcuts (if implemented)
- [ ] Verify tooltips and help text display correctly

## Post-Audio-DSP-Upgrade Verification
After implementing automatic audio assessment/AI-controlled DSP:
- [ ] Confirm video upload flow is unchanged
- [ ] Verify video preview behavior is unchanged
- [ ] Check that video effects application works as before
- [ ] Verify video comparison functionality is unaffected
- [ ] Confirm video export produces identical results to pre-upgrade

## Notes
- Any failures should be documented with screenshots and console errors
- Video editing functionality should remain completely independent of audio DSP changes
- If any video feature is broken, audio DSP changes must be reviewed for unintended side effects

---
Last Updated: February 10, 2026
