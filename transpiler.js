(function(global) {
    let _logoLoopCounter = 0;
    const LOOP_MAX_ITERATIONS = 100000;

    function getFullArityMap(userProcs) {
        const fullMap = Object.assign({}, global.arityMap || {});
        for (let name in userProcs) { fullMap[name.toUpperCase()] = userProcs[name]; }
        return fullMap;
    }

    global.translateLogoToJS = function(code) {
        _logoLoopCounter = 0;
        const userProcs = {};
        let codeClean = code.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^\\`]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/)/g, "");
        const procRegex = /\bpour\s+([a-zA-Z0-9_$\u00C0-\u00FF]+)([^\n]*)/gi;
        let m;
        while ((m = procRegex.exec(codeClean)) !== null) {
            const name = m[1];
            const params = m[2].trim().split(/\s+/).filter(p => {
                if (p.startsWith(':')) return true;
                if (p === "") return false;
                const u = p.toUpperCase();
                return !global.LOGO_KEYWORDS.includes(u) && !global.LOGO_COMMANDS.includes(u);
            });
            userProcs[name.toUpperCase()] = params.length;
        }
        let js = translateBlocks(code, userProcs);
        js = js.replace(/:([a-zA-Z0-9_$\u00C0-\u00FF]+)/g, '$1');
        return js;
    };

    function tokenize(input) {
        return input.split(/(\s+|"(?:[^"\\]|\\.)*"|[\[\]{}();,]|\+\+|--|\+=|-=|\*=|\/=|==|=|\+|-|\*|\/|%|>|<|!|\^)/).filter(t => t.length > 0);
    }

    function translateBlocks(input, userProcs = {}, isClass = false, addSemicolons = true) {
        const fullArityMap = getFullArityMap(userProcs);
        let tokens = tokenize(input);
        let output = "";
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            let trimmed = token.trim();
            if (!trimmed) { output += token; continue; }
            if (trimmed === ",") continue;
            let upper = trimmed.toUpperCase();

            if (upper === 'POUR') {
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                let name = tokens[j] || ""; j++;
                let params = [];
                while (j < tokens.length) {
                    if (tokens[j].trim() === "") { if (tokens[j].includes('\n')) break; j++; continue; }
                    let t = tokens[j].trim();
                    if (t.startsWith(':')) { params.push(t.substring(1)); j++; continue; }
                    let u = t.toUpperCase();
                    if (t !== "" && !global.LOGO_KEYWORDS.includes(u) && !global.LOGO_COMMANDS.includes(u)) {
                        params.push(t); j++; continue;
                    }
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
                let nRes = transpileOneCommand(tokens, j, fullArityMap, userProcs);
                j = nRes.nextIdx; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (tokens[j] === '[') {
                    let endIdx = findBalancedTokens(tokens, '[', ']', j);
                    if (endIdx !== -1) {
                        let body = tokens.slice(j + 1, endIdx).join("");
                        let translatedBody = translateBlocks(body, userProcs);
                        const loopVar = `_i${_logoLoopCounter++}`;
                        const checkVar = `_c${_logoLoopCounter++}`;
                        output += `let ${checkVar}=0; for(let ${loopVar}=0; ${loopVar}<${nRes.js}; ${loopVar}++){ if(${checkVar}++ > ${LOOP_MAX_ITERATIONS}) throw new Error("Boucle infinie détectée"); ${translatedBody} }`;
                        i = endIdx; continue;
                    }
                }
            }
            if (upper === 'SI' || upper === 'IF' || upper === 'TANTQUE' || upper === 'WHILE') {
                const isSi = (upper === 'SI' || upper === 'IF');
                let j = i + 1; let condRes = transpileOneCommand(tokens, j, fullArityMap, userProcs, true);
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
                            const checkVar = `_c${_logoLoopCounter++}`;
                            output += `let ${checkVar}=0; while (${condRes.js}) { if(${checkVar}++ > ${LOOP_MAX_ITERATIONS}) throw new Error("Boucle infinie détectée"); ${translatedBody1} }`;
                            i = endIdx1; continue;
                        }
                    }
                }
            }
            if (upper === 'CHOISIS' || upper === 'SWITCH') {
                let j = i + 1; let valRes = transpileOneCommand(tokens, i + 1, fullArityMap, userProcs);
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
                        let valRes = transpileOneCommand(tokens, j + 1, fullArityMap, userProcs);
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} ${op} ${valRes.js}; `;
                        else output += `var ${varName} ${op} ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    } else {
                        let valRes = transpileOneCommand(tokens, j, fullArityMap, userProcs);
                        if (varName.includes('.') || varName.startsWith('this')) output += `${varName} = ${valRes.js}; `;
                        else output += `var ${varName} = ${valRes.js}; `;
                        i = valRes.nextIdx - 1;
                    }
                }
                continue;
            }

            if (token.startsWith(':')) {
                let varName = token.substring(1);
                let j = i + 1; while (j < tokens.length && tokens[j].trim() === "") j++;
                if (j < tokens.length && ["=", "+=", "-=", "*=", "/=", "++", "--"].includes(tokens[j])) {
                    let op = tokens[j];
                    if (op === "++" || op === "--") {
                        output += `${varName}${op}; `;
                        i = j;
                    } else {
                        let valRes = transpileOneCommand(tokens, j + 1, fullArityMap, userProcs);
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
                let sub = transpileOneCommand(tokens, i, fullArityMap, userProcs);
                output += sub.js + (addSemicolons ? "; " : ""); i = sub.nextIdx - 1;
            } else {
                if (token.startsWith('"')) {
                    if (token.endsWith('"') && token.length > 1) { output += token; }
                    else { output += JSON.stringify(token.substring(1)); }
                }
                else output += token;
            }
        }
        return output;
    }

    function transpileOneCommand(tokens, startIndex, fullArityMap, userProcs, isCondition = false) {
        let i = startIndex;
        while (i < tokens.length && (tokens[i].trim() === "" || tokens[i] === ",")) i++;
        if (i >= tokens.length) return { js: "", nextIdx: i };
        let token = tokens[i].trim(); let upper = token.toUpperCase(); let arity = fullArityMap[upper];
        let resultJS = ""; let currentIdx = i;
        if (arity === undefined) {
            if (token === "(") {
                let end = findBalancedTokens(tokens, '(', ')', i);
                if (end !== -1) { let insideJS = translateBlocks(tokens.slice(i + 1, end).join(""), userProcs, false, false); resultJS = "(" + insideJS + ")"; currentIdx = end + 1; }
            } else if (token === "-" || token === "!" || token === "+") {
                let sub = transpileOneCommand(tokens, i + 1, fullArityMap, userProcs, isCondition);
                resultJS = token + sub.js;
                currentIdx = sub.nextIdx;
            } else if (token === "[") {
                let end = findBalancedTokens(tokens, '[', ']', i);
                if (end !== -1) { let inside = tokens.slice(i + 1, end).join("").trim(); resultJS = JSON.stringify(inside); currentIdx = end + 1; }
            } else if (token.startsWith(':')) { resultJS = token.substring(1); currentIdx = i + 1; }
            else if (token.startsWith('"')) {
                if (token.endsWith('"') && token.length > 1) { resultJS = token; }
                else { resultJS = JSON.stringify(token.substring(1)); }
                currentIdx = i + 1;
            }
            else { resultJS = token; currentIdx = i + 1; }
        } else {
            let args = []; currentIdx = i + 1;
            for (let a = 0; a < arity; a++) { let sub = transpileOneCommand(tokens, currentIdx, fullArityMap, userProcs, isCondition); args.push(sub.js); currentIdx = sub.nextIdx; }
            resultJS = token + "(" + args.join(", ") + ")";
        }
        while (currentIdx < tokens.length) {
            let nextTok = tokens[currentIdx]; let nt = nextTok.trim();
            if (nt === "") {
                let peek = currentIdx + 1; while (peek < tokens.length && tokens[peek].trim() === "") peek++;
                if (peek < tokens.length && "+-*/%><=!^".split("").some(op => tokens[peek].trim().includes(op))) { resultJS += nextTok; currentIdx++; continue; }
                break;
            }
            if ("+-*/%><=!^".split("").some(op => nt.includes(op))) {
                let op = nt;
                if (isCondition && op === "=") op = "==";
                resultJS += op; currentIdx++;
                let sub = transpileOneCommand(tokens, currentIdx, fullArityMap, userProcs, isCondition); resultJS += sub.js; currentIdx = sub.nextIdx; continue;
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

})(window);
