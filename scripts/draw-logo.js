class LogoShaderCanvas {
  constructor() {
    this.container = document.getElementById("exp-logo");
    // Seleccionamos la imagen original del logo que está centrada para copiar su tamaño y src
    this.logoImg = document.querySelector(".draw-logo img");
    
    if (!this.container || !this.logoImg) return;

    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    
    // Lo anexamos dentro de .draw-logo para que comparta el espacio
    const drawLogoWrapper = document.querySelector(".draw-logo");
    if (drawLogoWrapper) {
       drawLogoWrapper.style.position = "relative";
       drawLogoWrapper.appendChild(this.canvas);
       // Hacemos invisible al DOM original para que solo se vea el Shader, usando visibility en vez de opacity para no pelear con CSS.
       this.logoImg.style.visibility = "hidden"; 
    } else {
       return;
    }

    this.gl = this.canvas.getContext("webgl", {
      alpha: true, // Alpha true para que sea un logo con fondo transparente
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!this.gl) return;

    this.mouse = { x: -10, y: -10, active: false };
    this.last = { x: -10, y: -10 };
    this.velocity = 0;
    this.maxTrail = 20;
    this.trail = new Float32Array(this.maxTrail * 2);
    for (let i = 0; i < this.maxTrail * 2; i++) this.trail[i] = -12;

    this.initWebGL();
    this.setupEvents();
    this.startLoop();
  }

  initWebGL() {
    const gl = this.gl;
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ---------- VERTEX ----------
    const vertexShaderSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = vec2((aPosition.x + 1.0) / 2.0, (1.0 - aPosition.y) / 2.0);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // ---------- FRAGMENT (FLUID) ----------
    const fragmentShaderSource = `
      precision mediump float;

      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uMovement;
      uniform float uRadius; // Uniform para slider de rango de incidencia
      uniform vec4 uCoverConfig;
      uniform vec2 uCoverOffset;

      #define TRAIL_SIZE 10
      uniform vec2 uTrail[TRAIL_SIZE];

      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;

        vec2 aspectUv = uv;
        aspectUv.x *= uCoverConfig.x / uCoverConfig.y;

        // Blocky Grid logic
        float grid = 45.0; // Píxeles del efecto
        vec2 gridUv = floor(aspectUv * grid) / grid;
        gridUv += 0.5 / grid; // center of cell

        vec2 velocityField = vec2(0.0);
        float influenceSum = 0.0;

        for (int i = 0; i < TRAIL_SIZE; i++) {
          vec2 p = uTrail[i];
          if (p.x < -1.0) continue;

          vec2 aspectP = p;
          aspectP.x *= uCoverConfig.x / uCoverConfig.y;

          float dist = distance(gridUv, aspectP);
          float age = float(i) / float(TRAIL_SIZE);

          // radio dinámico uRadius
          float influence = smoothstep(uRadius, 0.0, dist) * (1.0 - age);

          vec2 dir = normalize(gridUv - aspectP + 0.0001);

          velocityField += dir * influence;
          influenceSum += influence;
        }

        if (influenceSum > 0.0) {
          velocityField /= influenceSum;
          velocityField *= min(influenceSum, 1.0);
        }

        // Apply grid displacement
        float strength = 0.1; // Intensidad del desorden al pasar el mouse
        vec2 displacedUv = uv - velocityField * strength;

        float imgUvX = (displacedUv.x * uCoverConfig.x - uCoverOffset.x) / uCoverConfig.z;
        float imgUvY = (displacedUv.y * uCoverConfig.y - uCoverOffset.y) / uCoverConfig.w;

        vec2 finalUv = vec2(imgUvX, imgUvY);

        vec4 col = vec4(0.0);

        if (finalUv.x >= 0.0 && finalUv.x <= 1.0 && finalUv.y >= 0.0 && finalUv.y <= 1.0) {
          col = texture2D(uTexture, finalUv);
        }
        
        gl_FragColor = col;
      }
    `;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };

    this.program = gl.createProgram();
    gl.attachShader(this.program, compile(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    // ---------- GEOMETRY ----------
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // ---------- UNIFORMS ----------
    this.uTime = gl.getUniformLocation(this.program, "uTime");
    this.uMovement = gl.getUniformLocation(this.program, "uMovement");
    this.uRadius = gl.getUniformLocation(this.program, "uRadius");
    this.uTexture = gl.getUniformLocation(this.program, "uTexture");
    this.uCoverConfig = gl.getUniformLocation(this.program, "uCoverConfig");
    this.uCoverOffset = gl.getUniformLocation(this.program, "uCoverOffset");
    this.uTrailUniform = gl.getUniformLocation(this.program, "uTrail");

    // UI Sliders state
    this.currentRadius = 0.35;

    // ---------- TEXTURE ----------
    const texture = gl.createTexture();
    const image = new Image();
    image.src = this.logoImg.src; // Usa la imagen del logo directamente
    
    this.imageReady = false;
    this.imgW = 100;
    this.imgH = 100;

    image.onload = () => {
      this.imgW = image.naturalWidth;
      this.imgH = image.naturalHeight;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.uniform1i(this.uTexture, 0);
      this.activeTexture = texture;
      this.imageReady = true;
      this.resize();
      this.canvas.style.opacity = "1";
    };

    window.addEventListener("resize", () => {
        // En resize se recupera levemente la imagen original DOM para medir pero no la mostramos visualmente.
        this.resize();
    });
  }

  resize() {
    if(!this.imageReady) return;
    const gl = this.gl;
    
    // Obtenemos medidas exactas del contenedor natural del logo
    const r = this.logoImg.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = r.width * dpr;
    this.canvas.height = r.height * dpr;

    const W = this.canvas.width;
    const H = this.canvas.height;

    const imgRatio = this.imgW / this.imgH;
    const canvasRatio = W / H;

    let renderW = W;
    let renderH = H;

    // En "contain"
    if (canvasRatio > imgRatio) renderW = H * imgRatio;
    else renderH = W / imgRatio;

    const dx = (W - renderW) * 0.5;
    const dy = (H - renderH) * 0.5;

    gl.useProgram(this.program);
    gl.uniform4f(this.uCoverConfig, W, H, renderW, renderH);
    gl.uniform2f(this.uCoverOffset, dx, dy);
  }

  setupEvents() {
    // Escuchar el slider de radio de pincel
    const radiusRange = document.getElementById("ctrl-logo-radius");
    const radiusOut = document.getElementById("out-logo-radius");
    if(radiusRange) {
       radiusRange.addEventListener('input', () => {
          this.currentRadius = parseFloat(radiusRange.value);
          if (radiusOut) radiusOut.textContent = this.currentRadius.toFixed(2);
       });
    }

    // Escuchar move events globales para que afecte incluso si se mueve alrededor del logo
    window.addEventListener("pointermove", (e) => {
       if (e.pointerType === 'touch') return;
       // Determinar posicion del mouse RELATIVA AL CANVAS DEL LOGO para el shader
       const r = this.canvas.getBoundingClientRect();
       this.mouse.x = (e.clientX - r.left) / r.width;
       this.mouse.y = (e.clientY - r.top) / r.height;
       this.mouse.active = true;
    });

    window.addEventListener("pointerleave", () => (this.mouse.active = false));
  }

  startLoop() {
    this.start = performance.now();
    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    
    // Solo procesar/dibujar si la experiencia Logo está activa
    if (!this.container.classList.contains("active")) {
      // reseteo rastro por seguridad
      this.mouse.active = false;
      return;
    }

    const gl = this.gl;
    const t = (performance.now() - this.start) * 0.001;

    const dx = this.mouse.x - this.last.x;
    const dy = this.mouse.y - this.last.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    this.last = { ...this.mouse };

    const target = this.mouse.active && speed > 0.001 ? 1 : 0;
    const decay = target === 1 ? 0.03 : 0.05;
    this.velocity += (target - this.velocity) * decay;

    if (this.mouse.active) {
      if (this.trail[0] < -1) {
        for (let i = 0; i < this.maxTrail; i++) {
          this.trail[i * 2] = this.mouse.x;
          this.trail[i * 2 + 1] = this.mouse.y;
        }
      }
      this.trail[0] += (this.mouse.x - this.trail[0]) * 0.4;
      this.trail[1] += (this.mouse.y - this.trail[1]) * 0.4;
    } else {
      this.trail[0] += (-10 - this.trail[0]) * 0.1;
      this.trail[1] += (-10 - this.trail[1]) * 0.1;
    }

    for (let i = 1; i < this.maxTrail; i++) {
      this.trail[i * 2] += (this.trail[(i - 1) * 2] - this.trail[i * 2]) * 0.4;
      this.trail[i * 2 + 1] += (this.trail[(i - 1) * 2 + 1] - this.trail[i * 2 + 1]) * 0.4;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Limpiamos transparente
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.imageReady) {
      gl.useProgram(this.program);
      gl.uniform2fv(this.uTrailUniform, this.trail);
      gl.uniform1f(this.uTime, t);
      gl.uniform1f(this.uMovement, this.velocity);
      gl.uniform1f(this.uRadius, this.currentRadius);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.activeTexture);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}

// Iniciar cuando el DOM esté listo o directamente si ya se importó al final
new LogoShaderCanvas();
