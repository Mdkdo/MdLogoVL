// Global turtle instance (will be initialized in editorUI.js)
var turtle;

// Helper functions for the user code
var fd = (n) => turtle.fd(n);
var bk = (n) => turtle.bk(n);
var rt = (n) => turtle.rt(n);
var lt = (n) => turtle.lt(n);
var pu = () => turtle.pu();
var pd = () => turtle.pd();
var cs = () => turtle.cs();
var clean = () => turtle.clean();
var home = () => turtle.home();

var colorMap = {
    'rouge': 'red', 'vert': 'green', 'bleu': 'blue', 'jaune': 'yellow',
    'noir': 'black', 'blanc': 'white', 'rose': 'pink', 'orange': 'orange',
    'violet': 'purple', 'gris': 'gray', 'marron': 'brown', 'cyan': 'cyan',
    'magenta': 'magenta'
};
var translateColor = (c) => (typeof c === 'string') ? (colorMap[c.toLowerCase()] || c) : c;

var setcolor = (c) => turtle.setcolor(translateColor(c));
var setwidth = (w) => turtle.setwidth(w);
var ps = setwidth;

var arc = (a, r) => turtle.arc(a, r);
var circle = (r) => turtle.circle(r);
var e = circle;
var rectangle = (w, h) => turtle.rectangle(w, h);
var ellipse = (w, h) => turtle.ellipse(w, h);
var line = (x1, y1, x2, y2) => turtle.line(x1, y1, x2, y2);
var write = (t) => turtle.write(t);
var font = (s) => turtle.font(s);

var polygon = (sides, size) => turtle.polygon(sides, size);
var star = (points, outer, inner) => turtle.star(points, outer, inner);
var stamp = () => turtle.stamp();
var drawimage = (url, w, h) => turtle.drawImage(url, w, h);
var gradient = (type, ...colors) => turtle.gradient(type, colors);
var opacity = (val) => turtle.opacity(val);
var smooth = (val) => turtle.smooth(val);

var setxy = (x, y) => turtle.setxy(x, y);
var setheading = (d) => turtle.setheading(d);
var ht = () => turtle.ht();
var st = () => turtle.st();
var posx = () => turtle.posx();
var posy = () => turtle.posy();
var heading = () => turtle.heading();
var ng = heading;
var distance = (x, y) => turtle.distance(x, y);
var nce = distance;
var towards = (x, y) => turtle.towards(x, y);
var ds = towards;

var pencolor = (c) => turtle.pencolor(translateColor(c));
var pc = pencolor;
var fillcolor = (c) => turtle.fillcolor(translateColor(c));
var fill = (c) => turtle.fill(c);
var canvascolor = (c) => turtle.canvascolor(translateColor(c));

var repeat = (n, fn) => {
    for (let i = 0; i < n; i++) {
        fn(i);
    }
};

// Media functions
var playsound = (url) => {
    const audio = new Audio(url);
    audio.play();
};

var showimage = (url, x, y, w, h) => {
    const img = new Image();
    img.onload = () => {
        const ix = (x !== undefined) ? x : turtle.x;
        const iy = (y !== undefined) ? y : turtle.y;
        const sx = turtle.originX + ix;
        const sy = turtle.originY - iy;
        if (w !== undefined && h !== undefined) {
            turtle.ctx.drawImage(img, sx - w/2, sy - h/2, w, h);
        } else {
            turtle.ctx.drawImage(img, sx - img.width/2, sy - img.height/2);
        }
    };
    img.src = url;
};

var showvideo = (url, x, y, w, h) => {
    const video = document.createElement('video');
    video.src = url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.onplay = () => {
        const drawVideo = () => {
            if (video.paused || video.ended) return;
            const ix = (x !== undefined) ? x : turtle.x;
            const iy = (y !== undefined) ? y : turtle.y;
            const sx = turtle.originX + ix;
            const sy = turtle.originY - iy;
            const vw = w || 320;
            const vh = h || 240;
            turtle.ctx.drawImage(video, sx - vw/2, sy - vh/2, vw, vh);
            requestAnimationFrame(drawVideo);
        };
        drawVideo();
    };
};

// French Aliases
var av = fd;
var re = bk;
var td = rt;
var tg = lt;
var lc = pu;
var bc = pd;
var ve = cs;
var ct = ht;
var mt = st;
var fcc = setcolor;
var fcb = fillcolor;
var fcap = setheading;
var fpos = setxy;
var fca = canvascolor;
var ftc = setwidth;
var remplis = fill;
var rvb = (r, g, b) => `rgb(${r},${g},${b})`;
var écris = write;
var tampon = stamp;
var dégradé = gradient;
var opacité = opacity;
var fluide = smooth;
var joue = playsound;
var afficheImage = showimage;
var afficheVideo = showvideo;
var cercle = circle;
var polygone = polygon;
var étoile = star;
var répète = repeat;

// Uppercase aliases
var FD = fd, BK = bk, RT = rt, LT = lt, PU = pu, PD = pd, CS = cs, CLEAN = clean, HOME = home;
var SETCOLOR = setcolor, SETWIDTH = setwidth, PS = ps;
var ARC = arc, CIRCLE = circle, E = e, RECTANGLE = rectangle, ELLIPSE = ellipse, LINE = line, WRITE = write, FONT = font;
var POLYGON = polygon, STAR = star, STAMP = stamp, DRAWIMAGE = drawimage, GRADIENT = gradient, OPACITY = opacity, SMOOTH = smooth;
var SETXY = setxy, SETHEADING = setheading, HT = ht, ST = st, POSX = posx, POSY = posy, HEADING = heading, NG = ng;
var DISTANCE = distance, NCE = nce, TOWARDS = towards, DS = ds;
var PENCOLOR = pencolor, PC = pc, FILLCOLOR = fillcolor, FILL = fill, CANVASCOLOR = canvascolor;
var REPEAT = repeat;

var AV = av, RE = re, TD = td, TG = tg, LC = lc, BC = bc, VE = ve, CT = ht, MT = st;
var FCC = fcc, FCB = fcb, FCAP = fcap, FPOS = fpos, FCA = fca, FTC = ftc;
var REPETE = repeat, ECRIS = écris, REMPLIS = remplis, TAMPON = tampon, DEGRADE = dégradé, OPACITE = opacité, FLUIDE = fluide;
var JOUE = joue, AFFICHEIMAGE = afficheImage, AFFICHEVIDEO = afficheVideo, RVB = rvb;
var CERCLE = cercle, POLYGONE = polygone, ETOILE = étoile;
