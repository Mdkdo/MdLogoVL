// Math functions (in degrees)
const degToRad = (d) => (d * Math.PI) / 180;
const radToDeg = (r) => (r * 180) / Math.PI;

var sin = (d) => Math.sin(degToRad(d));
var cos = (d) => Math.cos(degToRad(d));
var tan = (d) => Math.tan(degToRad(d));
var atan = (y, x) => radToDeg(Math.atan2(y, x));
var pi = Math.PI;
var sqrt = Math.sqrt;
var pow = Math.pow;
var abs = Math.abs;
var exp = Math.exp;
var ln = Math.log;
var random = (n) => Math.random() * n;
var m = random;
var integer = Math.floor;
var round = Math.round;
var ceil = Math.ceil;
var mod = (a, b) => a % b;
var modulo = mod;
var o = mod;
var min = Math.min;
var max = Math.max;
var rgb = (r, g, b) => `rgb(${r},${g},${b})`;
