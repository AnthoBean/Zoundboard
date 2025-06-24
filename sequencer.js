/**
 * Zune-inspired 16-bit Music Sequencer
 * Core Sequencer Functionality
 * 
 * This module handles all audio processing, sound loading, and sequencer timing.
 * It creates and manages the Web Audio API context and nodes for sound generation
 * and processing.
 */

// Audio Context and Playback State
let audioContext;
let isPlaying = false;
let currentStep = 0;
let tempo = 120; // BPM
let intervalId = null;

// Sound buffers for each instrument
const soundBuffers = [];

// Audio processing nodes
let masterGainNode;
let filterNode;
let analyserNode;

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Audio Context when user interacts with the page
    // This is required by browsers to prevent autoplay restrictions
    document.addEventListener('click', initAudioContext, { once: true });
    
    // Load sound samples
    loadSounds();
});

/**
 * Initialize the Web Audio API context
 * Creates the audio processing chain: masterGain -> filter -> analyser -> destination
 */
function initAudioContext() {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node for overall volume control
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.8; // Set to 80% volume
    
    // Create filter node for effects
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 22050; // Default to max frequency (no filtering)
    filterNode.Q.value = 1;
    
    // Create analyser node for visualization
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048; // For detailed waveform visualization
    
    // Connect nodes: masterGain -> filter -> analyser -> destination
    masterGainNode.connect(filterNode);
    filterNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
    
    console.log('Audio context initialized with audio processing chain');
}

/**
 * Load sound samples for each instrument
 * Organizes sounds by instrument type from the sounds directory
 */
function loadSounds() {
    // Define paths to sound samples from organized directories
    const soundPaths = [
        'sounds/kicks/Kick-Drum-1.wav',           // Row 0: Kick
        'sounds/snares/Snare-Drum-1.wav',         // Row 1: Snare
        'sounds/hi_hats/Closed-Hi-Hat-1.wav',     // Row 2: Hi-hat
        'sounds/percussion/Clap-1.wav',           // Row 3: Clap
        'sounds/bass/Bass-C1-16bit.wav',          // Row 4: Bass
        'sounds/bass/Bass-E1-16bit.wav',          // Row 5: Synth (using bass sample)
        'sounds/percussion/Cowbell-1.wav',        // Row 6: FX 1
        'sounds/percussion/Shaker-1.wav'          // Row 7: FX 2
    ];
    
    // Load each sound file
    soundPaths.forEach((path, index) => {
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sound: ${path}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                if (!audioContext) {
                    initAudioContext();
                }
                return audioContext.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                soundBuffers[index] = audioBuffer;
                console.log(`Loaded sound ${index}: ${path}`);
            })
            .catch(error => {
                console.error(`Error loading sound ${index}:`, error);
                // Fallback to synthesized sound if loading fails
                createSynthSound(index);
            });
    });
}

/**
 * Create a synthesized sound as fallback when samples can't be loaded
 * Uses oscillators to generate basic waveforms that approximate the intended sound
 * 
 * @param {number} index - Instrument index (0-7)
 */
function createSynthSound(index) {
    // Define sound types for each row (8 instruments)
    const soundTypes = [
        { name: 'kick', frequency: 60, decay: 0.4 },
        { name: 'snare', frequency: 200, decay: 0.2 },
        { name: 'hihat', frequency: 800, decay: 0.05 },
        { name: 'clap', frequency: 300, decay: 0.1 },
        { name: 'bass', frequency: 40, decay: 0.6 },
        { name: 'synth', frequency: 300, decay: 0.3 },
        { name: 'fx1', frequency: 500, decay: 0.2 },
        { name: 'fx2', frequency: 1200, decay: 0.1 }
    ];
    
    soundBuffers[index] = soundTypes[index];
    console.log(`Created synthesized sound for ${index}: ${soundTypes[index].name}`);
}

/**
 * Start the sequencer playback
 * Sets up the timing interval based on tempo and begins stepping through the pattern
 */
function startSequencer() {
    if (!audioContext) {
        initAudioContext();
    }
    
    if (isPlaying) return;
    
    isPlaying = true;
    currentStep = 0;
    
    // Calculate interval time based on tempo (BPM)
    // Formula: (60 seconds / BPM) / 4 = time for a 16th note in seconds
    const stepTime = (60 / tempo) / 4 * 1000; // Convert to milliseconds
    
    // Start the sequencer loop
    intervalId = setInterval(() => {
        playStep(currentStep);
        currentStep = (currentStep + 1) % 16; // Loop through 16 steps
    }, stepTime);
}

/**
 * Stop the sequencer playback
 * Clears the timing interval and resets visual indicators
 */
function stopSequencer() {
    isPlaying = false;
    clearInterval(intervalId);
    
    // Clear any playing indicators
    const cells = document.querySelectorAll('.grid-cell.playing');
    cells.forEach(cell => {
        cell.classList.remove('playing');
    });
}

/**
 * Play the current step in the sequence
 * Highlights the current step and triggers sounds for active cells
 * 
 * @param {number} step - Current step index (0-15)
 */
function playStep(step) {
    // Clear previous step indicators
    const prevCells = document.querySelectorAll('.grid-cell.playing');
    prevCells.forEach(cell => {
        cell.classList.remove('playing');
    });
    
    // Highlight current step
    const currentCells = document.querySelectorAll(`.grid-cell[data-col="${step}"]`);
    currentCells.forEach(cell => {
        cell.classList.add('playing');
        
        // If cell is active, play the corresponding sound
        if (cell.classList.contains('active')) {
            const row = parseInt(cell.dataset.row);
            triggerSound(row);
        }
    });
    
    // Update visualizer (implemented in visualizer.js)
    if (typeof updateVisualizer === 'function') {
        updateVisualizer(step);
    }
}

/**
 * Trigger a sound for the given instrument row
 * Either plays a sample from the sound buffer or synthesizes a sound
 * 
 * @param {number} row - Instrument row index (0-7)
 */
function triggerSound(row) {
    if (!audioContext) {
        initAudioContext();
        return; // Return early if context isn't ready yet
    }
    
    const sound = soundBuffers[row];
    
    if (!sound) {
        console.warn(`Sound for row ${row} not loaded yet`);
        return;
    }
    
    // Check if we have an audio buffer (sample) or need to synthesize
    if (sound instanceof AudioBuffer) {
        // Play the audio sample
        const source = audioContext.createBufferSource();
        source.buffer = sound;
        
        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.8;
        
        // Connect nodes to the master gain node
        source.connect(gainNode);
        gainNode.connect(masterGainNode);
        
        // Start playback
        source.start(0);
    } else {
        // Synthesize sound (fallback)
        synthesizeSound(sound);
    }
}

/**
 * Synthesize a sound using oscillators when samples aren't available
 * Creates different waveforms based on the instrument type
 * 
 * @param {Object} soundParams - Parameters for the synthesized sound
 */
function synthesizeSound(soundParams) {
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set oscillator type based on the instrument
    if (soundParams.name === 'kick' || soundParams.name === 'bass') {
        oscillator.type = 'sine';
    } else if (soundParams.name === 'snare' || soundParams.name === 'clap') {
        oscillator.type = 'triangle';
    } else if (soundParams.name === 'hihat') {
        oscillator.type = 'highpass';
    } else {
        oscillator.type = 'square';
    }
    
    // Set frequency and connect nodes
    oscillator.frequency.value = soundParams.frequency;
    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);
    
    // Apply envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + soundParams.decay);
    
    // Start and stop the oscillator
    oscillator.start(now);
    oscillator.stop(now + soundParams.decay);
}

/**
 * Set the sequencer tempo
 * Recalculates the timing interval based on the new BPM
 * 
 * @param {number} newTempo - Tempo in BPM (60-180)
 */
function setTempo(newTempo) {
    tempo = newTempo;
    
    // If currently playing, restart with new tempo
    if (isPlaying) {
        stopSequencer();
        startSequencer();
    }
}

/**
 * Change the sound for a specific row
 * Loads a new sample from the specified path
 * 
 * @param {number} row - Row index (0-7)
 * @param {string} soundPath - Path to the new sound file
 */
function changeSound(row, soundPath) {
    fetch(soundPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load sound: ${soundPath}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            if (!audioContext) {
                initAudioContext();
            }
            return audioContext.decodeAudioData(arrayBuffer);
        })
        .then(audioBuffer => {
            soundBuffers[row] = audioBuffer;
            console.log(`Changed sound ${row} to: ${soundPath}`);
        })
        .catch(error => {
            console.error(`Error changing sound ${row}:`, error);
        });
}

/**
 * Update filter parameters
 * Modifies the filter node's properties for audio effects
 * 
 * @param {Object} params - Filter parameters
 * @param {string} [params.type] - Filter type (lowpass, highpass, bandpass, notch)
 * @param {number} [params.frequency] - Filter cutoff frequency (20-22050 Hz)
 * @param {number} [params.Q] - Filter Q/resonance (0.1-20)
 */
function updateFilter(params) {
    if (!filterNode) return;
    
    if (params.type) filterNode.type = params.type;
    if (params.frequency) filterNode.frequency.value = params.frequency;
    if (params.Q) filterNode.Q.value = params.Q;
    
    console.log('Filter updated:', filterNode.type, filterNode.frequency.value, filterNode.Q.value);
}

/**
 * Get the analyzer node for visualization
 * Used by the visualizer.js module to access audio data
 * 
 * @returns {AnalyserNode} The analyzer node
 */
function getAnalyser() {
    return analyserNode;
}

/**
 * Resume the audio context if it's suspended
 * Useful for handling autoplay restrictions in browsers
 */
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed successfully');
        });
    }
}

// Export functions for other modules
window.startSequencer = startSequencer;
window.stopSequencer = stopSequencer;
window.triggerSound = triggerSound;
window.setTempo = setTempo;
window.changeSound = changeSound;
window.updateFilter = updateFilter;
window.getAnalyser = getAnalyser;
window.resumeAudioContext = resumeAudioContext;
window.audioContext = audioContext;
window.filterNode = filterNode;