# Audio Synchronization for Slides

## Overview

This feature allows slides to match the duration of their corresponding audio files. It also supports audio checkpoints, where audio can play first and then continue at specific points during the slide.

## Current Implementation

Currently, the system is configured to work with a single audio file (`audio1.mp3`) for the first slide. Other slides will use a default duration of 90 frames (3 seconds at 30fps) since they don't have associated audio files yet. The system will automatically check for audio files for each slide and use them if available.

## How It Works

### Audio Duration Matching

Each slide's duration is now determined by the length of its associated audio file, rather than a fixed duration for all slides. This ensures that slides remain visible for exactly as long as their audio plays.

### Audio Checkpoints

The system supports audio checkpoints, which allow for more complex audio-visual synchronization:

1. Audio can play at the beginning of a slide
2. At specific checkpoints, additional audio segments can continue
3. This creates a more interactive experience where code changes can be synchronized with audio explanations

## Implementation Details

### Audio Files Structure

Audio files should be placed in the following directory structure:

```
public/audio/react-native/audio{slideNumber}.mp3
```

Where `{slideNumber}` corresponds to the slide number (extracted from the filename or based on index).

### Audio Metadata

To define checkpoints for audio files, you can modify the `loadAudioMetadata` function in `audioUtils.ts`. The function returns a map of audio filenames to their metadata, including duration and checkpoints.

Example:

```typescript
metadata.set('audio1.mp3', { duration: 3, checkpoints: [1, 2] }); // 3 seconds with checkpoints at 1s and 2s
metadata.set('audio2.mp3', { duration: 5 }); // 5 seconds, no checkpoints
```

### Adding New Audio Files

1. Create your audio file with the appropriate name (e.g., `audio2.mp3`, `audio3.mp3`, etc.)
2. Place it in the `public/audio/react-native/` directory
3. If you want to add checkpoints, update the metadata in `audioUtils.ts`
4. Update the `getAudioForSlide` function in `Main.tsx` to return the appropriate audio file for each slide index

```typescript
// Example of updated getAudioForSlide function for multiple audio files
const getAudioForSlide = (index: number, filename: string) => {
  // Map each slide index to its corresponding audio file
  switch (index) {
    case 0:
      return staticFile('/audio/react-native/audio1.mp3');
    case 1:
      return staticFile('/audio/react-native/audio2.mp3');
    case 2:
      return staticFile('/audio/react-native/audio3.mp3');
    // Add more cases as you add more audio files
    default:
      return null; // No audio for other slides
  }
};
```

## Usage

The system will automatically:

1. Load audio files for each slide
2. Calculate their durations
3. Apply checkpoints if defined
4. Adjust slide durations to match audio lengths

No additional configuration is needed for basic functionality. For advanced features like checkpoints, update the metadata as described above.

## Technical Implementation

The implementation uses the following components:

1. `audioUtils.ts` - Utility functions for getting audio durations and checkpoints
2. `Main.tsx` - Updated to use audio durations for slide timing and handle slides with no audio
3. `calculate-metadata.tsx` - Modified to calculate total video duration based on available audio files

### Handling Multiple Audio Files

When you add more audio files, you'll need to update the `calculateTotalDuration` function in `calculate-metadata.tsx` to account for all audio files:

```typescript
// Example of updated calculateTotalDuration function for multiple audio files
const calculateTotalDuration = async () => {
  let totalDuration = 0;
  const fps = 30; // Default FPS
  
  // Define which slides have audio files
  const slidesWithAudio = [0, 1, 2]; // Indices of slides with audio (0-based)
  
  // Calculate duration for each slide
  for (let i = 0; i < contents.length; i++) {
    if (slidesWithAudio.includes(i)) {
      // This slide has audio
      try {
        const audioPath = staticFile(`/audio/react-native/audio${i+1}.mp3`);
        const audioDuration = await getAudioDurationInFrames(audioPath, fps);
        totalDuration += audioDuration > 0 ? audioDuration : defaultStepDuration;
      } catch (error) {
        console.error(`Error getting duration for slide ${i+1} audio:`, error);
        totalDuration += defaultStepDuration; // Fallback to default duration
      }
    } else {
      // This slide has no audio, use default duration
      totalDuration += defaultStepDuration;
    }
  }
  
  return totalDuration > 0 ? totalDuration : contents.length * defaultStepDuration;
};
```

## Troubleshooting

If audio and slides are not synchronizing correctly:

1. Check that audio files are named correctly and placed in the right directory
2. Verify that the audio files are valid and can be played
3. Check the browser console for any errors related to audio loading
4. If using checkpoints, ensure they are defined correctly in the metadata
5. **Missing audio files**: The system is designed to gracefully handle missing audio files by using the default duration. If you're adding new audio files, make sure to update both `getAudioForSlide` in `Main.tsx` and consider updating `calculateTotalDuration` in `calculate-metadata.tsx` if you have a specific pattern of slides with audio
6. **Audio only playing for first slide**: This is the current expected behavior. To add audio for other slides, follow the instructions in the "Adding New Audio Files" section
7. **Audio cutting off before completion**: If audio is cutting off before it finishes playing:
   - Check the buffer added to the slide duration (currently 30 frames = 1 second at 30fps)
   - Increase the buffer in both `Main.tsx` and `calculate-metadata.tsx` if needed
   - Verify that the audio duration is being calculated correctly in `audioUtils.ts`
   - Make sure the Audio component has proper settings (playbackRate, volume, startFrom)
   - Try setting audio.preload = 'auto' in audioUtils.ts to ensure audio is fully loaded before playing