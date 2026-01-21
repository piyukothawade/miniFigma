Mini Figma Editor – Project Documentation
1. Project Overview
Mini Figma Editor is a lightweight, browser-based visual design editor inspired by tools like Figma. It allows users to create, edit, arrange, and export basic design elements using pure HTML, CSS, and Vanilla JavaScript—without Canvas, SVG, or external frameworks.
The project focuses on DOM manipulation, event handling, state management, and UI/UX fundamentals.
________________________________________
2. Core Features (As Per Instructions)
2.1 Element Creation
•	Add Rectangle elements
•	Add Text elements (editable inline)
•	Each element maintains its own state (position, size, rotation, content)
2.2 Selection System
•	Click to select an element
•	Selected element shows:
o	Resize handles (4 corners)
o	Rotate handle
o	Outline highlight
2.3 Drag & Drop (Mouse Events)
•	Click + drag to move elements
•	Movement constrained within canvas boundaries
2.4 Resize (Mouse Events)
•	Resize from all four corners
•	Minimum size enforced
•	Resize respects canvas boundaries
2.5 Rotation (Mouse Events)
•	Rotate using a rotation handle
•	Rotation based on mouse angle from element center
•	Rotation value synced with properties panel
2.6 Properties Panel
•	Modify width
•	Modify height
•	Modify rotation (degrees)
•	Change background color
•	Edit text content (for text elements only)
2.7 Layers Panel
•	Displays all elements in stacking order
•	Click layer to select corresponding element
•	Selected layer highlighted
2.8 Layer Ordering
•	Move element Up (bring forward)
•	Move element Down (send backward)
•	Uses z-index derived from internal array order
2.9 Keyboard Interactions
•	Arrow Keys → Move selected element by 5px
•	Delete → Remove selected element
•	Keyboard actions only apply when an element is selected

2.10 Local Storage Persistence
•	Auto-save layout to localStorage
•	Design restores automatically on page refresh
2.11 Import / Export
Export JSON
•	Downloads internal layout state as .json
Import JSON
•	Load previously exported designs
Export HTML
•	Generates a standalone HTML file
•	Recreates layout using inline styles


________________________________________
3 Extra Features Implemented (Beyond Instructions)
3.1 Undo / Redo System
•	Undo & Redo buttons
•	Maintains history stacks
•	Covers move, resize, rotate, create, delete, layer changes
3.2 Copy & Paste
•	Ctrl/Cmd + C → Copy selected element
•	Ctrl/Cmd + V → Paste element
•	New element offsets position slightly
3.3 Infinite Canvas
•	Large scrollable workspace
•	Grid background for alignment
3.4 Modern UI Enhancements
•	Glassmorphism-style panels
•	Lucide icons for actions
•	Visual hover & active states
•	Canvas footer for file actions
________________________________________
4. Event Handling Overview
4.1 Mouse Events
•	mousedown → Start drag / resize / rotate
•	mousemove → Update element transform
•	mouseup → End interaction
•	Click handling ensures correct selection before interaction
4.2 Keyboard Events
•	Arrow keys for movement
•	Delete key for removal
•	Ctrl/Cmd shortcuts for copy-paste
________________________________________
________________________________________
5. Key Learnings Demonstrated
•	Advanced DOM manipulation
•	Event delegation & conflict handling
•	Geometry math (rotation & resizing)
•	Undo/Redo stack management
•	Local storage persistence
•	Clean separation of concerns
________________________________________
7. Conclusion
This project demonstrates how a Figma-like editor can be built using only core web technologies. It highlights strong fundamentals in JavaScript, UI design, and interactive systems—making it an excellent showcase project for front-end development.
