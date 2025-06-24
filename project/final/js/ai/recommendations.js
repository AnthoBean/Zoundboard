/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * AI Recommendation System
 * 
 * This module provides intelligent sound recommendations based on
 * pattern recognition and analysis of user-created sequences.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Recommendation state
    const recommendationState = {
        enabled: true,
        learningRate: 0.2,
        userPreferences: {},
        patternHistory: [],
        maxHistoryLength: 10,
        lastRecommendationTime: 0,
        recommendationCooldown: 5000, // ms between recommendations
        currentRecommendations: []
    };
    
    // Sound categories and their characteristics
    const soundCharacteristics = {
        kicks: { 
            density: 'low', 
            frequency: 'low', 
            rhythmicRole: 'foundation',
            commonPatterns: ['four-on-floor', 'downbeat', 'breakbeat']
        },
        snares: { 
            density: 'low', 
            frequency: 'mid', 
            rhythmicRole: 'backbeat',
            commonPatterns: ['backbeat', 'offbeat', 'fill']
        },
        hi_hats: { 
            density: 'high', 
            frequency: 'high', 
            rhythmicRole: 'subdivision',
            commonPatterns: ['eighth', 'sixteenth', 'offbeat']
        },
        percussion: { 
            density: 'medium', 
            frequency: 'mid-high', 
            rhythmicRole: 'accent',
            commonPatterns: ['syncopated', 'fill', 'offbeat']
        },
        bass: { 
            density: 'medium', 
            frequency: 'low-mid', 
            rhythmicRole: 'harmonic',
            commonPatterns: ['root', 'walking', 'ostinato']
        },
        synth: { 
            density: 'variable', 
            frequency: 'mid-high', 
            rhythmicRole: 'melodic',
            commonPatterns: ['arpeggio', 'pad', 'lead']
        },
        fx: { 
            density: 'low', 
            frequency: 'variable', 
            rhythmicRole: 'texture',
            commonPatterns: ['impact', 'riser', 'atmosphere']
        }
    };
    
    // Common rhythmic patterns and their characteristics
    const rhythmicPatterns = {
        'four-on-floor': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        'backbeat': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        'offbeat': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        'downbeat': [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        'eighth': [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        'sixteenth': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        'syncopated': [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
        'fill': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
    };
    
    // Initialize recommendation system
    initRecommendationSystem();
    
    /**
     * Initialize the recommendation system
     * Sets up event listeners and UI elements
     */
    function initRecommendationSystem() {
        console.log('Initializing AI recommendation system');
        
        // Create recommendation UI
        createRecommendationUI();
        
        // Set up event listeners for pattern changes
        setupPatternListeners();
        
        // Load user preferences from localStorage if available
        loadUserPreferences();
        
        // Initial analysis of current pattern
        setTimeout(() => {
            analyzeCurrentPattern();
        }, 1000);
    }
    
    /**
     * Create recommendation UI elements
     * Adds a recommendation panel to the interface
     */
    function createRecommendationUI() {
        // Create recommendation container
        const recommendationContainer = document.createElement('div');
        recommendationContainer.className = 'recommendation-container';
        recommendationContainer.style.position = 'absolute';
        recommendationContainer.style.top = '10px';
        recommendationContainer.style.right = '10px';
        recommendationContainer.style.width = '220px';
        recommendationContainer.style.backgroundColor = 'var(--color-background)';
        recommendationContainer.style.color = 'var(--color-text)';
        recommendationContainer.style.padding = '1rem';
        recommendationContainer.style.borderRadius = '2px';
        recommendationContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        recommendationContainer.style.zIndex = '100';
        recommendationContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        recommendationContainer.style.transform = 'translateX(110%)';
        recommendationContainer.style.opacity = '0';
        
        // Header
        const header = document.createElement('div');
        header.className = 'recommendation-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.5rem';
        
        const title = document.createElement('h3');
        title.textContent = 'genius suggestions';
        title.style.margin = '0';
        title.style.fontSize = 'var(--font-size-small)';
        title.style.fontWeight = '400';
        title.style.textTransform = 'lowercase';
        title.style.color = 'var(--color-accent)';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'recommendation-toggle metro-focus-element';
        toggleBtn.innerHTML = recommendationState.enabled ? '✓' : '✗';
        toggleBtn.title = recommendationState.enabled ? 'Disable recommendations' : 'Enable recommendations';
        toggleBtn.style.backgroundColor = 'transparent';
        toggleBtn.style.border = 'none';
        toggleBtn.style.color = recommendationState.enabled ? 'var(--color-green)' : 'var(--color-gray)';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = 'var(--font-size-small)';
        
        toggleBtn.addEventListener('click', () => {
            recommendationState.enabled = !recommendationState.enabled;
            toggleBtn.innerHTML = recommendationState.enabled ? '✓' : '✗';
            toggleBtn.title = recommendationState.enabled ? 'Disable recommendations' : 'Enable recommendations';
            toggleBtn.style.color = recommendationState.enabled ? 'var(--color-green)' : 'var(--color-gray)';
            
            // Save preference
            saveUserPreferences();
            
            // If enabled, analyze current pattern
            if (recommendationState.enabled) {
                analyzeCurrentPattern();
            } else {
                // Hide recommendations
                hideRecommendations();
            }
        });
        
        header.appendChild(title);
        header.appendChild(toggleBtn);
        
        // Recommendations content
        const content = document.createElement('div');
        content.className = 'recommendation-content';
        
        // Initial message
        const initialMessage = document.createElement('p');
        initialMessage.className = 'recommendation-message';
        initialMessage.textContent = 'Create a pattern to get suggestions';
        initialMessage.style.fontSize = 'var(--font-size-xs)';
        initialMessage.style.color = 'var(--color-gray)';
        initialMessage.style.textAlign = 'center';
        initialMessage.style.margin = '1rem 0';
        
        content.appendChild(initialMessage);
        
        // Add to container
        recommendationContainer.appendChild(header);
        recommendationContainer.appendChild(content);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'recommendation-close metro-focus-element';
        closeBtn.innerHTML = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'var(--color-gray)';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = 'var(--font-size-medium)';
        closeBtn.style.padding = '0 5px';
        
        closeBtn.addEventListener('click', () => {
            hideRecommendations();
        });
        
        recommendationContainer.appendChild(closeBtn);
        
        // Add to document
        document.body.appendChild(recommendationContainer);
    }
    
    /**
     * Set up event listeners for pattern changes
     * Monitors grid cell changes to trigger recommendations
     */
    function setupPatternListeners() {
        // Listen for changes to the grid
        const sequencerGrid = document.getElementById('sequencerGrid');
        if (sequencerGrid) {
            // Use MutationObserver to detect changes to grid cells
            const observer = new MutationObserver((mutations) => {
                let patternChanged = false;
                
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && 
                        mutation.attributeName === 'class' && 
                        mutation.target.classList.contains('grid-cell')) {
                        patternChanged = true;
                    }
                });
                
                if (patternChanged) {
                    // Debounce pattern analysis
                    clearTimeout(window.patternAnalysisTimeout);
                    window.patternAnalysisTimeout = setTimeout(() => {
                        analyzeCurrentPattern();
                    }, 1000); // Wait 1 second after last change
                }
            });
            
            // Observe changes to grid cell classes
            observer.observe(sequencerGrid, { 
                attributes: true, 
                attributeFilter: ['class'], 
                subtree: true 
            });
        }
        
        // Listen for randomize button clicks
        const randomizeBtn = document.getElementById('randomizeBtn');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                // Analyze after a short delay to let the randomization complete
                setTimeout(() => {
                    analyzeCurrentPattern();
                }, 500);
            });
        }
        
        // Listen for clear button clicks
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // Hide recommendations when pattern is cleared
                hideRecommendations();
            });
        }
    }
    
    /**
     * Load user preferences from localStorage
     */
    function loadUserPreferences() {
        try {
            const savedPreferences = localStorage.getItem('zoundboardPreferences');
            if (savedPreferences) {
                const preferences = JSON.parse(savedPreferences);
                
                // Apply saved preferences
                if (preferences.recommendationsEnabled !== undefined) {
                    recommendationState.enabled = preferences.recommendationsEnabled;
                    
                    // Update toggle button if it exists
                    const toggleBtn = document.querySelector('.recommendation-toggle');
                    if (toggleBtn) {
                        toggleBtn.innerHTML = recommendationState.enabled ? '✓' : '✗';
                        toggleBtn.title = recommendationState.enabled ? 'Disable recommendations' : 'Enable recommendations';
                        toggleBtn.style.color = recommendationState.enabled ? 'var(--color-green)' : 'var(--color-gray)';
                    }
                }
                
                // Load learning data
                if (preferences.userPreferences) {
                    recommendationState.userPreferences = preferences.userPreferences;
                }
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }
    
    /**
     * Save user preferences to localStorage
     */
    function saveUserPreferences() {
        try {
            const preferences = {
                recommendationsEnabled: recommendationState.enabled,
                userPreferences: recommendationState.userPreferences
            };
            
            localStorage.setItem('zoundboardPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }
    
    /**
     * Analyze the current pattern and generate recommendations
     * Uses pattern recognition to suggest complementary sounds
     */
    function analyzeCurrentPattern() {
        if (!recommendationState.enabled) return;
        
        // Get current pattern
        const pattern = getCurrentPattern();
        
        // If pattern is empty, hide recommendations
        if (isPatternEmpty(pattern)) {
            hideRecommendations();
            return;
        }
        
        // Add to pattern history
        addToPatternHistory(pattern);
        
        // Identify pattern characteristics
        const characteristics = identifyPatternCharacteristics(pattern);
        
        // Generate recommendations based on characteristics
        const recommendations = generateRecommendations(characteristics, pattern);
        
        // Update recommendation state
        recommendationState.currentRecommendations = recommendations;
        recommendationState.lastRecommendationTime = Date.now();
        
        // Display recommendations
        displayRecommendations(recommendations);
    }
    
    /**
     * Get the current pattern from the grid
     * @returns {Array} 2D array representing the pattern
     */
    function getCurrentPattern() {
        const pattern = [
            [], [], [], [], [], [], [], []
        ];
        
        // Get all active cells
        const activeCells = document.querySelectorAll('.grid-cell.active');
        
        // Populate pattern data
        activeCells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (row >= 0 && row < 8 && col >= 0 && col < 16) {
                pattern[row].push(col);
            }
        });
        
        return pattern;
    }
    
    /**
     * Check if a pattern is empty
     * @param {Array} pattern - The pattern to check
     * @returns {boolean} Whether the pattern is empty
     */
    function isPatternEmpty(pattern) {
        return pattern.every(row => row.length === 0);
    }
    
    /**
     * Add a pattern to the history
     * @param {Array} pattern - The pattern to add
     */
    function addToPatternHistory(pattern) {
        // Add to history
        recommendationState.patternHistory.push({
            pattern: JSON.parse(JSON.stringify(pattern)),
            timestamp: Date.now()
        });
        
        // Limit history length
        if (recommendationState.patternHistory.length > recommendationState.maxHistoryLength) {
            recommendationState.patternHistory.shift();
        }
    }
    
    /**
     * Identify characteristics of the current pattern
     * Analyzes density, rhythm patterns, and instrument relationships
     * 
     * @param {Array} pattern - The pattern to analyze
     * @returns {Object} Pattern characteristics
     */
    function identifyPatternCharacteristics(pattern) {
        // Calculate density for each row
        const density = pattern.map(row => row.length / 16);
        
        // Convert pattern to binary representation for pattern matching
        const binaryPattern = pattern.map(row => {
            const binary = new Array(16).fill(0);
            row.forEach(col => {
                binary[col] = 1;
            });
            return binary;
        });
        
        // Identify rhythm patterns for each row
        const rhythmPatterns = binaryPattern.map(row => {
            return identifyRhythmPattern(row);
        });
        
        // Identify empty tracks
        const emptyTracks = [];
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i].length === 0) {
                emptyTracks.push(i);
            }
        }
        
        // Identify relationships between instruments
        const relationships = identifyInstrumentRelationships(binaryPattern);
        
        return {
            density,
            binaryPattern,
            rhythmPatterns,
            emptyTracks,
            relationships
        };
    }
    
    /**
     * Identify the closest matching rhythm pattern
     * @param {Array} row - Binary representation of a row
     * @returns {string} Name of the closest rhythm pattern
     */
    function identifyRhythmPattern(row) {
        let bestMatch = '';
        let bestScore = -1;
        
        // Compare with known patterns
        for (const [name, pattern] of Object.entries(rhythmicPatterns)) {
            const score = calculatePatternSimilarity(row, pattern);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = name;
            }
        }
        
        return {
            name: bestMatch,
            score: bestScore
        };
    }
    
    /**
     * Calculate similarity between two patterns
     * @param {Array} pattern1 - First pattern
     * @param {Array} pattern2 - Second pattern
     * @returns {number} Similarity score (0-1)
     */
    function calculatePatternSimilarity(pattern1, pattern2) {
        let matches = 0;
        let total = 0;
        
        // Count matching positions
        for (let i = 0; i < pattern1.length; i++) {
            if (pattern1[i] === 1 || pattern2[i] === 1) {
                total++;
                if (pattern1[i] === pattern2[i]) {
                    matches++;
                }
            }
        }
        
        return total > 0 ? matches / total : 0;
    }
    
    /**
     * Identify relationships between instruments
     * @param {Array} binaryPattern - Binary representation of the pattern
     * @returns {Object} Instrument relationships
     */
    function identifyInstrumentRelationships(binaryPattern) {
        const relationships = {};
        
        // Check for common relationships
        
        // Kick and snare relationship (complementary)
        if (binaryPattern[0].some(val => val === 1) && binaryPattern[1].some(val => val === 1)) {
            relationships.kickSnare = calculateComplementaryScore(binaryPattern[0], binaryPattern[1]);
        }
        
        // Hi-hat and kick relationship (supportive)
        if (binaryPattern[2].some(val => val === 1) && binaryPattern[0].some(val => val === 1)) {
            relationships.hihatKick = calculateSupportScore(binaryPattern[2], binaryPattern[0]);
        }
        
        // Bass and kick relationship (reinforcing)
        if (binaryPattern[4].some(val => val === 1) && binaryPattern[0].some(val => val === 1)) {
            relationships.bassKick = calculateReinforcementScore(binaryPattern[4], binaryPattern[0]);
        }
        
        return relationships;
    }
    
    /**
     * Calculate complementary score between two patterns
     * High when patterns don't overlap but fill the space
     * 
     * @param {Array} pattern1 - First pattern
     * @param {Array} pattern2 - Second pattern
     * @returns {number} Complementary score (0-1)
     */
    function calculateComplementaryScore(pattern1, pattern2) {
        let complementary = 0;
        let overlapping = 0;
        
        for (let i = 0; i < pattern1.length; i++) {
            if (pattern1[i] === 1 && pattern2[i] === 0) {
                complementary++;
            } else if (pattern2[i] === 1 && pattern1[i] === 0) {
                complementary++;
            } else if (pattern1[i] === 1 && pattern2[i] === 1) {
                overlapping++;
            }
        }
        
        const total = complementary + overlapping;
        return total > 0 ? complementary / total : 0;
    }
    
    /**
     * Calculate support score between two patterns
     * High when one pattern supports the other (e.g., hi-hat supporting kick)
     * 
     * @param {Array} supportPattern - Supporting pattern
     * @param {Array} mainPattern - Main pattern
     * @returns {number} Support score (0-1)
     */
    function calculateSupportScore(supportPattern, mainPattern) {
        let supporting = 0;
        let total = 0;
        
        for (let i = 0; i < mainPattern.length; i++) {
            if (mainPattern[i] === 1) {
                total++;
                // Check if support pattern has notes around this position
                const before = i > 0 ? supportPattern[i - 1] : 0;
                const after = i < supportPattern.length - 1 ? supportPattern[i + 1] : 0;
                
                if (before === 1 || supportPattern[i] === 1 || after === 1) {
                    supporting++;
                }
            }
        }
        
        return total > 0 ? supporting / total : 0;
    }
    
    /**
     * Calculate reinforcement score between two patterns
     * High when patterns reinforce each other (e.g., bass and kick)
     * 
     * @param {Array} pattern1 - First pattern
     * @param {Array} pattern2 - Second pattern
     * @returns {number} Reinforcement score (0-1)
     */
    function calculateReinforcementScore(pattern1, pattern2) {
        let reinforcing = 0;
        let total = 0;
        
        for (let i = 0; i < pattern1.length; i++) {
            if (pattern1[i] === 1 || pattern2[i] === 1) {
                total++;
                if (pattern1[i] === 1 && pattern2[i] === 1) {
                    reinforcing++;
                }
            }
        }
        
        return total > 0 ? reinforcing / total : 0;
    }
    
    /**
     * Generate recommendations based on pattern characteristics
     * 
     * @param {Object} characteristics - Pattern characteristics
     * @param {Array} currentPattern - Current pattern
     * @returns {Array} Recommendations
     */
    function generateRecommendations(characteristics, currentPattern) {
        const recommendations = [];
        
        // Check for empty tracks that could be filled
        characteristics.emptyTracks.forEach(trackIndex => {
            // Get track type
            const trackTypes = [
                'kicks', 'snares', 'hi_hats', 'percussion', 
                'bass', 'synth', 'fx', 'fx'
            ];
            const trackType = trackTypes[trackIndex];
            
            // Skip if no track type
            if (!trackType) return;
            
            // Generate recommendation based on track type and pattern
            const recommendation = generateTrackRecommendation(trackType, trackIndex, characteristics);
            
            if (recommendation) {
                recommendations.push(recommendation);
            }
        });
        
        // Check for tracks that could be improved
        for (let i = 0; i < currentPattern.length; i++) {
            // Skip empty tracks (already handled)
            if (currentPattern[i].length === 0) continue;
            
            // Check if track has a low pattern match score
            if (characteristics.rhythmPatterns[i].score < 0.5) {
                const trackTypes = [
                    'kicks', 'snares', 'hi_hats', 'percussion', 
                    'bass', 'synth', 'fx', 'fx'
                ];
                const trackType = trackTypes[i];
                
                // Generate improvement recommendation
                const recommendation = generateImprovementRecommendation(trackType, i, characteristics);
                
                if (recommendation) {
                    recommendations.push(recommendation);
                }
            }
        }
        
        // Add general recommendations if we have few specific ones
        if (recommendations.length < 2) {
            // Add general recommendations based on genre detection
            const genreRecommendation = generateGenreBasedRecommendation(characteristics);
            if (genreRecommendation) {
                recommendations.push(genreRecommendation);
            }
        }
        
        // Sort recommendations by relevance
        recommendations.sort((a, b) => b.relevance - a.relevance);
        
        // Limit to 3 recommendations
        return recommendations.slice(0, 3);
    }
    
    /**
     * Generate a recommendation for an empty track
     * 
     * @param {string} trackType - Type of track
     * @param {number} trackIndex - Track index
     * @param {Object} characteristics - Pattern characteristics
     * @returns {Object} Recommendation
     */
    function generateTrackRecommendation(trackType, trackIndex, characteristics) {
        // Get track characteristics
        const trackInfo = soundCharacteristics[trackType];
        if (!trackInfo) return null;
        
        // Determine what pattern would complement the existing ones
        let suggestedPattern = null;
        let patternName = '';
        let relevance = 0.7; // Default relevance
        
        switch (trackType) {
            case 'kicks':
                // If hi-hats or snare is present, suggest complementary kick pattern
                if (characteristics.binaryPattern[2].some(val => val === 1)) {
                    // Hi-hats present, suggest four-on-the-floor
                    suggestedPattern = rhythmicPatterns['four-on-floor'];
                    patternName = 'four-on-the-floor';
                    relevance = 0.9;
                } else if (characteristics.binaryPattern[1].some(val => val === 1)) {
                    // Snare present, suggest downbeat
                    suggestedPattern = rhythmicPatterns['downbeat'];
                    patternName = 'downbeat';
                    relevance = 0.85;
                } else {
                    // Default kick pattern
                    suggestedPattern = rhythmicPatterns['four-on-floor'];
                    patternName = 'four-on-the-floor';
                }
                break;
                
            case 'snares':
                // If kick is present, suggest backbeat
                if (characteristics.binaryPattern[0].some(val => val === 1)) {
                    suggestedPattern = rhythmicPatterns['backbeat'];
                    patternName = 'backbeat';
                    relevance = 0.9;
                } else {
                    // Default snare pattern
                    suggestedPattern = rhythmicPatterns['offbeat'];
                    patternName = 'offbeat';
                }
                break;
                
            case 'hi_hats':
                // Suggest hi-hat pattern based on kick and snare
                if (characteristics.binaryPattern[0].some(val => val === 1) && 
                    characteristics.binaryPattern[1].some(val => val === 1)) {
                    // Both kick and snare present, suggest sixteenth notes
                    suggestedPattern = rhythmicPatterns['sixteenth'];
                    patternName = 'sixteenth notes';
                    relevance = 0.95;
                } else if (characteristics.binaryPattern[0].some(val => val === 1)) {
                    // Kick present, suggest eighth notes
                    suggestedPattern = rhythmicPatterns['eighth'];
                    patternName = 'eighth notes';
                    relevance = 0.85;
                } else {
                    // Default hi-hat pattern
                    suggestedPattern = rhythmicPatterns['offbeat'];
                    patternName = 'offbeat';
                }
                break;
                
            case 'percussion':
                // Suggest percussion pattern based on other elements
                suggestedPattern = rhythmicPatterns['syncopated'];
                patternName = 'syncopated';
                relevance = 0.75;
                break;
                
            case 'bass':
                // If kick is present, suggest complementary bass pattern
                if (characteristics.binaryPattern[0].some(val => val === 1)) {
                    // Create a pattern that follows the kick
                    suggestedPattern = [...characteristics.binaryPattern[0]];
                    patternName = 'follow kick';
                    relevance = 0.9;
                } else {
                    // Default bass pattern
                    suggestedPattern = rhythmicPatterns['downbeat'];
                    patternName = 'downbeat';
                }
                break;
                
            case 'synth':
                // Suggest synth pattern based on overall density
                const avgDensity = characteristics.density.reduce((sum, d) => sum + d, 0) / 
                                  characteristics.density.filter(d => d > 0).length;
                
                if (avgDensity > 0.5) {
                    // High density, suggest sparse pattern
                    suggestedPattern = rhythmicPatterns['downbeat'];
                    patternName = 'sparse melody';
                    relevance = 0.8;
                } else {
                    // Low density, suggest more active pattern
                    suggestedPattern = rhythmicPatterns['syncopated'];
                    patternName = 'syncopated melody';
                    relevance = 0.75;
                }
                break;
                
            case 'fx':
                // Suggest FX pattern
                suggestedPattern = rhythmicPatterns['fill'];
                patternName = 'fill';
                relevance = 0.6;
                break;
        }
        
        if (!suggestedPattern) return null;
        
        // Create recommendation
        return {
            type: 'track',
            trackType,
            trackIndex,
            pattern: suggestedPattern,
            patternName,
            message: `Add ${patternName} ${trackType.replace('_', ' ')}`,
            relevance
        };
    }
    
    /**
     * Generate a recommendation to improve an existing track
     * 
     * @param {string} trackType - Type of track
     * @param {number} trackIndex - Track index
     * @param {Object} characteristics - Pattern characteristics
     * @returns {Object} Recommendation
     */
    function generateImprovementRecommendation(trackType, trackIndex, characteristics) {
        // Get current pattern for this track
        const currentPattern = characteristics.binaryPattern[trackIndex];
        
        // Get track characteristics
        const trackInfo = soundCharacteristics[trackType];
        if (!trackInfo) return null;
        
        // Find the best pattern for this track type
        let bestPattern = '';
        let bestScore = -1;
        
        trackInfo.commonPatterns.forEach(patternName => {
            if (rhythmicPatterns[patternName]) {
                const score = calculatePatternSimilarity(currentPattern, rhythmicPatterns[patternName]);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestPattern = patternName;
                }
            }
        });
        
        // If current pattern is already close to a common pattern, don't suggest changes
        if (bestScore > 0.7) return null;
        
        // Suggest the best pattern
        return {
            type: 'improve',
            trackType,
            trackIndex,
            pattern: rhythmicPatterns[bestPattern] || null,
            patternName: bestPattern,
            message: `Try a ${bestPattern} pattern for ${trackType.replace('_', ' ')}`,
            relevance: 0.7 + (0.2 * (1 - bestScore)) // Higher relevance for worse matches
        };
    }
    
    /**
     * Generate a recommendation based on detected genre
     * 
     * @param {Object} characteristics - Pattern characteristics
     * @returns {Object} Recommendation
     */
    function generateGenreBasedRecommendation(characteristics) {
        // Detect genre based on pattern characteristics
        const genre = detectGenre(characteristics);
        
        // Generate recommendation based on genre
        switch (genre) {
            case 'house':
                return {
                    type: 'genre',
                    genre,
                    message: 'Try adding a four-on-the-floor kick and offbeat hi-hats for a house feel',
                    relevance: 0.8
                };
                
            case 'hip-hop':
                return {
                    type: 'genre',
                    genre,
                    message: 'Add syncopated hi-hats and a strong backbeat for a hip-hop groove',
                    relevance: 0.75
                };
                
            case 'trap':
                return {
                    type: 'genre',
                    genre,
                    message: 'Try adding rapid hi-hat rolls and 808-style bass for a trap sound',
                    relevance: 0.7
                };
                
            case 'techno':
                return {
                    type: 'genre',
                    genre,
                    message: 'Add a steady kick and minimal percussion for a techno vibe',
                    relevance: 0.75
                };
                
            default:
                return {
                    type: 'genre',
                    genre: 'electronic',
                    message: 'Try adding more rhythmic variation to make your pattern more interesting',
                    relevance: 0.6
                };
        }
    }
    
    /**
     * Detect genre based on pattern characteristics
     * 
     * @param {Object} characteristics - Pattern characteristics
     * @returns {string} Detected genre
     */
    function detectGenre(characteristics) {
        // Check for house music characteristics
        if (characteristics.rhythmPatterns[0].name === 'four-on-floor' &&
            characteristics.density[2] > 0.5) {
            return 'house';
        }
        
        // Check for hip-hop characteristics
        if (characteristics.rhythmPatterns[1].name === 'backbeat' &&
            characteristics.density[0] < 0.3) {
            return 'hip-hop';
        }
        
        // Check for trap characteristics
        if (characteristics.density[2] > 0.7 &&
            characteristics.rhythmPatterns[0].name === 'downbeat') {
            return 'trap';
        }
        
        // Check for techno characteristics
        if (characteristics.rhythmPatterns[0].name === 'four-on-floor' &&
            characteristics.density.reduce((sum, d) => sum + d, 0) < 2) {
            return 'techno';
        }
        
        // Default genre
        return 'electronic';
    }
    
    /**
     * Display recommendations in the UI
     * @param {Array} recommendations - Recommendations to display
     */
    function displayRecommendations(recommendations) {
        // Get recommendation container
        const container = document.querySelector('.recommendation-container');
        if (!container) return;
        
        // Get content area
        const content = container.querySelector('.recommendation-content');
        if (!content) return;
        
        // Clear existing content
        content.innerHTML = '';
        
        // If no recommendations, show message
        if (recommendations.length === 0) {
            const message = document.createElement('p');
            message.className = 'recommendation-message';
            message.textContent = 'No recommendations available';
            message.style.fontSize = 'var(--font-size-xs)';
            message.style.color = 'var(--color-gray)';
            message.style.textAlign = 'center';
            message.style.margin = '1rem 0';
            
            content.appendChild(message);
        } else {
            // Create recommendation list
            const list = document.createElement('ul');
            list.className = 'recommendation-list';
            list.style.listStyle = 'none';
            list.style.padding = '0';
            list.style.margin = '0';
            
            // Add recommendations
            recommendations.forEach((recommendation, index) => {
                const item = document.createElement('li');
                item.className = 'recommendation-item';
                item.style.marginBottom = '0.75rem';
                item.style.padding = '0.5rem';
                item.style.backgroundColor = 'var(--color-background-light)';
                item.style.borderLeft = '3px solid var(--color-accent)';
                item.style.transition = 'transform 0.2s ease';
                item.style.cursor = 'pointer';
                
                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'translateX(3px)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateX(0)';
                });
                
                // Add click event to apply recommendation
                item.addEventListener('click', () => {
                    applyRecommendation(recommendation);
                    
                    // Add feedback animation
                    item.style.backgroundColor = 'var(--color-accent)';
                    item.style.color = 'var(--color-white)';
                    
                    setTimeout(() => {
                        item.style.backgroundColor = 'var(--color-background-light)';
                        item.style.color = 'var(--color-text)';
                    }, 300);
                    
                    // Update user preferences
                    updateUserPreferences(recommendation);
                });
                
                // Recommendation message
                const message = document.createElement('p');
                message.className = 'recommendation-text';
                message.textContent = recommendation.message;
                message.style.margin = '0';
                message.style.fontSize = 'var(--font-size-xs)';
                
                item.appendChild(message);
                list.appendChild(item);
            });
            
            content.appendChild(list);
        }
        
        // Show container with animation
        container.style.transform = 'translateX(0)';
        container.style.opacity = '1';
    }
    
    /**
     * Hide recommendations
     */
    function hideRecommendations() {
        const container = document.querySelector('.recommendation-container');
        if (container) {
            container.style.transform = 'translateX(110%)';
            container.style.opacity = '0';
        }
    }
    
    /**
     * Apply a recommendation to the grid
     * @param {Object} recommendation - The recommendation to apply
     */
    function applyRecommendation(recommendation) {
        // Handle different recommendation types
        switch (recommendation.type) {
            case 'track':
            case 'improve':
                applyPatternRecommendation(recommendation);
                break;
                
            case 'genre':
                // Genre recommendations are informational only
                break;
        }
    }
    
    /**
     * Apply a pattern recommendation to the grid
     * @param {Object} recommendation - The recommendation to apply
     */
    function applyPatternRecommendation(recommendation) {
        if (!recommendation.pattern || recommendation.trackIndex === undefined) return;
        
        // Get all cells for this track
        const cells = document.querySelectorAll(`.grid-cell[data-row="${recommendation.trackIndex}"]`);
        
        // Clear existing pattern
        cells.forEach(cell => {
            cell.classList.remove('active');
        });
        
        // Apply new pattern
        recommendation.pattern.forEach((value, col) => {
            if (value === 1) {
                const cell = document.querySelector(`.grid-cell[data-row="${recommendation.trackIndex}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('active');
                    
                    // Trigger sound if available
                    if (typeof triggerSound === 'function') {
                        triggerSound(recommendation.trackIndex);
                    }
                }
            }
        });
        
        // Apply visual effect to waveform if available
        if (typeof applyVisualEffect === 'function') {
            applyVisualEffect('flash');
        }
    }
    
    /**
     * Update user preferences based on applied recommendation
     * @param {Object} recommendation - The applied recommendation
     */
    function updateUserPreferences(recommendation) {
        // Create preference key based on recommendation type
        let preferenceKey = '';
        
        switch (recommendation.type) {
            case 'track':
                preferenceKey = `track_${recommendation.trackType}_${recommendation.patternName}`;
                break;
                
            case 'improve':
                preferenceKey = `improve_${recommendation.trackType}_${recommendation.patternName}`;
                break;
                
            case 'genre':
                preferenceKey = `genre_${recommendation.genre}`;
                break;
        }
        
        // Update preference count
        if (preferenceKey) {
            if (!recommendationState.userPreferences[preferenceKey]) {
                recommendationState.userPreferences[preferenceKey] = 0;
            }
            
            recommendationState.userPreferences[preferenceKey]++;
            
            // Save preferences
            saveUserPreferences();
        }
    }
    
    // Export functions for other modules
    window.analyzeCurrentPattern = analyzeCurrentPattern;
    window.getRecommendations = () => recommendationState.currentRecommendations;
    window.toggleRecommendations = (enabled) => {
        recommendationState.enabled = enabled !== undefined ? enabled : !recommendationState.enabled;
        
        // Update toggle button if it exists
        const toggleBtn = document.querySelector('.recommendation-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = recommendationState.enabled ? '✓' : '✗';
            toggleBtn.title = recommendationState.enabled ? 'Disable recommendations' : 'Enable recommendations';
            toggleBtn.style.color = recommendationState.enabled ? 'var(--color-green)' : 'var(--color-gray)';
        }
        
        // Save preference
        saveUserPreferences();
        
        // If enabled, analyze current pattern
        if (recommendationState.enabled) {
            analyzeCurrentPattern();
        } else {
            // Hide recommendations
            hideRecommendations();
        }
    };
});