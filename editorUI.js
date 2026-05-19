document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const canvas = document.getElementById('turtleCanvas');
    const turtleLayer = document.getElementById('turtleLayer');
    
    // Resize function
    function resizeCanvas() {
        const container = canvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;
        canvas.width = w * 0.95;
        canvas.height = h * 0.95;
        turtleLayer.width = w * 0.95;
        turtleLayer.height = h * 0.95;
        if (turtle) {
            turtle.originX = canvas.width / 2;
            turtle.originY = canvas.height / 2;
            turtle.draw();
        }
    }

    // Initialize turtle
    turtle = new Turtle(canvas, turtleLayer);
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking on canvas
    const mousePosSpan = document.getElementById('mouse-pos');
    [canvas, turtleLayer].forEach(c => {
        c.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left - (canvas.width / 2));
            const y = Math.round((canvas.height / 2) - (e.clientY - rect.top));
            mousePosSpan.textContent = `${x}, ${y}`;
        });
    });

    // Real-time status update
    function updateStatus() {
        if (!turtle) return;
        document.getElementById('turtle-pos').textContent = `${Math.round(turtle.x)}, ${Math.round(turtle.y)}`;
        document.getElementById('turtle-angle').textContent = `${Math.round(turtle.heading())}°`;
        document.getElementById('pen-size').textContent = turtle.width;
        
        const pColor = turtle.color;
        document.getElementById('pen-color').textContent = typeof pColor === 'string' ? pColor : 'Gradient';
        document.getElementById('pen-color-preview').style.backgroundColor = typeof pColor === 'string' ? pColor : 'transparent';
        
        const fColor = turtle.fillColor;
        document.getElementById('fill-color-status').textContent = fColor;
        document.getElementById('fill-color-preview').style.backgroundColor = fColor;
        
        const bColor = getComputedStyle(canvas).backgroundColor;
        document.getElementById('bg-color-status').textContent = bColor;
        document.getElementById('bg-color-preview-status').style.backgroundColor = bColor;
        
        requestAnimationFrame(updateStatus);
    }
    updateStatus();
    
    // Initial resize after mode switch or load
    setTimeout(resizeCanvas, 100);
    
    const codeEditor = document.getElementById('codeEditor');
    const terminalOutput = document.getElementById('terminalOutput');
    const terminalSection = document.getElementById('terminal-section');
    
    // Theme logic
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.addEventListener('change', (e) => {
        document.body.className = e.target.value;
        saveSettings();
    });

    // View Switching
    const runBtnTop = document.getElementById('runBtnTop');
    const backToEditorBtn = document.getElementById('backToEditorBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close-modal');

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    const bgColorPicker = document.getElementById('bg-color-picker');
    const turtleImgSelect = document.getElementById('turtle-img-select');

    bgColorPicker.addEventListener('input', (e) => {
        canvas.style.backgroundColor = e.target.value;
        saveSettings();
    });

    turtleImgSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'default') {
            turtle.setTurtleImage(null);
        } else {
            turtle.setTurtleImage(val);
        }
        saveSettings();
    });

    function saveSettings() {
        const settings = {
            theme: themeSelect.value,
            bgColor: bgColorPicker.value,
            turtleImg: turtleImgSelect.value
        };
        localStorage.setItem('logoJsSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('logoJsSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            // Apply Theme
            themeSelect.value = settings.theme || 'theme-light';
            document.body.className = themeSelect.value;

            // Apply BG Color
            bgColorPicker.value = settings.bgColor || '#ffffff';
            canvas.style.backgroundColor = bgColorPicker.value;

            // Apply Turtle Img
            turtleImgSelect.value = settings.turtleImg || 'default';
            if (turtleImgSelect.value === 'default') {
                turtle.setTurtleImage(null);
            } else {
                turtle.setTurtleImage(turtleImgSelect.value);
            }
        }
    }

    // Load settings after turtle is initialized
    loadSettings();

    runBtnTop.addEventListener('click', () => {
        app.className = 'mode-execution';
        resizeCanvas();
        runCode();
    });

    backToEditorBtn.addEventListener('click', () => {
        app.className = 'mode-editor';
        turtle.stop();
    });

    // Toolbar Buttons
    const newFileBtn = document.getElementById('newFileBtn');
    const openFileBtn = document.getElementById('openFileBtn');
    const saveFileBtn = document.getElementById('saveFileBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const copyBtn = document.getElementById('copyBtn');
    const cutBtn = document.getElementById('cutBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const commentBtn = document.getElementById('commentBtn');
    const indentBtn = document.getElementById('indentBtn');
    const unindentBtn = document.getElementById('unindentBtn');

    // Terminal logic
    const toggleTerminalBtn = document.getElementById('toggleTerminalBtn');
    const clearTerminalBtn = document.getElementById('clearTerminalBtn');
    const showTerminalBtn = document.getElementById('showTerminalBtn');
    
    toggleTerminalBtn.addEventListener('click', () => {
        terminalSection.classList.add('hidden');
        showTerminalBtn.classList.remove('hidden');
    });

    showTerminalBtn.addEventListener('click', () => {
        terminalSection.classList.remove('hidden');
        showTerminalBtn.classList.add('hidden');
    });

    clearTerminalBtn.addEventListener('click', () => {
        terminalOutput.innerHTML = '';
    });

    // Stop execution
    const stopBtn = document.getElementById('stopBtn');
    stopBtn.addEventListener('click', () => {
        turtle.stop();
    });

    // Inline Command
    const inlineCmdInput = document.getElementById('inlineCmdInput');
    const runInlineBtn = document.getElementById('runInlineBtn');

    function runInline() {
        const cmd = inlineCmdInput.value;
        if (cmd.trim()) {
            executeSnippet(cmd);
            inlineCmdInput.value = '';
        }
    }

    runInlineBtn.addEventListener('click', runInline);
    inlineCmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runInline();
    });

    // Undo/Redo Logic
    let undoStack = [codeEditor.value];
    let redoStack = [];
    const MAX_STACK = 50;

    function saveState() {
        const currentCode = codeEditor.value;
        if (undoStack[undoStack.length - 1] !== currentCode) {
            undoStack.push(currentCode);
            if (undoStack.length > MAX_STACK) undoStack.shift();
            redoStack = [];
        }
    }

    codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') saveState();
    });
    codeEditor.addEventListener('blur', saveState);

    // File Actions
    newFileBtn.addEventListener('click', () => {
        if (confirm('Nouveau fichier ?')) {
            codeEditor.value = '';
            updateHighlight();
            turtle.reset();
        }
    });

    openFileBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                codeEditor.value = ev.target.result;
                updateHighlight();
            };
            reader.readAsText(file);
        };
        input.click();
    });

    saveFileBtn.addEventListener('click', () => {
        let filename = prompt('Nom du fichier (ex: dessin.js) :', 'code.js');
        if (!filename) return;
        if (!filename.endsWith('.js')) filename += '.js';

        const blob = new Blob([codeEditor.value], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    });

    // Edit Actions
    undoBtn.addEventListener('click', () => {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            codeEditor.value = undoStack[undoStack.length - 1];
            updateHighlight();
        }
    });
    
    redoBtn.addEventListener('click', () => {
        if (redoStack.length > 0) {
            const state = redoStack.pop();
            undoStack.push(state);
            codeEditor.value = state;
            updateHighlight();
        }
    });

    selectAllBtn.addEventListener('click', () => {
        codeEditor.select();
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeEditor.value.substring(codeEditor.selectionStart, codeEditor.selectionEnd));
    });

    cutBtn.addEventListener('click', () => {
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const text = codeEditor.value;
        const selected = text.substring(start, end);
        if (selected) {
            navigator.clipboard.writeText(selected);
            saveState();
            codeEditor.value = text.substring(0, start) + text.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start;
            updateHighlight();
        }
    });

    pasteBtn.addEventListener('click', async () => {
        const text = await navigator.clipboard.readText();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const current = codeEditor.value;
        saveState();
        codeEditor.value = current.substring(0, start) + text + current.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + text.length;
        updateHighlight();
    });

    // Indent/Comment
    function modifySelection(fn) {
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const text = codeEditor.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);
        
        const lines = selection.split('\n');
        const newSelection = lines.map(fn).join('\n');
        
        saveState();
        codeEditor.value = before + newSelection + after;
        codeEditor.selectionStart = start;
        codeEditor.selectionEnd = start + newSelection.length;
        updateHighlight();
    }

    commentBtn.addEventListener('click', () => {
        modifySelection(line => line.trim().startsWith('//') ? line.replace('// ', '').replace('//', '') : '// ' + line);
    });

    indentBtn.addEventListener('click', () => {
        modifySelection(line => '  ' + line);
    });

    unindentBtn.addEventListener('click', () => {
        modifySelection(line => line.replace(/^  ?/, ''));
    });

    // Examples
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            codeEditor.value = btn.getAttribute('data-code');
            updateHighlight();
        });
    });

    codeEditor.addEventListener('input', updateHighlight);
    codeEditor.addEventListener('scroll', syncScroll);

    updateHighlight();
});
