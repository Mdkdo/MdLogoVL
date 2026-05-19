const { readFileSync } = require('fs');
const content = readFileSync('editorSyntaxe.js', 'utf8');
const match = content.match(/function translateLogoToJS\(code\) \{([\s\S]*?\n)\}/);
const funcBody = match[1];
const translateLogoToJS = new Function('code', funcBody);

console.log("--- Multi-command line ---");
console.log(translateLogoToJS("donne :i 0 tantque (:i < 10) [ AV :i donne :i (:i + 1) ]"));
