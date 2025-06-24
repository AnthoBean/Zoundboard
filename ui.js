/**
 * Zune-inspired 16-bit Music Sequencer
 * UI Interactions
 * 
 * This module handles all user interface interactions, including:
 * - Sequencer grid initialization and interaction
 * - Track label interactions for sound selection
 * - Button controls (play/pause, randomize, clear)
 * - Audio effects controls
 * - Tempo adjustment
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playPauseBtn = document.getElementById('playPauseBtn');
    const randomizeBtn = document.getElementById('randomizeBtn');
    const tempoSlider = document.getElementById('tempoSlider');
    const tempoValue = document.getElementById('tempoValue');
    const sequencerGrid = document.getElementById('sequencerGrid');
    const trackLabels = document.querySelectorAll('.track-label');
    
    // Sound categories and their available samples
    const soundCategories = {
        0: { // Kicks
            category: 'kicks',
            samples: ['Kick-Drum-1.wav', 'Kick-Drum-2.wav']
        },
        1: { // Snares
            category: 'snares',
            samples: ['Snare-Drum-1.wav', 'Snare-Drum-2.wav', 'Ensoniq-ESQ-1-Snare.wav']
        },
        2: { // Hi-hats
            category: 'hi_hats',
            samples: ['Closed-Hi-Hat-1.wav', 'Open-Hi-Hat-1.wav', 'Ensoniq-SQ-1-Open-Hi-Hat.wav']
        },
        3: { // Percussion (Clap)
            category: 'percussion',
            samples: ['Clap-1.wav', 'Cowbell-1.wav', 'Shaker-1.wav']
        },
        4: { // Bass
            category: 'bass',
            samples: ['Bass-C1-16bit.wav', 'Bass-E1-16bit.wav', 'Bass-G1-16bit.wav', 'Alesis-Fusion-Acoustic-Bass-C2.wav']
        },
        5: { // Synth (using bass samples)
            category: 'bass',
            samples: ['Bass-E1-16bit.wav', 'Bass-G1-16bit.wav', 'Bass-C1-16bit.wav']
        },
        6: { // FX 1 (using percussion)
            category: 'percussion',
            samples: ['Cowbell-1.wav', 'Shaker-1.wav']
        },
        7: { // FX 2 (using percussion)
            category: 'percussion',
            samples: ['Shaker-1.wav', 'Clap-1.wav']
        }
    };
    
    // Audio effects state
    const effectsState = {
        filterFrequency: 22050, // Default: no filtering (max frequency)
        filterType: 'lowpass',  // Default filter type
        filterQ: 1,             // Default Q value
        filterEnabled: false    // Filter disabled by default
    };
    
    // Initialize the sequencer grid
    initializeGrid();
    
    // Add sound selection functionality to track labels
    setupTrackLabelInteractions();
    
    // Add audio effects controls
    setupEffectsControls();
    
    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    randomizeBtn.addEventListener('click', randomizePattern);
    tempoSlider.addEventListener('input', updateTempo);
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
    
    /**
     * Initialize the sequencer grid with 8 rows and 16 columns
     * Creates the grid cells and adds event listeners for interaction
     */
    function initializeGrid() {
        sequencerGrid.innerHTML = '';
        
        // Create 8 rows x 16 columns grid
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 16; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click event to toggle cell state
                cell.addEventListener('click', () => {
                    cell.classList.toggle('active');
                    // Trigger sound when cell is activated
                    if (cell.classList.contains('active')) {
                        // This will be handled by the sequencer.js
                        if (typeof triggerSound === 'function') {
                            triggerSound(row);
                        }
                        
                        // Apply visual effect to waveform if available
                        if (typeof applyVisualEffect === 'function') {
                            applyVisualEffect('flash');
                        }
                    }
                });
                
                // Add drag functionality for better UX
                cell.addEventListener('mousedown', () => {
                    // Set a flag to indicate we're in drag mode
                    window.isDragging = true;
                    window.dragState = !cell.classList.contains('active');
                });
                
                cell.addEventListener('mouseenter', () => {
                    // If we're dragging, toggle cells based on the initial drag state
                    if (window.isDragging) {
                        if (window.dragState) {
                            cell.classList.add('active');
                            if (typeof triggerSound === 'function') {
                                triggerSound(row);
                            }
                        } else {
                            cell.classList.remove('active');
                        }
                    }
                });
                
                // Add beat indicators for better rhythm visualization
                if (col % 4 === 0) {
                    // Add a subtle indicator for the main beats (1, 5, 9, 13)
                    cell.classList.add('beat-marker');
                    
                    // Add stronger indicator for the first beat
                    if (col === 0) {
                        cell.classList.add('first-beat');
                    }
                }
                
                sequencerGrid.appendChild(cell);
            }
        }
        
        // Add mouseup event to document to end dragging
        document.addEventListener('mouseup', () => {
            window.isDragging = false;
        });
        
        // Add mouseleave event to grid to end dragging if mouse leaves the grid
        sequencerGrid.addEventListener('mouseleave', () => {
            window.isDragging = false;
        });
    }
    
    /**
     * Set up interactions for track labels (sound selection)
     * Makes track labels clickable to change instrument sounds
     */
    function setupTrackLabelInteractions() {
        trackLabels.forEach((label, index) => {
            // Make track labels clickable for sound selection
            label.style.cursor = 'pointer';
            
            // Add click event to show sound options
            label.addEventListener('click', () => {
                // Create a dropdown for sound selection
                showSoundSelectionDropdown(label, index);
            });
        });
    }
    
    /**
     * Set up audio effects controls
     * Creates UI elements for controlling audio filter effects
     */
    function setupEffectsControls() {
        // Create effects container
        const effectsContainer = document.createElement('div');
        effectsContainer.className = 'effects-container';
        effectsContainer.style.display = 'flex';
        effectsContainer.style.alignItems = 'center';
        effectsContainer.style.gap = '1rem';
        effectsContainer.style.marginTop = '1rem';
        
        // Create filter toggle button
        const filterToggle = document.createElement('button');
        filterToggle.className = 'btn btn-filter';
        filterToggle.innerHTML = '<span>filter: off</span>';
        filterToggle.title = 'Toggle filter effect';
        
        // Create filter type selector
        const filterTypeSelect = document.createElement('select');
        filterTypeSelect.className = 'filter-type';
        filterTypeSelect.style.backgroundColor = 'var(--color-black)';
        filterTypeSelect.style.color = 'var(--color-gray)';
        filterTypeSelect.style.border = '1px solid var(--color-gray)';
        filterTypeSelect.style.padding = '4px 8px';
        filterTypeSelect.style.borderRadius = '4px';
        filterTypeSelect.style.fontSize = 'var(--font-size-xs)';
        filterTypeSelect.style.textTransform = 'lowercase';
        filterTypeSelect.disabled = true;
        
        // Add filter type options
        const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch'];
        filterTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            filterTypeSelect.appendChild(option);
        });
        
        // Create filter frequency slider
        const filterFreqSlider = document.createElement('input');
        filterFreqSlider.type = 'range';
        filterFreqSlider.min = '20';
        filterFreqSlider.max = '22050';
        filterFreqSlider.value = effectsState.filterFrequency;
        filterFreqSlider.className = 'filter-freq';
        filterFreqSlider.disabled = true;
        
        // Create filter frequency label
        const filterFreqLabel = document.createElement('span');
        filterFreqLabel.textContent = 'freq';
        filterFreqLabel.style.color = 'var(--color-gray)';
        filterFreqLabel.style.fontSize = 'var(--font-size-xs)';
        filterFreqLabel.style.textTransform = 'lowercase';
        
        // Create filter Q slider
        const filterQSlider = document.createElement('input');
        filterQSlider.type = 'range';
        filterQSlider.min = '0.1';
        filterQSlider.max = '20';
        filterQSlider.step = '0.1';
        filterQSlider.value = effectsState.filterQ;
        filterQSlider.className = 'filter-q';
        filterQSlider.disabled = true;
        
        // Create filter Q label
        const filterQLabel = document.createElement('span');
        filterQLabel.textContent = 'q';
        filterQLabel.style.color = 'var(--color-gray)';
        filterQLabel.style.fontSize = 'var(--font-size-xs)';
        filterQLabel.style.textTransform = 'lowercase';
        
        // Add event listeners for filter controls
        filterToggle.addEventListener('click', () => {
            effectsState.filterEnabled = !effectsState.filterEnabled;
            filterToggle.innerHTML = `<span>filter: ${effectsState.filterEnabled ? 'on' : 'off'}</span>`;
            filterToggle.style.color = effectsState.filterEnabled ? 'var(--color-green)' : 'var(--color-gray)';
            
            // Enable/disable other controls
            filterTypeSelect.disabled = !effectsState.filterEnabled;
            filterFreqSlider.disabled = !effectsState.filterEnabled;
            filterQSlider.disabled = !effectsState.filterEnabled;
            
            // Apply filter
            applyAudioEffects();
            
            // Apply visual effect to waveform if available
            if (typeof applyVisualEffect === 'function') {
                applyVisualEffect('ripple');
            }
        });
        
        filterTypeSelect.addEventListener('change', () => {
            effectsState.filterType = filterTypeSelect.value;
            applyAudioEffects();
        });
        
        filterFreqSlider.addEventListener('input', () => {
            effectsState.filterFrequency = parseInt(filterFreqSlider.value);
            applyAudioEffects();
        });
        
        filterQSlider.addEventListener('input', () => {
            effectsState.filterQ = parseFloat(filterQSlider.value);
            applyAudioEffects();
        });
        
        // Create filter frequency and Q container
        const filterFreqContainer = document.createElement('div');
        filterFreqContainer.style.display = 'flex';
        filterFreqContainer.style.alignItems = 'center';
        filterFreqContainer.style.gap = '0.5rem';
        filterFreqContainer.appendChild(filterFreqLabel);
        filterFreqContainer.appendChild(filterFreqSlider);
        
        const filterQContainer = document.createElement('div');
        filterQContainer.style.display = 'flex';
        filterQContainer.style.alignItems = 'center';
        filterQContainer.style.gap = '0.5rem';
        filterQContainer.appendChild(filterQLabel);
        filterQContainer.appendChild(filterQSlider);
        
        // Add elements to effects container
        effectsContainer.appendChild(filterToggle);
        effectsContainer.appendChild(filterTypeSelect);
        effectsContainer.appendChild(filterFreqContainer);
        effectsContainer.appendChild(filterQContainer);
        
        // Add effects container to playback controls
        const playbackControls = document.querySelector('.playback-controls');
        playbackControls.appendChild(effectsContainer);
    }
    
    /**
     * Set up keyboard shortcuts for common actions
     * Adds keyboard controls for play/pause, clear, and randomize
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only respond to shortcuts if not typing in an input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                return;
            }
            
            switch (event.key.toLowerCase()) {
                case ' ': // Spacebar for play/pause
                    event.preventDefault();
                    togglePlayPause();
                    break;
                    
                case 'c': // C for clear
                    event.preventDefault();
                    clearPattern();
                    break;
                    
                case 'r': // R for randomize
                    event.preventDefault();
                    randomizePattern();
                    break;
                    
                case 'f': // F for filter toggle
                    event.preventDefault();
                    const filterToggle = document.querySelector('.btn-filter');
                    if (filterToggle) {
                        filterToggle.click();
                    }
                    break;
            }
        });
    }
    
    /**
     * Apply audio effects based on current settings
     * Updates the filter node parameters
     */
    function applyAudioEffects() {
        if (!window.audioContext) return;
        
        // Create filter node if it doesn't exist
        if (!window.filterNode) {
            window.filterNode = window.audioContext.createBiquadFilter();
            
            // Insert filter between audio context destination and other nodes
            const destination = window.audioContext.destination;
            
            // Disconnect any existing connections to destination
            // Note: This is a simplified approach and might need adjustment
            // based on how the audio routing is set up in sequencer.js
            window.filterNode.connect(destination);
        }
        
        // Update filter parameters
        window.filterNode.type = effectsState.filterType;
        window.filterNode.frequency.value = effectsState.filterFrequency;
        window.filterNode.Q.value = effectsState.filterQ;
        
        // Enable/bypass filter
        if (effectsState.filterEnabled) {
            // Filter is enabled, ensure it's in the audio path
            console.log('Filter enabled:', effectsState);
            
            // If we have an updateFilter function from sequencer.js, use it
            if (typeof updateFilter === 'function') {
                updateFilter({
                    type: effectsState.filterType,
                    frequency: effectsState.filterFrequency,
                    Q: effectsState.filterQ
                });
            }
        } else {
            // Filter is disabled, set frequency to max to effectively bypass
            window.filterNode.frequency.value = 22050;
            window.filterNode.Q.value = 0.01;
            console.log('Filter disabled');
            
            // If we have an updateFilter function from sequencer.js, use it
            if (typeof updateFilter === 'function') {
                updateFilter({
                    frequency: 22050,
                    Q: 0.01
                });
            }
        }
    }
    
    /**
     * Show a dropdown menu for sound selection
     * Creates a dropdown with available sound options for the selected track
     * 
     * @param {HTMLElement} label - The track label element
     * @param {number} rowIndex - The row index (0-7)
     */
    function showSoundSelectionDropdown(label, rowIndex) {
        // Remove any existing dropdowns
        const existingDropdown = document.querySelector('.sound-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Get the sound category for this row
        const category = soundCategories[rowIndex];
        if (!category) return;
        
        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'sound-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.left = `${label.offsetLeft + label.offsetWidth}px`;
        dropdown.style.top = `${label.offsetTop}px`;
        dropdown.style.backgroundColor = '#000';
        dropdown.style.border = '1px solid var(--color-magenta)';
        dropdown.style.borderRadius = '4px';
        dropdown.style.padding = '8px';
        dropdown.style.zIndex = '100';
        
        // Add sound options
        category.samples.forEach(sample => {
            const option = document.createElement('div');
            option.textContent = sample.replace('.wav', '');
            option.style.padding = '4px 8px';
            option.style.cursor = 'pointer';
            option.style.color = 'var(--color-white)';
            option.style.transition = 'background-color 0.2s ease';
            
            // Hover effect
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'transparent';
            });
            
            // Click event to select this sound
            option.addEventListener('click', () => {
                const soundPath = `sounds/${category.category}/${sample}`;
                
                // Update the sound using the changeSound function from sequencer.js
                if (typeof changeSound === 'function') {
                    changeSound(rowIndex, soundPath);
                    
                    // Update label to show selected sound
                    const shortName = sample.split('-')[0].toLowerCase();
                    label.textContent = shortName;
                    
                    // Preview the sound
                    if (typeof triggerSound === 'function') {
                        triggerSound(rowIndex);
                    }
                    
                    // Remove dropdown
                    dropdown.remove();
                }
            });
            
            dropdown.appendChild(option);
        });
        
        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '2px';
        closeBtn.style.right = '6px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = 'var(--color-gray)';
        closeBtn.addEventListener('click', () => dropdown.remove());
        dropdown.appendChild(closeBtn);
        
        // Add click outside to close
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== label) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
        
        // Add to document
        document.body.appendChild(dropdown);
    }
    
    /**
     * Toggle play/pause state
     * Controls the sequencer playback
     */
    function togglePlayPause() {
        const isPlaying = playPauseBtn.classList.toggle('playing');
        
        if (isPlaying) {
            playPauseBtn.querySelector('span').textContent = 'pause';
            playPauseBtn.querySelector('.icon-play').style.display = 'none';
            playPauseBtn.querySelector('.icon-pause').style.display = 'inline-block';
            
            // Start sequencer (will be implemented in sequencer.js)
            if (typeof startSequencer === 'function') {
                startSequencer();
            }
            
            // Resume audio context if it's suspended
            if (typeof resumeAudioContext === 'function') {
                resumeAudioContext();
            }
        } else {
            playPauseBtn.querySelector('span').textContent = 'play';
            playPauseBtn.querySelector('.icon-play').style.display = 'inline-block';
            playPauseBtn.querySelector('.icon-pause').style.display = 'none';
            
            // Stop sequencer (will be implemented in sequencer.js)
            if (typeof stopSequencer === 'function') {
                stopSequencer();
            }
        }
    }
    
    /**
     * Randomize the pattern using music theory principles
     * Creates musically coherent patterns based on common rhythms
     */
    function randomizePattern() {
        // Clear existing pattern
        clearPattern();
        
        // Define common rhythm patterns for different instruments
        const rhythmPatterns = {
            kick: [
                [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Four-on-the-floor
                [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], // Four-on-the-floor with pickup
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0]  // Hip-hop style
            ],
            snare: [
                [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Basic backbeat
                [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], // Backbeat with pickup
                [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]  // Reggae style
            ],
            hihat: [
                [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Eighth notes
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Sixteenth notes
                [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]  // Triplet feel
            ],
            percussion: [
                [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // Off-beat accents
                [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Sparse accents
                [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]  // Downbeat emphasis
            ]
        };
        
        // Define bass patterns (based on common chord progressions)
        const bassPatterns = [
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Root note on 1
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], // Root note on 1 and 9
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]  // Root and fifth
        ];
        
        // Select random patterns for each instrument type
        const kickPattern = rhythmPatterns.kick[Math.floor(Math.random() * rhythmPatterns.kick.length)];
        const snarePattern = rhythmPatterns.snare[Math.floor(Math.random() * rhythmPatterns.snare.length)];
        const hihatPattern = rhythmPatterns.hihat[Math.floor(Math.random() * rhythmPatterns.hihat.length)];
        const percPattern = rhythmPatterns.percussion[Math.floor(Math.random() * rhythmPatterns.percussion.length)];
        const bassPattern = bassPatterns[Math.floor(Math.random() * bassPatterns.length)];
        
        // Apply patterns to the grid
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Apply different patterns based on instrument row
            switch (row) {
                case 0: // Kick
                    if (kickPattern[col]) cell.classList.add('active');
                    break;
                case 1: // Snare
                    if (snarePattern[col]) cell.classList.add('active');
                    break;
                case 2: // Hi-hat
                    if (hihatPattern[col]) cell.classList.add('active');
                    break;
                case 3: // Clap/Percussion
                    if (percPattern[col]) cell.classList.add('active');
                    break;
                case 4: // Bass
                    if (bassPattern[col]) cell.classList.add('active');
                    break;
                case 5: // Synth
                    // Create a complementary pattern to the bass
                    if (col % 4 === 0 && Math.random() < 0.6) cell.classList.add('active');
                    break;
                case 6: // FX 1
                case 7: // FX 2
                    // Add sparse random effects
                    if (Math.random() < 0.15) cell.classList.add('active');
                    break;
            }
        });
        
        // Add variation to make it less predictable
        addRandomVariation();
        
        // Animate the randomize button
        randomizeBtn.classList.add('animating');
        setTimeout(() => {
            randomizeBtn.classList.remove('animating');
        }, 300);
        
        // Show "genius" feedback
        showGeniusFeedback();
        
        // Apply visual effect to waveform if available
        if (typeof applyVisualEffect === 'function') {
            applyVisualEffect('flash');
        }
    }
    
    /**
     * Add random variation to the pattern to make it less predictable
     * Adds musical "humanization" to the generated patterns
     */
    function addRandomVariation() {
        const cells = document.querySelectorAll('.grid-cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Add some random variations
            if (cell.classList.contains('active')) {
                // Occasionally remove a note (10% chance)
                if (Math.random() < 0.1) {
                    cell.classList.remove('active');
                }
            } else {
                // Occasionally add a note (5% chance, varies by instrument)
                let chance = 0.05;
                
                // Adjust chance based on instrument
                if (row === 2) chance = 0.1; // More hi-hats
                if (row === 6 || row === 7) chance = 0.03; // Fewer FX
                
                if (Math.random() < chance) {
                    cell.classList.add('active');
                }
            }
        });
    }
    
    /**
     * Show a visual feedback when the genius button is clicked
     * Creates a temporary overlay with a message
     */
    function showGeniusFeedback() {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.textContent = 'genius pattern created';
        feedback.style.position = 'fixed';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.color = 'var(--color-orange)';
        feedback.style.fontSize = 'var(--font-size-medium)';
        feedback.style.fontWeight = '300';
        feedback.style.zIndex = '100';
        feedback.style.textTransform = 'lowercase';
        feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        feedback.style.padding = '1rem 2rem';
        feedback.style.borderRadius = '4px';
        feedback.style.opacity = '0';
        feedback.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        document.body.appendChild(feedback);
        
        // Fade in with animation
        setTimeout(() => {
            feedback.style.opacity = '1';
            feedback.style.transform = 'translate(-50%, -50%) scale(1.1)';
            
            setTimeout(() => {
                feedback.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                feedback.remove();
            }, 300);
        }, 1500);
    }
    
    /**
     * Update tempo based on slider value
     * Changes the sequencer playback speed
     */
    function updateTempo() {
        const tempo = tempoSlider.value;
        tempoValue.textContent = tempo;
        
        // Update sequencer tempo (will be implemented in sequencer.js)
        if (typeof setTempo === 'function') {
            setTempo(tempo);
        }
    }
    
    /**
     * Clear the entire pattern
     * Removes all active steps from the grid
     */
    function clearPattern() {
        const cells = document.querySelectorAll('.grid-cell.active');
        cells.forEach(cell => {
            cell.classList.remove('active');
        });
        
        // Apply visual effect to waveform if available
        if (typeof applyVisualEffect === 'function') {
            applyVisualEffect('flash');
        }
    }
    
    // Export functions for other modules
    window.initializeGrid = initializeGrid;
    window.togglePlayPause = togglePlayPause;
    window.randomizePattern = randomizePattern;
    window.clearPattern = clearPattern;
    window.applyAudioEffects = applyAudioEffects;
});