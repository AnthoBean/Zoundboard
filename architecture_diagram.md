# ZoundBoard Architecture Diagram

## Application Structure

```
+-------------------------------------+
|            ZoundBoard               |
+-------------------------------------+
                  |
        +---------+---------+
        |         |         |
+-------v---+ +---v-----+ +-v--------+
|   UI      | |  Audio  | |Visualizer|
|  Layer    | |  Engine | |  Layer   |
+-------+---+ +---+-----+ +----+-----+
        |         |            |
        v         v            v
+-------+---+ +---+-----+ +----+-----+
| User      | | Sound    | | Canvas   |
| Interface | | Processing| | Rendering|
+-----------+ +-----------+ +----------+
```

## Component Interaction Flow

```
+----------------+    Triggers    +----------------+    Provides Data    +----------------+
|                |  ---------->   |                |  --------------->   |                |
|  UI Layer      |                |  Audio Engine  |                     |  Visualizer    |
|  (ui.js)       |  <----------   |  (sequencer.js)|  <---------------   |  (visualizer.js)|
|                |  Updates UI    |                |  Renders Audio      |                |
+----------------+                +----------------+                     +----------------+
       ^                                  ^                                     ^
       |                                  |                                     |
       v                                  v                                     v
+----------------+                +----------------+                    +----------------+
|                |                |                |                    |                |
| DOM Elements   |                | Web Audio API  |                    | Canvas API     |
| Event Handlers |                | Audio Nodes    |                    | Drawing Context|
|                |                |                |                    |                |
+----------------+                +----------------+                    +----------------+
```

## Data Flow Diagram

```
+---------------+     +---------------+     +---------------+
| User Input    |     | Audio Data    |     | Visual Output |
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                     |
        v                     v                     v
+-------+-------+     +-------+-------+     +-------+-------+
| UI Events     |     | Sound Samples |     | Canvas        |
| - Grid clicks |     | - Buffers     |     | - Waveform    |
| - Button      |     | - Synthesized |     | - Bars        |
|   presses     |     |   sounds      |     | - Circles     |
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                     |
        v                     v                     v
+-------+-------+     +-------+-------+     +-------+-------+
| UI Controller |     | Audio Engine  |     | Visualizer    |
| - Grid state  |     | - Playback    |     | - Animation   |
| - Controls    |     | - Effects     |     | - Rendering   |
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                     |
        +----------+---------+----------+-----------+
                   |                    |
                   v                    v
           +-------+-------+    +-------+-------+
           | Sequencer     |    | Audio         |
           | - Timing      |    | - Processing  |
           | - Patterns    |    | - Effects     |
           +---------------+    +---------------+
```

## Core Functionality Issues

### Clear Button Implementation Issue

```
+-------------------+     Missing     +-------------------+
| Clear Button      | - - - - - - - > | clearPattern()    |
| (Not in HTML)     |   Connection    | Function in ui.js |
+-------------------+                 +-------------------+
         |                                      |
         |                                      |
         v                                      v
+-------------------+                  +-------------------+
| Keyboard Shortcut |                  | Grid Cell State   |
| (Key 'c')         | ----------------> | Management       |
+-------------------+                  +-------------------+
```

### Visualizer Implementation Issues

```
+-------------------+     Potential    +-------------------+
| Audio Context     | - - - - - - - -> | Visualizer        |
| Initialization    |  Timing Issue    | Initialization    |
+-------------------+                  +-------------------+
         |                                      |
         v                                      v
+-------------------+     Missing     +-------------------+
| Analyzer Node     | - - - - - - - > | Canvas Drawing    |
| Connection        |   Audio Data    | Functions         |
+-------------------+                  +-------------------+
         |                                      |
         v                                      v
+-------------------+     Separate    +-------------------+
| Active            | - - - - - - - > | Default           |
| Visualizations    | Implementations | Visualizations    |
+-------------------+                  +-------------------+
```

## File Structure vs. Intended Structure

### Current Structure
```
./
├── index.html          # Redirect file
├── sequencer.js        # Audio engine
├── ui.js               # UI interactions
├── visualizer.js       # Visualization
└── style.css           # Styling
```

### Intended Structure
```
zoundboard/
├── assets/
│   ├── sounds/         # Sound samples
│   ├── images/         # UI elements
│   └── fonts/          # Typography
├── css/
│   ├── main.css        # Core styles
│   ├── responsive.css  # Responsive design
│   └── animations.css  # Animations
├── js/
│   ├── core/           # Core functionality
│   ├── ui/             # UI functionality
│   ├── effects/        # Audio effects
│   └── ai/             # AI recommendations
├── lib/                # Third-party libraries
└── index.html          # Main application
```