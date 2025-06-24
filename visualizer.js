/**
 * Zune-inspired 16-bit Music Sequencer
 * Waveform Visualization
 * 
 * This module handles the audio visualization using Canvas.
 * It provides three visualization modes: waveform, bars, and circles.
 */

// Canvas and visualization state
let canvas;
let canvasContext;
let analyser;
let dataArray;
let bufferLength;
let animationId;
let visualizationMode = 'waveform'; // Default mode: 'waveform', 'bars', 'circles'
let lastTransitionTime = 0; // Track last mode change for smooth transitions

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    // Set up the canvas for visualization
    setupCanvas();
    
    // Listen for window resize to adjust canvas
    window.addEventListener('resize', resizeCanvas);
    
    // Add visualization mode toggle button
    addVisualizationControls();
});

/**
 * Set up the canvas for waveform visualization
 * Creates and configures the canvas element
 */
function setupCanvas() {
    const waveformViewer = document.getElementById('waveformViewer');
    
    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = waveformViewer.clientWidth;
    canvas.height = waveformViewer.clientHeight;
    canvas.style.transition = 'filter 0.3s ease'; // Add transition for visual effects
    waveformViewer.appendChild(canvas);
    
    // Get canvas context
    canvasContext = canvas.getContext('2d');
    
    // Draw default waveform
    drawDefaultWaveform();
}

/**
 * Add visualization mode controls
 * Creates a button to toggle between visualization modes
 */
function addVisualizationControls() {
    const waveformContainer = document.querySelector('.waveform-container');
    
    // Create visualization mode toggle button
    const vizModeBtn = document.createElement('button');
    vizModeBtn.className = 'btn btn-viz-mode';
    vizModeBtn.innerHTML = '<span>mode</span>';
    vizModeBtn.title = 'Change visualization mode';
    vizModeBtn.style.position = 'absolute';
    vizModeBtn.style.top = '8px';
    vizModeBtn.style.right = '8px';
    vizModeBtn.style.zIndex = '5';
    vizModeBtn.style.padding = '4px 8px';
    vizModeBtn.style.fontSize = 'var(--font-size-xs)';
    vizModeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    
    // Add click event to toggle visualization mode
    vizModeBtn.addEventListener('click', () => {
        // Apply transition effect to canvas
        canvas.style.filter = 'blur(5px)';
        
        // Cycle through visualization modes
        switch (visualizationMode) {
            case 'waveform':
                visualizationMode = 'bars';
                break;
            case 'bars':
                visualizationMode = 'circles';
                break;
            case 'circles':
                visualizationMode = 'waveform';
                break;
        }
        
        // Track transition time
        lastTransitionTime = Date.now();
        
        // Remove blur effect after transition
        setTimeout(() => {
            canvas.style.filter = 'none';
        }, 300);
        
        // Show feedback
        showModeChangeFeedback(waveformContainer);
        
        // Animate button
        vizModeBtn.classList.add('animating');
        setTimeout(() => {
            vizModeBtn.classList.remove('animating');
        }, 300);
    });
    
    waveformContainer.appendChild(vizModeBtn);
}

/**
 * Show visual feedback when changing visualization mode
 * 
 * @param {HTMLElement} container - The container element for the feedback
 */
function showModeChangeFeedback(container) {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.textContent = visualizationMode;
    feedback.style.position = 'absolute';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.color = 'var(--color-magenta)';
    feedback.style.fontSize = 'var(--font-size-medium)';
    feedback.style.fontWeight = '300';
    feedback.style.zIndex = '10';
    feedback.style.textTransform = 'lowercase';
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    container.appendChild(feedback);
    
    // Fade in with animation
    setTimeout(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translate(-50%, -50%) scale(1.2)';
        
        setTimeout(() => {
            feedback.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, 1000);
}

/**
 * Resize canvas when window size changes
 * Ensures visualization fills the container properly
 */
function resizeCanvas() {
    if (!canvas) return;
    
    const waveformViewer = document.getElementById('waveformViewer');
    canvas.width = waveformViewer.clientWidth;
    canvas.height = waveformViewer.clientHeight;
    
    // Redraw visualization if active
    if (analyser) {
        drawVisualization();
    } else {
        drawDefaultWaveform();
    }
}

/**
 * Initialize audio analyzer for visualization
 * Sets up the analyzer node and data arrays
 */
function initAnalyzer() {
    if (!window.audioContext) return;
    
    // Create analyzer node if it doesn't exist
    if (!analyser) {
        // Try to get the analyzer from the sequencer
        if (typeof getAnalyser === 'function') {
            analyser = getAnalyser();
        }
        
        // If still no analyzer, create one
        if (!analyser) {
            analyser = window.audioContext.createAnalyser();
            analyser.fftSize = 2048;
            
            // Connect analyzer to audio context destination
            const destination = window.audioContext.destination;
            
            // Create a gain node to connect to the analyzer
            const analyzerGain = window.audioContext.createGain();
            analyzerGain.gain.value = 1.0;
            
            // Connect the destination to the analyzer through the gain node
            analyzerGain.connect(analyser);
            destination.connect(analyzerGain);
        }
        
        // Set up data arrays for visualization
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }
}

/**
 * Update visualizer based on current step
 * Called by the sequencer on each step
 * 
 * @param {number} step - Current step index (0-15)
 */
function updateVisualizer(step) {
    if (!analyser) {
        if (window.audioContext) {
            initAnalyzer();
        } else {
            return;
        }
    }
    
    // Cancel any existing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Start visualization loop
    drawVisualization();
    
    // Add step indicator
    drawStepIndicator(step);
}

/**
 * Draw a step indicator on the visualization
 * Shows the current position in the sequence
 * 
 * @param {number} step - Current step index (0-15)
 */
function drawStepIndicator(step) {
    if (!canvas) return;
    
    const stepWidth = canvas.width / 16;
    const x = step * stepWidth + stepWidth / 2;
    
    // Draw vertical line at current step
    canvasContext.save();
    canvasContext.globalAlpha = 0.5;
    canvasContext.strokeStyle = 'var(--color-white)';
    canvasContext.lineWidth = 1;
    canvasContext.beginPath();
    canvasContext.moveTo(x, 0);
    canvasContext.lineTo(x, canvas.height);
    canvasContext.stroke();
    canvasContext.restore();
}

/**
 * Draw the waveform visualization
 * Main visualization function that calls the appropriate drawing method
 */
function drawVisualization() {
    if (!analyser) return;
    
    // Get frequency and time domain data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate transition progress (for smooth mode changes)
    const transitionProgress = Math.min(1, (Date.now() - lastTransitionTime) / 300);
    
    // Choose visualization based on mode
    switch (visualizationMode) {
        case 'waveform':
            drawWaveform(transitionProgress);
            break;
        case 'bars':
            drawBars(transitionProgress);
            break;
        case 'circles':
            drawCircles(transitionProgress);
            break;
    }
    
    // Continue animation loop
    animationId = requestAnimationFrame(drawVisualization);
}

/**
 * Draw waveform visualization
 * Creates a line representing the audio waveform
 * 
 * @param {number} transitionProgress - Transition animation progress (0-1)
 */
function drawWaveform(transitionProgress = 1) {
    // Set up drawing style
    canvasContext.lineWidth = 2;
    
    // Use magenta color with transition effect
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-magenta') || '#e64e8d';
    canvasContext.strokeStyle = color;
    
    // Draw waveform
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    canvasContext.beginPath();
    canvasContext.moveTo(0, canvas.height / 2);
    
    // Create a stylized waveform visualization
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            // Apply easing to the transition
            const easedY = canvas.height / 2 + (y - canvas.height / 2) * transitionProgress;
            canvasContext.lineTo(x, easedY);
        }
        
        x += sliceWidth;
    }
    
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
    
    // If no data is present, draw a default line
    if (dataArray.every(val => val === 0)) {
        drawDefaultWaveform();
    }
}

/**
 * Draw bar visualization
 * Creates frequency bars representing the audio spectrum
 * 
 * @param {number} transitionProgress - Transition animation progress (0-1)
 */
function drawBars(transitionProgress = 1) {
    const barWidth = canvas.width / (bufferLength / 4);
    let x = 0;
    
    // Draw frequency bars
    for (let i = 0; i < bufferLength; i += 4) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Apply transition effect to height
        const transitionHeight = barHeight * transitionProgress;
        
        // Use gradient color based on frequency
        const hue = (i / bufferLength) * 360;
        canvasContext.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        // Draw bar
        canvasContext.fillRect(x, canvas.height - transitionHeight, barWidth, transitionHeight);
        
        x += barWidth + 1;
        
        // Stop when we reach the canvas width
        if (x >= canvas.width) break;
    }
    
    // If no data is present, draw default bars
    if (dataArray.every(val => val === 0)) {
        drawDefaultBars();
    }
}

/**
 * Draw circle visualization
 * Creates concentric circles that respond to audio amplitude
 * 
 * @param {number} transitionProgress - Transition animation progress (0-1)
 */
function drawCircles(transitionProgress = 1) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    
    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const avgAmplitude = sum / bufferLength / 255;
    
    // Draw concentric circles
    for (let i = 5; i > 0; i--) {
        const radius = maxRadius * (i / 5) * (0.8 + avgAmplitude * 0.2) * transitionProgress;
        
        canvasContext.beginPath();
        canvasContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        // Use different colors for each circle
        const hue = (i * 60) % 360;
        canvasContext.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.6 * transitionProgress})`;
        canvasContext.lineWidth = 2;
        canvasContext.stroke();
    }
    
    // Draw pulsing center circle
    canvasContext.beginPath();
    canvasContext.arc(centerX, centerY, maxRadius * 0.2 * (0.8 + avgAmplitude * 0.5) * transitionProgress, 0, Math.PI * 2);
    canvasContext.fillStyle = 'var(--color-magenta)';
    canvasContext.fill();
    
    // If no data is present, draw default circles
    if (dataArray.every(val => val === 0)) {
        drawDefaultCircles();
    }
}

/**
 * Draw a default waveform when no audio is playing
 * Creates a simple sine wave visualization
 */
function drawDefaultWaveform() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerY = canvas.height / 2;
    const amplitude = canvas.height / 4;
    const frequency = 0.01;
    
    canvasContext.beginPath();
    canvasContext.moveTo(0, centerY);
    
    for (let x = 0; x < canvas.width; x++) {
        // Create a simple sine wave
        const y = centerY + Math.sin(x * frequency) * amplitude * 0.3;
        canvasContext.lineTo(x, y);
    }
    
    canvasContext.strokeStyle = 'rgba(230, 78, 141, 0.3)'; // Magenta with opacity
    canvasContext.stroke();
}

/**
 * Draw default bars when no audio is playing
 * Creates a simple pattern of bars
 */
function drawDefaultBars() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 32;
    const barWidth = canvas.width / barCount - 1;
    
    for (let i = 0; i < barCount; i++) {
        // Create a simple pattern
        const barHeight = (Math.sin(i * 0.2) * 0.5 + 0.5) * canvas.height * 0.3;
        const x = i * (barWidth + 1);
        
        canvasContext.fillStyle = 'rgba(230, 78, 141, 0.3)';
        canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    }
}

/**
 * Draw default circles when no audio is playing
 * Creates a simple pattern of concentric circles
 */
function drawDefaultCircles() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    
    // Draw concentric circles
    for (let i = 5; i > 0; i--) {
        const radius = maxRadius * (i / 5) * 0.8;
        
        canvasContext.beginPath();
        canvasContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
        canvasContext.strokeStyle = `rgba(230, 78, 141, ${0.1 + (5-i) * 0.05})`;
        canvasContext.lineWidth = 2;
        canvasContext.stroke();
    }
    
    // Draw center circle
    canvasContext.beginPath();
    canvasContext.arc(centerX, centerY, maxRadius * 0.15, 0, Math.PI * 2);
    canvasContext.fillStyle = 'rgba(230, 78, 141, 0.3)';
    canvasContext.fill();
}

/**
 * Apply a visual effect to the visualization
 * Can be used to create special effects during playback
 * 
 * @param {string} effectType - Type of effect to apply ('flash', 'ripple', etc.)
 */
function applyVisualEffect(effectType) {
    if (!canvas) return;
    
    switch (effectType) {
        case 'flash':
            // Apply a brief flash effect
            canvas.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                canvas.style.filter = 'none';
            }, 100);
            break;
            
        case 'ripple':
            // Apply a ripple effect (implemented via CSS)
            canvas.classList.add('ripple-effect');
            setTimeout(() => {
                canvas.classList.remove('ripple-effect');
            }, 500);
            break;
    }
}

// Export functions for other modules
window.updateVisualizer = updateVisualizer;
window.visualizationMode = visualizationMode;
window.applyVisualEffect = applyVisualEffect;