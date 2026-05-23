(function(global) {
    global.turtle = null;
    const colorMap = { 'rouge': 'red', 'vert': 'green', 'bleu': 'blue', 'jaune': 'yellow', 'noir': 'black', 'blanc': 'white', 'rose': 'pink', 'orange': 'orange', 'violet': 'purple', 'gris': 'gray', 'marron': 'brown', 'cyan': 'cyan', 'magenta': 'magenta' };
    const translateColor = (c) => (typeof c === 'string') ? (colorMap[c.toLowerCase()] || c) : c;

    const baseLibrary = {
        fd: (n) => global.turtle.fd(n),
        bk: (n) => global.turtle.bk(n),
        rt: (n) => global.turtle.rt(n),
        lt: (n) => global.turtle.lt(n),
        pu: () => global.turtle.pu(),
        pd: () => global.turtle.pd(),
        cs: () => global.turtle.cs(),
        clean: () => global.turtle.clean(),
        home: () => global.turtle.home(),
        setcolor: (c) => global.turtle.setcolor(translateColor(c)),
        setwidth: (w) => global.turtle.setwidth(w),
        arc: (a, r) => global.turtle.arc(a, r),
        circle: (r) => global.turtle.circle(r),
        rectangle: (w, h) => global.turtle.rectangle(w, h),
        ellipse: (w, h) => global.turtle.ellipse(w, h),
        line: (x1, y1, x2, y2) => global.turtle.line(x1, y1, x2, y2),
        write: (t) => global.turtle.write(t),
        font: (s) => global.turtle.font(s),
        polygon: (sides, size) => global.turtle.polygon(sides, size),
        star: (points, outer, inner) => global.turtle.star(points, outer, inner),
        stamp: () => global.turtle.stamp(),
        gradient: (type, ...colors) => global.turtle.gradient(type, colors),
        opacity: (val) => global.turtle.opacity(val),
        smooth: (val) => global.turtle.smooth(val),
        setxy: (x, y) => global.turtle.setxy(x, y),
        setheading: (d) => global.turtle.setheading(d),
        ht: () => global.turtle.ht(),
        st: () => global.turtle.st(),
        posx: () => global.turtle.x,
        posy: () => global.turtle.y,
        heading: () => global.turtle.heading(),
        distance: (x, y) => global.turtle.distance(x, y),
        towards: (x, y) => global.turtle.towards(x, y),
        pencolor: (c) => global.turtle.pencolor(translateColor(c)),
        fillcolor: (c) => global.turtle.fillcolor(translateColor(c)),
        fill: () => global.turtle.fill(),
        canvascolor: (c) => global.turtle.canvascolor(translateColor(c)),
        pi: Math.PI,
        sqrt: Math.sqrt,
        pow: Math.pow,
        abs: Math.abs,
        exp: Math.exp,
        ln: Math.log,
        integer: Math.floor,
        round: Math.round,
        ceil: Math.ceil,
        min: Math.min,
        max: Math.max,
        random: (n) => Math.random() * n,
        mod: (a, b) => a % b,
        rgb: (r, g, b) => `rgb(${r},${g},${b})`,
        playsound: (url) => { const audio = new Audio(url); audio.play(); },
        print: (msg) => { if (typeof global.logToTerminal === 'function') { global.logToTerminal(String(msg), 'log'); } else { console.log(msg); } },
        showimage: (url, x, y, w, h) => {
            const img = new Image();
            img.onload = () => {
                const ix = (x !== undefined) ? x : global.turtle.x;
                const iy = (y !== undefined) ? y : global.turtle.y;
                const sx = global.turtle.originX + ix;
                const sy = global.turtle.originY - iy;
                if (w !== undefined && h !== undefined) { global.turtle.ctx.drawImage(img, sx - w/2, sy - h/2, w, h); }
                else { global.turtle.ctx.drawImage(img, sx - img.width/2, sy - img.height/2); }
            };
            img.src = url;
        },
        showvideo: (url, x, y, w, h) => {
            const video = document.createElement('video'); video.src = url; video.autoplay = true; video.loop = true; video.muted = true;
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
        }
    };

    const degToRad = (d) => (d * Math.PI) / 180;
    const radToDeg = (r) => (r * 180) / Math.PI;
    baseLibrary.sin = (d) => Math.sin(degToRad(d));
    baseLibrary.cos = (d) => Math.cos(degToRad(d));
    baseLibrary.tan = (d) => Math.tan(degToRad(d));
    baseLibrary.atan = (y, x) => radToDeg(Math.atan2(y, x));

    // Register globally and create aliases
    Object.assign(global, baseLibrary);
    if (global.LOGO_COMMANDS_DATA) {
        global.LOGO_COMMANDS_DATA.forEach(cmd => {
            if (baseLibrary[cmd.js]) {
                global[cmd.fr] = baseLibrary[cmd.js];
                global[cmd.en.toUpperCase()] = baseLibrary[cmd.js];
            }
        });
    }

})(window);
