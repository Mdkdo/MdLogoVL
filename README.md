# Logo VL Advanced

An advanced, web-based Logo interpreter that features a custom French-Logo dialect while maintaining compatibility with classic turtle graphics. It leverages a modern transpiler to convert Logo syntax into optimized JavaScript.

## 🚀 Features

- **Logo Dialect**: Use traditional Logo commands (`AV`, `TD`, `REPETE`) and French keywords (`DONNE`, `SI`, `POUR`).
- **Parentheses-Free Syntax**: Commands and user-defined procedures can be called without parentheses (e.g., `AV 100`, `CARRE 50`).
- **Modern Extensions**: Supports modern operators (`+=`, `++`, `^`), standard quoted strings (`"texte"`), and object-oriented programming via `CLASSE`.
- **Smart Editor**:
  - **Auto-Uppercase**: Automatically converts recognized keywords and commands to uppercase after typing a space.
  - **Line Numbers**: Dynamic line numbering with vertical scroll synchronization.
  - **Syntax Highlighting**: Case-insensitive highlighting for commands, variables, and comments.
  - **Integrated Terminal**: Displays output from `ECRIS` and provides detailed error reporting with line numbers.
- **Mathematical Coordinate System**: Origin `(0,0)` is at the center of the canvas, with positive Y increasing upwards.
- **Rich Shape Library**: Support for circles, arcs, rectangles, ellipses, polygons, and stars.
- **Real-Time Telemetry**: Execution Mode includes a status bar showing turtle position, heading, pen state, and colors.
- **Dual-Layer Canvas**: Flicker-free rendering using a dedicated layer for the turtle cursor.

## 🛠 Implementation Details

### Architecture
- `index.html`: Main structure and UI layout.
- `style.css`: Unified styling with theme support.
- `canva.js`: Core `Turtle` class handling drawing logic and path tracking.
- `library.js`: Centralized API for turtle commands, aliases (FR/EN), and mathematical functions.
- `editor.js`: The powerhouse containing the Logo-to-JS transpiler, editor UI logic, and syntax highlighting.

### Execution Engine
The engine uses a recursive, arity-aware parser that identifies commands and consumes the correct number of arguments. It supports:
- **Nested Commands**: `AV SIN 90` transpiles to `AV(sin(90));`.
- **Optional Separators**: Commas can be used to disambiguate negative numbers, e.g., `FPOS 10, -20`.
- **Procedural Logic**: `POUR` definitions are pre-scanned to support user-defined arity.

## 📖 How to Use

1. Open `index.html` in any modern browser.
2. Write your code in the editor.
   - Example:
     ```logo
     POUR SPIRALE :n
       REPETE :n [
         AV (_i0 * 2)
         TD 91
       ]
     FIN
     SPIRALE 50
     ```
3. Click **Exécuter** to switch to the canvas view and start drawing.
4. Use the **Inline Command** bar in Execution Mode to interact with the turtle live.
5. Access the **?** icon for the full documentation on Logo commands and structures.
