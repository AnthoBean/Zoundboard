/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * Sound Selection Dialog
 * 
 * This module implements a Metro UI-styled dialog for browsing and selecting sounds.
 * It provides filtering, categorization, and preview functionality for the sound library.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Sound library state
    const soundLibrary = {
        categories: [
            { id: 'kicks', name: 'Kicks', icon: 'drum' },
            { id: 'snares', name: 'Snares', icon: 'drum' },
            { id: 'hi_hats', name: 'Hi-Hats', icon: 'drum' },
            { id: 'percussion', name: 'Percussion', icon: 'drum' },
            { id: 'bass', name: 'Bass', icon: 'music' },
            { id: 'synth', name: 'Synth', icon: 'music' },
            { id: 'vocals', name: 'Vocals', icon: 'mic' },
            { id: 'fx', name: 'FX', icon: 'sound' }
        ],
        sounds: [],
        currentCategory: 'kicks',
        currentFilter: '',
        selectedSound: null,
        currentRow: 0
    };
    
    // Dialog state
    let dialogOpen = false;
    let dialogElement = null;
    
    /**
     * Initialize the sound selector
     * Sets up event listeners and loads sound data
     */
    function initSoundSelector() {
        // Create dialog element
        createDialogElement();
        
        // Add event listener to track labels for opening the dialog
        const trackLabels = document.querySelectorAll('.track-label');
        trackLabels.forEach((label, index) => {
            label.addEventListener('click', () => {
                openSoundSelector(index);
            });
            
            // Add visual indicator that track labels are clickable
            label.classList.add('clickable');
            label.setAttribute('title', 'Click to change sound');
        });
        
        // Load sound library data
        loadSoundLibrary();
    }
    
    /**
     * Create the dialog element
     * Builds the Metro UI-styled dialog for sound selection
     */
    function createDialogElement() {
        // Create dialog container
        dialogElement = document.createElement('div');
        dialogElement.className = 'metro-dialog sound-selector-dialog';
        dialogElement.setAttribute('role', 'dialog');
        dialogElement.setAttribute('aria-modal', 'true');
        dialogElement.setAttribute('aria-labelledby', 'sound-selector-title');
        dialogElement.style.display = 'none';
        
        // Create dialog content
        const dialogContent = `
            <div class="metro-dialog-header">
                <h2 id="sound-selector-title">select sound</h2>
                <button class="metro-dialog-close metro-focus-element" aria-label="Close dialog">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>
            </div>
            <div class="metro-dialog-body">
                <div class="sound-selector-categories">
                    <ul class="category-list"></ul>
                </div>
                <div class="sound-selector-content">
                    <div class="sound-selector-search">
                        <input type="text" class="sound-search-input metro-focus-element" placeholder="search sounds" aria-label="Search sounds">
                    </div>
                    <div class="sound-selector-list">
                        <ul class="sound-list"></ul>
                    </div>
                </div>
            </div>
            <div class="metro-dialog-footer">
                <button class="btn btn-cancel metro-focus-element">cancel</button>
                <button class="btn btn-select metro-focus-element">select</button>
            </div>
        `;
        
        dialogElement.innerHTML = dialogContent;
        
        // Add event listeners
        const closeButton = dialogElement.querySelector('.metro-dialog-close');
        closeButton.addEventListener('click', closeSoundSelector);
        
        const cancelButton = dialogElement.querySelector('.btn-cancel');
        cancelButton.addEventListener('click', closeSoundSelector);
        
        const selectButton = dialogElement.querySelector('.btn-select');
        selectButton.addEventListener('click', selectSound);
        
        const searchInput = dialogElement.querySelector('.sound-search-input');
        searchInput.addEventListener('input', filterSounds);
        
        // Add dialog to document
        document.body.appendChild(dialogElement);
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'metro-dialog-backdrop';
        backdrop.style.display = 'none';
        backdrop.addEventListener('click', closeSoundSelector);
        document.body.appendChild(backdrop);
    }
    
    /**
     * Load sound library data
     * Fetches sound files and organizes them by category
     */
    function loadSoundLibrary() {
        // Fetch sound files for each category
        soundLibrary.categories.forEach(category => {
            fetch(`assets/sounds/${category.id}/index.json`)
                .then(response => {
                    if (!response.ok) {
                        // If index.json doesn't exist, scan directory
                        scanSoundDirectory(category.id);
                        return null;
                    }
                    return response.json();
                })
                .then(data => {
                    if (data) {
                        // Add sounds from index.json
                        data.sounds.forEach(sound => {
                            sound.category = category.id;
                            soundLibrary.sounds.push(sound);
                        });
                    }
                })
                .catch(error => {
                    console.warn(`Error loading sound library for ${category.id}:`, error);
                    // Fallback to directory scan
                    scanSoundDirectory(category.id);
                });
        });
    }
    
    /**
     * Scan a sound directory for sound files
     * Used as fallback when index.json is not available
     * 
     * @param {string} categoryId - Category ID to scan
     */
    function scanSoundDirectory(categoryId) {
        // This would normally use a server-side API to scan directories
        // For client-side only, we'll use a predefined list of common sound files
        
        const commonSounds = {
            kicks: [
                { name: 'Kick Drum 1', file: 'kick-1.wav', tags: ['drum', 'kick', 'bass'] },
                { name: 'Kick Drum 2', file: 'kick-2.wav', tags: ['drum', 'kick', 'bass'] },
                { name: 'Kick Drum 3', file: 'kick-3.wav', tags: ['drum', 'kick', 'bass'] },
                { name: 'Deep Kick', file: 'deep-kick.wav', tags: ['drum', 'kick', 'bass', 'deep'] },
                { name: '808 Kick', file: '808-kick.wav', tags: ['drum', 'kick', '808', 'bass'] }
            ],
            snares: [
                { name: 'Snare Drum 1', file: 'snare-1.wav', tags: ['drum', 'snare'] },
                { name: 'Snare Drum 2', file: 'snare-2.wav', tags: ['drum', 'snare'] },
                { name: 'Clap Snare', file: 'clap-snare.wav', tags: ['drum', 'snare', 'clap'] },
                { name: 'Rim Shot', file: 'rim-shot.wav', tags: ['drum', 'snare', 'rim'] }
            ],
            hi_hats: [
                { name: 'Closed Hi-Hat', file: 'closed-hat.wav', tags: ['drum', 'hi-hat', 'closed'] },
                { name: 'Open Hi-Hat', file: 'open-hat.wav', tags: ['drum', 'hi-hat', 'open'] },
                { name: 'Pedal Hi-Hat', file: 'pedal-hat.wav', tags: ['drum', 'hi-hat', 'pedal'] }
            ],
            percussion: [
                { name: 'Clap', file: 'clap.wav', tags: ['percussion', 'clap'] },
                { name: 'Tambourine', file: 'tambourine.wav', tags: ['percussion'] },
                { name: 'Shaker', file: 'shaker.wav', tags: ['percussion', 'shaker'] },
                { name: 'Cowbell', file: 'cowbell.wav', tags: ['percussion', 'cowbell'] }
            ],
            bass: [
                { name: 'Bass C1', file: 'bass-c1.wav', tags: ['bass', 'c1'] },
                { name: 'Bass E1', file: 'bass-e1.wav', tags: ['bass', 'e1'] },
                { name: 'Bass G1', file: 'bass-g1.wav', tags: ['bass', 'g1'] },
                { name: '808 Bass', file: '808-bass.wav', tags: ['bass', '808'] }
            ],
            synth: [
                { name: 'Synth Lead', file: 'synth-lead.wav', tags: ['synth', 'lead'] },
                { name: 'Synth Pad', file: 'synth-pad.wav', tags: ['synth', 'pad'] },
                { name: 'Synth Pluck', file: 'synth-pluck.wav', tags: ['synth', 'pluck'] }
            ],
            vocals: [
                { name: 'Vocal Ah', file: 'vocal-ah.wav', tags: ['vocal', 'ah'] },
                { name: 'Vocal Oh', file: 'vocal-oh.wav', tags: ['vocal', 'oh'] },
                { name: 'Vocal Chop', file: 'vocal-chop.wav', tags: ['vocal', 'chop'] }
            ],
            fx: [
                { name: 'Riser', file: 'riser.wav', tags: ['fx', 'riser'] },
                { name: 'Downlifter', file: 'downlifter.wav', tags: ['fx', 'downlifter'] },
                { name: 'Impact', file: 'impact.wav', tags: ['fx', 'impact'] },
                { name: 'Sweep', file: 'sweep.wav', tags: ['fx', 'sweep'] }
            ]
        };
        
        // Add sounds from predefined list
        if (commonSounds[categoryId]) {
            commonSounds[categoryId].forEach(sound => {
                soundLibrary.sounds.push({
                    name: sound.name,
                    file: `assets/sounds/${categoryId}/${sound.file}`,
                    category: categoryId,
                    tags: sound.tags
                });
            });
        }
    }
    
    /**
     * Open the sound selector dialog
     * 
     * @param {number} rowIndex - Row index (0-7) to select sound for
     */
    function openSoundSelector(rowIndex) {
        if (!dialogElement) return;
        
        // Set current row
        soundLibrary.currentRow = rowIndex;
        
        // Set current category based on row
        const categoryMap = {
            0: 'kicks',
            1: 'snares',
            2: 'hi_hats',
            3: 'percussion',
            4: 'bass',
            5: 'synth',
            6: 'fx',
            7: 'fx'
        };
        
        soundLibrary.currentCategory = categoryMap[rowIndex] || 'kicks';
        
        // Update dialog title
        const dialogTitle = dialogElement.querySelector('#sound-selector-title');
        const trackLabels = document.querySelectorAll('.track-label');
        const trackName = rowIndex < trackLabels.length ? trackLabels[rowIndex].textContent : `track ${rowIndex + 1}`;
        dialogTitle.textContent = `select sound for ${trackName}`;
        
        // Populate categories
        populateCategories();
        
        // Populate sounds for current category
        populateSounds();
        
        // Show dialog
        dialogElement.style.display = 'flex';
        document.querySelector('.metro-dialog-backdrop').style.display = 'block';
        dialogOpen = true;
        
        // Focus search input
        setTimeout(() => {
            dialogElement.querySelector('.sound-search-input').focus();
        }, 100);
        
        // Add keyboard event listener
        document.addEventListener('keydown', handleDialogKeydown);
    }
    
    /**
     * Close the sound selector dialog
     */
    function closeSoundSelector() {
        if (!dialogElement) return;
        
        // Hide dialog
        dialogElement.style.display = 'none';
        document.querySelector('.metro-dialog-backdrop').style.display = 'none';
        dialogOpen = false;
        
        // Remove keyboard event listener
        document.removeEventListener('keydown', handleDialogKeydown);
    }
    
    /**
     * Handle keyboard events for the dialog
     * 
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleDialogKeydown(e) {
        if (!dialogOpen) return;
        
        // Close dialog on Escape
        if (e.key === 'Escape') {
            closeSoundSelector();
        }
        
        // Select sound on Enter
        if (e.key === 'Enter' && soundLibrary.selectedSound) {
            selectSound();
        }
    }
    
    /**
     * Populate category list
     * Creates the list of sound categories in the dialog
     */
    function populateCategories() {
        const categoryList = dialogElement.querySelector('.category-list');
        categoryList.innerHTML = '';
        
        soundLibrary.categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'category-item metro-focus-element';
            if (category.id === soundLibrary.currentCategory) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <span class="category-icon">${getCategoryIcon(category.icon)}</span>
                <span class="category-name">${category.name}</span>
            `;
            
            li.addEventListener('click', () => {
                soundLibrary.currentCategory = category.id;
                soundLibrary.currentFilter = '';
                
                // Update active category
                const activeCategory = categoryList.querySelector('.active');
                if (activeCategory) {
                    activeCategory.classList.remove('active');
                }
                li.classList.add('active');
                
                // Clear search input
                const searchInput = dialogElement.querySelector('.sound-search-input');
                searchInput.value = '';
                
                // Update sound list
                populateSounds();
            });
            
            categoryList.appendChild(li);
        });
    }
    
    /**
     * Get SVG icon for category
     * 
     * @param {string} iconName - Icon name
     * @returns {string} SVG icon markup
     */
    function getCategoryIcon(iconName) {
        const icons = {
            drum: '<svg viewBox="0 0 24 24"><path d="M12 2C5.92 2 1 3.58 1 5.5v12c0 1.92 4.92 3.5 11 3.5s11-1.58 11-3.5v-12C23 3.58 18.08 2 12 2zm0 15c-5.52 0-10-1.34-10-3v-2.22c2.2 1.38 6.36 2.22 10 2.22s7.8-.84 10-2.22V14c0 1.66-4.48 3-10 3zm0-5c-5.52 0-10-1.34-10-3v-2.22c2.2 1.38 6.36 2.22 10 2.22s7.8-.84 10-2.22V9c0 1.66-4.48 3-10 3zm0-5c-5.52 0-10-1.34-10-3s4.48-3 10-3 10 1.34 10 3-4.48 3-10 3z"/></svg>',
            music: '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
            mic: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
            sound: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
        };
        
        return icons[iconName] || icons.sound;
    }
    
    /**
     * Populate sound list
     * Creates the list of sounds for the current category and filter
     */
    function populateSounds() {
        const soundList = dialogElement.querySelector('.sound-list');
        soundList.innerHTML = '';
        
        // Filter sounds by category and search term
        const filteredSounds = soundLibrary.sounds.filter(sound => {
            // Filter by category
            const categoryMatch = sound.category === soundLibrary.currentCategory;
            
            // Filter by search term if provided
            if (!soundLibrary.currentFilter) {
                return categoryMatch;
            }
            
            const searchTerm = soundLibrary.currentFilter.toLowerCase();
            const nameMatch = sound.name.toLowerCase().includes(searchTerm);
            const tagMatch = sound.tags && sound.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            return categoryMatch && (nameMatch || tagMatch);
        });
        
        // Display message if no sounds found
        if (filteredSounds.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'sound-item-empty';
            emptyMessage.textContent = 'no sounds found';
            soundList.appendChild(emptyMessage);
            return;
        }
        
        // Add sounds to list
        filteredSounds.forEach(sound => {
            const li = document.createElement('li');
            li.className = 'sound-item metro-focus-element';
            li.setAttribute('data-file', sound.file);
            
            li.innerHTML = `
                <span class="sound-name">${sound.name}</span>
                <button class="sound-preview metro-focus-element" aria-label="Preview sound">
                    <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </button>
            `;
            
            // Add click event to select sound
            li.addEventListener('click', (e) => {
                // Don't select if clicking preview button
                if (e.target.closest('.sound-preview')) return;
                
                // Update selected sound
                soundLibrary.selectedSound = sound;
                
                // Update active sound
                const activeSound = soundList.querySelector('.active');
                if (activeSound) {
                    activeSound.classList.remove('active');
                }
                li.classList.add('active');
            });
            
            // Add double-click to select and close
            li.addEventListener('dblclick', () => {
                soundLibrary.selectedSound = sound;
                selectSound();
            });
            
            // Add preview button click event
            const previewButton = li.querySelector('.sound-preview');
            previewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                previewSound(sound.file);
            });
            
            soundList.appendChild(li);
        });
    }
    
    /**
     * Filter sounds based on search input
     * 
     * @param {Event} e - Input event
     */
    function filterSounds(e) {
        soundLibrary.currentFilter = e.target.value;
        populateSounds();
    }
    
    /**
     * Preview a sound
     * 
     * @param {string} soundFile - Path to sound file
     */
    function previewSound(soundFile) {
        if (!window.audioContext) {
            if (typeof window.resumeAudioContext === 'function') {
                window.resumeAudioContext();
            }
            return;
        }
        
        fetch(soundFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sound: ${soundFile}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                return window.audioContext.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                const source = window.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                
                // Create gain node for volume control
                const gainNode = window.audioContext.createGain();
                gainNode.gain.value = 0.8;
                
                // Connect nodes
                source.connect(gainNode);
                gainNode.connect(window.audioContext.destination);
                
                // Start playback
                source.start(0);
            })
            .catch(error => {
                console.error(`Error previewing sound:`, error);
            });
    }
    
    /**
     * Select the current sound and apply it to the track
     */
    function selectSound() {
        if (!soundLibrary.selectedSound) return;
        
        // Apply selected sound to the track
        if (typeof window.changeSound === 'function') {
            window.changeSound(soundLibrary.currentRow, soundLibrary.selectedSound.file);
            
            // Update track label
            const trackLabels = document.querySelectorAll('.track-label');
            if (soundLibrary.currentRow < trackLabels.length) {
                // Extract sound name without category prefix
                let displayName = soundLibrary.selectedSound.name;
                if (displayName.includes(' ')) {
                    displayName = displayName.split(' ').pop();
                }
                
                // Truncate if too long
                if (displayName.length > 8) {
                    displayName = displayName.substring(0, 7) + '…';
                }
                
                trackLabels[soundLibrary.currentRow].textContent = displayName.toLowerCase();
                trackLabels[soundLibrary.currentRow].setAttribute('title', soundLibrary.selectedSound.name);
            }
        }
        
        // Close dialog
        closeSoundSelector();
    }
    
    // Initialize sound selector
    initSoundSelector();
    
    // Export functions to window object
    window.openSoundSelector = openSoundSelector;
    window.closeSoundSelector = closeSoundSelector;
});