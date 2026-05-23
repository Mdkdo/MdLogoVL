(function(global) {
    global.updateLineNumbers = function() {
        const el = document.getElementById('codeEditor');
        const ln = document.getElementById('line-numbers');
        if (el && ln) ln.innerHTML = el.value.split('\n').map((_, i) => i + 1).join('<br>') + '<br>';
    };

    global.updateHighlight = function() {
        const el = document.getElementById('codeEditor');
        const hl = document.getElementById('highlighting-content');
        if (!el || !hl) return;
        global.updateLineNumbers();
        let code = el.value;
        const keywords = global.LOGO_KEYWORDS || [];
        const commands = global.LOGO_COMMANDS || [];
        const combinedRegex = new RegExp('(\\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)|' + '("(?:[^"\\\\\\n]|\\.)*"|\'(?:[^\'\\\\\\n]|\\.)*\'|`(?:[^\\\\`]|\\.)*`)|' + '(\\b\\d+(?:\\.\\d+)?\\b)|' + '(:[a-zA-Z0-9_$\u00C0-\u00FF]+)|' + '([^a-zA-Z0-9_\u00C0-\u00FF]|^)(' + keywords.join('|') + ')(?![a-zA-Z0-9_\u00C0-\u00FF])|' + '([^a-zA-Z0-9_\u00C0-\u00FF]|^)(' + commands.join('|') + ')(?![a-zA-Z0-9_\u00C0-\u00FF])|' + '([\\+\\-\\*/\\(\\),\\;\\(\\)\\[\\]\\{\\}\\.])|' + '([a-zA-Z_$\u00C0-\u00FF][a-zA-Z0-9_$\u00C0-\u00FF]*)', 'gi');
        let res = ''; let last = 0;
        code.replace(combinedRegex, (match, com, str, num, v, kp, kw, cp, cmd, op, unk, off) => {
            res += code.substring(last, off).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (com) res += `<span class="hl-comment">${com.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            else if (str) res += `<span class="hl-string">${str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            else if (num) res += `<span class="hl-number">${num}</span>`;
            else if (v) res += `<span class="hl-variable">${v}</span>`;
            else if (kw) { res += kp; res += `<span class="hl-keyword">${kw.toUpperCase()}</span>`; }
            else if (cmd) { res += cp; res += `<span class="hl-command">${cmd.toUpperCase()}</span>`; }
            else if (op) res += `<span class="hl-operator">${op.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            else if (unk) {
                const procSearch = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
                const ups = []; const prRegex = /\bpour\s+([a-zA-Z0-9_$\u00C0-\u00FF]+)/gi; let m;
                while ((m = prRegex.exec(procSearch)) !== null) ups.push(m[1].toUpperCase());
                if (ups.includes(unk.toUpperCase())) res += `<span class="hl-userproc">${unk}</span>`;
                else res += `<span class="hl-unknown">${unk}</span>`;
            }
            last = off + match.length; return match;
        });
        hl.innerHTML = res + code.substring(last).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + (code.endsWith('\n') ? ' ' : '');
    };

    global.syncScroll = function() {
        const el = document.getElementById('codeEditor');
        const hl = document.getElementById('highlighting');
        const ln = document.getElementById('line-numbers');
        if (el && hl) { hl.scrollTop = el.scrollTop; hl.scrollLeft = el.scrollLeft; if (ln) ln.scrollTop = el.scrollTop; }
    };
})(window);

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const canvas = document.getElementById('turtleCanvas');
    const turtleLayer = document.getElementById('turtleLayer');
    function resizeCanvas() {
        const container = canvas.parentElement; const w = container.clientWidth; const h = container.clientHeight;
        canvas.width = w * 0.95; canvas.height = h * 0.95; turtleLayer.width = w * 0.95; turtleLayer.height = h * 0.95;
        if (window.turtle) { window.turtle.originX = canvas.width / 2; window.turtle.originY = canvas.height / 2; window.turtle.draw(); }
    }
    window.turtle = new Turtle(canvas, turtleLayer); window.addEventListener('resize', resizeCanvas);
    const mousePosSpan = document.getElementById('mouse-pos');
    [canvas, turtleLayer].forEach(c => {
        c.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect(); const x = Math.round(e.clientX - rect.left - (canvas.width / 2)); const y = Math.round((canvas.height / 2) - (e.clientY - rect.top));
            mousePosSpan.textContent = `${x}, ${y}`;
        });
    });
    function updateStatus() {
        if (!window.turtle) return;
        document.getElementById('turtle-pos').textContent = `${Math.round(window.turtle.x)}, ${Math.round(window.turtle.y)}`;
        document.getElementById('turtle-angle').textContent = `${Math.round(window.turtle.heading())}°`;
        document.getElementById('pen-size').textContent = window.turtle.width;
        const pColor = window.turtle.color; document.getElementById('pen-color').textContent = typeof pColor === 'string' ? pColor : 'Gradient';
        document.getElementById('pen-color-preview').style.backgroundColor = typeof pColor === 'string' ? pColor : 'transparent';
        const fColor = window.turtle.fillColor; document.getElementById('fill-color-status').textContent = fColor;
        document.getElementById('fill-color-preview').style.backgroundColor = fColor;
        const bColor = getComputedStyle(canvas).backgroundColor; document.getElementById('bg-color-status').textContent = bColor;
        document.getElementById('bg-color-preview-status').style.backgroundColor = bColor;
        requestAnimationFrame(updateStatus);
    }
    updateStatus(); setTimeout(resizeCanvas, 100);
    const codeEditor = document.getElementById('codeEditor');
    const themeSelect = document.getElementById('themeSelect'); themeSelect.addEventListener('change', (e) => { document.body.className = e.target.value; saveSettings(); });
    const runBtnTop = document.getElementById('runBtnTop'); const backToEditorBtn = document.getElementById('backToEditorBtn');
    const settingsBtn = document.getElementById('settingsBtn'); const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close-modal'); settingsBtn.addEventListener('click', () => { settingsModal.classList.remove('hidden'); });
    closeModal.addEventListener('click', () => { settingsModal.classList.add('hidden'); });
    window.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });
    const bgColorPicker = document.getElementById('bg-color-picker'); const turtleImgSelect = document.getElementById('turtle-img-select');
    bgColorPicker.addEventListener('input', (e) => { canvas.style.backgroundColor = e.target.value; saveSettings(); });
    turtleImgSelect.addEventListener('change', (e) => { const val = e.target.value; if (val === 'default') window.turtle.setTurtleImage(null); else window.turtle.setTurtleImage(val); saveSettings(); });
    function saveSettings() { const settings = { theme: themeSelect.value, bgColor: bgColorPicker.value, turtleImg: turtleImgSelect.value }; localStorage.setItem('logoJsSettings', JSON.stringify(settings)); }
    function loadSettings() {
        const saved = localStorage.getItem('logoJsSettings');
        if (saved) {
            const settings = JSON.parse(saved); themeSelect.value = settings.theme || 'theme-light'; document.body.className = themeSelect.value;
            bgColorPicker.value = settings.bgColor || '#ffffff'; canvas.style.backgroundColor = bgColorPicker.value;
            turtleImgSelect.value = settings.turtleImg || 'default'; if (turtleImgSelect.value === 'default') window.turtle.setTurtleImage(null); else window.turtle.setTurtleImage(turtleImgSelect.value);
        }
    }
    loadSettings();
    runBtnTop.addEventListener('click', () => { app.className = 'mode-execution'; resizeCanvas(); window.runCode(); });
    backToEditorBtn.addEventListener('click', () => { app.className = 'mode-editor'; window.turtle.stop(); });
    const newFileBtn = document.getElementById('newFileBtn'); const openFileBtn = document.getElementById('openFileBtn');
    const saveFileBtn = document.getElementById('saveFileBtn'); const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn'); const selectAllBtn = document.getElementById('selectAllBtn');
    const copyBtn = document.getElementById('copyBtn'); const cutBtn = document.getElementById('cutBtn');
    const pasteBtn = document.getElementById('pasteBtn'); const commentBtn = document.getElementById('commentBtn');
    const indentBtn = document.getElementById('indentBtn'); const unindentBtn = document.getElementById('unindentBtn');
    const terminalSection = document.getElementById('terminal-section'); const toggleTerminalBtn = document.getElementById('toggleTerminalBtn');
    const clearTerminalBtn = document.getElementById('clearTerminalBtn'); const showTerminalBtn = document.getElementById('showTerminalBtn');
    toggleTerminalBtn.addEventListener('click', () => { terminalSection.classList.add('hidden'); showTerminalBtn.classList.remove('hidden'); });
    showTerminalBtn.addEventListener('click', () => { terminalSection.classList.remove('hidden'); showTerminalBtn.classList.add('hidden'); });
    clearTerminalBtn.addEventListener('click', () => { document.getElementById('terminalOutput').innerHTML = ''; });
    const stopBtn = document.getElementById('stopBtn'); stopBtn.addEventListener('click', () => { window.turtle.stop(); });
    const inlineCmdInput = document.getElementById('inlineCmdInput'); const runInlineBtn = document.getElementById('runInlineBtn');
    function runInline() { const cmd = inlineCmdInput.value; if (cmd.trim()) { window.executeSnippet(cmd); inlineCmdInput.value = ''; } }
    runInlineBtn.addEventListener('click', runInline); inlineCmdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runInline(); });
    let undoStack = [codeEditor.value]; let redoStack = []; const MAX_STACK = 50;
    function saveState() { const currentCode = codeEditor.value; if (undoStack[undoStack.length - 1] !== currentCode) { undoStack.push(currentCode); if (undoStack.length > MAX_STACK) undoStack.shift(); redoStack = []; } }

    function handleAutoCaps() {
        const text = codeEditor.value;
        const pos = codeEditor.selectionStart;
        const lastChar = text.substring(pos - 1, pos);
        const separators = [' ', '\n', '\t', '[', ']', '(', ')', '{', '}', ',', ';'];
        if (separators.includes(lastChar)) {
            const textBefore = text.substring(0, pos - 1);
            const wordMatch = textBefore.match(/([a-zA-Z0-9_$\u00C0-\u00FF]+)$/);
            if (wordMatch) {
                const word = wordMatch[1];
                const upperWord = word.toUpperCase();
                const allCaps = window.LOGO_ALL_CAPS || [];
                const procSearch = text.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
                const procRegex = /\bpour\s+([a-zA-Z0-9_$\u00C0-\u00FF]+)/gi;
                const userProcs = []; let mProc;
                while ((mProc = procRegex.exec(procSearch)) !== null) { userProcs.push(mProc[1].toUpperCase()); }
                if (allCaps.includes(upperWord) || userProcs.includes(upperWord)) {
                    const start = pos - 1 - word.length;
                    const newText = text.substring(0, start) + upperWord + text.substring(pos - 1);
                    if (newText !== text) {
                        codeEditor.value = newText;
                        codeEditor.setSelectionRange(pos, pos);
                    }
                }
            }
        }
    }

    codeEditor.addEventListener('input', () => {
        handleAutoCaps();
        window.updateHighlight();
    });

    codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') saveState();
    });
    codeEditor.addEventListener('blur', saveState);
    newFileBtn.addEventListener('click', () => { if (confirm('Nouveau fichier ?')) { codeEditor.value = ''; window.updateHighlight(); window.turtle.reset(); } });
    openFileBtn.addEventListener('click', () => {
        const input = document.createElement('input'); input.type = 'file';
        input.onchange = (e) => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = (ev) => { codeEditor.value = ev.target.result; window.updateHighlight(); }; reader.readAsText(file); };
        input.click();
    });
    saveFileBtn.addEventListener('click', () => {
        let filename = prompt('Nom du fichier :', 'code.logo'); if (!filename) return;
        const blob = new Blob([codeEditor.value], { type: 'text/plain' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    });
    undoBtn.addEventListener('click', () => { if (undoStack.length > 1) { redoStack.push(undoStack.pop()); codeEditor.value = undoStack[undoStack.length - 1]; window.updateHighlight(); } });
    redoBtn.addEventListener('click', () => { if (redoStack.length > 0) { const state = redoStack.pop(); undoStack.push(state); codeEditor.value = state; window.updateHighlight(); } });
    selectAllBtn.addEventListener('click', () => { codeEditor.select(); });
    copyBtn.addEventListener('click', () => { navigator.clipboard.writeText(codeEditor.value.substring(codeEditor.selectionStart, codeEditor.selectionEnd)); });
    cutBtn.addEventListener('click', () => {
        const start = codeEditor.selectionStart; const end = codeEditor.selectionEnd;
        const text = codeEditor.value; const selected = text.substring(start, end);
        if (selected) { navigator.clipboard.writeText(selected); saveState(); codeEditor.value = text.substring(0, start) + text.substring(end); codeEditor.selectionStart = codeEditor.selectionEnd = start; window.updateHighlight(); }
    });
    pasteBtn.addEventListener('click', async () => {
        const text = await navigator.clipboard.readText(); const start = codeEditor.selectionStart; const end = codeEditor.selectionEnd;
        saveState(); codeEditor.value = codeEditor.value.substring(0, start) + text + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + text.length; window.updateHighlight();
    });
    function modifySelection(fn) {
        const start = codeEditor.selectionStart; const end = codeEditor.selectionEnd; text = codeEditor.value; const before = text.substring(0, start); const selection = text.substring(start, end); const after = text.substring(end);
        const lines = selection.split('\n'); const newSelection = lines.map(fn).join('\n');
        saveState(); codeEditor.value = before + newSelection + after; codeEditor.selectionStart = start; codeEditor.selectionEnd = start + newSelection.length; window.updateHighlight();
    }
    commentBtn.addEventListener('click', () => { modifySelection(line => line.trim().startsWith('//') ? line.replace('// ', '').replace('//', '') : '// ' + line); });
    indentBtn.addEventListener('click', () => { modifySelection(line => '  ' + line); });
    unindentBtn.addEventListener('click', () => { modifySelection(line => line.replace(/^  ?/, '')); });
    document.querySelectorAll('.example-btn').forEach(btn => { btn.addEventListener('click', () => { codeEditor.value = btn.getAttribute('data-code'); window.updateHighlight(); }); });
    codeEditor.addEventListener('input', window.updateHighlight);
    codeEditor.addEventListener('scroll', window.syncScroll);
    window.updateHighlight();
});
