class GridDrawEffect {
  constructor() {
    this.container = document.getElementById("exp-dibujar");
    if(!this.container) return;

    this.container.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "width:100%; height:100%; display:block; touch-action:none; background:transparent; position:absolute; top:0; left:0;";
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // Grid State (más chico por default = mayor densidad)
    this.gridX = 80;
    this.gridY = 60;
    this.gridData = []; 
    
    // Draw Settings
    this.drawMode = "normal"; // normal, 45, n45
    this.brushWidth = 1;
    this.brushHeight = 1;
    this.cornerRadius = 25; // 0 to 100
    
    this.history = [];
    this.historyIndex = -1;

    // Interaction
    this.isDrawing = false;
    this.isErasing = false; 

    this.initGrid();
    this.setupUI();
    this.setupEvents();
    
    window.addEventListener("resize", () => {
       if(this.container.classList.contains("active")) {
           this.resize();
           this.render();
       }
    });

    // Pequeño hack para forzar el renderizado exacto cuando se muestra la tab
    const obs = new MutationObserver(() => {
       if (this.container.classList.contains("active")) {
           this.resize();
           this.render();
       }
    });
    obs.observe(this.container, { attributes: true, attributeFilter: ['class'] });
    
    this.resize();
  }

  resize() {
    const r = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = r.width * dpr;
    this.canvas.height = r.height * dpr;
  }

  initGrid() {
    this.gridData = Array(this.gridX).fill(0).map(() => Array(this.gridY).fill(false));
    this.saveHistory();
  }

  saveHistory() {
    const stamp = JSON.parse(JSON.stringify(this.gridData));
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(stamp);
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.gridData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.gridData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
    }
  }

  clear() {
    this.gridData = Array(this.gridX).fill(0).map(() => Array(this.gridY).fill(false));
    this.saveHistory();
    this.render();
  }

  setupUI() {
    const rx = document.getElementById("ctrl-grid-x");
    if(rx) rx.addEventListener("input", e => { this.gridX = parseInt(e.target.value); document.getElementById("out-grid-x").textContent = this.gridX; this.initGrid(); this.render(); });
    const ry = document.getElementById("ctrl-grid-y");
    if(ry) ry.addEventListener("input", e => { this.gridY = parseInt(e.target.value); document.getElementById("out-grid-y").textContent = this.gridY; this.initGrid(); this.render(); });

    const bw = document.getElementById("ctrl-draw-width");
    if(bw) bw.addEventListener("input", e => { this.brushWidth = parseInt(e.target.value); document.getElementById("out-draw-width").textContent = this.brushWidth; this.render();});
    const bh = document.getElementById("ctrl-draw-height");
    if(bh) bh.addEventListener("input", e => { this.brushHeight = parseInt(e.target.value); document.getElementById("out-draw-height").textContent = this.brushHeight; this.render();});

    const rad = document.getElementById("ctrl-draw-radius");
    if(rad) rad.addEventListener("input", e => { this.cornerRadius = parseInt(e.target.value); document.getElementById("out-draw-radius").textContent = this.cornerRadius; this.render(); });

    // Modos
    ["normal", "45", "n45"].forEach(m => {
       const b = document.getElementById("btn-draw-" + m);
       if(!b) return;
       b.addEventListener("click", () => {
         ["normal", "45", "n45"].forEach(mm => document.getElementById("btn-draw-" + mm).classList.remove("active"));
         b.classList.add("active");
         this.drawMode = m;
         this.render();
       });
    });

    document.getElementById("btn-draw-clear")?.addEventListener("click", () => this.clear());
    document.getElementById("btn-draw-undo")?.addEventListener("click", () => this.undo());
    document.getElementById("btn-draw-redo")?.addEventListener("click", () => this.redo());
  }

  setupEvents() {
    const getPos = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return {
            mx: e.clientX - r.left,
            my: e.clientY - r.top
        };
    };

    const pointerDown = (e) => {
       if(!this.container.classList.contains("active")) return;
       // Permite tap en mobile y clic izq/der en desktop
       if(e.button !== 0 && e.button !== 2 && e.pointerType !== 'touch') return;
       this.isDrawing = true;
       // Clic derecho es borrar
       this.isErasing = e.button === 2; 

       const {mx, my} = getPos(e);
       this.mouseX = mx; this.mouseY = my;
       this.paintPoint(mx, my);
    };

    const pointerMove = (e) => {
       const {mx, my} = getPos(e);
       this.mouseX = mx; this.mouseY = my;
       
       // Fallback de seguridad: si pasamos el mouse pero soltamos el click y el sistema no lo registró (muy común en trackpads o tablets), frenamos.
       if (e.pointerType === 'mouse' && e.buttons === 0 && this.isDrawing) {
           this.isDrawing = false;
           this.saveHistory();
       }

       if(!this.isDrawing) {
           this.render(); // Para mostrar el hoover preview state
           return;
       }
       this.paintPoint(mx, my);
    };

    const pointerUp = (e) => {
       if(this.isDrawing) {
         this.isDrawing = false;
         this.saveHistory();
         this.render();
       }
    };

    this.canvas.addEventListener("pointerdown", pointerDown);
    this.canvas.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);

    // Context menu deshabilitado para habilitar borrado fluido con clic derecho
    this.canvas.addEventListener("contextmenu", e => e.preventDefault());
    
    this.canvas.addEventListener("pointerleave", () => {
       this.mouseX = null;
       this.mouseY = null;
       this.render();
    });
  }

  paintPoint(mx, my) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const dpr = window.devicePixelRatio || 1;
    
    const cellW = W / this.gridX;
    const cellH = H / this.gridY;

    // Normalizamos el mouse * dpr 
    const gx = Math.floor((mx * dpr) / cellW);
    const gy = Math.floor((my * dpr) / cellH);

    // Apply brush logic
    for(let i = 0; i < this.brushWidth; i++) {
      for(let j = 0; j < this.brushHeight; j++) {
         let tx = gx, ty = gy;

         if (this.drawMode === "normal") {
           tx = gx + i - Math.floor(this.brushWidth/2);
           ty = gy + j - Math.floor(this.brushHeight/2);
         } else if (this.drawMode === "45") {
           tx = (gx + i - j) - Math.floor((this.brushWidth - this.brushHeight)/2);
           ty = (gy + i + j) - Math.floor((this.brushWidth + this.brushHeight)/2); 
         } else if (this.drawMode === "n45") {
           tx = (gx + i + j) - Math.floor((this.brushWidth + this.brushHeight)/2);
           ty = (gy - i + j) + Math.floor((this.brushWidth - this.brushHeight)/2);
         }

         if(tx >= 0 && tx < this.gridX && ty >= 0 && ty < this.gridY) {
            this.gridData[tx][ty] = !this.isErasing;
         }
      }
    }
    this.render();
  }

  render() {
     if(!this.container.classList.contains("active")) return;
     const W = this.canvas.width;
     const H = this.canvas.height;
     const dpr = window.devicePixelRatio || 1;

     const ctx = this.ctx;

     ctx.clearRect(0, 0, W, H);

     const cw = W / this.gridX;
     const ch = H / this.gridY;

     // Draw subtle grid lines
     ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
     ctx.lineWidth = 1 * dpr;
     ctx.beginPath();
     for(let i=0; i<=this.gridX; i++) {
       ctx.moveTo(i*cw, 0); ctx.lineTo(i*cw, H);
     }
     for(let j=0; j<=this.gridY; j++) {
       ctx.moveTo(0, j*ch); ctx.lineTo(W, j*ch);
     }
     ctx.stroke();

     // Preview brush cursor
     if(this.mouseX != null && !this.isDrawing) {
        const mx = this.mouseX * dpr;
        const my = this.mouseY * dpr;
        const gx = Math.floor(mx / cw);
        const gy = Math.floor(my / ch);

        ctx.fillStyle = "rgba(100, 100, 255, 0.4)"; 
        for(let i=0; i<this.brushWidth; i++) {
          for(let j=0; j<this.brushHeight; j++) {
             let tx = gx, ty = gy;
             if (this.drawMode === "normal") {
               tx = gx + i - Math.floor(this.brushWidth/2);
               ty = gy + j - Math.floor(this.brushHeight/2);
             } else if (this.drawMode === "45") {
               tx = (gx + i - j) - Math.floor((this.brushWidth - this.brushHeight)/2);
               ty = (gy + i + j) - Math.floor((this.brushWidth + this.brushHeight)/2); 
             } else if (this.drawMode === "n45") {
               tx = (gx + i + j) - Math.floor((this.brushWidth + this.brushHeight)/2);
               ty = (gy - i + j) + Math.floor((this.brushWidth - this.brushHeight)/2);
             }
             if(tx >= 0 && tx < this.gridX && ty >= 0 && ty < this.gridY) {
                // simple sub block
                ctx.fillRect(tx*cw, ty*ch, cw+.5, ch+.5);
             }
          }
        }
     }

     // Render shapes (Black pixels)
     ctx.fillStyle = "#000000";
     
     // Corner radius logic
     const maxR = Math.min(cw, ch) / 2;
     const rVal = (this.cornerRadius / 100) * maxR;

     ctx.beginPath();
     for(let x=0; x<this.gridX; x++) {
       for(let y=0; y<this.gridY; y++) {
         if(this.gridData[x][y]) {
            // Evaluando fronteras exteriores
            const top = (y > 0) ? this.gridData[x][y-1] : false;
            const bottom = (y < this.gridY-1) ? this.gridData[x][y+1] : false;
            const left = (x > 0) ? this.gridData[x-1][y] : false;
            const right = (x < this.gridX-1) ? this.gridData[x+1][y] : false;

            const tl = (!top && !left) ? rVal : 0;
            const tr = (!top && !right) ? rVal : 0;
            const br = (!bottom && !right) ? rVal : 0;
            const bl = (!bottom && !left) ? rVal : 0;

            const wx = x*cw;
            const wy = y*ch;
            
            // Standard rounded rect build
            ctx.moveTo(wx + tl, wy);
            ctx.lineTo(wx + cw - tr, wy);
            if(tr>0) ctx.quadraticCurveTo(wx + cw, wy, wx + cw, wy + tr);
            ctx.lineTo(wx + cw, wy + ch - br);
            if(br>0) ctx.quadraticCurveTo(wx + cw, wy + ch, wx + cw - br, wy + ch);
            ctx.lineTo(wx + bl, wy + ch);
            if(bl>0) ctx.quadraticCurveTo(wx, wy + ch, wx, wy + ch - bl);
            ctx.lineTo(wx, wy + tl);
            if(tl>0) ctx.quadraticCurveTo(wx, wy, wx + tl, wy);
            ctx.closePath();
         }
       }
     }
     ctx.fill();
  }
}

new GridDrawEffect();
