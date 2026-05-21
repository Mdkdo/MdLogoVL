(function(global) {
    global.pi = Math.PI;
    global.sqrt = Math.sqrt;
    global.pow = Math.pow;
    global.abs = Math.abs;
    global.exp = Math.exp;
    global.ln = Math.log;
    global.integer = Math.floor;
    global.round = Math.round;
    global.ceil = Math.ceil;
    global.min = Math.min;
    global.max = Math.max;

    const degToRad = (d) => (d * Math.PI) / 180;
    const radToDeg = (r) => (r * 180) / Math.PI;

    global.sin = (d) => Math.sin(degToRad(d));
    global.cos = (d) => Math.cos(degToRad(d));
    global.tan = (d) => Math.tan(degToRad(d));
    global.atan = (y, x) => radToDeg(Math.atan2(y, x));
    global.random = (n) => Math.random() * n;
    global.m = global.random;
    global.mod = (a, b) => a % b;
    global.modulo = global.mod;
    global.o = global.mod;
    global.rgb = (r, g, b) => \`rgb(\${r},\${g},\${b})\`;
    global.RVB = global.rgb;

    // Additional Math Aliases
    global.SIN = global.sin; global.COS = global.cos; global.TAN = global.tan; global.ATAN = global.atan;
    global.SQRT = global.sqrt; global.ABS = global.abs; global.EXP = global.exp; global.LN = global.ln;
    global.RANDOM = global.random; global.MOD = global.mod; global.MODULO = global.mod;
})(window);
