# Zune-inspired 16-bit Music Sequencer

A web-based music sequencer with a Zune-inspired design aesthetic that allows you to create 16-bit music loops.

## Features

- **8-track Sequencer**: Create patterns with 8 different instrument tracks across 16 steps
- **Sound Selection**: Choose from multiple sound samples for each track
- **Waveform Visualization**: Three visualization modes (waveform, bars, circles)
- **Randomizer**: "Genius" button to generate musically coherent patterns
- **Audio Effects**: Filter controls with frequency and Q adjustments
- **Responsive Design**: Works well on various desktop screen sizes
- **Zune-inspired UI**: Minimalist design with the distinctive Zune visual language

## How to Use

### Basic Controls

1. **Play/Pause**: Click the play button to start/stop the sequencer
2. **Tempo**: Adjust the tempo slider to change the playback speed (60-180 BPM)
3. **Clear**: Reset the pattern grid with the clear button

### Creating Patterns

- **Click** on grid cells to activate/deactivate steps for each instrument
- **Click and drag** across multiple cells to quickly create patterns
- **Click on track labels** to change the sound for that instrument

### Visualization

- Click the **mode** button in the waveform viewer to cycle through visualization styles:
  - Waveform: Classic audio waveform display
  - Bars: Frequency spectrum visualization
  - Circles: Concentric circle visualization that pulses with the audio

### Special Features

- **Genius Button**: Click the "genius" button to generate a random pattern based on music theory principles
- **Filter Effects**: Toggle the filter on/off and adjust its parameters:
  - Filter type: lowpass, highpass, bandpass, or notch
  - Frequency: Controls the cutoff frequency
  - Q: Adjusts the resonance of the filter

## Sound Credits

The application uses a collection of 16-bit audio samples organized by instrument type:

- **Kicks**: Basic kick drum samples
- **Snares**: Various snare drum sounds
- **Hi-hats**: Closed and open hi-hat samples
- **Percussion**: Claps, cowbells, and shakers
- **Bass**: 16-bit bass samples at different pitches

## Design Inspiration

The user interface is inspired by the Microsoft Zune media player's distinctive visual language, featuring:

- Minimalist aesthetic with clean, uncluttered interfaces
- Typography-focused design with the Segoe UI font family
- Zune color palette with black backgrounds and vibrant accent colors
- Content-first approach with simplified controls
- Subtle animations and transitions for an engaging experience

## Technical Implementation

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses the Web Audio API for sound generation and processing
- Canvas-based visualizations for real-time audio feedback
- No external dependencies or frameworks required