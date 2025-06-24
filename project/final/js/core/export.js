/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * Export Functionality
 * 
 * This module handles exporting user-created music loops
 * in various formats (WAV, MP3) and provides pattern import/export.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Audio recording state
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordingStartTime = 0;
    
    // Export settings
    const exportSettings = {
        format: 'wav', // 'wav' or 'mp3'
        quality: 'high', // 'low', 'medium', 'high'
        includeEffects: true // Whether to include audio effects in export
    };
    
    // Add export button to UI
    createExportButton();
    
    /**
     * Create export button and add to UI
     */
    function createExportButton() {
        const playbackControls = document.querySelector('.playback-controls .transport-controls');
        if (!playbackControls) return;
        
        // Create export button
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'btn btn-export metro-focus-element';
        exportBtn.innerHTML = `
            <svg class="icon icon-export" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            <span>export</span>
        `;
        exportBtn.title = 'Export your creation';
        
        // Add click event
        exportBtn.addEventListener('click', showExportDialog);
        
        // Add to playback controls
        playbackControls.appendChild(exportBtn);
    }
    
    /**
     * Show export dialog with options
     * Creates a Metro UI-styled dialog for export settings
     */
    function showExportDialog() {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'metro-dialog-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'metro-dialog export-dialog';
        dialog.style.backgroundColor = 'var(--color-background)';
        dialog.style.color = 'var(--color-text)';
        dialog.style.padding = '1.5rem';
        dialog.style.borderRadius = '2px';
        dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        dialog.style.width = '90%';
        dialog.style.maxWidth = '400px';
        dialog.style.transform = 'translateY(20px)';
        dialog.style.transition = 'transform 0.3s ease';
        
        // Dialog header
        const header = document.createElement('div');
        header.className = 'dialog-header';
        header.style.marginBottom = '1.5rem';
        
        const title = document.createElement('h2');
        title.textContent = 'export your creation';
        title.style.fontSize = 'var(--font-size-large)';
        title.style.fontWeight = '300';
        title.style.margin = '0';
        title.style.textTransform = 'lowercase';
        
        header.appendChild(title);
        dialog.appendChild(header);
        
        // Dialog content
        const content = document.createElement('div');
        content.className = 'dialog-content';
        
        // Format selection
        const formatGroup = document.createElement('div');
        formatGroup.className = 'option-group';
        formatGroup.style.marginBottom = '1.5rem';
        
        const formatLabel = document.createElement('label');
        formatLabel.textContent = 'format';
        formatLabel.style.display = 'block';
        formatLabel.style.marginBottom = '0.5rem';
        formatLabel.style.color = 'var(--color-gray)';
        
        const formatOptions = document.createElement('div');
        formatOptions.className = 'format-options';
        formatOptions.style.display = 'flex';
        formatOptions.style.gap = '0.5rem';
        
        // WAV option
        const wavOption = document.createElement('button');
        wavOption.className = 'format-option metro-focus-element';
        wavOption.textContent = 'WAV';
        wavOption.dataset.format = 'wav';
        wavOption.style.padding = '0.5rem 1rem';
        wavOption.style.backgroundColor = exportSettings.format === 'wav' ? 'var(--color-accent)' : 'var(--color-background-light)';
        wavOption.style.color = exportSettings.format === 'wav' ? 'var(--color-white)' : 'var(--color-text)';
        wavOption.style.border = 'none';
        wavOption.style.cursor = 'pointer';
        
        // MP3 option
        const mp3Option = document.createElement('button');
        mp3Option.className = 'format-option metro-focus-element';
        mp3Option.textContent = 'MP3';
        mp3Option.dataset.format = 'mp3';
        mp3Option.style.padding = '0.5rem 1rem';
        mp3Option.style.backgroundColor = exportSettings.format === 'mp3' ? 'var(--color-accent)' : 'var(--color-background-light)';
        mp3Option.style.color = exportSettings.format === 'mp3' ? 'var(--color-white)' : 'var(--color-text)';
        mp3Option.style.border = 'none';
        mp3Option.style.cursor = 'pointer';
        
        // Format option click events
        wavOption.addEventListener('click', () => {
            exportSettings.format = 'wav';
            wavOption.style.backgroundColor = 'var(--color-accent)';
            wavOption.style.color = 'var(--color-white)';
            mp3Option.style.backgroundColor = 'var(--color-background-light)';
            mp3Option.style.color = 'var(--color-text)';
        });
        
        mp3Option.addEventListener('click', () => {
            exportSettings.format = 'mp3';
            mp3Option.style.backgroundColor = 'var(--color-accent)';
            mp3Option.style.color = 'var(--color-white)';
            wavOption.style.backgroundColor = 'var(--color-background-light)';
            wavOption.style.color = 'var(--color-text)';
        });
        
        formatOptions.appendChild(wavOption);
        formatOptions.appendChild(mp3Option);
        
        formatGroup.appendChild(formatLabel);
        formatGroup.appendChild(formatOptions);
        
        // Quality selection
        const qualityGroup = document.createElement('div');
        qualityGroup.className = 'option-group';
        qualityGroup.style.marginBottom = '1.5rem';
        
        const qualityLabel = document.createElement('label');
        qualityLabel.textContent = 'quality';
        qualityLabel.style.display = 'block';
        qualityLabel.style.marginBottom = '0.5rem';
        qualityLabel.style.color = 'var(--color-gray)';
        
        const qualitySelect = document.createElement('select');
        qualitySelect.className = 'quality-select metro-focus-element';
        qualitySelect.style.width = '100%';
        qualitySelect.style.padding = '0.5rem';
        qualitySelect.style.backgroundColor = 'var(--color-background-light)';
        qualitySelect.style.color = 'var(--color-text)';
        qualitySelect.style.border = 'none';
        
        const qualities = [
            { value: 'low', label: 'Low (smaller file size)' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High (better quality)' }
        ];
        
        qualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality.value;
            option.textContent = quality.label;
            option.selected = quality.value === exportSettings.quality;
            qualitySelect.appendChild(option);
        });
        
        qualitySelect.addEventListener('change', () => {
            exportSettings.quality = qualitySelect.value;
        });
        
        qualityGroup.appendChild(qualityLabel);
        qualityGroup.appendChild(qualitySelect);
        
        // Effects option
        const effectsGroup = document.createElement('div');
        effectsGroup.className = 'option-group';
        effectsGroup.style.marginBottom = '1.5rem';
        
        const effectsCheckbox = document.createElement('input');
        effectsCheckbox.type = 'checkbox';
        effectsCheckbox.id = 'includeEffects';
        effectsCheckbox.className = 'effects-checkbox metro-focus-element';
        effectsCheckbox.checked = exportSettings.includeEffects;
        effectsCheckbox.style.marginRight = '0.5rem';
        
        const effectsLabel = document.createElement('label');
        effectsLabel.htmlFor = 'includeEffects';
        effectsLabel.textContent = 'include audio effects';
        
        effectsCheckbox.addEventListener('change', () => {
            exportSettings.includeEffects = effectsCheckbox.checked;
        });
        
        effectsGroup.appendChild(effectsCheckbox);
        effectsGroup.appendChild(effectsLabel);
        
        // Add all option groups to content
        content.appendChild(formatGroup);
        content.appendChild(qualityGroup);
        content.appendChild(effectsGroup);
        
        dialog.appendChild(content);
        
        // Dialog footer with buttons
        const footer = document.createElement('div');
        footer.className = 'dialog-footer';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '1rem';
        footer.style.marginTop = '1rem';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-cancel metro-focus-element';
        cancelBtn.textContent = 'cancel';
        cancelBtn.style.padding = '0.5rem 1rem';
        cancelBtn.style.backgroundColor = 'var(--color-background-light)';
        cancelBtn.style.color = 'var(--color-text)';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-export-confirm metro-focus-element';
        exportBtn.textContent = 'export';
        exportBtn.style.padding = '0.5rem 1rem';
        exportBtn.style.backgroundColor = 'var(--color-accent)';
        exportBtn.style.color = 'var(--color-white)';
        exportBtn.style.border = 'none';
        exportBtn.style.cursor = 'pointer';
        
        // Button events
        cancelBtn.addEventListener('click', () => {
            // Close dialog with animation
            overlay.style.opacity = '0';
            dialog.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        });
        
        exportBtn.addEventListener('click', () => {
            // Close dialog
            overlay.style.opacity = '0';
            dialog.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                // Start export process
                startAudioExport();
            }, 300);
        });
        
        footer.appendChild(cancelBtn);
        footer.appendChild(exportBtn);
        
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        
        // Add to document and animate in
        document.body.appendChild(overlay);
        
        // Trigger reflow for animation
        overlay.offsetHeight;
        
        // Animate in
        overlay.style.opacity = '1';
        dialog.style.transform = 'translateY(0)';
    }
    
    /**
     * Start the audio export process
     * Records the audio output and saves it in the selected format
     */
    function startAudioExport() {
        if (!window.audioContext) {
            showExportError('Audio context not available');
            return;
        }
        
        // Show export progress dialog
        showExportProgress();
        
        // Reset recording state
        audioChunks = [];
        isRecording = true;
        
        try {
            // Create a MediaStream destination node
            const destination = window.audioContext.createMediaStreamDestination();
            
            // Connect the master output to the destination
            // If effects are included, use the full audio chain
            if (exportSettings.includeEffects && window.masterGainNode) {
                // The audio chain is already set up in the sequencer
                // We just need to connect the analyzer to our destination
                if (window.analyserNode) {
                    window.analyserNode.connect(destination);
                } else {
                    window.masterGainNode.connect(destination);
                }
            } else {
                // Connect directly from the master gain to bypass effects
                if (window.masterGainNode) {
                    window.masterGainNode.connect(destination);
                }
            }
            
            // Set up MediaRecorder with appropriate MIME type
            const mimeType = exportSettings.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
            
            // Check if the browser supports the selected format
            if (MediaRecorder.isTypeSupported(mimeType)) {
                // Create MediaRecorder with selected quality
                const bitrates = {
                    low: 96000,
                    medium: 128000,
                    high: 192000
                };
                
                const options = {
                    mimeType: mimeType,
                    audioBitsPerSecond: bitrates[exportSettings.quality]
                };
                
                mediaRecorder = new MediaRecorder(destination.stream, options);
            } else {
                // Fallback to default format
                mediaRecorder = new MediaRecorder(destination.stream);
                console.warn(`Format ${mimeType} not supported, using default format`);
            }
            
            // Set up event handlers
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.onstop = finalizeRecording;
            
            // Start recording
            mediaRecorder.start();
            recordingStartTime = Date.now();
            
            // Start playback if not already playing
            const isPlaying = document.querySelector('#playPauseBtn').classList.contains('playing');
            if (!isPlaying && typeof window.togglePlayPause === 'function') {
                window.togglePlayPause();
            }
            
            // Record for the duration of the pattern (16 steps)
            // Calculate duration based on tempo
            const tempo = window.tempo || 120;
            const stepTime = (60 / tempo) / 4; // Time for a 16th note in seconds
            const patternDuration = stepTime * 16 * 1000; // Duration in milliseconds
            
            // Stop recording after pattern completes
            setTimeout(() => {
                if (isRecording) {
                    stopAudioExport();
                }
            }, patternDuration + 500); // Add a small buffer
            
        } catch (error) {
            console.error('Error starting audio export:', error);
            showExportError('Failed to start recording: ' + error.message);
            isRecording = false;
        }
    }
    
    /**
     * Handle data available event from MediaRecorder
     * @param {BlobEvent} event - The data available event
     */
    function handleDataAvailable(event) {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    }
    
    /**
     * Stop the audio export process
     */
    function stopAudioExport() {
        if (!isRecording || !mediaRecorder) return;
        
        try {
            // Stop the media recorder
            mediaRecorder.stop();
            isRecording = false;
            
            // Stop playback if it was started for recording
            const isPlaying = document.querySelector('#playPauseBtn').classList.contains('playing');
            if (isPlaying && typeof window.togglePlayPause === 'function') {
                window.togglePlayPause();
            }
            
            // Disconnect the recording destination
            if (window.analyserNode) {
                try {
                    window.analyserNode.disconnect();
                } catch (e) {
                    // Ignore errors if not connected
                }
            }
            
            // Reconnect the normal audio chain
            if (typeof window.connectEffects === 'function') {
                window.connectEffects(window.masterGainNode, window.audioContext.destination);
            } else if (window.masterGainNode) {
                window.masterGainNode.connect(window.audioContext.destination);
            }
            
            // Update progress dialog
            updateExportProgress('Processing audio...');
            
        } catch (error) {
            console.error('Error stopping audio export:', error);
            showExportError('Failed to stop recording: ' + error.message);
        }
    }
    
    /**
     * Finalize the recording and create downloadable file
     */
    function finalizeRecording() {
        try {
            // Create blob from recorded chunks
            const mimeType = exportSettings.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
            const blob = new Blob(audioChunks, { type: mimeType });
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = `zoundboard-${timestamp}.${exportSettings.format}`;
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // Add to document and trigger download
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Close progress dialog and show success
            closeExportProgress();
            showExportSuccess(filename);
            
            console.log(`Audio exported successfully as ${filename}`);
            
        } catch (error) {
            console.error('Error finalizing recording:', error);
            showExportError('Failed to create audio file: ' + error.message);
        }
    }
    
    /**
     * Show export progress dialog
     */
    function showExportProgress() {
        // Create progress overlay
        const overlay = document.createElement('div');
        overlay.className = 'metro-dialog-overlay export-progress-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        
        // Create progress dialog
        const dialog = document.createElement('div');
        dialog.className = 'metro-dialog export-progress-dialog';
        dialog.style.backgroundColor = 'var(--color-background)';
        dialog.style.color = 'var(--color-text)';
        dialog.style.padding = '1.5rem';
        dialog.style.borderRadius = '2px';
        dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        dialog.style.width = '90%';
        dialog.style.maxWidth = '400px';
        dialog.style.textAlign = 'center';
        
        // Progress message
        const message = document.createElement('p');
        message.className = 'export-progress-message';
        message.textContent = 'Recording audio...';
        message.style.marginBottom = '1rem';
        
        // Progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.width = '100%';
        progressContainer.style.height = '4px';
        progressContainer.style.backgroundColor = 'var(--color-background-light)';
        progressContainer.style.position = 'relative';
        progressContainer.style.overflow = 'hidden';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.position = 'absolute';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.height = '100%';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'var(--color-accent)';
        progressBar.style.transition = 'width 0.3s ease';
        
        progressContainer.appendChild(progressBar);
        
        dialog.appendChild(message);
        dialog.appendChild(progressContainer);
        overlay.appendChild(dialog);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Start progress animation
        animateProgress(progressBar);
    }
    
    /**
     * Animate progress bar during export
     * @param {HTMLElement} progressBar - The progress bar element
     */
    function animateProgress(progressBar) {
        const startTime = Date.now();
        const tempo = window.tempo || 120;
        const stepTime = (60 / tempo) / 4; // Time for a 16th note in seconds
        const patternDuration = stepTime * 16 * 1000; // Duration in milliseconds
        
        function updateProgress() {
            if (!document.body.contains(progressBar)) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / patternDuration, 1);
            
            progressBar.style.width = `${progress * 100}%`;
            
            if (progress < 1 && isRecording) {
                requestAnimationFrame(updateProgress);
            }
        }
        
        requestAnimationFrame(updateProgress);
    }
    
    /**
     * Update export progress message
     * @param {string} message - The progress message
     */
    function updateExportProgress(message) {
        const messageElement = document.querySelector('.export-progress-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Update progress bar to full
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }
    
    /**
     * Close export progress dialog
     */
    function closeExportProgress() {
        const overlay = document.querySelector('.export-progress-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }
    
    /**
     * Show export success message
     * @param {string} filename - The exported filename
     */
    function showExportSuccess(filename) {
        // Create success message
        const message = document.createElement('div');
        message.className = 'export-success-message';
        message.textContent = `Exported as ${filename}`;
        message.style.position = 'fixed';
        message.style.bottom = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.backgroundColor = 'var(--color-green)';
        message.style.color = 'var(--color-white)';
        message.style.padding = '0.75rem 1.5rem';
        message.style.borderRadius = '2px';
        message.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        message.style.zIndex = '1000';
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        document.body.appendChild(message);
        
        // Animate in
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(-50%) translateY(10px)';
            
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Show export error message
     * @param {string} errorMessage - The error message
     */
    function showExportError(errorMessage) {
        // Close progress dialog if open
        closeExportProgress();
        
        // Create error message
        const message = document.createElement('div');
        message.className = 'export-error-message';
        message.textContent = errorMessage;
        message.style.position = 'fixed';
        message.style.bottom = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.backgroundColor = 'var(--color-red, #e74c3c)';
        message.style.color = 'var(--color-white)';
        message.style.padding = '0.75rem 1.5rem';
        message.style.borderRadius = '2px';
        message.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        message.style.zIndex = '1000';
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        document.body.appendChild(message);
        
        // Animate in
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(-50%) translateY(10px)';
            
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
        }, 5000);
    }
    
    /**
     * Export the current pattern as a JSON file
     * Captures the state of all active cells in the grid
     */
    function exportPattern() {
        try {
            // Get all active cells
            const activeCells = document.querySelectorAll('.grid-cell.active');
            
            // Create pattern data structure
            const pattern = {
                version: '1.0',
                tempo: window.tempo || 120,
                timestamp: new Date().toISOString(),
                tracks: [
                    [], [], [], [], [], [], [], []
                ]
            };
            
            // Populate pattern data
            activeCells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (row >= 0 && row < 8 && col >= 0 && col < 16) {
                    pattern.tracks[row].push(col);
                }
            });
            
            // Add effects state if available
            if (typeof window.getEffectsState === 'function') {
                pattern.effects = window.getEffectsState();
            }
            
            // Convert to JSON string
            const jsonData = JSON.stringify(pattern, null, 2);
            
            // Create download link
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = `zoundboard-pattern-${timestamp}.json`;
            
            // Create and trigger download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Pattern exported successfully');
            
            // Show success message
            showExportSuccess(filename);
            
            return true;
        } catch (error) {
            console.error('Error exporting pattern:', error);
            showExportError('Failed to export pattern: ' + error.message);
            return false;
        }
    }
    
    /**
     * Import a previously exported pattern
     * 
     * @param {File} file - The JSON file to import
     * @returns {Promise<boolean>} - Whether import was successful
     */
    function importPattern(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    // Parse the JSON data
                    const pattern = JSON.parse(event.target.result);
                    
                    // Validate pattern format
                    if (!pattern.tracks || !Array.isArray(pattern.tracks) || pattern.tracks.length !== 8) {
                        throw new Error('Invalid pattern format');
                    }
                    
                    // Clear current pattern
                    if (typeof window.clearPattern === 'function') {
                        window.clearPattern();
                    } else {
                        const activeCells = document.querySelectorAll('.grid-cell.active');
                        activeCells.forEach(cell => cell.classList.remove('active'));
                    }
                    
                    // Set tempo if available
                    if (pattern.tempo && typeof window.setTempo === 'function') {
                        window.setTempo(pattern.tempo);
                        
                        // Update tempo slider if it exists
                        const tempoSlider = document.getElementById('tempoSlider');
                        const tempoValue = document.getElementById('tempoValue');
                        if (tempoSlider) tempoSlider.value = pattern.tempo;
                        if (tempoValue) tempoValue.textContent = pattern.tempo;
                    }
                    
                    // Apply the pattern to the grid
                    pattern.tracks.forEach((track, row) => {
                        track.forEach(col => {
                            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
                            if (cell) {
                                cell.classList.add('active');
                            }
                        });
                    });
                    
                    // Apply effects if available
                    if (pattern.effects && typeof window.updateFilterEffect === 'function') {
                        if (pattern.effects.filter) {
                            window.updateFilterEffect(pattern.effects.filter);
                        }
                        if (pattern.effects.reverb) {
                            window.updateReverbEffect(pattern.effects.reverb);
                        }
                        if (pattern.effects.delay) {
                            window.updateDelayEffect(pattern.effects.delay);
                        }
                        if (pattern.effects.distortion) {
                            window.updateDistortionEffect(pattern.effects.distortion);
                        }
                    }
                    
                    console.log('Pattern imported successfully');
                    
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'import-success-message';
                    successMessage.textContent = 'Pattern imported successfully';
                    successMessage.style.position = 'fixed';
                    successMessage.style.bottom = '20px';
                    successMessage.style.left = '50%';
                    successMessage.style.transform = 'translateX(-50%)';
                    successMessage.style.backgroundColor = 'var(--color-green)';
                    successMessage.style.color = 'var(--color-white)';
                    successMessage.style.padding = '0.75rem 1.5rem';
                    successMessage.style.borderRadius = '2px';
                    successMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                    successMessage.style.zIndex = '1000';
                    
                    document.body.appendChild(successMessage);
                    
                    // Remove after delay
                    setTimeout(() => {
                        document.body.removeChild(successMessage);
                    }, 3000);
                    
                    resolve(true);
                } catch (error) {
                    console.error('Error importing pattern:', error);
                    
                    // Show error message
                    showExportError('Failed to import pattern: ' + error.message);
                    
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Create import button and add to UI
     */
    function createImportButton() {
        const playbackControls = document.querySelector('.playback-controls .transport-controls');
        if (!playbackControls) return;
        
        // Create import button
        const importBtn = document.createElement('button');
        importBtn.id = 'importBtn';
        importBtn.className = 'btn btn-import metro-focus-element';
        importBtn.innerHTML = `
            <svg class="icon icon-import" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" transform="rotate(180, 12, 12)" />
            </svg>
            <span>import</span>
        `;
        importBtn.title = 'Import a pattern';
        
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        // Add click event to trigger file input
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Add change event to file input
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importPattern(e.target.files[0])
                    .catch(error => {
                        console.error('Import failed:', error);
                    });
            }
        });
        
        // Add to document
        document.body.appendChild(fileInput);
        
        // Add to playback controls
        playbackControls.appendChild(importBtn);
    }
    
    // Create import button
    createImportButton();
    
    // Export functions for other modules
    window.exportPattern = exportPattern;
    window.importPattern = importPattern;
    window.startAudioExport = startAudioExport;
    window.stopAudioExport = stopAudioExport;
});