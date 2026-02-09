# Video Editing Smoke Test Checklist

This checklist verifies that video editing functionality remains unchanged after audio DSP upgrades.

## Test Scenarios

### 1. Video Upload
- [ ] Navigate to Dashboard → "Upload Media" tab
- [ ] Select "Video" mode from the mode selector
- [ ] Upload a video file (MP4, MOV, or WebM)
- [ ] Verify upload progress displays correctly
- [ ] Confirm upload completes without errors

### 2. Video Editor Access
- [ ] Navigate to Dashboard → "Unified Video Editor" tab
- [ ] Verify the video editor UI loads correctly
- [ ] Check that all video editing controls are visible and responsive
- [ ] Confirm no console errors appear

### 3. Video Preview
- [ ] Upload or select a video file
- [ ] Verify video preview displays correctly
- [ ] Test play/pause controls
- [ ] Test seek/scrub functionality
- [ ] Verify video playback is smooth

### 4. Video Effects
- [ ] Access video effect controls (if available)
- [ ] Test enabling/disabling various video effects
- [ ] Verify effect preview updates in real-time
- [ ] Confirm effect strength sliders work correctly

### 5. Video Comparison
- [ ] Process a video with effects applied
- [ ] Access the video comparison view
- [ ] Verify side-by-side comparison displays correctly
- [ ] Test synchronized playback between original and edited versions
- [ ] Confirm comparison controls (play, pause, seek) work properly

### 6. Video Job History
- [ ] Navigate to Dashboard → "Processing History" tab
- [ ] Verify video processing jobs appear in the history
- [ ] Check that job status displays correctly
- [ ] Confirm job details are accurate

### 7. Video Export
- [ ] Process a video file
- [ ] Locate and click the export/download button
- [ ] Verify the processed video downloads successfully
- [ ] Confirm the downloaded file plays correctly in a media player

## Expected Results

All test scenarios should pass without:
- UI layout changes
- Broken functionality
- Console errors
- Performance regressions

## Notes

- This checklist focuses on video editing only
- Audio DSP changes should not affect video workflows
- Report any unexpected behavior or regressions
