/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * Audio Effects Processing
 * 
 * This module handles audio effects processing for the sequencer.
 * It provides functionality for applying various audio effects to the sound output.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Effects state
    const effectsState = {
        // Filter effect
        filter: {
            enabled: false,
            type: 'lowpass',
            frequency: 22050,
            Q: 1
        },
        // Reverb effect
        reverb: {
            enabled: false,
            level: 0.3,
            decay: 2.0,
            impulseResponse: null
        },
        // Delay effect
        delay: {
            enabled: false,
            time: 0.3,
            feedback: 0.4,
            mix: 0.3
        },
        // Distortion effect
        distortion: {
            enabled: false,
            amount: 20,
            oversample: '4x'
        }
    };
    
    // Audio nodes
    let audioContext;
    let reverbNode;
    let delayNode;
    let delayFeedbackNode;
    let delayMixNode;
    let distortionNode;
    
    /**
     * Initialize audio effects
     * Sets up the audio effects processing chain
     */
    function initEffects() {
        // Effects will be initialized when audio context is available
        console.log('Audio effects module initialized');
        
        // Check if audioContext is available from sequencer.js
        if (window.audioContext) {
            audioContext = window.audioContext;
            createEffectNodes();
        } else {
            // Wait for audio context to be created
            document.addEventListener('audioContextCreated', (e) => {
                audioContext = e.detail.audioContext;
                createEffectNodes();
            });
        }
    }
    
    /**
     * Create audio effect nodes
     * Sets up all the audio nodes needed for effects processing
     */
    function createEffectNodes() {
        if (!audioContext) return;
        
        // Create reverb node (ConvolverNode)
        reverbNode = audioContext.createConvolver();
        
        // Create delay nodes
        delayNode = audioContext.createDelay(5.0); // Max 5 seconds delay
        delayNode.delayTime.value = effectsState.delay.time;
        
        delayFeedbackNode = audioContext.createGain();
        delayFeedbackNode.gain.value = effectsState.delay.feedback;
        
        delayMixNode = audioContext.createGain();
        delayMixNode.gain.value = effectsState.delay.mix;
        
        // Create distortion node
        distortionNode = audioContext.createWaveShaper();
        distortionNode.oversample = effectsState.distortion.oversample;
        
        // Generate impulse response for reverb
        generateReverbImpulse();
        
        // Generate distortion curve
        updateDistortionCurve();
        
        console.log('Audio effect nodes created');
    }
    
    /**
     * Generate impulse response for reverb effect
     * Creates a decaying noise buffer to simulate reverb
     */
    function generateReverbImpulse() {
        if (!audioContext || !reverbNode) return;
        
        const duration = effectsState.reverb.decay;
        const decay = effectsState.reverb.decay;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        
        const leftChannel = impulse.getChannelData(0);
        const rightChannel = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = i / length;
            // Decaying white noise
            const value = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            leftChannel[i] = value;
            rightChannel[i] = value;
        }
        
        reverbNode.buffer = impulse;
        effectsState.reverb.impulseResponse = impulse;
        
        console.log('Reverb impulse response generated');
    }
    
    /**
     * Generate distortion curve
     * Creates a waveshaper curve for the distortion effect
     */
    function updateDistortionCurve() {
        if (!audioContext || !distortionNode) return;
        
        const amount = effectsState.distortion.amount;
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; ++i) {
            const x = i * 2 / samples - 1;
            // Distortion algorithms
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        
        distortionNode.curve = curve;
        console.log('Distortion curve updated');
    }
    
    /**
     * Connect effect nodes to audio chain
     * @param {AudioNode} sourceNode - The source node to connect effects to
     * @param {AudioNode} destinationNode - The destination node to connect effects to
     */
    function connectEffects(sourceNode, destinationNode) {
        if (!audioContext || !sourceNode || !destinationNode) return;
        
        // Disconnect any existing connections
        try {
            sourceNode.disconnect();
        } catch (e) {
            // Ignore errors if not connected
        }
        
        // Create a chain of connections based on enabled effects
        let currentNode = sourceNode;
        
        // Connect filter if enabled
        if (effectsState.filter.enabled && window.filterNode) {
            currentNode.connect(window.filterNode);
            currentNode = window.filterNode;
        }
        
        // Connect reverb if enabled
        if (effectsState.reverb.enabled && reverbNode) {
            const reverbMixNode = audioContext.createGain();
            reverbMixNode.gain.value = effectsState.reverb.level;
            
            // Split signal for dry/wet mix
            currentNode.connect(destinationNode); // Dry signal
            currentNode.connect(reverbNode); // Wet signal
            reverbNode.connect(reverbMixNode);
            reverbMixNode.connect(destinationNode);
            
            // Update current node for next effect
            currentNode = reverbMixNode;
        }
        
        // Connect delay if enabled
        if (effectsState.delay.enabled && delayNode) {
            // Set up delay feedback loop
            delayNode.delayTime.value = effectsState.delay.time;
            delayFeedbackNode.gain.value = effectsState.delay.feedback;
            delayMixNode.gain.value = effectsState.delay.mix;
            
            // Connect delay network
            currentNode.connect(destinationNode); // Dry signal
            currentNode.connect(delayNode); // Wet signal
            delayNode.connect(delayFeedbackNode);
            delayFeedbackNode.connect(delayNode); // Feedback loop
            delayNode.connect(delayMixNode);
            delayMixNode.connect(destinationNode);
            
            // Update current node for next effect
            currentNode = delayMixNode;
        }
        
        // Connect distortion if enabled
        if (effectsState.distortion.enabled && distortionNode) {
            currentNode.connect(distortionNode);
            distortionNode.connect(destinationNode);
            
            // Update current node for next effect
            currentNode = distortionNode;
        }
        
        // If no effects are enabled, connect source directly to destination
        if (currentNode === sourceNode) {
            currentNode.connect(destinationNode);
        }
        
        console.log('Effects connected to audio chain');
    }
    
    /**
     * Update filter effect parameters
     * 
     * @param {Object} params - Filter parameters
     * @param {boolean} [params.enabled] - Whether filter is enabled
     * @param {string} [params.type] - Filter type (lowpass, highpass, bandpass, notch)
     * @param {number} [params.frequency] - Filter cutoff frequency (20-22050 Hz)
     * @param {number} [params.Q] - Filter Q/resonance (0.1-20)
     */
    function updateFilterEffect(params) {
        // Update local state
        if (params.enabled !== undefined) effectsState.filter.enabled = params.enabled;
        if (params.type) effectsState.filter.type = params.type;
        if (params.frequency) effectsState.filter.frequency = params.frequency;
        if (params.Q) effectsState.filter.Q = params.Q;
        
        // Apply to audio engine
        if (typeof window.updateFilter === 'function') {
            window.updateFilter({
                type: effectsState.filter.type,
                frequency: effectsState.filter.enabled ? effectsState.filter.frequency : 22050,
                Q: effectsState.filter.enabled ? effectsState.filter.Q : 0.01
            });
        }
    }
    
    /**
     * Update reverb effect parameters
     * 
     * @param {Object} params - Reverb parameters
     * @param {boolean} [params.enabled] - Whether reverb is enabled
     * @param {number} [params.level] - Reverb wet/dry mix level (0-1)
     * @param {number} [params.decay] - Reverb decay time in seconds (0.1-10)
     */
    function updateReverbEffect(params) {
        // Update local state
        if (params.enabled !== undefined) effectsState.reverb.enabled = params.enabled;
        if (params.level !== undefined) effectsState.reverb.level = params.level;
        if (params.decay !== undefined) {
            effectsState.reverb.decay = params.decay;
            // Regenerate impulse response if decay changed
            generateReverbImpulse();
        }
        
        // Reconnect effects chain if needed
        if (window.masterGainNode && window.audioContext) {
            connectEffects(window.masterGainNode, window.audioContext.destination);
        }
    }
    
    /**
     * Update delay effect parameters
     * 
     * @param {Object} params - Delay parameters
     * @param {boolean} [params.enabled] - Whether delay is enabled
     * @param {number} [params.time] - Delay time in seconds (0.01-5)
     * @param {number} [params.feedback] - Delay feedback amount (0-0.95)
     * @param {number} [params.mix] - Delay wet/dry mix level (0-1)
     */
    function updateDelayEffect(params) {
        // Update local state
        if (params.enabled !== undefined) effectsState.delay.enabled = params.enabled;
        if (params.time !== undefined) {
            effectsState.delay.time = params.time;
            if (delayNode) delayNode.delayTime.value = params.time;
        }
        if (params.feedback !== undefined) {
            effectsState.delay.feedback = params.feedback;
            if (delayFeedbackNode) delayFeedbackNode.gain.value = params.feedback;
        }
        if (params.mix !== undefined) {
            effectsState.delay.mix = params.mix;
            if (delayMixNode) delayMixNode.gain.value = params.mix;
        }
        
        // Reconnect effects chain if needed
        if (window.masterGainNode && window.audioContext) {
            connectEffects(window.masterGainNode, window.audioContext.destination);
        }
    }
    
    /**
     * Update distortion effect parameters
     * 
     * @param {Object} params - Distortion parameters
     * @param {boolean} [params.enabled] - Whether distortion is enabled
     * @param {number} [params.amount] - Distortion amount (0-100)
     * @param {string} [params.oversample] - Oversampling ('none', '2x', '4x')
     */
    function updateDistortionEffect(params) {
        // Update local state
        if (params.enabled !== undefined) effectsState.distortion.enabled = params.enabled;
        if (params.amount !== undefined) {
            effectsState.distortion.amount = params.amount;
            updateDistortionCurve();
        }
        if (params.oversample !== undefined) {
            effectsState.distortion.oversample = params.oversample;
            if (distortionNode) distortionNode.oversample = params.oversample;
        }
        
        // Reconnect effects chain if needed
        if (window.masterGainNode && window.audioContext) {
            connectEffects(window.masterGainNode, window.audioContext.destination);
        }
    }
    
    /**
     * Get the current state of all effects
     * 
     * @returns {Object} Current effects state
     */
    function getEffectsState() {
        return { ...effectsState };
    }
    
    /**
     * Reset all effects to default values
     */
    function resetEffects() {
        // Reset filter
        effectsState.filter.enabled = false;
        effectsState.filter.type = 'lowpass';
        effectsState.filter.frequency = 22050;
        effectsState.filter.Q = 1;
        
        // Reset reverb
        effectsState.reverb.enabled = false;
        effectsState.reverb.level = 0.3;
        effectsState.reverb.decay = 2.0;
        
        // Reset delay
        effectsState.delay.enabled = false;
        effectsState.delay.time = 0.3;
        effectsState.delay.feedback = 0.4;
        effectsState.delay.mix = 0.3;
        
        // Reset distortion
        effectsState.distortion.enabled = false;
        effectsState.distortion.amount = 20;
        effectsState.distortion.oversample = '4x';
        
        // Apply reset to audio engine
        if (typeof window.updateFilter === 'function') {
            window.updateFilter({
                type: 'lowpass',
                frequency: 22050,
                Q: 0.01
            });
        }
        
        // Regenerate impulse response and distortion curve
        generateReverbImpulse();
        updateDistortionCurve();
        
        // Reconnect effects chain
        if (window.masterGainNode && window.audioContext) {
            connectEffects(window.masterGainNode, window.audioContext.destination);
        }
        
        // Update UI if elements exist
        updateEffectsUI();
    }
    
    /**
     * Update the UI to reflect current effects state
     */
    function updateEffectsUI() {
        // Update filter UI
        const filterToggle = document.querySelector('.btn-filter');
        if (filterToggle) {
            filterToggle.innerHTML = `<span>filter: ${effectsState.filter.enabled ? 'on' : 'off'}</span>`;
            filterToggle.style.color = effectsState.filter.enabled ? 'var(--color-accent)' : 'var(--color-gray)';
        }
        
        // Update reverb UI
        const reverbToggle = document.querySelector('.btn-reverb');
        if (reverbToggle) {
            reverbToggle.innerHTML = `<span>reverb: ${effectsState.reverb.enabled ? 'on' : 'off'}</span>`;
            reverbToggle.style.color = effectsState.reverb.enabled ? 'var(--color-accent)' : 'var(--color-gray)';
        }
        
        // Update delay UI
        const delayToggle = document.querySelector('.btn-delay');
        if (delayToggle) {
            delayToggle.innerHTML = `<span>delay: ${effectsState.delay.enabled ? 'on' : 'off'}</span>`;
            delayToggle.style.color = effectsState.delay.enabled ? 'var(--color-accent)' : 'var(--color-gray)';
        }
        
        // Update distortion UI
        const distortionToggle = document.querySelector('.btn-distortion');
        if (distortionToggle) {
            distortionToggle.innerHTML = `<span>distortion: ${effectsState.distortion.enabled ? 'on' : 'off'}</span>`;
            distortionToggle.style.color = effectsState.distortion.enabled ? 'var(--color-accent)' : 'var(--color-gray)';
        }
        
        // Update control sliders
        updateControlSliders();
    }
    
    /**
     * Update control sliders to match current effect states
     */
    function updateControlSliders() {
        // Filter controls
        const filterTypeSelect = document.querySelector('.filter-type');
        const filterFreqSlider = document.querySelector('.filter-freq');
        const filterQSlider = document.querySelector('.filter-q');
        
        if (filterTypeSelect) filterTypeSelect.disabled = !effectsState.filter.enabled;
        if (filterFreqSlider) {
            filterFreqSlider.disabled = !effectsState.filter.enabled;
            filterFreqSlider.value = effectsState.filter.frequency;
        }
        if (filterQSlider) {
            filterQSlider.disabled = !effectsState.filter.enabled;
            filterQSlider.value = effectsState.filter.Q;
        }
        
        // Reverb controls
        const reverbLevelSlider = document.querySelector('.reverb-level');
        const reverbDecaySlider = document.querySelector('.reverb-decay');
        
        if (reverbLevelSlider) {
            reverbLevelSlider.disabled = !effectsState.reverb.enabled;
            reverbLevelSlider.value = effectsState.reverb.level;
        }
        if (reverbDecaySlider) {
            reverbDecaySlider.disabled = !effectsState.reverb.enabled;
            reverbDecaySlider.value = effectsState.reverb.decay;
        }
        
        // Delay controls
        const delayTimeSlider = document.querySelector('.delay-time');
        const delayFeedbackSlider = document.querySelector('.delay-feedback');
        const delayMixSlider = document.querySelector('.delay-mix');
        
        if (delayTimeSlider) {
            delayTimeSlider.disabled = !effectsState.delay.enabled;
            delayTimeSlider.value = effectsState.delay.time;
        }
        if (delayFeedbackSlider) {
            delayFeedbackSlider.disabled = !effectsState.delay.enabled;
            delayFeedbackSlider.value = effectsState.delay.feedback;
        }
        if (delayMixSlider) {
            delayMixSlider.disabled = !effectsState.delay.enabled;
            delayMixSlider.value = effectsState.delay.mix;
        }
        
        // Distortion controls
        const distortionAmountSlider = document.querySelector('.distortion-amount');
        const distortionOversampleSelect = document.querySelector('.distortion-oversample');
        
        if (distortionAmountSlider) {
            distortionAmountSlider.disabled = !effectsState.distortion.enabled;
            distortionAmountSlider.value = effectsState.distortion.amount;
        }
        if (distortionOversampleSelect) {
            distortionOversampleSelect.disabled = !effectsState.distortion.enabled;
            distortionOversampleSelect.value = effectsState.distortion.oversample;
        }
    }
    
    /**
     * Create effects UI controls
     * Adds UI elements for controlling audio effects
     */
    function createEffectsUI() {
        // Create effects container if it doesn't exist
        let effectsContainer = document.querySelector('.effects-container');
        if (!effectsContainer) {
            effectsContainer = document.createElement('div');
            effectsContainer.className = 'effects-container';
            
            // Add to playback controls
            const playbackControls = document.querySelector('.playback-controls');
            if (playbackControls) {
                playbackControls.appendChild(effectsContainer);
            }
        }
        
        // Create effects toggle buttons
        const effectsToggleContainer = document.createElement('div');
        effectsToggleContainer.className = 'effects-toggle-container';
        
        // Filter toggle
        const filterToggle = document.createElement('button');
        filterToggle.className = 'btn btn-effect btn-filter metro-focus-element';
        filterToggle.innerHTML = '<span>filter: off</span>';
        filterToggle.addEventListener('click', () => {
            updateFilterEffect({ enabled: !effectsState.filter.enabled });
            updateEffectsUI();
        });
        
        // Reverb toggle
        const reverbToggle = document.createElement('button');
        reverbToggle.className = 'btn btn-effect btn-reverb metro-focus-element';
        reverbToggle.innerHTML = '<span>reverb: off</span>';
        reverbToggle.addEventListener('click', () => {
            updateReverbEffect({ enabled: !effectsState.reverb.enabled });
            updateEffectsUI();
        });
        
        // Delay toggle
        const delayToggle = document.createElement('button');
        delayToggle.className = 'btn btn-effect btn-delay metro-focus-element';
        delayToggle.innerHTML = '<span>delay: off</span>';
        delayToggle.addEventListener('click', () => {
            updateDelayEffect({ enabled: !effectsState.delay.enabled });
            updateEffectsUI();
        });
        
        // Distortion toggle
        const distortionToggle = document.createElement('button');
        distortionToggle.className = 'btn btn-effect btn-distortion metro-focus-element';
        distortionToggle.innerHTML = '<span>distortion: off</span>';
        distortionToggle.addEventListener('click', () => {
            updateDistortionEffect({ enabled: !effectsState.distortion.enabled });
            updateEffectsUI();
        });
        
        // Add toggles to container
        effectsToggleContainer.appendChild(filterToggle);
        effectsToggleContainer.appendChild(reverbToggle);
        effectsToggleContainer.appendChild(delayToggle);
        effectsToggleContainer.appendChild(distortionToggle);
        
        // Add toggle container to effects container
        effectsContainer.appendChild(effectsToggleContainer);
        
        // Create effects controls container
        const effectsControlsContainer = document.createElement('div');
        effectsControlsContainer.className = 'effects-controls-container';
        
        // Create filter controls
        const filterControls = createFilterControls();
        
        // Create reverb controls
        const reverbControls = createReverbControls();
        
        // Create delay controls
        const delayControls = createDelayControls();
        
        // Create distortion controls
        const distortionControls = createDistortionControls();
        
        // Add controls to container
        effectsControlsContainer.appendChild(filterControls);
        effectsControlsContainer.appendChild(reverbControls);
        effectsControlsContainer.appendChild(delayControls);
        effectsControlsContainer.appendChild(distortionControls);
        
        // Add controls container to effects container
        effectsContainer.appendChild(effectsControlsContainer);
        
        // Update UI to match current state
        updateEffectsUI();
    }
    
    /**
     * Create filter controls
     * @returns {HTMLElement} Filter controls container
     */
    function createFilterControls() {
        const container = document.createElement('div');
        container.className = 'effect-controls filter-controls';
        container.style.display = 'none';
        
        // Filter type selector
        const typeContainer = document.createElement('div');
        typeContainer.className = 'control-group';
        
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'type';
        typeLabel.htmlFor = 'filterType';
        
        const typeSelect = document.createElement('select');
        typeSelect.className = 'filter-type metro-focus-element';
        typeSelect.id = 'filterType';
        typeSelect.disabled = !effectsState.filter.enabled;
        
        const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass'];
        filterTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            if (type === effectsState.filter.type) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });
        
        typeSelect.addEventListener('change', () => {
            updateFilterEffect({ type: typeSelect.value });
        });
        
        typeContainer.appendChild(typeLabel);
        typeContainer.appendChild(typeSelect);
        
        // Frequency slider
        const freqContainer = document.createElement('div');
        freqContainer.className = 'control-group';
        
        const freqLabel = document.createElement('label');
        freqLabel.textContent = 'freq';
        freqLabel.htmlFor = 'filterFreq';
        
        const freqSlider = document.createElement('input');
        freqSlider.type = 'range';
        freqSlider.className = 'filter-freq metro-focus-element';
        freqSlider.id = 'filterFreq';
        freqSlider.min = '20';
        freqSlider.max = '22050';
        freqSlider.step = '1';
        freqSlider.value = effectsState.filter.frequency;
        freqSlider.disabled = !effectsState.filter.enabled;
        
        const freqValue = document.createElement('span');
        freqValue.className = 'slider-value';
        freqValue.textContent = effectsState.filter.frequency + ' Hz';
        
        freqSlider.addEventListener('input', () => {
            const value = parseInt(freqSlider.value);
            updateFilterEffect({ frequency: value });
            freqValue.textContent = value + ' Hz';
        });
        
        freqContainer.appendChild(freqLabel);
        freqContainer.appendChild(freqSlider);
        freqContainer.appendChild(freqValue);
        
        // Q/Resonance slider
        const qContainer = document.createElement('div');
        qContainer.className = 'control-group';
        
        const qLabel = document.createElement('label');
        qLabel.textContent = 'q';
        qLabel.htmlFor = 'filterQ';
        
        const qSlider = document.createElement('input');
        qSlider.type = 'range';
        qSlider.className = 'filter-q metro-focus-element';
        qSlider.id = 'filterQ';
        qSlider.min = '0.1';
        qSlider.max = '20';
        qSlider.step = '0.1';
        qSlider.value = effectsState.filter.Q;
        qSlider.disabled = !effectsState.filter.enabled;
        
        const qValue = document.createElement('span');
        qValue.className = 'slider-value';
        qValue.textContent = effectsState.filter.Q;
        
        qSlider.addEventListener('input', () => {
            const value = parseFloat(qSlider.value);
            updateFilterEffect({ Q: value });
            qValue.textContent = value;
        });
        
        qContainer.appendChild(qLabel);
        qContainer.appendChild(qSlider);
        qContainer.appendChild(qValue);
        
        // Add all controls to container
        container.appendChild(typeContainer);
        container.appendChild(freqContainer);
        container.appendChild(qContainer);
        
        return container;
    }
    
    /**
     * Create reverb controls
     * @returns {HTMLElement} Reverb controls container
     */
    function createReverbControls() {
        const container = document.createElement('div');
        container.className = 'effect-controls reverb-controls';
        container.style.display = 'none';
        
        // Level slider
        const levelContainer = document.createElement('div');
        levelContainer.className = 'control-group';
        
        const levelLabel = document.createElement('label');
        levelLabel.textContent = 'level';
        levelLabel.htmlFor = 'reverbLevel';
        
        const levelSlider = document.createElement('input');
        levelSlider.type = 'range';
        levelSlider.className = 'reverb-level metro-focus-element';
        levelSlider.id = 'reverbLevel';
        levelSlider.min = '0';
        levelSlider.max = '1';
        levelSlider.step = '0.01';
        levelSlider.value = effectsState.reverb.level;
        levelSlider.disabled = !effectsState.reverb.enabled;
        
        const levelValue = document.createElement('span');
        levelValue.className = 'slider-value';
        levelValue.textContent = effectsState.reverb.level;
        
        levelSlider.addEventListener('input', () => {
            const value = parseFloat(levelSlider.value);
            updateReverbEffect({ level: value });
            levelValue.textContent = value.toFixed(2);
        });
        
        levelContainer.appendChild(levelLabel);
        levelContainer.appendChild(levelSlider);
        levelContainer.appendChild(levelValue);
        
        // Decay slider
        const decayContainer = document.createElement('div');
        decayContainer.className = 'control-group';
        
        const decayLabel = document.createElement('label');
        decayLabel.textContent = 'decay';
        decayLabel.htmlFor = 'reverbDecay';
        
        const decaySlider = document.createElement('input');
        decaySlider.type = 'range';
        decaySlider.className = 'reverb-decay metro-focus-element';
        decaySlider.id = 'reverbDecay';
        decaySlider.min = '0.1';
        decaySlider.max = '10';
        decaySlider.step = '0.1';
        decaySlider.value = effectsState.reverb.decay;
        decaySlider.disabled = !effectsState.reverb.enabled;
        
        const decayValue = document.createElement('span');
        decayValue.className = 'slider-value';
        decayValue.textContent = effectsState.reverb.decay + ' s';
        
        decaySlider.addEventListener('input', () => {
            const value = parseFloat(decaySlider.value);
            updateReverbEffect({ decay: value });
            decayValue.textContent = value.toFixed(1) + ' s';
        });
        
        decayContainer.appendChild(decayLabel);
        decayContainer.appendChild(decaySlider);
        decayContainer.appendChild(decayValue);
        
        // Add all controls to container
        container.appendChild(levelContainer);
        container.appendChild(decayContainer);
        
        return container;
    }
    
    /**
     * Create delay controls
     * @returns {HTMLElement} Delay controls container
     */
    function createDelayControls() {
        const container = document.createElement('div');
        container.className = 'effect-controls delay-controls';
        container.style.display = 'none';
        
        // Time slider
        const timeContainer = document.createElement('div');
        timeContainer.className = 'control-group';
        
        const timeLabel = document.createElement('label');
        timeLabel.textContent = 'time';
        timeLabel.htmlFor = 'delayTime';
        
        const timeSlider = document.createElement('input');
        timeSlider.type = 'range';
        timeSlider.className = 'delay-time metro-focus-element';
        timeSlider.id = 'delayTime';
        timeSlider.min = '0.01';
        timeSlider.max = '2';
        timeSlider.step = '0.01';
        timeSlider.value = effectsState.delay.time;
        timeSlider.disabled = !effectsState.delay.enabled;
        
        const timeValue = document.createElement('span');
        timeValue.className = 'slider-value';
        timeValue.textContent = effectsState.delay.time + ' s';
        
        timeSlider.addEventListener('input', () => {
            const value = parseFloat(timeSlider.value);
            updateDelayEffect({ time: value });
            timeValue.textContent = value.toFixed(2) + ' s';
        });
        
        timeContainer.appendChild(timeLabel);
        timeContainer.appendChild(timeSlider);
        timeContainer.appendChild(timeValue);
        
        // Feedback slider
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'control-group';
        
        const feedbackLabel = document.createElement('label');
        feedbackLabel.textContent = 'feedback';
        feedbackLabel.htmlFor = 'delayFeedback';
        
        const feedbackSlider = document.createElement('input');
        feedbackSlider.type = 'range';
        feedbackSlider.className = 'delay-feedback metro-focus-element';
        feedbackSlider.id = 'delayFeedback';
        feedbackSlider.min = '0';
        feedbackSlider.max = '0.95';
        feedbackSlider.step = '0.01';
        feedbackSlider.value = effectsState.delay.feedback;
        feedbackSlider.disabled = !effectsState.delay.enabled;
        
        const feedbackValue = document.createElement('span');
        feedbackValue.className = 'slider-value';
        feedbackValue.textContent = effectsState.delay.feedback;
        
        feedbackSlider.addEventListener('input', () => {
            const value = parseFloat(feedbackSlider.value);
            updateDelayEffect({ feedback: value });
            feedbackValue.textContent = value.toFixed(2);
        });
        
        feedbackContainer.appendChild(feedbackLabel);
        feedbackContainer.appendChild(feedbackSlider);
        feedbackContainer.appendChild(feedbackValue);
        
        // Mix slider
        const mixContainer = document.createElement('div');
        mixContainer.className = 'control-group';
        
        const mixLabel = document.createElement('label');
        mixLabel.textContent = 'mix';
        mixLabel.htmlFor = 'delayMix';
        
        const mixSlider = document.createElement('input');
        mixSlider.type = 'range';
        mixSlider.className = 'delay-mix metro-focus-element';
        mixSlider.id = 'delayMix';
        mixSlider.min = '0';
        mixSlider.max = '1';
        mixSlider.step = '0.01';
        mixSlider.value = effectsState.delay.mix;
        mixSlider.disabled = !effectsState.delay.enabled;
        
        const mixValue = document.createElement('span');
        mixValue.className = 'slider-value';
        mixValue.textContent = effectsState.delay.mix;
        
        mixSlider.addEventListener('input', () => {
            const value = parseFloat(mixSlider.value);
            updateDelayEffect({ mix: value });
            mixValue.textContent = value.toFixed(2);
        });
        
        mixContainer.appendChild(mixLabel);
        mixContainer.appendChild(mixSlider);
        mixContainer.appendChild(mixValue);
        
        // Add all controls to container
        container.appendChild(timeContainer);
        container.appendChild(feedbackContainer);
        container.appendChild(mixContainer);
        
        return container;
    }
    
    /**
     * Create distortion controls
     * @returns {HTMLElement} Distortion controls container
     */
    function createDistortionControls() {
        const container = document.createElement('div');
        container.className = 'effect-controls distortion-controls';
        container.style.display = 'none';
        
        // Amount slider
        const amountContainer = document.createElement('div');
        amountContainer.className = 'control-group';
        
        const amountLabel = document.createElement('label');
        amountLabel.textContent = 'amount';
        amountLabel.htmlFor = 'distortionAmount';
        
        const amountSlider = document.createElement('input');
        amountSlider.type = 'range';
        amountSlider.className = 'distortion-amount metro-focus-element';
        amountSlider.id = 'distortionAmount';
        amountSlider.min = '0';
        amountSlider.max = '100';
        amountSlider.step = '1';
        amountSlider.value = effectsState.distortion.amount;
        amountSlider.disabled = !effectsState.distortion.enabled;
        
        const amountValue = document.createElement('span');
        amountValue.className = 'slider-value';
        amountValue.textContent = effectsState.distortion.amount;
        
        amountSlider.addEventListener('input', () => {
            const value = parseInt(amountSlider.value);
            updateDistortionEffect({ amount: value });
            amountValue.textContent = value;
        });
        
        amountContainer.appendChild(amountLabel);
        amountContainer.appendChild(amountSlider);
        amountContainer.appendChild(amountValue);
        
        // Oversample selector
        const oversampleContainer = document.createElement('div');
        oversampleContainer.className = 'control-group';
        
        const oversampleLabel = document.createElement('label');
        oversampleLabel.textContent = 'quality';
        oversampleLabel.htmlFor = 'distortionOversample';
        
        const oversampleSelect = document.createElement('select');
        oversampleSelect.className = 'distortion-oversample metro-focus-element';
        oversampleSelect.id = 'distortionOversample';
        oversampleSelect.disabled = !effectsState.distortion.enabled;
        
        const oversampleOptions = ['none', '2x', '4x'];
        oversampleOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option === effectsState.distortion.oversample) {
                optionElement.selected = true;
            }
            oversampleSelect.appendChild(optionElement);
        });
        
        oversampleSelect.addEventListener('change', () => {
            updateDistortionEffect({ oversample: oversampleSelect.value });
        });
        
        oversampleContainer.appendChild(oversampleLabel);
        oversampleContainer.appendChild(oversampleSelect);
        
        // Add all controls to container
        container.appendChild(amountContainer);
        container.appendChild(oversampleContainer);
        
        return container;
    }
    
    /**
     * Show effect controls for the selected effect
     * @param {string} effectType - Type of effect to show controls for
     */
    function showEffectControls(effectType) {
        // Hide all effect controls
        const allControls = document.querySelectorAll('.effect-controls');
        allControls.forEach(control => {
            control.style.display = 'none';
        });
        
        // Show selected effect controls
        const selectedControls = document.querySelector(`.${effectType}-controls`);
        if (selectedControls) {
            selectedControls.style.display = 'block';
        }
    }
    
    // Initialize effects
    initEffects();
    
    // Create effects UI
    document.addEventListener('DOMContentLoaded', createEffectsUI);
    
    // Add event listeners for effect control buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-filter') || e.target.classList.contains('btn-filter')) {
            showEffectControls('filter');
        } else if (e.target.closest('.btn-reverb') || e.target.classList.contains('btn-reverb')) {
            showEffectControls('reverb');
        } else if (e.target.closest('.btn-delay') || e.target.classList.contains('btn-delay')) {
            showEffectControls('delay');
        } else if (e.target.closest('.btn-distortion') || e.target.classList.contains('btn-distortion')) {
            showEffectControls('distortion');
        }
    });
    
    // Export functions to window object
    window.updateFilterEffect = updateFilterEffect;
    window.updateReverbEffect = updateReverbEffect;
    window.updateDelayEffect = updateDelayEffect;
    window.updateDistortionEffect = updateDistortionEffect;
    window.getEffectsState = getEffectsState;
    window.resetEffects = resetEffects;
    window.connectEffects = connectEffects;
});