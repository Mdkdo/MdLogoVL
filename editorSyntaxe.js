(function(global) {
    let _logoLoopCounter = 0;

    const zeroArgCmds = ["pu", "pd", "cs", "clean", "home", "ht", "st", "stamp", "lc", "bc", "ve", "ct", "mt", "tampon", "remplis"];
    const oneArgCmds = ["fd", "bk", "rt", "lt", "setwidth", "ps", "circle", "e", "rectangle", "ellipse", "line", "write", "font", "opacity", "smooth", "setheading", "pencolor", "pc", "fillcolor", "fill", "canvascolor", "av", "re", "td", "tg", "fcc", "fcb", "fcap", "fpos", "fca", "ftc", "écris", "ecris", "opacité", "opacite", "fluide", "joue", "playsound", "afficheImage", "showimage", "afficheVideo", "showvideo", "sin", "cos", "tan", "sqrt", "exp", "ln", "random", "m", "integer", "round", "ceil", "abs"];
    const twoArgCmds = ["setxy", "fpos", "arc", "rectangle", "ellipse", "polygon", "polygone", "distance", "nce", "towards", "ds", "mod", "modulo", "o", "cercle"];
    const threeArgCmds = ["star", "étoile", "etoile", "rvb"];

    function getArityMap(userProcs) {
        const arityMap = {};
        zeroArgCmds.forEach(c => arityMap[c.toUpperCase()] = 0);
        oneArgCmds.forEach(c => arityMap[c.toUpperCase()] = 1);
        twoArgCmds.forEach(c => arityMap[c.toUpperCase()] = 2);
        threeArgCmds.forEach(c => arityMap[c.toUpperCase()] = 3);
        for (let name in userProcs) { arityMap[name.toUpperCase()] = userProcs[name]; }
        return arityMap;
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
        return input.split(/(\s+|"[\S]*|[\[\]{}();,])/).filter(t => t.length > 0);
    }

    function translateBlocks(input, userProcs, isClass = false) {
        const arityMap = getArityMap(userProcs);
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

            if (upper === 'REPETE') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                let nRes = transpileOneCommand(tokens, j, arityMap);
                j = nRes.nextIdx;
                while (j < tokens.length && tokens[j].trim() === "") j++;
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

            if (upper === 'SI' || upper === 'TANTQUE') {
                const isSi = (upper === 'SI');
                let j = i + 1;
                let condRes = transpileOneCommand(tokens, j, arityMap);
                j = condRes.nextIdx;
                while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j] === '[') {
                    let endIdx1 = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx1 !== -1) {
                        let body1 = tokens.slice(j + 1, endIdx1).join("");
                        let translatedBody1 = translateBlocks(body1, userProcs);
                        if (isSi) {
                            let nextJ = endIdx1 + 1;
                            while (nextJ < tokens.length && tokens[nextJ].trim() === "") nextJ++;
                            if (tokens[nextJ] && tokens[nextJ].toUpperCase() === 'SINON') {
                                nextJ++; while (nextJ < tokens.length && tokens[nextJ].trim() === "") nextJ++;
                                if (tokens[nextJ] === '[') {
                                    let endIdx2 = findBalancedTokens(tokens, '[', ']', nextJ);
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

            if (upper === 'CHOISIS') {
                let j = i + 1;
                let valRes = transpileOneCommand(tokens, j, arityMap);
                j = valRes.nextIdx;
                while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j] === '[') {
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = body;
                        while (true) {
                            let cMatch = /\bcase\s+([^\[\]\n]+)\[/gi.exec(translatedBody);
                            if (!cMatch) break;
                            let moffset = cMatch.index;
                            let eIdx = findBalancedString(translatedBody, '[', ']', moffset + cMatch[0].length - 1);
                            if (eIdx !== -1) {
                                let cbody = translatedBody.substring(moffset + cMatch[0].length, eIdx);
                                translatedBody = translatedBody.substring(0, moffset) + `case ${cMatch[1].trim()}: ${translateBlocks(cbody, userProcs)}; break; ` + translatedBody.substring(eIdx + 1);
                            } else break;
                        }
                        while (true) {
                            let aMatch = /\bautres\s*\[/gi.exec(translatedBody);
                            if (!aMatch) break;
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

            if (upper === 'CLASSE') {
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

            if (upper === 'DONNE' || upper === 'DECLARE') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j].startsWith(':')) {
                    let varNameRaw = tokens[j].substring(1);
                    let varName = varNameRaw.replace(/:/g, '');
                    j++;
                    while (j < tokens.length && tokens[j].trim() === "") j++;
                    if (j < tokens.length && tokens[j] === "=") {
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} = `;
                        else output += `var ${varName} = `;
                        i = j;
                    }
                    else {
                        let valRes = transpileOneCommand(tokens, j, arityMap);
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} = ${valRes.js}; `;
                        else output += `var ${varName} = ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    }
                }
                continue;
            }

            if (isClass && trimmed !== "") {
                let j = i + 1;
                while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && tokens[j] === "[") {
                    let methodName = (trimmed.toLowerCase() === "constructeur") ? "constructor" : trimmed;
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = translateBlocks(body, userProcs);
                        output += `${methodName}() { ${translatedBody} } `;
                        i = endIdx; continue;
                    }
                }
            }

            if (upper === 'RENDS') { output += "return "; continue; }
            if (upper === 'STOP') { output += "break; "; continue; }
            if (upper === 'CONTINUE') { output += "continue; "; continue; }

            if (arityMap[upper] !== undefined) {
                let lookBehind = i - 1;
                while (lookBehind >= 0 && tokens[lookBehind].trim() === "") lookBehind--;
                if (lookBehind >= 0 && (tokens[lookBehind] === "function" || tokens[lookBehind] === "class")) { output += token; continue; }
                let sub = transpileOneCommand(tokens, i, arityMap);
                output += sub.js + "; ";
                i = sub.nextIdx - 1;
            } else {
                if (token.startsWith('"')) output += JSON.stringify(token.substring(1));
                else output += token;
            }
        }
        return output;
    }

    function transpileOneCommand(tokens, startIndex, arityMap) {
        let i = startIndex; while (i < tokens.length && tokens[i].trim() === "") i++;
        if (i >= tokens.length) return { js: "", nextIdx: i };
        let token = tokens[i].trim();
        let upper = token.toUpperCase();
        let arity = arityMap[upper];

        let resultJS = "";
        let currentIdx = i;

        if (arity === undefined) {
            if (token === "(") {
                let end = findBalancedTokens(tokens, '(', ')', i);
                if (end !== -1) {
                    let insideJS = translateBlocks(tokens.slice(i + 1, end).join(""), {});
                    resultJS = "(" + insideJS + ")";
                    currentIdx = end + 1;
                }
            } else if (token === "[") {
                let end = findBalancedTokens(tokens, '[', ']', i);
                if (end !== -1) {
                    let inside = tokens.slice(i + 1, end).join("").trim();
                    resultJS = JSON.stringify(inside);
                    currentIdx = end + 1;
                }
            } else if (token.startsWith(':')) {
                resultJS = token.substring(1);
                currentIdx = i + 1;
            } else if (token.startsWith('"')) {
                resultJS = JSON.stringify(token.substring(1));
                currentIdx = i + 1;
            } else {
                resultJS = token;
                currentIdx = i + 1;
            }
        } else {
            let args = [];
            currentIdx = i + 1;
            for (let a = 0; a < arity; a++) {
                let sub = transpileOneCommand(tokens, currentIdx, arityMap);
                args.push(sub.js);
                currentIdx = sub.nextIdx;
            }
            resultJS = token + "(" + args.join(", ") + ")";
        }

        while (currentIdx < tokens.length) {
            let nextTok = tokens[currentIdx];
            let nt = nextTok.trim();
            if (nt === "") {
                let peek = currentIdx + 1;
                while (peek < tokens.length && tokens[peek].trim() === "") peek++;
                if (peek < tokens.length && "+-*/%><=!".split("").some(op => tokens[peek].trim().includes(op))) {
                    resultJS += nextTok;
                    currentIdx++;
                    continue;
                }
                break;
            }
            if ("+-*/%><=!".split("").some(op => nt.includes(op))) {
                resultJS += nt;
                currentIdx++;
                let sub = transpileOneCommand(tokens, currentIdx, arityMap);
                resultJS += sub.js;
                currentIdx = sub.nextIdx;
                continue;
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
        const keywords = ["const", "let", "var", "if", "else", "for", "while", "function", "return", "new", "try", "catch", "class", "switch", "case", "default", "donne", "declare", "si", "sinon", "tantque", "repete", "choisis", "autres", "classe", "pour", "fin", "stop", "continue", "rends"];
        const commands = ["fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps", "arc", "circle", "e", "rectangle", "ellipse", "line", "write", "font", "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth", "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards", "ds", "nce", "ng", "pencolor", "pc", "fillcolor", "fill", "canvascolor", "sin", "cos", "tan", "atan", "pi", "sqrt", "pow", "abs", "exp", "ln", "random", "m", "integer", "round", "ceil", "mod", "modulo", "o", "min", "max", "rgb", "playsound", "showimage", "showvideo", "repeat", "av", "re", "td", "tg", "lc", "bc", "ve", "ct", "mt", "fcc", "fcb", "fcap", "fpos", "fca", "ftc", "répète", "écris", "remplis", "tampon", "dégradé", "opacité", "fluide", "joue", "repete", "ecris", "degrade", "opacite", "etoile", "afficheImage", "showimage", "afficheVideo", "cercle", "polygone", "étoile"];
        const combinedRegex = new RegExp('(\\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)|' + '("(?:[^"\\\\\\n]|\\.)*"|\'(?:[^\'\\\\\\n]|\\.)*\'|`(?:[^\\\\`]|\\.)*`)|' + '(\\b\\d+(?:\\.\\d+)?\\b)|' + '(:[a-zA-Z0-9_$À-ÿ]+)|' + '([^a-zA-Z0-9_À-ÿ]|^)(' + keywords.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + '([^a-zA-Z0-9_À-ÿ]|^)(' + commands.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + '([\\+\\-\\*/\\(\\),\\;\\(\\)\\[\\]\\{\\}\\.])|' + '([a-zA-Z_$À-ÿ][a-zA-Z0-9_$À-ÿ]*)', 'gi');
        let res = ''; let last = 0;
        code.replace(combinedRegex, (match, com, str, num, v, kp, kw, cp, cmd, op, unk, off) => {
            res += code.substring(last, off).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (com) res += `<span class="hl-comment">${com.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            else if (str) res += `<span class="hl-string">${str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            else if (num) res += `<span class="hl-number">${num}</span>`;
            else if (v) res += `<span class="hl-variable">${v}</span>`;
            else if (kw) { res += kp; res += `<span class="hl-keyword">${kw}</span>`; }
            else if (cmd) { res += cp; res += `<span class="hl-command">${cmd}</span>`; }
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
        const terminal = document.getElementById('terminalOutput');
        if (!terminal) return;
        const div = document.createElement('div');
        div.className = `terminal-msg terminal-${type}`; div.textContent = msg;
        terminal.appendChild(div); terminal.scrollTop = terminal.scrollHeight;
    };

    global.getHelpers = function() {
        const helpers = {};
        const keys = ["fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps", "arc", "circle", "e", "rectangle", "ellipse", "line", "write", "font", "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth", "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards", "ds", "nce", "ng", "pencolor", "pc", "fillcolor", "fill", "canvascolor", "sin", "cos", "tan", "atan", "pi", "sqrt", "pow", "abs", "exp", "ln", "random", "m", "integer", "round", "ceil", "mod", "modulo", "o", "min", "max", "rgb", "playsound", "showimage", "showvideo", "repeat", "av", "re", "td", "tg", "lc", "bc", "ve", "ct", "mt", "fcc", "fcb", "fcap", "fpos", "fca", "ftc", "répète", "écris", "remplis", "tampon", "dégradé", "opacité", "fluide", "joue", "repete", "ecris", "degrade", "opacite", "etoile", "afficheImage", "showimage", "afficheVideo", "cercle", "polygone", "étoile", "FD", "BK", "RT", "LT", "PU", "PD", "CS", "CLEAN", "HOME", "SETCOLOR", "SETWIDTH", "PS", "ARC", "CIRCLE", "E", "RECTANGLE", "ELLIPSE", "LINE", "WRITE", "FONT", "POLYGON", "STAR", "STAMP", "DRAWIMAGE", "GRADIENT", "OPACITY", "SMOOTH", "SETXY", "SETHEADING", "HT", "ST", "POSX", "POSY", "HEADING", "NG", "DISTANCE", "NCE", "TOWARDS", "DS", "PENCOLOR", "PC", "FILLCOLOR", "FILL", "CANVASCOLOR", "REPEAT", "AV", "RE", "TD", "TG", "LC", "BC", "VE", "CT", "MT", "FCC", "FCB", "FCAP", "FPOS", "FCA", "FTC", "REPETE", "ECRIS", "REMPLIS", "TAMPON", "DEGRADE", "OPACITE", "FLUIDE", "JOUE", "AFFICHEIMAGE", "AFFICHEVIDEO", "RVB", "CERCLE", "POLYGONE", "ETOILE"];
        keys.forEach(k => { if (global[k] !== undefined) helpers[k] = global[k]; });
        helpers.console = { log: (...args) => global.logToTerminal(args.join(' '), 'log'), error: (...args) => global.logToTerminal(args.join(' '), 'error'), warn: (...args) => global.logToTerminal(args.join(' '), 'warn'), clear: () => { document.getElementById('terminalOutput').innerHTML = ''; } };
        helpers.print = (...args) => global.logToTerminal(args.join(' '), 'log');
        return helpers;
    };

    global.runCode = function() {
        const terminal = document.getElementById('terminalOutput');
        if (terminal) terminal.innerHTML = '';
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
