/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * Theme Management
 * Implements OLED optimization and high-contrast themes
 */

// Theme constants
const THEMES = {
    STANDARD: 'standard',
    OLED: 'oled',
    HIGH_CONTRAST: 'high-contrast'
};

// Initialize theme management
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});

/**
 * Initialize theme system
 * Sets up theme based on saved preferences or system settings
 */
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('zoundboard-theme');
    
    // Apply saved theme or detect system preference
    if (savedTheme === THEMES.OLED) {
        applyTheme(THEMES.OLED);
    } else if (savedTheme === THEMES.HIGH_CONTRAST) {
        applyTheme(THEMES.HIGH_CONTRAST);
    } else {
        // Check system preference for dark mode
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            applyTheme(THEMES.STANDARD);
            body.classList.add('high-contrast-theme');
        } else {
            applyTheme(THEMES.STANDARD);
        }
    }
    
    // Set up theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        
        // Update button state based on current theme
        updateThemeToggleState();
    }
    
    // Listen for system theme changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (darkModeMediaQuery.addListener) {
        // Fallback for older browsers
        darkModeMediaQuery.addListener(handleSystemThemeChange);
    }
}

/**
 * Apply a specific theme
 * @param {string} theme - The theme to apply
 */
function applyTheme(theme) {
    const body = document.body;
    
    // Remove all theme classes first
    body.classList.remove('oled-theme', 'high-contrast-theme');
    
    // Apply the requested theme
    switch (theme) {
        case THEMES.OLED:
            body.classList.add('oled-theme');
            break;
        case THEMES.HIGH_CONTRAST:
            body.classList.add('high-contrast-theme');
            break;
        case THEMES.STANDARD:
        default:
            // Standard theme has no additional classes
            break;
    }
    
    // Save the theme preference
    localStorage.setItem('zoundboard-theme', theme);
    
    // Update UI to reflect theme change
    updateThemeToggleState();
    
    // Show feedback if animation system is available
    if (window.ZoundBoardAnimations && window.ZoundBoardAnimations.showMetroFeedback) {
        let message;
        switch (theme) {
            case THEMES.OLED:
                message = 'OLED theme activated';
                break;
            case THEMES.HIGH_CONTRAST:
                message = 'High contrast theme activated';
                break;
            default:
                message = 'Standard theme activated';
        }
        window.ZoundBoardAnimations.showMetroFeedback(message, 'info');
    }
    
    // Dispatch theme change event
    const event = new CustomEvent('zoundboard:themechange', { detail: { theme } });
    document.dispatchEvent(event);
}

/**
 * Toggle between themes
 * Cycles through available themes: Standard -> OLED -> High Contrast
 */
function toggleTheme() {
    const body = document.body;
    let nextTheme;
    
    if (body.classList.contains('oled-theme')) {
        nextTheme = THEMES.HIGH_CONTRAST;
    } else if (body.classList.contains('high-contrast-theme')) {
        nextTheme = THEMES.STANDARD;
    } else {
        nextTheme = THEMES.OLED;
    }
    
    applyTheme(nextTheme);
}

/**
 * Update theme toggle button state
 * Updates the visual state of the theme toggle button
 */
function updateThemeToggleState() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const body = document.body;
    const themeText = themeToggle.querySelector('span');
    
    if (body.classList.contains('oled-theme')) {
        themeToggle.classList.add('active');
        themeToggle.setAttribute('aria-pressed', 'true');
        if (themeText) themeText.textContent = 'oled';
    } else if (body.classList.contains('high-contrast-theme')) {
        themeToggle.classList.add('active');
        themeToggle.setAttribute('aria-pressed', 'true');
        if (themeText) themeText.textContent = 'contrast';
    } else {
        themeToggle.classList.remove('active');
        themeToggle.setAttribute('aria-pressed', 'false');
        if (themeText) themeText.textContent = 'theme';
    }
}

/**
 * Handle system theme change
 * Responds to changes in system dark mode preference
 * @param {MediaQueryListEvent} event - Media query change event
 */
function handleSystemThemeChange(event) {
    // Only apply system theme if no user preference is saved
    const savedTheme = localStorage.getItem('zoundboard-theme');
    if (!savedTheme) {
        if (event.matches) {
            // System switched to dark mode
            document.body.classList.add('high-contrast-theme');
        } else {
            // System switched to light mode
            document.body.classList.remove('high-contrast-theme');
        }
        updateThemeToggleState();
    }
}

// Export theme functions for use in other modules
window.ZoundBoardTheme = {
    applyTheme,
    toggleTheme,
    THEMES
};