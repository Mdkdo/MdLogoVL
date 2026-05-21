(function(global) {
    let _logoLoopCounter = 0;

    const zeroArgCmds = ["PU", "PD", "CS", "LC", "BC", "VE", "NETTOIE", "ORIGINE", "CT", "MT", "TAMPON", "REMPLIS"];
    const oneArgCmds = ["AV", "RE", "TD", "TG", "FTC", "FCC", "FCB", "FCAP", "FCA", "CERCLE", "OPACITE", "FLUIDE", "JOUE", "ECRIS", "ENTIER", "ARRONDI", "PLAFOND", "VALABS", "RACINE", "EXP", "LOGN", "HASARD", "SIN", "COS", "TAN", "ATAN", "PI"];
    const twoArgCmds = ["FPOS", "POLYGONE", "RECTANGLE", "ELLIPSE", "DISTANCE", "NCE", "TOWARDS", "DS", "MODULO", "RVB", "ARC"];
    const threeArgCmds = ["ETOILE"];

    const arityMap = {};
    zeroArgCmds.forEach(c => arityMap[c] = 0);
    oneArgCmds.forEach(c => arityMap[c] = 1);
    twoArgCmds.forEach(c => arityMap[c] = 2);
    threeArgCmds.forEach(c => arityMap[c] = 3);
    Object.assign(arityMap, {
        "pu":0, "pd":0, "cs":0, "clean":0, "home":0, "ht":0, "st":0, "stamp":0,
        "fd":1, "bk":1, "rt":1, "lt":1, "setwidth":1, "setcolor":1, "fillcolor":1, "setheading":1, "canvascolor":1, "circle":1, "opacity":1, "smooth":1, "playsound":1, "write":1, "integer":1, "round":1, "ceil":1, "abs":1, "sqrt":1, "exp":1, "ln":1, "random":1, "sin":1, "cos":1, "tan":1,
        "setxy":2, "polygon":2, "rectangle":2, "ellipse":2, "distance":2, "towards":2, "mod":2, "rgb":2, "arc":2,
        "star":3
    });

    function getFullArityMap(userProcs) {
        const fullMap = Object.assign({}, arityMap);
        for (let name in userProcs) { fullMap[name.toUpperCase()] = userProcs[name]; }
        return fullMap;
    }

    global.translateLogoToJS = function(code) {
        _logoLoopCounter = 0;
        const userProcs = {};
        let codeClean = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
        const procRegex = /\bpour\s+([a-zA-Z0-9_$À-ÿ]+)([\s\S]*?)\n/gi;
        let m;
        while ((m = procRegex.exec(codeClean)) !== null) {
            const name = m[1];
            const params = m[2].trim().split(/\s+/).filter(p => p.startsWith(':'));
            userProcs[name.toUpperCase()] = params.length;
        }
        let js = translateBlocks(code, userProcs);
        js = js.replace(/:([a-zA-Z0-9_$À-ÿ]+)/g, '$1');
        return js;
    };

    function tokenize(input) {
        // Updated regex to support quoted strings "..." and multi-char operators
        return input.split(/(\s+|"(?:[^"\\]|\\.)*"|[\[\]{}();,]|\+\+|--|\+=|-=|\*=|\/=|==|=)/).filter(t => t.length > 0);
    }

    function translateBlocks(input, userProcs, isClass = false) {
        const fullArityMap = getFullArityMap(userProcs);
        let tokens = tokenize(input);
        let output = "";
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            let trimmed = token.trim();
            if (!trimmed) { output += token; continue; }
            let upper = trimmed.toUpperCase();

            if (upper === 'POUR') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                let name = tokens[j] || ""; j++;
                let params = [];
                while (j < tokens.length) {
                    if (tokens[j].trim() === "") { if (tokens[j].includes('\n')) break; j++; continue; }
                    if (tokens[j].startsWith(':')) { params.push(tokens[j].substring(1)); j++; continue; }
                    break;
                }
                let endIdx = -1; let depth = 0;
                for (let k = j; k < tokens.length; k++) {
                    let tu = tokens[k].toUpperCase().trim();
                    if (tu === 'POUR') depth++;
                    if (tu === 'FIN') { if (depth === 0) { endIdx = k; break; } depth--; }
                }
                if (endIdx !== -1) {
                    let bodyTokens = tokens.slice(j, endIdx);
                    let body = translateBlocks(bodyTokens.join(""), userProcs);
                    output += `function ${name}(${params.join(', ')}) { ${body} }`;
                    i = endIdx; continue;
                }
            }
            if (upper === 'REPETE' || upper === 'REPEAT') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                let nRes = transpileOneCommand(tokens, j, fullArityMap);
                j = nRes.nextIdx; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (tokens[j] === '[') {
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = translateBlocks(body, userProcs);
                        const loopVar = `_i${_logoLoopCounter++}`;
                        output += `for(let ${loopVar}=0; ${loopVar}<${nRes.js}; ${loopVar}++){ ${translatedBody} }`;
                        i = endIdx; continue;
                    }
                }
            }
            if (upper === 'SI' || upper === 'IF' || upper === 'TANTQUE' || upper === 'WHILE') {
                const isSi = (upper === 'SI' || upper === 'IF');
                let j = i + 1; let condRes = transpileOneCommand(tokens, j, fullArityMap);
                j = condRes.nextIdx; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (tokens[j] === '[') {
                    let endIdx1 = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx1 !== -1) {
                        let body1 = tokens.slice(j + 1, endIdx1).join("");
                        let translatedBody1 = translateBlocks(body1, userProcs);
                        if (isSi) {
                            let nextJ = endIdx1 + 1; while (nextJ < tokens.length && tokens[nextJ].trim() === "") nextJ++;
                            if (tokens[nextJ] && (tokens[nextJ].toUpperCase() === 'SINON' || tokens[nextJ].toUpperCase() === 'ELSE')) {
                                nextJ++; while (nextJ < tokens.length && tokens[nextJ].trim() === "") nextJ++;
                                if (tokens[nextJ] === '[') {
                                    let endIdx2 = findBalancedTokens(tokens, '[', nextJ);
                                    if (endIdx2 !== -1) {
                                        let body2 = tokens.slice(nextJ + 1, endIdx2).join("");
                                        let translatedBody2 = translateBlocks(body2, userProcs);
                                        output += `if (${condRes.js}) { ${translatedBody1} } else { ${translatedBody2} }`;
                                        i = endIdx2; continue;
                                    }
                                }
                            }
                            output += `if (${condRes.js}) { ${translatedBody1} }`;
                            i = endIdx1; continue;
                        } else {
                            output += `while (${condRes.js}) { ${translatedBody1} }`;
                            i = endIdx1; continue;
                        }
                    }
                }
            }
            if (upper === 'CHOISIS' || upper === 'SWITCH') {
                let j = i + 1; let valRes = transpileOneCommand(tokens, i + 1, fullArityMap);
                j = valRes.nextIdx; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (tokens[j] === '[') {
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = body;
                        while (true) {
                            let cMatch = /\b(?:case|CASE)\s+([^\[\]\n]+)\[/gi.exec(translatedBody); if (!cMatch) break;
                            let moffset = cMatch.index;
                            let eIdx = findBalancedString(translatedBody, '[', ']', moffset + cMatch[0].length - 1);
                            if (eIdx !== -1) {
                                let cbody = translatedBody.substring(moffset + cMatch[0].length, eIdx);
                                translatedBody = translatedBody.substring(0, moffset) + `case ${cMatch[1].trim()}: ${translateBlocks(cbody, userProcs)}; break; ` + translatedBody.substring(eIdx + 1);
                            } else break;
                        }
                        while (true) {
                            let aMatch = /\b(?:autres|AUTRES|default|DEFAULT)\s*\[/gi.exec(translatedBody); if (!aMatch) break;
                            let moffset = aMatch.index;
                            let eIdx = findBalancedString(translatedBody, '[', ']', moffset + aMatch[0].length - 1);
                            if (eIdx !== -1) {
                                let cbody = translatedBody.substring(moffset + aMatch[0].length, eIdx);
                                translatedBody = translatedBody.substring(0, moffset) + `default: ${translateBlocks(cbody, userProcs)}; break; ` + translatedBody.substring(eIdx + 1);
                            } else break;
                        }
                        output += `switch (${valRes.js}) { ${translatedBody} }`;
                        i = endIdx; continue;
                    }
                }
            }
            if (upper === 'CLASSE' || upper === 'CLASS') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                let name = tokens[j] || ""; j++;
                while (j < tokens.length && tokens[j].trim() === "") j++;
                if (tokens[j] === '[') {
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = translateBlocks(body, userProcs, true);
                        output += `class ${name} { ${translatedBody} }`;
                        i = endIdx; continue;
                    }
                }
            }
            if (upper === 'DONNE' || upper === 'DECLARE' || upper === 'LET' || upper === 'VAR') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j].startsWith(':')) {
                    let varNameRaw = tokens[j].substring(1);
                    let varName = varNameRaw.replace(/:/g, ''); j++;
                    while (j < tokens.length && tokens[j].trim() === "") j++;
                    if (j < tokens.length && ["=", "+=", "-=", "*=", "/="].includes(tokens[j])) {
                        let op = tokens[j];
                        let valRes = transpileOneCommand(tokens, j + 1, fullArityMap);
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} ${op} ${valRes.js}; `;
                        else output += `var ${varName} ${op} ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    } else {
                        let valRes = transpileOneCommand(tokens, j, fullArityMap);
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} = ${valRes.js}; `;
                        else output += `var ${varName} = ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    }
                }
                continue;
            }

            // New logic: catch :var = , :var +=, :var++, etc. without DONNE
            if (token.startsWith(':')) {
                let varName = token.substring(1);
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && ["=", "+=", "-=", "*=", "/=", "++", "--"].includes(tokens[j])) {
                    let op = tokens[j];
                    if (op === "++" || op === "--") {
                        output += `${varName}${op}; `;
                        i = j;
                    } else {
                        let valRes = transpileOneCommand(tokens, j + 1, fullArityMap);
                        output += `${varName} ${op} ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    }
                    continue;
                }
            }

            if (isClass && trimmed !== "") {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j] === "[") {
                    let methodName = (trimmed.toLowerCase() === "constructeur" || trimmed.toLowerCase() === "constructor") ? "constructor" : trimmed;
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = translateBlocks(body, userProcs);
                        output += `${methodName}() { ${translatedBody} } `;
                        i = endIdx; continue;
                    }
                }
            }

            if (upper === 'RENDS' || upper === 'RETURN') { output += "return "; continue; }
            if (upper === 'STOP' || upper === 'BREAK') { output += "break; "; continue; }
            if (upper === 'CONTINUE') { output += "continue; "; continue; }
            if (fullArityMap[upper] !== undefined) {
                let lookBehind = i - 1; while (lookBehind >= 0 && tokens[lookBehind].trim() === "") lookBehind--;
                if (lookBehind >= 0 && (tokens[lookBehind] === "function" || tokens[lookBehind] === "class")) { output += token; continue; }
                let sub = transpileOneCommand(tokens, i, fullArityMap);
                output += sub.js + "; "; i = sub.nextIdx - 1;
            } else {
                if (token.startsWith('"')) {
                    if (token.endsWith('"') && token.length > 1) {
                         output += token; // Full quoted string
                    } else {
                         output += JSON.stringify(token.substring(1)); // Old Logo "string
                    }
                }
                else output += token;
            }
        }
        return output;
    }

    function transpileOneCommand(tokens, startIndex, fullArityMap) {
        let i = startIndex; while (i < tokens.length && tokens[i].trim() === "") i++;
        if (i >= tokens.length) return { js: "", nextIdx: i };
        let token = tokens[i].trim(); let upper = token.toUpperCase(); let arity = fullArityMap[upper];
        let resultJS = ""; let currentIdx = i;
        if (arity === undefined) {
            if (token === "(") {
                let end = findBalancedTokens(tokens, '(', ')', i);
                if (end !== -1) { let insideJS = translateBlocks(tokens.slice(i + 1, end).join(""), {}); resultJS = "(" + insideJS + ")"; currentIdx = end + 1; }
            } else if (token === "[") {
                let end = findBalancedTokens(tokens, '[', ']', i);
                if (end !== -1) { let inside = tokens.slice(i + 1, end).join("").trim(); resultJS = JSON.stringify(inside); currentIdx = end + 1; }
            } else if (token.startsWith(':')) { resultJS = token.substring(1); currentIdx = i + 1; }
            else if (token.startsWith('"')) {
                if (token.endsWith('"') && token.length > 1) {
                    resultJS = token; // Full quoted string
                } else {
                    resultJS = JSON.stringify(token.substring(1));
                }
                currentIdx = i + 1;
            }
            else { resultJS = token; currentIdx = i + 1; }
        } else {
            let args = []; currentIdx = i + 1;
            for (let a = 0; a < arity; a++) { let sub = transpileOneCommand(tokens, currentIdx, fullArityMap); args.push(sub.js); currentIdx = sub.nextIdx; }
            resultJS = token + "(" + args.join(", ") + ")";
        }
        while (currentIdx < tokens.length) {
            let nextTok = tokens[currentIdx]; let nt = nextTok.trim();
            if (nt === "") {
                let peek = currentIdx + 1; while (peek < tokens.length && tokens[peek].trim() === "") peek++;
                if (peek < tokens.length && "+-*/%><=!".split("").some(op => tokens[peek].trim().includes(op))) { resultJS += nextTok; currentIdx++; continue; }
                break;
            }
            if ("+-*/%><=!".split("").some(op => nt.includes(op))) {
                resultJS += nt; currentIdx++;
                let sub = transpileOneCommand(tokens, currentIdx, fullArityMap); resultJS += sub.js; currentIdx = sub.nextIdx; continue;
            }
            break;
        }
        return { js: resultJS, nextIdx: currentIdx };
    }

    function findBalancedTokens(tokens, start, end, startIndex) {
        let count = 0;
        for (let i = startIndex; i < tokens.length; i++) {
            if (tokens[i] === start) count++;
            else if (tokens[i] === end) { count--; if (count === 0) return i; }
        }
        return -1;
    }

    function findBalancedString(str, start, end, startIndex) {
        let count = 0;
        for (let i = startIndex; i < str.length; i++) {
            if (str[i] === start) count++;
            else if (str[i] === end) { count--; if (count === 0) return i; }
        }
        return -1;
    }

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
        const combinedRegex = new RegExp('(\\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)|' + '("(?:[^"\\\\\\n]|\\.)*"|\'(?:[^\'\\\\\\n]|\\.)*\'|`(?:[^\\\\`]|\\.)*`)|' + '(\\b\\d+(?:\\.\\d+)?\\b)|' + '(:[a-zA-Z0-9_$À-ÿ]+)|' + '([^a-zA-Z0-9_À-ÿ]|^)(' + keywords.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + '([^a-zA-Z0-9_À-ÿ]|^)(' + commands.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + '([\\+\\-\\*/\\(\\),\\;\\(\\)\\[\\]\\{\\}\\.])|' + '([a-zA-Z_$À-ÿ][a-zA-Z0-9_$À-ÿ]*)', 'gi');
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
                const ups = []; const pr = /\bpour\s+([a-zA-Z0-9_$À-ÿ]+)/gi; let m;
                while ((m = pr.exec(procSearch)) !== null) ups.push(m[1].toUpperCase());
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

    global.logToTerminal = function(msg, type = 'log') {
        const terminal = document.getElementById('terminalOutput'); if (!terminal) return;
        const div = document.createElement('div'); div.className = `terminal-msg terminal-${type}`; div.textContent = msg;
        terminal.appendChild(div); terminal.scrollTop = terminal.scrollHeight;
    };

    global.getHelpers = function() {
        const helpers = {};
        const keys = global.LOGO_ALL_CAPS || [];
        keys.forEach(k => { if (global[k] !== undefined) helpers[k] = global[k]; });
        ["fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps", "arc", "circle", "rectangle", "ellipse", "line", "write", "font", "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth", "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards", "ds", "pencolor", "pc", "fillcolor", "fill", "canvascolor", "pi", "sqrt", "pow", "abs", "exp", "ln", "integer", "round", "ceil", "min", "max", "sin", "cos", "tan", "atan", "random", "mod", "rgb", "playsound", "showimage", "showvideo"].forEach(k => { if (global[k] !== undefined) helpers[k] = global[k]; });
        helpers.console = { log: (...args) => global.logToTerminal(args.join(' '), 'log'), error: (...args) => global.logToTerminal(args.join(' '), 'error'), warn: (...args) => global.logToTerminal(args.join(' '), 'warn'), clear: () => { document.getElementById('terminalOutput').innerHTML = ''; } };
        return helpers;
    };

    global.runCode = function() {
        const terminal = document.getElementById('terminalOutput'); if (terminal) terminal.innerHTML = '';
        const code = document.getElementById('codeEditor').value;
        if (global.turtle) global.turtle.reset();
        global.executeSnippet(code);
    };

    global.executeSnippet = function(code) {
        let preparedCode = global.translateLogoToJS(code);
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
            const wordMatch = textBefore.match(/([a-zA-Z0-9_$À-ÿ]+)$/);
            if (wordMatch) {
                const word = wordMatch[1];
                const upperWord = word.toUpperCase();
                const allCaps = window.LOGO_ALL_CAPS || [];
                const procSearch = text.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
                const procRegex = /\bpour\s+([a-zA-Z0-9_$À-ÿ]+)/gi;
                const userProcs = []; let m;
                while ((m = procRegex.exec(procSearch)) !== null) { userProcs.push(m[1].toUpperCase()); }
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
