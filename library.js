(function(global) {
    // Global turtle instance (will be initialized in editorUI.js)
    global.turtle = null;

    const colorMap = {
        'rouge': 'red', 'vert': 'green', 'bleu': 'blue', 'jaune': 'yellow',
        'noir': 'black', 'blanc': 'white', 'rose': 'pink', 'orange': 'orange',
        'violet': 'purple', 'gris': 'gray', 'marron': 'brown', 'cyan': 'cyan',
        'magenta': 'magenta'
    };
    const translateColor = (c) => (typeof c === 'string') ? (colorMap[c.toLowerCase()] || c) : c;

    // Core Turtle functions
    global.fd = (n) => global.turtle.fd(n);
    global.bk = (n) => global.turtle.bk(n);
    global.rt = (n) => global.turtle.rt(n);
    global.lt = (n) => global.turtle.lt(n);
    global.pu = () => global.turtle.pu();
    global.pd = () => global.turtle.pd();
    global.cs = () => global.turtle.cs();
    global.clean = () => global.turtle.clean();
    global.home = () => global.turtle.home();

    global.setcolor = (c) => global.turtle.setcolor(translateColor(c));
    global.setwidth = (w) => global.turtle.setwidth(w);
    global.ps = global.setwidth;

    global.arc = (a, r) => global.turtle.arc(a, r);
    global.circle = (r) => global.turtle.circle(r);
    global.e = global.circle;
    global.rectangle = (w, h) => global.turtle.rectangle(w, h);
    global.ellipse = (w, h) => global.turtle.ellipse(w, h);
    global.line = (x1, y1, x2, y2) => global.turtle.line(x1, y1, x2, y2);
    global.write = (t) => global.turtle.write(t);
    global.font = (s) => global.turtle.font(s);

    global.polygon = (sides, size) => global.turtle.polygon(sides, size);
    global.star = (points, outer, inner) => global.turtle.star(points, outer, inner);
    global.stamp = () => global.turtle.stamp();
    global.tampon = global.stamp;
    global.drawimage = (url, w, h) => global.turtle.drawImage(url, w, h);
    global.gradient = (type, ...colors) => global.turtle.gradient(type, colors);
    global.opacity = (val) => global.turtle.opacity(val);
    global.smooth = (val) => global.turtle.smooth(val);

    global.setxy = (x, y) => global.turtle.setxy(x, y);
    global.setheading = (d) => global.turtle.setheading(d);
    global.ht = () => global.turtle.ht();
    global.st = () => global.turtle.st();
    global.posx = () => global.turtle.x;
    global.posy = () => global.turtle.y;
    global.heading = () => global.turtle.heading();
    global.ng = global.heading;
    global.distance = (x, y) => global.turtle.distance(x, y);
    global.nce = global.distance;
    global.towards = (x, y) => global.turtle.towards(x, y);
    global.ds = global.towards;

    global.pencolor = (c) => global.turtle.pencolor(translateColor(c));
    global.pc = global.pencolor;
    global.fillcolor = (c) => global.turtle.fillcolor(translateColor(c));
    global.fill = (c) => global.turtle.fill(c);
    global.remplis = global.fill;
    global.canvascolor = (c) => global.turtle.canvascolor(translateColor(c));

    global.repeat = (n, fn) => { for (let i = 0; i < n; i++) { fn(i); } };

    // Media functions
    global.playsound = (url) => { const audio = new Audio(url); audio.play(); };
    global.joue = global.playsound;

    global.showimage = (url, x, y, w, h) => {
        const img = new Image();
        img.onload = () => {
            const ix = (x !== undefined) ? x : global.turtle.x;
            const iy = (y !== undefined) ? y : global.turtle.y;
            const sx = global.turtle.originX + ix;
            const sy = global.turtle.originY - iy;
            if (w !== undefined && h !== undefined) {
                global.turtle.ctx.drawImage(img, sx - w/2, sy - h/2, w, h);
            } else {
                global.turtle.ctx.drawImage(img, sx - img.width/2, sy - img.height/2);
            }
        };
        img.src = url;
    };
    global.afficheImage = global.showimage;

    global.showvideo = (url, x, y, w, h) => {
        const video = document.createElement('video');
        video.src = url; video.autoplay = true; video.loop = true; video.muted = true;
        video.onplay = () => {
            const drawVideo = () => {
                if (video.paused || video.ended) return;
                const ix = (x !== undefined) ? x : global.turtle.x;
                const iy = (y !== undefined) ? y : global.turtle.y;
                const sx = global.turtle.originX + ix;
                const sy = global.turtle.originY - iy;
                const vw = w || 320; const vh = h || 240;
                global.turtle.ctx.drawImage(video, sx - vw/2, sy - vh/2, vw, vh);
                requestAnimationFrame(drawVideo);
            };
            drawVideo();
        };
    };
    global.afficheVideo = global.showvideo;

    function _logoLog(msg) {
        if (typeof global.logToTerminal === 'function') {
            global.logToTerminal(String(msg), 'log');
        } else {
            console.log(msg);
        }
    }
    global.ecris = _logoLog;
    global.écris = _logoLog;
    global.ECRIS = _logoLog;

    // French Aliases
    global.av = global.fd; global.re = global.bk; global.td = global.rt; global.tg = global.lt;
    global.lc = global.pu; global.bc = global.pd; global.ve = global.cs; global.ct = global.ht; global.mt = global.st;
    global.fcc = global.setcolor; global.fcb = global.fillcolor; global.fcap = global.setheading;
    global.fpos = global.setxy; global.fca = global.canvascolor; global.ftc = global.setwidth;
    global.cercle = global.circle; global.polygone = global.polygon;
    global.étoile = global.star; global.etoile = global.star;
    global.opacité = global.opacity; global.opacite = global.opacity;
    global.fluide = global.smooth; global.dégradé = global.gradient; global.degrade = global.gradient;

    // Uppercase Aliases
    const keys = ["fd", "bk", "rt", "lt", "pu", "pd", "cs", "clean", "home", "setcolor", "setwidth", "ps", "arc", "circle", "e", "rectangle", "ellipse", "line", "write", "font", "polygon", "star", "stamp", "drawimage", "gradient", "opacity", "smooth", "setxy", "setheading", "ht", "st", "posx", "posy", "heading", "ng", "distance", "nce", "towards", "ds", "pencolor", "pc", "fillcolor", "fill", "remplis", "canvascolor", "repeat", "av", "re", "td", "tg", "lc", "bc", "ve", "ct", "mt", "fcc", "fcb", "fcap", "fpos", "fca", "ftc", "cercle", "polygone", "étoile", "etoile", "opacité", "opacite", "fluide", "dégradé", "degrade", "tampon", "joue", "afficheImage", "afficheVideo"];
    keys.forEach(k => { global[k.toUpperCase()] = global[k]; });

})(window);
