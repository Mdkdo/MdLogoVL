function updateHighlight() {
    const codeEditor = document.getElementById('codeEditor');
    const highlighting = document.getElementById('highlighting-content');
    if (!codeEditor || !highlighting) return;
    
    let code = codeEditor.value;

    const keywords = ["const", "let", "var", "if", "else", "for", "while", "function", "return", "new", "try", "catch"];
    const commands = [
        "fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps",
        "arc", "circle", "e", "rectangle", "ellipse", "line", "write", "font",
        "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth",
        "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "distance", "towards",
        "ds", "nce", "ng", "pencolor", "pc", "fillcolor", "fill", "canvascolor",
        "sin", "cos", "tan", "atan", "pi", "sqrt", "pow", "abs", "exp", "ln", "random", "m",
        "integer", "round", "ceil", "mod", "modulo", "o", "min", "max", "rgb",
        "playsound", "showimage", "showvideo", "repeat",
        "av", "re", "td", "tg", "lc", "bc", "ve", "ct", "mt", "fcc", "fcl", "fcap", "fpos", "fct", 
        "répète", "écris", "tampon", "dégradé", "opacité", "fluide", "joue", 
        "afficheImage", "afficheVideo", "cercle", "polygone", "étoile"
    ];

    const combinedRegex = new RegExp(
        '(\\/\/.*|\\/\\*[\\s\\S]*?\\*\\/)|' + 
        '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^\\\\`]|\\\\.)*`)|' + 
        '(\\b\\d+(?:\\.\\d+)?\\b)|' + 
        '([^a-zA-Z0-9_À-ÿ]|^)(' + keywords.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + 
        '([^a-zA-Z0-9_À-ÿ]|^)(' + commands.join('|') + ')(?![a-zA-Z0-9_À-ÿ])|' + 
        '([\\+\\-\\*/\\(\\),\\;\\[\\]\\{\\}\\.])|' + 
        '([a-zA-Z_$À-ÿ][a-zA-Z0-9_$À-ÿ]*)', 
        'g'
    );

    let highlighted = '';
    let lastIndex = 0;
    
    code.replace(combinedRegex, (match, comment, string, number, k_pre, keyword, c_pre, command, operator, unknown, offset) => {
        highlighted += code.substring(lastIndex, offset)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
        if (comment) highlighted += `<span class="hl-comment">${comment.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (string) highlighted += `<span class="hl-string">${string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (number) highlighted += `<span class="hl-number">${number}</span>`;
        else if (keyword) {
            highlighted += k_pre;
            highlighted += `<span class="hl-keyword">${keyword}</span>`;
        }
        else if (command) {
            highlighted += c_pre;
            highlighted += `<span class="hl-command">${command}</span>`;
        }
        else if (operator) highlighted += `<span class="hl-operator">${operator.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        else if (unknown) highlighted += `<span class="hl-unknown">${unknown}</span>`;
        
        lastIndex = offset + match.length;
        return match;
    });
    
    highlighted += code.substring(lastIndex).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    highlighting.innerHTML = highlighted + (code.endsWith('\n') ? ' ' : '');
}

function syncScroll() {
    const codeEditor = document.getElementById('codeEditor');
    const highlighting = document.getElementById('highlighting');
    if (codeEditor && highlighting) {
        highlighting.scrollTop = codeEditor.scrollTop;
        highlighting.scrollLeft = codeEditor.scrollLeft;
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
        av, re, td, tg, lc, bc, ve, ct, mt, fcc, fcl, fcap, fpos, fct, 
        répète, écris, tampon, dégradé, opacité, fluide, joue, 
        afficheImage, afficheVideo, cercle, polygone, étoile,
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
    const code = document.getElementById('codeEditor').value;
    turtle.reset();
    executeSnippet(code);
}

function executeSnippet(code) {
    const preparedCode = code.replace(/\^/g, '**');
    try {
        const helpers = getHelpers();
        const keys = Object.keys(helpers);
        const values = Object.values(helpers);
        const execute = new Function(...keys, `"use strict";\n${preparedCode}`);
        execute(...values);
    } catch (err) {
        logToTerminal(err.message, 'error');
    }
}
