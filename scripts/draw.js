import * as THREE from "three";

// ── Bayer matrices ──────────────────────────────────────────────
const BAYER4 = [
   0, 8, 2,10,
  12, 4,14, 6,
   3,11, 1, 9,
  15, 7,13, 5
];

function bayerDither4(x, y, value, intensity) {
  const threshold = (BAYER4[(y % 4) * 4 + (x % 4)] / 16.0 - 0.5) * intensity;
  return value + threshold;
}

class PixelDrawEffect {
  constructor() {
    this.hero       = document.querySelector(".hero");
    this.video      = document.querySelector(".hero-video");
    this.logoImg    = document.querySelector(".draw-logo img");

    if (!this.hero || !this.video) return;

    this.settings = {
      grid: 120,
      drawEffectEnabled: false
    };

    // Logo dither state
    this.logoDither = {
      intensity: 0.0,   // 0 = nada, 1 = máximo
      pixelSize: 2      // tamaño de bloque para el dither del logo
    };

    this.init();
  }

  // ── VIDEO TEXTURE ───────────────────────────────────────────
  createVideoTexture() {
    const texture = new THREE.VideoTexture(this.video);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  // ── DATA TEXTURE ────────────────────────────────────────────
  createDataTexture() {
    const size = this.settings.grid;
    const data = new Float32Array(size * size * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 1;
    }

    this.dataTexture = new THREE.DataTexture(
      data, size, size,
      THREE.RGBAFormat,
      THREE.FloatType
    );

    this.dataTexture.needsUpdate    = true;
    this.dataTexture.magFilter      = THREE.NearestFilter;
    this.dataTexture.minFilter      = THREE.NearestFilter;
  }

  // ── DRAW PIXEL (cursor) ─────────────────────────────────────
  drawPixel(x, y) {
    if (!this.settings.drawEffectEnabled) return;

    const size  = this.settings.grid;
    const px    = Math.floor(x * size);
    const py    = Math.floor((1 - y) * size);
    const data  = this.dataTexture.image.data;

    // Convertir 163px logicos a unidades de la grilla (usamos radio = 163 / 2)
    const brushRadiusPx = 163 / 2;
    const pxPerGrid = this.hero.offsetWidth / size; 
    const rGrid = Math.max(1, brushRadiusPx / pxPerGrid);

    // Dibujar en círculo sobre la grilla
    for (let dy = -Math.ceil(rGrid); dy <= Math.ceil(rGrid); dy++) {
       for (let dx = -Math.ceil(rGrid); dx <= Math.ceil(rGrid); dx++) {
          if (dx*dx + dy*dy <= rGrid*rGrid) {
             const cx = px + dx;
             const cy = py + dy;
             if (cx >= 0 && cx < size && cy >= 0 && cy < size) {
                const index = 4 * (cx + cy * size);
                data[index]     = 0.1;
                data[index + 1] = 0.1;
             }
          }
       }
    }

    this.dataTexture.needsUpdate = true;
  }

  // ── SCENE ───────────────────────────────────────────────────
  initScene(texture) {
    const width  = this.hero.offsetWidth;
    const height = this.hero.offsetHeight;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture:     { value: texture },
        uDataTexture: { value: this.dataTexture },
        uGrid:        { value: this.settings.grid }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position,1.);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDataTexture;
        uniform float uGrid;
        varying vec2 vUv;

        void main(){
          vec2 pixelUv = floor(vUv * uGrid) / uGrid;
          vec2 offset  = texture2D(uDataTexture, pixelUv).rg;
          vec2 uv      = pixelUv - offset;
          gl_FragColor = texture2D(uTexture, uv);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(width, height);

    const canvas       = this.renderer.domElement;
    canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0";

    this.video.style.opacity = "0";
    this.hero.appendChild(canvas);
  }

  // ── LOGO CANVAS OVERLAY ──────────────────────────────────────
  initLogoCanvas() {
    this.logoCanvas         = document.createElement("canvas");
    this.logoCanvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2";
    this.hero.appendChild(this.logoCanvas);
    this.logoCtx = this.logoCanvas.getContext("2d");

    // Offscreen para samplear el logo limpio
    this.offCanvas  = document.createElement("canvas");
    this.offCtx     = this.offCanvas.getContext("2d");

    this.resizeLogoCanvas();
    window.addEventListener("resize", () => this.resizeLogoCanvas());
  }

  resizeLogoCanvas() {
    this.logoCanvas.width  = this.hero.offsetWidth;
    this.logoCanvas.height = this.hero.offsetHeight;
  }

    // Antiguo dither removido a pedido del usuario que proveyó el shader interactivo fluido.

  // ── UI CONTROLS ──────────────────────────────────────────────
  setupUI() {
    // GSAP animations for the UI panels
    if (typeof gsap !== 'undefined') {
      const globalPanel = document.getElementById("draw-ui-global");
      const contextPanel = document.getElementById("draw-ui-context");
      
      if (globalPanel) {
        gsap.fromTo(globalPanel, 
          { x: -50, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
        );
      }
      
      if (contextPanel) {
        gsap.fromTo(contextPanel, 
          { x: 50, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.6 }
        );
      }
    }

    // Pixel size (background) — ya existía
    const pixelRange = document.getElementById("ctrl-pixel");
    const pixelOut   = document.getElementById("out-pixel");
    if (pixelRange) {
      pixelRange.addEventListener("input", () => {
        const v = parseInt(pixelRange.value);
        pixelOut.textContent = v;
        this.settings.grid = v;
        this.mesh.material.uniforms.uGrid.value = v;
        // Rebuild data texture at new resolution
        this.createDataTexture();
        this.mesh.material.uniforms.uDataTexture.value = this.dataTexture;
      });
    }

    // Toggle para el Pincel Interactivo
    const btnDrawOn = document.getElementById("btn-draw-on");
    const btnDrawOff = document.getElementById("btn-draw-off");
    if (btnDrawOn && btnDrawOff) {
      btnDrawOn.addEventListener("click", () => {
        this.settings.drawEffectEnabled = true;
        btnDrawOn.classList.add("active");
        btnDrawOff.classList.remove("active");
      });
      btnDrawOff.addEventListener("click", () => {
        this.settings.drawEffectEnabled = false;
        btnDrawOff.classList.add("active");
        btnDrawOn.classList.remove("active");
      });
    }

    // Los sliders Logo dither intensity y pixel size estaban vinculados al shader viejo que removimos.
    // Quedan libres por si queremos conectarlos al nuevo shader de logo fluido en el futuro.

    // Reset — ya existía, ahora también resetea logo
    const resetBtn = document.getElementById("ctrl-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        // reset background
        if (pixelRange)  { pixelRange.value = 120; pixelOut.textContent = 120; this.settings.grid = 120; this.mesh.material.uniforms.uGrid.value = 120; this.createDataTexture(); this.mesh.material.uniforms.uDataTexture.value = this.dataTexture; }
        // reset logo dither
        if (logoDitherRange) { logoDitherRange.value = 0; this.logoDither.intensity = 0; if (logoDitherOut) logoDitherOut.textContent = "0.00"; }
        if (logoPixelRange)  { logoPixelRange.value = 2; this.logoDither.pixelSize = 2; if (logoPixelOut) logoPixelOut.textContent = 2; }
      });
    }
  }

  // ── EVENTS ───────────────────────────────────────────────────
  setupEvents() {
    this.hero.addEventListener("pointermove", (e) => {
      // Ignorar interacción de pintura en móviles táctiles para evitar roces molestos 
      // y problemas con el scroll, dejándolo exclusivo para mouse/puntero preciso.
      if (e.pointerType === 'touch') return;

      const rect = this.hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      this.drawPixel(x, y);
    });
  }

  // ── RENDER LOOP ──────────────────────────────────────────────
  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

  // ── INIT ─────────────────────────────────────────────────────
  async init() {
    await new Promise((resolve) => {
      if (this.video.readyState >= 2) resolve();
      else this.video.addEventListener("loadeddata", resolve, { once: true });
    });

    this.video.muted = true;
    this.video.play();

    const texture = this.createVideoTexture();

    this.createDataTexture();
    this.initScene(texture);
    this.initLogoCanvas();
    this.setupEvents();
    this.setupUI();
    this.setupTabs();
    this.render();
  }

  // ── EXPERIENCES TABS ─────────────────────────────────────────
  setupTabs() {
    const btns = document.querySelectorAll(".exp-btn");
    const containers = document.querySelectorAll(".experience-container");
    const contextPanels = document.querySelectorAll(".context-controls");

    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        // 1. Quitar active de todos los tabs y content
        btns.forEach(b => b.classList.remove("active"));
        containers.forEach(c => c.classList.remove("active"));
        
        // Ocultar todos los paneles condicionales
        contextPanels.forEach(p => p.style.display = "none");

        // 2. Activar el clickeado
        btn.classList.add("active");
        
        const targetId = btn.getAttribute("data-target"); // "exp-pajaro", "exp-logo", "exp-dibujar"
        const targetContainer = document.getElementById(targetId);
        if (targetContainer) targetContainer.classList.add("active");

        // 3. Mostrar el panel correspondiente
        const targetPanelId = targetId.replace("exp-", "controls-");
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) targetPanel.style.display = "block";
      });
    });
  }
}

new PixelDrawEffect();