/**
 * ZoundBoard - Zune-inspired Music Sequencer
 * Procedural Background Generator
 * 
 * This module creates a dynamic, slowly scrolling background
 * that complements the Zune/Metro UI aesthetic.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get the background canvas element
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) {
        console.error('Background canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Initial resize and add event listener for window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Background configuration
    const config = {
        // Zune-inspired color palette
        colors: [
            { r: 255, g: 0, b: 151, a: 0.05 },    // Magenta
            { r: 255, g: 102, b: 0, a: 0.05 },    // Orange
            { r: 51, g: 153, b: 51, a: 0.05 }     // Green
        ],
        // Background elements
        elements: [],
        // Animation speed
        scrollSpeed: 0.2,
        // Number of elements to generate
        elementCount: 15,
        // Last time animation was updated
        lastTime: 0
    };
    
    // Generate random background elements
    function generateElements() {
        config.elements = [];
        
        for (let i = 0; i < config.elementCount; i++) {
            // Randomly select element type
            const elementType = Math.random() < 0.7 ? 'rectangle' : 'circle';
            
            // Random color from palette
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            
            // Create element with random properties
            const element = {
                type: elementType,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 200 + 50,
                color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                speed: (Math.random() * 0.5 + 0.1) * config.scrollSpeed,
                direction: Math.random() > 0.5 ? 1 : -1
            };
            
            config.elements.push(element);
        }
    }
    
    // Draw a single background element
    function drawElement(element) {
        ctx.fillStyle = element.color;
        
        if (element.type === 'rectangle') {
            // Draw rectangle with rounded corners for Metro UI feel
            const radius = element.size * 0.1; // Rounded corner radius
            
            ctx.beginPath();
            ctx.moveTo(element.x + radius, element.y);
            ctx.lineTo(element.x + element.size - radius, element.y);
            ctx.quadraticCurveTo(element.x + element.size, element.y, element.x + element.size, element.y + radius);
            ctx.lineTo(element.x + element.size, element.y + element.size - radius);
            ctx.quadraticCurveTo(element.x + element.size, element.y + element.size, element.x + element.size - radius, element.y + element.size);
            ctx.lineTo(element.x + radius, element.y + element.size);
            ctx.quadraticCurveTo(element.x, element.y + element.size, element.x, element.y + element.size - radius);
            ctx.lineTo(element.x, element.y + radius);
            ctx.quadraticCurveTo(element.x, element.y, element.x + radius, element.y);
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw circle
            ctx.beginPath();
            ctx.arc(element.x + element.size / 2, element.y + element.size / 2, element.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Update element positions for animation
    function updateElements(deltaTime) {
        config.elements.forEach(element => {
            // Move element vertically
            element.y += element.speed * element.direction * deltaTime;
            
            // Wrap around when off screen
            if (element.direction > 0 && element.y > canvas.height) {
                element.y = -element.size;
                element.x = Math.random() * canvas.width;
            } else if (element.direction < 0 && element.y + element.size < 0) {
                element.y = canvas.height;
                element.x = Math.random() * canvas.width;
            }
        });
    }
    
    // Draw the entire background
    function drawBackground(timestamp) {
        // Calculate delta time for smooth animation
        if (!config.lastTime) config.lastTime = timestamp;
        const deltaTime = timestamp - config.lastTime;
        config.lastTime = timestamp;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw elements
        updateElements(deltaTime / 16); // Normalize to ~60fps
        config.elements.forEach(drawElement);
        
        // Continue animation loop
        requestAnimationFrame(drawBackground);
    }
    
    // Add subtle text legibility enhancement
    function enhanceTextLegibility() {
        // Add a subtle shadow to the app container for better text contrast
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
        }
        
        // Add a subtle background to text elements that might need it
        const textElements = document.querySelectorAll('h1, h2, h3, p, button, .track-label');
        textElements.forEach(el => {
            // Only add if not already styled
            if (!el.style.textShadow) {
                el.style.textShadow = '0 1px 1px rgba(0, 0, 0, 0.2)';
            }
        });
    }
    
    // Initialize and start background animation
    function initBackground() {
        generateElements();
        enhanceTextLegibility();
        requestAnimationFrame(drawBackground);
        
        // Regenerate elements periodically for variety
        setInterval(() => {
            // Only regenerate a few elements at a time for subtle change
            const elementsToRegenerate = Math.floor(config.elementCount * 0.2);
            for (let i = 0; i < elementsToRegenerate; i++) {
                const index = Math.floor(Math.random() * config.elements.length);
                
                // Random color from palette
                const color = config.colors[Math.floor(Math.random() * config.colors.length)];
                
                // Update element properties
                config.elements[index].color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
                config.elements[index].size = Math.random() * 200 + 50;
                config.elements[index].speed = (Math.random() * 0.5 + 0.1) * config.scrollSpeed;
                config.elements[index].direction = Math.random() > 0.5 ? 1 : -1;
            }
        }, 30000); // Every 30 seconds
    }
    
    // Start the background animation
    initBackground();
    
    // Adjust background opacity based on user interaction
    // This helps ensure text remains legible when user is actively using the app
    document.addEventListener('mousemove', () => {
        canvas.style.opacity = '0.1';
        
        // Restore normal opacity after a delay
        clearTimeout(window.backgroundOpacityTimeout);
        window.backgroundOpacityTimeout = setTimeout(() => {
            canvas.style.opacity = '0.15';
        }, 2000);
    });
    
    // Reduce background animation when audio is playing to avoid distraction
    if (typeof window.startSequencer === 'function') {
        const originalStartSequencer = window.startSequencer;
        window.startSequencer = function() {
            // Slow down background animation when playing
            config.scrollSpeed = 0.1;
            config.elements.forEach(element => {
                element.speed = (element.speed / 0.2) * config.scrollSpeed;
            });
            
            // Call original function
            originalStartSequencer.apply(this, arguments);
        };
        
        const originalStopSequencer = window.stopSequencer;
        window.stopSequencer = function() {
            // Restore normal background animation when stopped
            config.scrollSpeed = 0.2;
            config.elements.forEach(element => {
                element.speed = (element.speed / 0.1) * config.scrollSpeed;
            });
            
            // Call original function
            originalStopSequencer.apply(this, arguments);
        };
    }
    
    // Adjust background for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        config.scrollSpeed = 0.05;
        config.elements.forEach(element => {
            element.speed = (Math.random() * 0.2 + 0.05) * config.scrollSpeed;
        });
    }
});