class AsciiBirdEffect {
  constructor() {
    this.container = document.getElementById("exp-pajaro");
    this.gif = document.getElementById("ave-gif");
    this.canvas = document.getElementById("ave-ascii-canvas");
    this.densityRange = document.getElementById("ctrl-ave-density");
    this.densityOut = document.getElementById("out-ave-density");
    
    if (!this.container || !this.gif || !this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    
    // Offscreen canvas para samplear pixeles rápido
    this.offCanvas = document.createElement("canvas");
    this.offCtx = this.offCanvas.getContext("2d", { willReadFrequently: true });

    // Una rampa ASCII de alta fidelidad desde oscuro a claro (ej. la estándar usada en arte avanzado)
    this.chars = " .`'^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    
    // Fijar la velocidad del GIF/Video permanentemente
    if(this.gif) {
        this.gif.playbackRate = 0.2;
    }

    // Nuevos sliders de procesamiento
    this.brightnessRange = document.getElementById("ctrl-ave-brightness");
    this.contrastRange = document.getElementById("ctrl-ave-contrast");
    this.thresholdRange = document.getElementById("ctrl-ave-threshold");

    // Escuchar cambios de densidad
    if(this.densityRange) {
        this.densityRange.addEventListener("input", () => {
            if(this.densityOut) this.densityOut.textContent = this.densityRange.value;
        });
    }

    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Loop
    this.render();
  }

  resize() {
    const parent = this.container.parentElement;
    this.canvas.width = parent.offsetWidth;
    this.canvas.height = parent.offsetHeight;
  }

  render() {
    requestAnimationFrame(() => this.render());

    // Solo dibujar si la experiencia está activa
    if (!this.container.classList.contains("active")) return;
    
    // Asegurarnos que el video tenga dimensiones útiles
    const vW = this.gif.videoWidth || this.gif.naturalWidth;
    const vH = this.gif.videoHeight || this.gif.naturalHeight;
    if (!vW || !vH || vW === 0 || vH === 0) return;

    const W = this.canvas.width;
    const H = this.canvas.height;
    const density = parseInt(this.densityRange ? this.densityRange.value : 8);

    // Limpiar canvas principal (volvemos a dejarlo 100% transparente para no perder el cielo)
    this.ctx.clearRect(0, 0, W, H);

    // Calcular dimensiones escaladas para samplear
    // Mientras más pequeño, menos columnas/filas
    const cols = Math.max(1, Math.floor(W / density));
    const rows = Math.max(1, Math.floor(H / density));

    this.offCanvas.width = cols;
    this.offCanvas.height = rows;

    clearTimeout(this.to);

    // Achicamos la imagen general multiplicando por un factor (ej: 0.5 para el 50%)
    const scaleFactor = 0.5; 
    
    // Contain logic (para que se vea todo el pajaro sin cortar y más centrado)
    const vWidth = this.gif.videoWidth || this.gif.naturalWidth;
    const vHeight = this.gif.videoHeight || this.gif.naturalHeight;
    const imgAspect = vWidth / vHeight;
    const screenAspect = cols / rows;
    
    let dw = cols * scaleFactor;
    let dh = rows * scaleFactor;

    if (imgAspect > screenAspect) {
        dh = dw / imgAspect;
    } else {
        dw = dh * imgAspect;
    }

    const dx = (cols - dw) / 2;
    const dy = (rows - dh) / 2;

    this.offCtx.clearRect(0, 0, cols, rows);
    this.offCtx.drawImage(this.gif, dx, dy, dw, dh);

    // Extraer data miniatura
    const imageData = this.offCtx.getImageData(0, 0, cols, rows);
    const data = imageData.data;

    // Ajustes de fuente y color (ELIMINAMOS EL STROKE NEGRO)
    this.ctx.fillStyle = "#ff2222"; // Rojo vibrante
    this.ctx.font = `bold ${density}px monospace`; 
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Valores procesado
    const bOffset = this.brightnessRange ? parseFloat(this.brightnessRange.value) : 0.0;
    const cFactor = this.contrastRange ? parseFloat(this.contrastRange.value) : 1.0;
    const threshold = this.thresholdRange ? parseFloat(this.thresholdRange.value) : 1.0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = (r * cols + c) * 4;
        const R = data[index];
        const G = data[index + 1];
        const B = data[index + 2];
        const a = data[index + 3];

        if (a === 0) continue; // skip transparent

        // Contrast adjustment
        let R2 = ((R / 255 - 0.5) * cFactor + 0.5) * 255;
        let G2 = ((G / 255 - 0.5) * cFactor + 0.5) * 255;
        let B2 = ((B / 255 - 0.5) * cFactor + 0.5) * 255;

        // Brightness offset
        R2 += bOffset * 255;
        G2 += bOffset * 255;
        B2 += bOffset * 255;

        R2 = Math.max(0, Math.min(255, R2));
        G2 = Math.max(0, Math.min(255, G2));
        B2 = Math.max(0, Math.min(255, B2));

        // Average Brightness
        const currentBrightness = (0.299 * R2 + 0.587 * G2 + 0.114 * B2) / 255;
        
        // Threshold (si supera el límite de brillo, lo hacemos "espacio vacío")
        let invBrightness = 1 - currentBrightness;
        if (currentBrightness >= threshold) {
            invBrightness = 0; // Transparente/Espacio si es el fondo brillante
        }

        const charIndex = Math.floor(invBrightness * (this.chars.length - 1));
        const char = this.chars[charIndex];
        
        // draw
        if (char !== ' ') {
          const x = c * density + density / 2;
          const y = r * density + density / 2;
          this.ctx.fillText(char, x, y);   // Sólo la letra roja pura
        }
      }
    }
  }
}

new AsciiBirdEffect();
