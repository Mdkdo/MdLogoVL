class Turtle {
    constructor(canvas, turtleLayer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.turtleLayer = turtleLayer;
        this.turtleCtx = turtleLayer ? turtleLayer.getContext('2d') : null;
        this.turtleImage = null;
        this.reset();
    }

    reset() {
        this.originX = this.canvas.width / 2;
        this.originY = this.canvas.height / 2;
        this.x = 0; // Relative to origin
        this.y = 0; // Relative to origin
        this.angle = Math.PI / 2; // Pointing up (90 degrees in math sense if Y is up)
        this.isProcessing = false;
        this.commandQueue = [];
        this.penDown = true;
        this.color = '#000000';
        this.fillColor = '#000000';
        this.width = 1;
        this.visible = true;
        this.fontName = '12px Arial';
        this.speed = 1000; // Fast by default
        this.isDrawingSmooth = false;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentPath = new Path2D();
        this.currentPath.moveTo(this.originX + this.x, this.originY - this.y);
        
        if (this.turtleCtx) {
            this.draw();
        }
    }

    fd(dist) {
        if (this.isDrawingSmooth) {
            this.commandQueue.push({ type: 'fd', dist });
            this.processQueue();
            return;
        }
        const newX = this.x + dist * Math.cos(this.angle);
        const newY = this.y + dist * Math.sin(this.angle);
        
        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.originX + this.x, this.originY - this.y);
            this.ctx.lineTo(this.originX + newX, this.originY - newY);
            this.ctx.stroke();
            this.currentPath.lineTo(this.originX + newX, this.originY - newY);
        } else {
            this.currentPath.moveTo(this.originX + newX, this.originY - newY);
        }
        
        this.x = newX;
        this.y = newY;
        this.draw();
    }

    bk(dist) {
        this.fd(-dist);
    }

    rt(deg) {
        if (this.isDrawingSmooth) {
            this.commandQueue.push({ type: 'rt', deg });
            this.processQueue();
            return;
        }
        // Turtle rt is clockwise. If Y is up, clockwise rotation decreases the math angle.
        this.angle -= (deg * Math.PI) / 180;
        this.draw();
    }

    lt(deg) {
        if (this.isDrawingSmooth) {
            this.commandQueue.push({ type: 'lt', deg });
            this.processQueue();
            return;
        }
        this.angle += (deg * Math.PI) / 180;
        this.draw();
    }

    pu() {
        this.penDown = false;
    }

    pd() {
        this.penDown = true;
    }

    cs() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentPath = new Path2D();
        this.home();
    }

    clean() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentPath = new Path2D();
        this.currentPath.moveTo(this.originX + this.x, this.originY - this.y);
    }

    home() {
        this.x = 0;
        this.y = 0;
        this.angle = Math.PI / 2;
        this.currentPath.moveTo(this.originX + this.x, this.originY - this.y);
        this.draw();
    }


    setwidth(width) {
        this.width = width;
    }

    arc(angle, radius) {
        const startAngle = -this.angle;
        const endAngle = -(this.angle + (angle * Math.PI) / 180);
        
        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.beginPath();
            this.ctx.arc(this.originX + this.x, this.originY - this.y, radius, startAngle, endAngle, angle > 0);
            this.ctx.stroke();
        }
        this.currentPath.arc(this.originX + this.x, this.originY - this.y, radius, startAngle, endAngle, angle > 0);
    }

    circle(radius) {
        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.beginPath();
            this.ctx.arc(this.originX + this.x, this.originY - this.y, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        this.currentPath.arc(this.originX + this.x, this.originY - this.y, radius, 0, 2 * Math.PI);
    }

    rectangle(x1, y1, x2, y2) {
        let rx, ry, rw, rh;
        if (x2 === undefined) {
            rx = this.originX + this.x;
            ry = this.originY - this.y - y1;
            rw = x1;
            rh = y1;
        } else {
            const ux = Math.min(x1, x2);
            const uy = Math.max(y1, y2);
            rw = Math.abs(x2 - x1);
            rh = Math.abs(y2 - y1);
            rx = this.originX + ux;
            ry = this.originY - uy;
        }

        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.strokeRect(rx, ry, rw, rh);
        }
        this.currentPath.rect(rx, ry, rw, rh);
    }

    ellipse(x1, y1, x2, y2) {
        let ex, ey, erx, ery, erot;
        if (x2 === undefined) {
            ex = this.originX + this.x;
            ey = this.originY - this.y;
            erx = x1 / 2;
            ery = y1 / 2;
            erot = -this.angle;
        } else {
            ex = this.originX + (x1 + x2) / 2;
            ey = this.originY - (y1 + y2) / 2;
            erx = Math.abs(x2 - x1) / 2;
            ery = Math.abs(y2 - y1) / 2;
            erot = 0;
        }

        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.beginPath();
            this.ctx.ellipse(ex, ey, erx, ery, erot, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        this.currentPath.ellipse(ex, ey, erx, ery, erot, 0, 2 * Math.PI);
    }

    line(x1, y1, x2, y2) {
        if (this.penDown) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.width;
            this.ctx.beginPath();
            this.ctx.moveTo(this.originX + x1, this.originY - y1);
            this.ctx.lineTo(this.originX + x2, this.originY - y2);
            this.ctx.stroke();
        }
        this.currentPath.moveTo(this.originX + x1, this.originY - y1);
        this.currentPath.lineTo(this.originX + x2, this.originY - y2);
    }

    write(text) {
        this.ctx.font = this.fontName;
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(text, this.originX + this.x, this.originY - this.y);
    }

    font(style) {
        this.fontName = style;
    }

    polygon(sides, size) {
        const deg = 360 / sides;
        for (let i = 0; i < sides; i++) {
            this.fd(size);
            this.rt(deg);
        }
    }

    star(points, outerRadius, innerRadius) {
        let step = Math.PI / points;
        this.ctx.beginPath();
        for (let i = 0; i < 2 * points; i++) {
            let r = (i % 2 === 0) ? outerRadius : innerRadius;
            let currX = this.x + r * Math.cos(this.angle + i * step);
            let currY = this.y + r * Math.sin(this.angle + i * step);
            const sx = this.originX + currX;
            const sy = this.originY - currY;
            if (i === 0) {
                this.ctx.moveTo(sx, sy);
                this.currentPath.moveTo(sx, sy);
            } else {
                this.ctx.lineTo(sx, sy);
                this.currentPath.lineTo(sx, sy);
            }
        }
        this.ctx.closePath();
        this.currentPath.closePath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.width;
        this.ctx.stroke();
    }

    stamp() {
        this.drawOnCanvas(this.ctx);
    }

    drawOnCanvas(targetCtx) {
        targetCtx.save();
        targetCtx.translate(this.originX + this.x, this.originY - this.y);
        targetCtx.rotate(-this.angle + Math.PI / 2);
        if (this.turtleImage) {
            const size = 30;
            targetCtx.drawImage(this.turtleImage, -size/2, -size/2, size, size);
        } else {
            targetCtx.beginPath();
            targetCtx.moveTo(0, -10);
            targetCtx.lineTo(7, 10);
            targetCtx.lineTo(-7, 10);
            targetCtx.closePath();
            targetCtx.fillStyle = 'green';
            targetCtx.fill();
            targetCtx.strokeStyle = 'black';
            targetCtx.lineWidth = 1;
            targetCtx.stroke();
        }
        targetCtx.restore();
    }

    drawImage(url, w, h) {
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, this.originX + this.x - w/2, this.originY - this.y - h/2, w, h);
            this.draw();
        };
        img.src = url;
    }

    gradient(type, colors) {
        let grd;
        if (type === 'linear') {
            grd = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        } else {
            grd = this.ctx.createRadialGradient(this.originX + this.x, this.originY - this.y, 5, this.originX + this.x, this.originY - this.y, 100);
        }
        colors.forEach((c, i) => grd.addColorStop(i / (colors.length - 1), c));
        this.color = grd;
    }

    opacity(value) {
        this.ctx.globalAlpha = value;
    }

    setTurtleImage(url) {
        if (!url) {
            this.turtleImage = null;
            this.draw();
            return;
        }
        const img = new Image();
        img.onload = () => {
            this.turtleImage = img;
            this.draw();
        };
        img.src = url;
    }

    setxy(x, y) {
        this.x = x;
        this.y = y;
        this.currentPath.moveTo(this.originX + this.x, this.originY - this.y);
        this.draw();
    }

    setheading(deg) {
        // User heading 0 is up. Math angle 90deg is up.
        this.angle = (90 - deg) * Math.PI / 180;
        this.draw();
    }

    ht() {
        this.visible = false;
        this.draw();
    }

    st() {
        this.visible = true;
        this.draw();
    }

    posx() { return this.x; }
    posy() { return this.y; }
    heading() { 
        let h = 90 - (this.angle * 180 / Math.PI);
        while (h < 0) h += 360;
        while (h >= 360) h -= 360;
        return h;
    }

    distance(x, y) {
        return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    }

    towards(x, y) {
        const angle = Math.atan2(y - this.y, x - this.x);
        let h = 90 - (angle * 180 / Math.PI);
        while (h < 0) h += 360;
        while (h >= 360) h -= 360;
        return h;
    }

    setcolor(color) {
        this.color = color;
    }

    pencolor(c) { this.setcolor(c); }
    fillcolor(c) { this.fillColor = c; }
    
    fill(color) {
        if (color) this.fillColor = color;
        this.ctx.fillStyle = this.fillColor;
        this.ctx.fill(this.currentPath);
    }

    canvascolor(c) {
        this.canvas.style.backgroundColor = c;
    }

    draw() {
        if (!this.turtleCtx) return;

        this.turtleCtx.clearRect(0, 0, this.turtleLayer.width, this.turtleLayer.height);

        if (!this.visible) return;

        this.turtleCtx.save();
        this.turtleCtx.translate(this.originX + this.x, this.originY - this.y);
        this.turtleCtx.rotate(-this.angle + Math.PI / 2);

        if (this.turtleImage) {
            const size = 30;
            this.turtleCtx.drawImage(this.turtleImage, -size/2, -size/2, size, size);
        } else {
            this.turtleCtx.beginPath();
            this.turtleCtx.moveTo(0, -10);
            this.turtleCtx.lineTo(7, 10);
            this.turtleCtx.lineTo(-7, 10);
            this.turtleCtx.closePath();

            this.turtleCtx.fillStyle = 'green';
            this.turtleCtx.fill();
            this.turtleCtx.strokeStyle = 'black';
            this.turtleCtx.lineWidth = 1;
            this.turtleCtx.stroke();
        }

        this.turtleCtx.restore();
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.commandQueue.length > 0) {
            const cmd = this.commandQueue.shift();
            if (cmd.type === 'fd') {
                await this.animateFd(cmd.dist);
            } else if (cmd.type === 'rt') {
                await this.animateRotate(cmd.deg);
            } else if (cmd.type === 'lt') {
                await this.animateRotate(-cmd.deg);
            }
        }

        this.isProcessing = false;
    }

    animateFd(dist) {
        return new Promise(resolve => {
            if (!this.isProcessing) return resolve();
            const steps = Math.max(1, Math.abs(dist) / (this.speed / 60));
            const stepX = (dist * Math.cos(this.angle)) / steps;
            const stepY = (dist * Math.sin(this.angle)) / steps;
            let currentStep = 0;

            const animate = () => {
                if (!this.isProcessing) return resolve();
                if (currentStep < steps) {
                    const nextX = this.x + stepX;
                    const nextY = this.y + stepY;
                    if (this.penDown) {
                        this.ctx.strokeStyle = this.color;
                        this.ctx.lineWidth = this.width;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.originX + this.x, this.originY - this.y);
                        this.ctx.lineTo(this.originX + nextX, this.originY - nextY);
                        this.ctx.stroke();
                        this.currentPath.lineTo(this.originX + nextX, this.originY - nextY);
                    } else {
                        this.currentPath.moveTo(this.originX + nextX, this.originY - nextY);
                    }
                    this.x = nextX;
                    this.y = nextY;
                    this.draw();
                    currentStep++;
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    animateRotate(deg) {
        return new Promise(resolve => {
            if (!this.isProcessing) return resolve();
            // rt is clockwise, so if Y is up, it decreases math angle.
            // But deg passed to animateRotate is signed. 
            // If rt(90) called, animateRotate(-90) should be called? 
            // Wait, processQueue calls animateRotate(cmd.deg) for rt, and animateRotate(-cmd.deg) for lt.
            // So if rt(90), deg=90. Math angle should decrease by 90.
            const rad = -(deg * Math.PI) / 180;
            const steps = Math.max(1, Math.abs(deg) / 5);
            const stepRad = rad / steps;
            let currentStep = 0;

            const animate = () => {
                if (!this.isProcessing) return resolve();
                if (currentStep < steps) {
                    this.angle += stepRad;
                    this.draw();
                    currentStep++;
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    smooth(active) {
        this.isDrawingSmooth = active !== false;
    }

    stop() {
        this.isProcessing = false;
        this.commandQueue = [];
    }

    // Alias for common Logo commands
    forward(dist) { this.fd(dist); }
    back(dist) { this.bk(dist); }
    right(deg) { this.rt(deg); }
    left(deg) { this.lt(deg); }
    penup() { this.pu(); }
    pendown() { this.pd(); }
    clearscreen() { this.cs(); }
}

if (typeof module !== 'undefined') {
    module.exports = Turtle;
}
