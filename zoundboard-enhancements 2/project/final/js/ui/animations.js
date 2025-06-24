/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * UI Animations and Interactions
 * Enhanced with Metro UI animation principles
 */

// Metro UI animation constants
const METRO_ANIMATION = {
    EASING: 'cubic-bezier(0.1, 0.9, 0.2, 1)', // Metro UI signature easing
    DURATION: {
        FAST: 200,
        MEDIUM: 300,
        SLOW: 500
    }
};

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    setupInteractionAnimations();
    setupScrollAnimations();
    setupButtonAnimations();
    setupGridCellAnimations();
    setupRippleEffect();
});

/**
 * Initialize entrance animations with staggered timing
 * Following Metro UI's "content before chrome" principle
 */
function initializeAnimations() {
    // Staggered entrance for sequencer grid cells
    const gridCells = document.querySelectorAll('.grid-cell');
    if (gridCells.length) {
        gridCells.forEach((cell, index) => {
            const delay = 10 + (index * 5); // Staggered delay
            cell.style.animationDelay = `${delay}ms`;
            cell.classList.add('fade-in');
        });
    }

    // Apply Metro UI panoramic entrance animation
    const panoramicElements = document.querySelectorAll('.panoramic-container > *');
    if (panoramicElements.length) {
        panoramicElements.forEach((element, index) => {
            const delay = 100 + (index * 50); // More pronounced staggering for panoramic elements
            element.style.animationDelay = `${delay}ms`;
            element.classList.add('metro-page-transition');
        });
    }
}

/**
 * Setup hover and interaction animations for UI elements
 * Following Metro UI's fluid interaction principles
 */
function setupInteractionAnimations() {
    // Track label hover animations
    const trackLabels = document.querySelectorAll('.track-label');
    if (trackLabels.length) {
        trackLabels.forEach(label => {
            label.addEventListener('mouseenter', () => {
                label.style.transition = `color 0.2s ${METRO_ANIMATION.EASING}, transform 0.2s ${METRO_ANIMATION.EASING}`;
            });
        });
    }

    // Waveform container hover effect
    const waveformContainer = document.querySelector('.waveform-container');
    if (waveformContainer) {
        waveformContainer.addEventListener('mouseenter', () => {
            waveformContainer.style.transition = `transform 0.3s ${METRO_ANIMATION.EASING}, box-shadow 0.3s ${METRO_ANIMATION.EASING}`;
        });
    }

    // Metro UI tile hover effects
    const metroTiles = document.querySelectorAll('.metro-tile');
    if (metroTiles.length) {
        metroTiles.forEach(tile => {
            tile.addEventListener('mouseenter', () => {
                tile.style.transition = `transform 0.3s ${METRO_ANIMATION.EASING}, box-shadow 0.3s ${METRO_ANIMATION.EASING}`;
            });
        });
    }
}

/**
 * Setup scroll-triggered animations
 * Especially useful for mobile views with Metro UI principles
 */
function setupScrollAnimations() {
    // Only setup if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe staggered items
        const staggeredItems = document.querySelectorAll('.staggered-item');
        if (staggeredItems.length) {
            staggeredItems.forEach(item => {
                observer.observe(item);
            });
        }
    }
}

/**
 * Setup button animations for play/pause, randomize, and clear buttons
 * Enhanced with Metro UI fluid animations
 */
function setupButtonAnimations() {
    // Play/Pause button animation
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            playPauseBtn.classList.toggle('playing');
            
            // Metro UI style animation feedback
            if (playPauseBtn.classList.contains('playing')) {
                animateElement(playPauseBtn, 'playingPulse');
            } else {
                playPauseBtn.style.animation = '';
            }
        });
    }

    // Randomize button animation
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn) {
        randomizeBtn.addEventListener('click', () => {
            randomizeBtn.classList.add('animating');
            
            // Metro UI style animation for icon
            const icon = randomizeBtn.querySelector('.icon');
            if (icon) {
                animateElement(icon, 'spin');
                
                // Show "genius" feedback in Metro UI style
                showMetroFeedback('Patterns generated', 'success');
            }
            
            setTimeout(() => {
                randomizeBtn.classList.remove('animating');
            }, METRO_ANIMATION.DURATION.MEDIUM);
        });
    }

    // Clear button animation
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearBtn.classList.add('animating');
            
            // Metro UI style animation
            animateElement(clearBtn, 'clearFlash');
            
            // Show "cleared" feedback in Metro UI style
            showMetroFeedback('Pattern cleared', 'info');
            
            setTimeout(() => {
                clearBtn.classList.remove('animating');
            }, METRO_ANIMATION.DURATION.MEDIUM);
        });
    }

    // Visualization mode button animation
    const vizModeBtn = document.querySelector('.btn-viz-mode');
    if (vizModeBtn) {
        vizModeBtn.addEventListener('click', () => {
            vizModeBtn.classList.add('animating');
            
            setTimeout(() => {
                vizModeBtn.classList.remove('animating');
            }, METRO_ANIMATION.DURATION.MEDIUM);
        });
    }
}

/**
 * Setup grid cell animations for click and activation
 * Enhanced with Metro UI fluid animations
 */
function setupGridCellAnimations() {
    const gridCells = document.querySelectorAll('.grid-cell');
    if (gridCells.length) {
        gridCells.forEach(cell => {
            cell.addEventListener('click', () => {
                // Toggle active state
                cell.classList.toggle('active');
                
                // Apply Metro UI animation
                if (cell.classList.contains('active')) {
                    animateElement(cell, 'activateCell');
                }
            });
        });
    }

    // Use MutationObserver to watch for class changes (for programmatic activation)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const cell = mutation.target;
                if (cell.classList.contains('active') && !cell.dataset.animated) {
                    cell.dataset.animated = 'true';
                    animateElement(cell, 'activateCell');
                    
                    // Reset the animated flag after animation completes
                    setTimeout(() => {
                        delete cell.dataset.animated;
                    }, METRO_ANIMATION.DURATION.MEDIUM);
                }
            }
        });
    });

    // Observe all grid cells for class changes
    gridCells.forEach(cell => {
        observer.observe(cell, { attributes: true });
    });
}

/**
 * Setup ripple effect for buttons and interactive elements
 * Following Metro UI's subtle interaction feedback
 */
function setupRippleEffect() {
    const buttons = document.querySelectorAll('.btn');
    if (buttons.length) {
        buttons.forEach(button => {
            button.addEventListener('click', createRippleEffect);
        });
    }

    // Add ripple effect to other interactive elements
    const interactiveElements = document.querySelectorAll('.metro-tile, .track-label');
    if (interactiveElements.length) {
        interactiveElements.forEach(element => {
            element.addEventListener('click', createRippleEffect);
        });
    }
}

/**
 * Create ripple effect on click
 * Metro UI style subtle feedback
 */
function createRippleEffect(event) {
    const button = event.currentTarget;
    
    // Only proceed if the element doesn't already have a ripple
    if (button.querySelector('.ripple')) return;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    // Position the ripple
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    
    // Add animation class
    ripple.classList.add('ripple-active');
    
    // Remove ripple after animation completes
    setTimeout(() => {
        if (ripple && ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600); // Slightly longer than animation duration
}

/**
 * Show Metro UI style feedback notification
 * @param {string} message - The message to display
 * @param {string} type - The type of feedback (success, info, warning, error)
 */
function showMetroFeedback(message, type = 'info') {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.classList.add('metro-feedback', `metro-feedback-${type}`);
    feedback.textContent = message;
    
    // Add to document
    document.body.appendChild(feedback);
    
    // Trigger animation
    setTimeout(() => {
        feedback.classList.add('active');
        
        // Remove after animation
        setTimeout(() => {
            feedback.classList.remove('active');
            
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }, 10);
}

/**
 * Animate an element with a specific animation
 * @param {HTMLElement} element - The element to animate
 * @param {string} animationName - The name of the animation
 * @param {number} duration - The duration of the animation in ms
 */
function animateElement(element, animationName, duration = METRO_ANIMATION.DURATION.MEDIUM) {
    if (!element) return;
    
    // Set animation with Metro UI easing
    element.style.animation = `${animationName} ${duration}ms ${METRO_ANIMATION.EASING}`;
    
    // Remove animation after it completes
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

/**
 * Pulse an element with Metro UI animation
 * @param {HTMLElement} element - The element to pulse
 */
function pulseElement(element) {
    animateElement(element, 'pulse', METRO_ANIMATION.DURATION.FAST);
}

/**
 * Flash an element with Metro UI animation
 * @param {HTMLElement} element - The element to flash
 */
function flashElement(element) {
    animateElement(element, 'flash', METRO_ANIMATION.DURATION.FAST);
}

/**
 * Shake an element with Metro UI animation
 * @param {HTMLElement} element - The element to shake
 */
function shakeElement(element) {
    animateElement(element, 'shake', METRO_ANIMATION.DURATION.MEDIUM);
}

/**
 * Apply Metro UI tile update animation
 * @param {HTMLElement} element - The tile element to animate
 */
function animateTileUpdate(element) {
    animateElement(element, 'tileUpdate', METRO_ANIMATION.DURATION.MEDIUM);
}

/**
 * Apply Metro UI panorama transition
 * @param {HTMLElement} container - The panorama container
 * @param {number} index - The index to scroll to
 */
function animatePanoramaTransition(container, index) {
    if (!container) return;
    
    const items = container.children;
    if (!items.length || index >= items.length) return;
    
    // Calculate scroll position
    const itemWidth = items[0].offsetWidth;
    const scrollPosition = index * itemWidth;
    
    // Animate scroll with Metro UI easing
    container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
}

// Export animation functions for use in other modules
window.ZoundBoardAnimations = {
    animateElement,
    pulseElement,
    flashElement,
    shakeElement,
    animateTileUpdate,
    animatePanoramaTransition,
    showMetroFeedback
};