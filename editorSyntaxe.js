let _logoLoopCounter = 0;

function translateLogoToJS(code) {
    _logoLoopCounter = 0;
    let placeholders = [];
    // Protect strings and comments
    let js = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, (match) => {
        placeholders.push(match);
        return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });

    function findBalanced(str, startChar, endChar, startIndex) {
        let count = 0;
        for (let i = startIndex; i < str.length; i++) {
            if (str[i] === startChar) count++;
            else if (str[i] === endChar) {
                count--;
                if (count === 0) return i;
            }
        }
        return -1;
    }

    function applyLogoCore(input, userProcs) {
        let out = input;

        // Assignments & Declarations
        out = out.replace(/\b(donne|declare)\s+:([a-zA-Z0-9_$À-ÿ]+)\s*=\s*([^;\n\[\]]+)/gi, 'var $2 = $3;');
        out = out.replace(/\b(donne|declare)\s+:([a-zA-Z0-9_$À-ÿ]+)\s+([^;\n\s\[\]{}()]+)/gi, 'var $2 = $3;');
        out = out.replace(/\b(donne|declare)\s+:([a-zA-Z0-9_$À-ÿ]+)\s+(\([^;\n\[\]{}]+\))/gi, 'var $2 = $3;');
        out = out.replace(/(^|[\n;])\s*:([a-zA-Z0-9_$À-ÿ]+)\s*=\s*([^;\n\[\]]+)/gi, '$1var $2 = $3;');

        out = out.replace(/\b(donne|declare)\b/gi, 'var');
        out = out.replace(/:([a-zA-Z0-9_$À-ÿ]+)/g, '$1');

        // Keywords
        out = out.replace(/\bRENDS\b/gi, 'return');
        out = out.replace(/\bSTOP\b/gi, 'break');
        out = out.replace(/\bCONTINUE\b/gi, 'continue');

        // Commands without parentheses
        const zeroArgCmds = ["pu", "pd", "cs", "clean", "home", "ht", "st", "stamp", "lc", "bc", "ve", "ct", "mt", "tampon", "remplis"];
        const oneArgCmds = ["fd", "bk", "rt", "lt", "setwidth", "ps", "circle", "e", "write", "font", "opacity", "smooth", "setheading", "pencolor", "pc", "fillcolor", "fill", "canvascolor", "av", "re", "td", "tg", "fcc", "fcb", "fcap", "fpos", "fca", "ftc", "écris", "ecris", "opacité", "opacite", "fluide", "joue", "playsound", "afficheImage", "showimage", "afficheVideo", "showvideo"];
        const twoArgCmds = ["setxy", "fpos", "arc", "rectangle", "ellipse", "polygon", "polygone", "distance", "nce", "towards", "ds", "mod", "modulo", "o", "cercle"];
        const threeArgCmds = ["star", "étoile", "etoile", "rvb"];

        const arityMap = {};
        zeroArgCmds.forEach(c => arityMap[c.toUpperCase()] = 0);
        oneArgCmds.forEach(c => arityMap[c.toUpperCase()] = 1);
        twoArgCmds.forEach(c => arityMap[c.toUpperCase()] = 2);
        threeArgCmds.forEach(c => arityMap[c.toUpperCase()] = 3);

        for (let name in userProcs) {
            arityMap[name.toUpperCase()] = userProcs[name];
        }

        let tokens = out.split(/(\s+|[\[\]{}();,])/);
        let newJs = "";
        let loopVarCounter = 0;
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (token.trim() === "") { newJs += token; continue; }
            let upperToken = token.toUpperCase();

            // Look behind and ahead to see if it's a function definition or already a call
            let isFuncDef = false;
            let lookBehind = i - 1;
            while (lookBehind >= 0 && tokens[lookBehind].trim() === "") lookBehind--;
            if (lookBehind >= 0 && tokens[lookBehind] === "function") isFuncDef = true;

            let isAlreadyCall = false;
            let lookAhead = i + 1;
            while (lookAhead < tokens.length && tokens[lookAhead].trim() === "") lookAhead++;
            if (lookAhead < tokens.length && tokens[lookAhead] === "(") isAlreadyCall = true;

            if (arityMap[upperToken] !== undefined && !isFuncDef && !isAlreadyCall) {
                let arity = arityMap[upperToken];
                let args = [];
                let currentIdx = i + 1;
                for (let a = 0; a < arity; a++) {
                    while (currentIdx < tokens.length && tokens[currentIdx].trim() === "") currentIdx++;
                    if (currentIdx < tokens.length && !"[{}();,]".includes(tokens[currentIdx]) && arityMap[tokens[currentIdx].toUpperCase()] === undefined) {
                        args.push(tokens[currentIdx]);
                        currentIdx++;
                    } else {
                        break;
                    }
                }

                if (args.length === arity) {
                    newJs += token + "(" + args.join(", ") + ");";
                    i = currentIdx - 1;
                } else {
                    newJs += token;
                    if (arity === 0) newJs += "()";
                }
            } else {
                newJs += token;
            }
        }
        return newJs;
    }

    function translateBlocks(input, userProcs) {
        let output = input;
        let changed = true;
        let loopCounter = 0;
        while (changed) {
            let startOutput = output;

            // REPETE n [ body ] -> native for loop to support STOP/CONTINUE
            let repMatch = /\bREPETE\s+(\d+|:[a-zA-Z0-9_$À-ÿ]+|[a-zA-Z0-9_$À-ÿ]+|(?:\([^()]+\)))\s*\[/gi.exec(output);
            if (repMatch) {
                const match = repMatch[0];
                let n = repMatch[1];
                if (n.startsWith(':')) n = n.substring(1);
                const offset = repMatch.index;
                const endIdx = findBalanced(output, '[', ']', offset + match.length - 1);
                if (endIdx !== -1) {
                    const body = output.substring(offset + match.length, endIdx);
                    const translatedBody = translateBlocks(body, userProcs);
                    const loopVar = `_i${_logoLoopCounter++}`;
                    output = output.substring(0, offset) + `for(let ${loopVar}=0; ${loopVar}<${n}; ${loopVar}++){ ${translatedBody} }` + output.substring(endIdx + 1);
                    continue;
                }
            }

            // si (cond) [ body ] sinon [ body ]
            let siMatch = /\bsi\b\s*(\([^()]+\))\s*\[/gi.exec(output);
            if (siMatch) {
                const match = siMatch[0];
                const cond = siMatch[1];
                const offset = siMatch.index;
                const endIdx1 = findBalanced(output, '[', ']', offset + match.length - 1);
                if (endIdx1 !== -1) {
                    const body1 = output.substring(offset + match.length, endIdx1);
                    const translatedBody1 = translateBlocks(body1, userProcs);
                    let remainder = output.substring(endIdx1 + 1);
                    let sinonMatch = remainder.match(/^\s*sinon\s*\[/i);
                    if (sinonMatch) {
                        const startIdx2 = endIdx1 + 1 + sinonMatch.index + sinonMatch[0].length - 1;
                        const endIdx2 = findBalanced(output, '[', ']', startIdx2);
                        if (endIdx2 !== -1) {
                            const body2 = output.substring(startIdx2 + 1, endIdx2);
                            const translatedBody2 = translateBlocks(body2, userProcs);
                            output = output.substring(0, offset) + `if ${cond} { ${translatedBody1} } else { ${translatedBody2} }` + output.substring(endIdx2 + 1);
                            continue;
                        }
                    }
                    output = output.substring(0, offset) + `if ${cond} { ${translatedBody1} }` + output.substring(endIdx1 + 1);
                    continue;
                }
            }

            // tantque (cond) [ body ]
            let tqMatch = /\btantque\b\s*(\([^()]+\))\s*\[/gi.exec(output);
            if (tqMatch) {
                const match = tqMatch[0];
                const cond = tqMatch[1];
                const offset = tqMatch.index;
                const endIdx = findBalanced(output, '[', ']', offset + match.length - 1);
                if (endIdx !== -1) {
                    const body = output.substring(offset + match.length, endIdx);
                    const translatedBody = translateBlocks(body, userProcs);
                    output = output.substring(0, offset) + `while ${cond} { ${translatedBody} }` + output.substring(endIdx + 1);
                    continue;
                }
            }

            // choisis (val) [ body ]
            let chMatch = /\bchoisis\b\s*(\([^()]+\))\s*\[/gi.exec(output);
            if (chMatch) {
                const match = chMatch[0];
                const val = chMatch[1];
                const offset = chMatch.index;
                const endIdx = findBalanced(output, '[', ']', offset + match.length - 1);
                if (endIdx !== -1) {
                    let body = output.substring(offset + match.length, endIdx);
                    let translatedBody = body;
                    while (true) {
                        let cMatch = /\bcase\s+([^\[\]\n]+)\[/gi.exec(translatedBody);
                        if (!cMatch) break;
                        let moffset = cMatch.index;
                        let eIdx = findBalanced(translatedBody, '[', ']', moffset + cMatch[0].length - 1);
                        if (eIdx !== -1) {
                            let cbody = translatedBody.substring(moffset + cMatch[0].length, eIdx);
                            translatedBody = translatedBody.substring(0, moffset) + `case ${cMatch[1]}: ${translateBlocks(cbody, userProcs)}; break; ` + translatedBody.substring(eIdx + 1);
                        } else break;
                    }
                    while (true) {
                        let aMatch = /\bautres\s*\[/gi.exec(translatedBody);
                        if (!aMatch) break;
                        let moffset = aMatch.index;
                        let eIdx = findBalanced(translatedBody, '[', ']', moffset + aMatch[0].length - 1);
                        if (eIdx !== -1) {
                            let cbody = translatedBody.substring(moffset + aMatch[0].length, eIdx);
                            translatedBody = translatedBody.substring(0, moffset) + `default: ${translateBlocks(cbody, userProcs)}; break; ` + translatedBody.substring(eIdx + 1);
                        } else break;
                    }
                    output = output.substring(0, offset) + `switch ${val} { ${translatedBody} }` + output.substring(endIdx + 1);
                    continue;
                }
            }

            // classe Name [ body ]
            let clsMatch = /\bclasse\s+([a-zA-Z0-9_$À-ÿ]+)\s*\[/gi.exec(output);
            if (clsMatch) {
                const name = clsMatch[1];
                const offset = clsMatch.index;
                const endIdx = findBalanced(output, '[', ']', offset + clsMatch[0].length - 1);
                if (endIdx !== -1) {
                    const body = output.substring(offset + clsMatch[0].length, endIdx);
                    const translatedBody = translateBlocks(body, userProcs);
                    output = output.substring(0, offset) + `class ${name} { ${translatedBody} }` + output.substring(endIdx + 1);
                    continue;
                }
            }
            if (output === startOutput) changed = false;
        }
        return applyLogoCore(output, userProcs);
    }

    const userProcs = {};
    // Pre-identify user procedures and their arity
    let procSearch = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
    let m;
    const procRegex = /\bpour\s+([a-zA-Z0-9_$À-ÿ]+)([\s\S]*?)\n/gi;
    while ((m = procRegex.exec(procSearch)) !== null) {
        const name = m[1];
        const params = m[2].trim().split(/\s+/).filter(p => p.startsWith(':'));
        userProcs[name] = params.length;
    }

    // 1. Procedure definitions
    js = js.replace(/\bpour\s+([a-zA-Z0-9_$À-ÿ]+)([\s\S]*?)\bfin\b/gi, (match, name, content) => {
        let firstNewLine = content.indexOf('\n');
        let paramPart = firstNewLine === -1 ? content : content.substring(0, firstNewLine);
        let body = firstNewLine === -1 ? "" : content.substring(firstNewLine);
        let params = paramPart.trim().split(/\s+/).filter(p => p.startsWith(':')).map(p => p.substring(1));
        params.forEach(p => {
            const pRegex = new RegExp(':' + p + '\\b', 'g');
            body = body.replace(pRegex, p);
        });
        body = translateBlocks(body, userProcs);
        return `function ${name}(${params.join(', ')}) {\n${body}\n}`;
    });

    // 2. Blocks outside procedures
    js = translateBlocks(js, userProcs);

    // Restore placeholders
    for (let i = placeholders.length - 1; i >= 0; i--) {
        js = js.split(`__PLACEHOLDER_${i}__`).join(placeholders[i]);
    }
    return js;
}

function updateLineNumbers() {
    const codeEditor = document.getElementById('codeEditor');
    const lineNumbers = document.getElementById('line-numbers');
    if (!codeEditor || !lineNumbers) return;

    const lines = codeEditor.value.split('\n');
    let numbers = '';
    for (let i = 1; i <= lines.length; i++) {
        numbers += i + '<br>';
    }
    lineNumbers.innerHTML = numbers;
}

function updateHighlight() {
    const codeEditor = document.getElementById('codeEditor');
    const highlighting = document.getElementById('highlighting-content');
    if (!codeEditor || !highlighting) return;
    
    updateLineNumbers();
    let code = codeEditor.value;

    const keywords = ["const", "let", "var", "if", "else", "for", "while", "function", "return", "new", "try", "catch", "class", "switch", "case", "default", "donne", "declare", "si", "sinon", "tantque", "repete", "choisis", "autres", "classe", "pour", "fin", "stop", "continue", "rends"];
    const commands = [
        "fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps",
        "arc", "circle", "e", "rectangle", "ellipse", "line", "write", "font",
        "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth",
        "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards",
        "ds", "nce", "ng", "pencolor", "pc", "fillcolor", "fill", "canvascolor",
        "sin", "cos", "tan", "atan", "pi", "sqrt", "pow", "abs", "exp", "ln", "random", "m",
        "integer", "round", "ceil", "mod", "modulo", "o", "min", "max", "rgb",
        "playsound", "showimage", "showvideo", "repeat",
        "av", "re", "td", "tg", "lc", "bc", "ve", "ct", "mt", "fcc", "fcb", "fcap", "fpos", "fca", "ftc",
        "répète", "écris", "remplis", "tampon", "dégradé", "opacité", "fluide", "joue",
        "afficheImage", "afficheVideo", "cercle", "polygone", "étoile", "rvb",
        "AV", "RE", "TD", "TG", "LC", "BC", "VE", "CT", "MT", "FCC", "FCB", "FCAP", "FPOS", "FCA", "FTC",
        "REPETE", "ECRIS", "REMPLIS", "TAMPON", "DEGRADE", "OPACITE", "FLUIDE", "JOUE",
        "AFFICHEIMAGE", "AFFICHEVIDEO", "CERCLE", "POLYGONE", "ETOILE", "RVB",
        "FD", "BK", "RT", "LT", "PU", "PD", "CS", "CLEAN", "HOME", "SETCOLOR", "SETWIDTH", "PS",
        "ARC", "CIRCLE", "RECTANGLE", "ELLIPSE", "LINE", "WRITE", "FONT",
        "POLYGON", "STAR", "STAMP", "DRAWIMAGE", "GRADIENT", "OPACITY", "SMOOTH",
        "SETXY", "SETHEADING", "HT", "ST", "POSX", "POSY", "HEADING", "DISTANCE", "TOWARDS",
        "DS", "NCE", "NG", "PENCOLOR", "PC", "FILLCOLOR", "FILL", "CANVASCOLOR"
    ];

    const combinedRegex = new RegExp(
        '(\\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)|' + 
        '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^\\\\`]|\\\\.)*`)|' + 
        '(\\b\\d+(?:\\.\\d+)?\\b)|' + 
        '(:[a-zA-Z0-9_$À-ÿ]+)|' +
        '([^a-zA-Z0-9_À-ÿ]|^)(' + keywords.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + 
        '([^a-zA-Z0-9_À-ÿ]|^)(' + commands.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + 
        '([\\+\\-\\*/\\(\\),\\;\\[\\]\\{\\}\\.])|' + 
        '([a-zA-Z_$À-ÿ][a-zA-Z0-9_$À-ÿ]*)', 
        'gi'
    );

    let highlighted = '';
    let lastIndex = 0;
    
    code.replace(combinedRegex, (match, comment, string, number, variable, k_pre, keyword, c_pre, command, operator, unknown, offset) => {
        highlighted += code.substring(lastIndex, offset)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
        if (comment) highlighted += `<span class="hl-comment">${comment.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (string) highlighted += `<span class="hl-string">${string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (number) highlighted += `<span class="hl-number">${number}</span>`;
        else if (variable) highlighted += `<span class="hl-variable">${variable}</span>`;
        else if (keyword) {
            highlighted += k_pre;
            highlighted += `<span class="hl-keyword">${keyword}</span>`;
        }
        else if (command) {
            highlighted += c_pre;
            highlighted += `<span class="hl-command">${command}</span>`;
        }
        else if (operator) highlighted += `<span class="hl-operator">${operator.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (unknown) {
            // Check if unknown is a user proc
            const procSearch = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
            const userProcs = [];
            const procRegex = /\bpour\s+([a-zA-Z0-9_$À-ÿ]+)/gi;
            let m;
            while ((m = procRegex.exec(procSearch)) !== null) { userProcs.push(m[1].toUpperCase()); }

            if (userProcs.includes(unknown.toUpperCase())) {
                highlighted += `<span class="hl-userproc">${unknown}</span>`;
            } else {
                highlighted += `<span class="hl-unknown">${unknown}</span>`;
            }
        }
        
        lastIndex = offset + match.length;
        return match;
    });
    
    highlighted += code.substring(lastIndex).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    highlighting.innerHTML = highlighted + (code.endsWith('\n') ? ' ' : '');
}

function syncScroll() {
    const codeEditor = document.getElementById('codeEditor');
    const highlighting = document.getElementById('highlighting');
    const lineNumbers = document.getElementById('line-numbers');
    if (codeEditor && highlighting) {
        highlighting.scrollTop = codeEditor.scrollTop;
        highlighting.scrollLeft = codeEditor.scrollLeft;
        if (lineNumbers) {
            lineNumbers.scrollTop = codeEditor.scrollTop;
        }
    }
}

function logToTerminal(msg, type = 'log') {
    const terminal = document.getElementById('terminalOutput');
    if (!terminal) return;
    const div = document.createElement('div');
    div.className = `terminal-msg terminal-${type}`;
    div.textContent = msg;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

function getHelpers() {
    return {
        fd, bk, rt, lt, pu, pd, cs, clean, home, setcolor, setwidth, ps,
        arc, circle, e, rectangle, ellipse, line, write, font,
        polygon, star, stamp, drawimage, gradient, opacity, smooth,
        setxy, setheading, ht, st, posx, posy, heading, distance, towards,
        ds, nce, ng, pencolor, pc, fillcolor, fill, canvascolor,
        sin, cos, tan, atan, pi, sqrt, pow, abs, exp, ln, random, m,
        integer, round, ceil, mod, modulo, o, min, max, rgb,
        playsound, showimage, showvideo, repeat,
        av, re, td, tg, lc, bc, ve, ct, mt, fcc, fcb, fcap, fpos, fca, ftc,
        répète, écris, tampon, dégradé, opacité, fluide, joue, 
        afficheImage, afficheVideo, cercle, polygone, étoile,
        FD: fd, BK: bk, RT: rt, LT: lt, PU: pu, PD: pd, CS: cs, CLEAN: clean, HOME: home,
        SETCOLOR: setcolor, SETWIDTH: setwidth, PS: ps,
        ARC: arc, CIRCLE: circle, E: e, RECTANGLE: rectangle, ELLIPSE: ellipse, LINE: line, WRITE: write, FONT: font,
        POLYGON: polygon, STAR: star, STAMP: stamp, DRAWIMAGE: drawimage, GRADIENT: gradient, OPACITY: opacity, SMOOTH: smooth,
        SETXY: setxy, SETHEADING: setheading, HT: ht, ST: st, POSX: posx, POSY: posy, HEADING: heading, NG: ng,
        DISTANCE: distance, NCE: nce, TOWARDS: towards, DS: ds,
        PENCOLOR: pencolor, PC: pc, FILLCOLOR: fillcolor, FILL: fill, CANVASCOLOR: canvascolor,
        REPEAT: repeat, AV: av, RE: re, TD: td, TG: tg, LC: lc, BC: bc, VE: ve, CT: ht, MT: st,
        FCC: fcc, FCB: fcb, FCAP: fcap, FPOS: fpos, FCA: fca, FTC: ftc,
        REPETE: repeat, ECRIS: écris, REMPLIS: remplis, TAMPON: stamp, DEGRADE: gradient, OPACITE: opacity, FLUIDE: smooth,
        JOUE: playsound, AFFICHEIMAGE: showimage, AFFICHEVIDEO: showvideo, RVB: rvb,
        CERCLE: circle, POLYGONE: polygon, ETOILE: star,
        console: {
            log: (...args) => logToTerminal(args.join(' '), 'log'),
            error: (...args) => logToTerminal(args.join(' '), 'error'),
            warn: (...args) => logToTerminal(args.join(' '), 'warn'),
            clear: () => { document.getElementById('terminalOutput').innerHTML = ''; }
        },
        print: (...args) => logToTerminal(args.join(' '), 'log')
    };
}

function runCode() {
    const terminal = document.getElementById('terminalOutput');
    if (terminal) terminal.innerHTML = '';
    const code = document.getElementById('codeEditor').value;
    turtle.reset();
    executeSnippet(code);
}

function executeSnippet(code) {
    let preparedCode = translateLogoToJS(code);
    preparedCode = preparedCode.replace(/\^/g, '**');
    try {
        const helpers = getHelpers();
        const keys = Object.keys(helpers);
        const values = Object.values(helpers);
        const execute = new Function(...keys, `"use strict";\n${preparedCode}`);
        execute(...values);
    } catch (err) {
        let lineNo = "Inconnue";
        if (err.stack) {
            const stackLines = err.stack.split('\n');
            for (let sLine of stackLines) {
                const m = sLine.match(/<anonymous>:(\d+):(\d+)/) || sLine.match(/eval at.*<anonymous>:(\d+):(\d+)/) || sLine.match(/eval:(\d+):(\d+)/);
                if (m) {
                    lineNo = parseInt(m[m.length - 2]) - 2; // Adjust for Function wrapper
                    if (lineNo < 0) lineNo = "Inconnue";
                    break;
                }
            }
        }

        const logoLines = code.split('\n');
        let errorMsg = `Erreur: ${err.message}\n`;
        if (lineNo !== "Inconnue" && logoLines[lineNo - 1] !== undefined) {
            errorMsg += `Ligne ${lineNo}: ${logoLines[lineNo - 1].trim()}`;
        } else {
            errorMsg += `Ligne: ${lineNo}`;
        }
        logToTerminal(errorMsg, 'error');
    }
}
