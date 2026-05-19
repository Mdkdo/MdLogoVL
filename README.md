# Logo JS Interpreter

An advanced, web-based Logo interpreter that leverages modern JavaScript syntax while maintaining the charm of classic turtle graphics.

## 🚀 Features

- **JavaScript Syntax**: Use loops (`for`, `while`, `repeat`), functions, classes, and standard operators.
- **Mathematical Coordinate System**: Origin `(0,0)` is at the center of the canvas, with positive Y increasing upwards.
- **Smooth Animation**: Fluid turtle movement using `requestAnimationFrame` (enabled via `smooth(true)`).
- **Real-Time Telemetry**: Execution Mode includes a status bar showing:
  - Mouse position (relative to center).
  - Turtle coordinates and heading.
  - Pen size and color previews.
  - Fill and background color states.
- **Advanced Path Tracking**: Robust `fill()` command that works across complex sequences of movements and shapes using `Path2D`.
- **Comprehensive Editor**: 
  - Tokenizer-based syntax highlighting with multiple themes (Light, Dark, Monokai, Solarized, Midnight).
  - Multi-level Undo/Redo (50 states) and "Select All" support.
  - Code formatting (Indent/Outdent, Comment/Uncomment).
  - File management (New, Open, Save with custom filename).
- **Dual-Layer Canvas**: Flicker-free rendering using a dedicated layer for the turtle cursor.
- **Rich Shape Library**: Support for circles, arcs, rectangles, ellipses, polygons, and stars.
- **Integrated Terminal**: Captures `console.log` output and detailed error reporting.
- **Settings & Customization**: Configure canvas background color and turtle cursor images via a dedicated modal.

## 🛠 Implementation Details

### Architecture
The application is built with a modular approach:
- `index.html`: Main structure and UI layout (Editor vs. Execution views).
- `style.css`: Unified styling with theme support and standardized control heights (38px).
- `canva.js`: The core `Turtle` class handling drawing logic, path tracking, and animation queues.
- `library.js`: User-facing API wrappers, media functions (`playsound`, `showimage`), and French color mapping.
- `syntaxe.js`: Math helpers (degree-to-radian conversions).
- `editorSyntaxe.js`: Code execution engine (`new Function`) and tokenizer-based highlighter.
- `editorUI.js`: UI event listeners, telemetry loop, and state management.
- `help.html`: Extensive documentation for both Logo commands and JavaScript language fundamentals.

### Execution Engine
User code is wrapped in a `new Function()` constructor, injecting library functions into the local scope. It supports standard JS features and translates the `^` operator to `**` for mathematical convenience.

### Path & Fill Logic
To ensure `fill()` works reliably, the engine maintains a hidden `Path2D` object. Every movement (`fd`, `setxy`) and shape (`circle`, `rect`) is recorded in this path, allowing for complex fills even when the pen is up or multiple strokes are performed.

## 📖 How to Use

1. Open `index.html` in any modern browser.
2. Write your code in the editor.
   - Example: `repeat(36, (i) => { setcolor(rgb(i*7, 100, 255)); polygon(6, 50); rt(10); });`
3. Click **Exécuter** to switch to the canvas view and start drawing.
4. Use the **Inline Command** bar in Execution Mode to interact with the turtle live.
5. Access the **?** icon for the full documentation on JS structures and Logo commands.
