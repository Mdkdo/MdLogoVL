(function(global) {
    global.logToTerminal = function(msg, type = 'log') {
        const terminal = document.getElementById('terminalOutput'); if (!terminal) return;
        const div = document.createElement('div'); div.className = `terminal-msg terminal-${type}`; div.textContent = msg;
        terminal.appendChild(div); terminal.scrollTop = terminal.scrollHeight;
    };

    global.getHelpers = function() {
        const helpers = {};
        const keys = global.LOGO_ALL_CAPS || [];
        keys.forEach(k => { if (global[k] !== undefined) helpers[k] = global[k]; });

        // Add math functions from library.js
        ["fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "arc", "circle", "rectangle", "ellipse", "line", "write", "font", "polygon", "star", "stamp", "gradient", "opacity", "smooth", "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards", "pencolor", "fillcolor", "fill", "canvascolor", "pi", "sqrt", "pow", "abs", "exp", "ln", "integer", "round", "ceil", "min", "max", "sin", "cos", "tan", "atan", "random", "mod", "rgb", "playsound", "print", "showimage", "showvideo"].forEach(k => { if (global[k] !== undefined) helpers[k] = global[k]; });

        helpers.console = {
            log: (...args) => global.logToTerminal(args.join(' '), 'log'),
            error: (...args) => global.logToTerminal(args.join(' '), 'error'),
            warn: (...args) => global.logToTerminal(args.join(' '), 'warn'),
            clear: () => { document.getElementById('terminalOutput').innerHTML = ''; }
        };
        return helpers;
    };

    global.runCode = function() {
        const terminal = document.getElementById('terminalOutput'); if (terminal) terminal.innerHTML = '';
        const code = document.getElementById('codeEditor').value;
        if (global.turtle) global.turtle.reset();
        global.executeSnippet(code);
    };

    global.executeSnippet = function(code) {
        let preparedCode = window.translateLogoToJS(code);
        preparedCode = preparedCode.replace(/\^/g, '**');
        try {
            const helpers = global.getHelpers();
            const keys = Object.keys(helpers);
            const values = Object.values(helpers);
            const execute = new Function(...keys, '"use strict";\n' + preparedCode);
            execute(...values);
        } catch (err) {
            let lineNo = "Inconnue";
            if (err.stack) {
                const sl = err.stack.split('\n');
                for (let s of sl) {
                    const m = s.match(/<anonymous>:(\d+):(\d+)/) || s.match(/eval at.*<anonymous>:(\d+):(\d+)/) || s.match(/eval:(\d+):(\d+)/);
                    if (m) { lineNo = parseInt(m[m.length - 2]) - 2; if (lineNo < 0) lineNo = "Inconnue"; break; }
                }
            }
            const logoLines = code.split('\n');
            let errorMsg = `Erreur: ${err.message}\n`;
            if (lineNo !== "Inconnue" && logoLines[lineNo - 1] !== undefined) errorMsg += `Ligne ${lineNo}: ${logoLines[lineNo - 1].trim()}`;
            else errorMsg += `Ligne: ${lineNo}`;
            global.logToTerminal(errorMsg, 'error');
        }
    };
})(window);
