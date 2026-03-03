import * as THREE from "three";

class PixelatedVideoEffect {
  constructor() {
    this.heroContainer = document.querySelector(".hero");
    this.videoElement = document.querySelector(".hero-video");

    if (!this.heroContainer || !this.videoElement) return;

    this.time = 0;

    this.mouse = {
      x: 0.5,
      y: 0.5,
      vX: 0,
      vY: 0,
      prevX: 0.5,
      prevY: 0.5
    };

    this.settings = {
      grid: 120,          // tamaño pixel
      radius: 0.08,      // área afectada 
      strength: 1,     // intensidad
      relaxation: 1   // persistencia
    };

    this.init();
  }

  createVideoTexture() {
    const texture = new THREE.VideoTexture(this.videoElement);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    return texture;
  }

  updateCameraAndGeometry() {
    this.width = this.heroContainer.offsetWidth;
    this.height = this.heroContainer.offsetHeight;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    this.geometry = new THREE.PlaneGeometry(2, 2);
  }

  createDataTexture() {
    const size = this.settings.grid;
    const data = new Float32Array(size * size * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 1;
    }

    this.dataTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );

    this.dataTexture.magFilter = THREE.NearestFilter;
    this.dataTexture.minFilter = THREE.NearestFilter;
    this.dataTexture.needsUpdate = true;
  }

  initializeScene(texture) {
    this.scene = new THREE.Scene();
    this.updateCameraAndGeometry();
    this.createDataTexture();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform sampler2D uDataTexture;
      uniform float uGrid;
      varying vec2 vUv;

      void main() {

        // pixelado
        vec2 pixelUv = floor(vUv * uGrid) / uGrid;

        // desplazamiento
        vec2 offset = texture2D(uDataTexture, pixelUv).rg;

        vec2 distortedUv = pixelUv - offset * 0.6;

        gl_FragColor = texture2D(uTexture, distortedUv);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uDataTexture: { value: this.dataTexture },
        uGrid: { value: this.settings.grid }
      },
      vertexShader,
      fragmentShader
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const canvas = this.renderer.domElement;
    canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0";

    this.videoElement.style.opacity = "0";
    this.heroContainer.appendChild(canvas);
  }

  updateDataTexture() {
    const data = this.dataTexture.image.data;
    const size = this.settings.grid;

    // relajación
    for (let i = 0; i < data.length; i += 4) {
      data[i] *= this.settings.relaxation;
      data[i + 1] *= this.settings.relaxation;
    }

    const mouseX = this.mouse.x * size;
    const mouseY = (1 - this.mouse.y) * size;

    const radius = this.settings.radius * size;
    const radiusSq = radius * radius;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - mouseX;
        const dy = y - mouseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq) {
          const index = 4 * (x + y * size);

          const falloff = 1.0 - distSq / radiusSq;

          data[index] += this.mouse.vX * this.settings.strength * falloff;
          data[index + 1] -= this.mouse.vY * this.settings.strength * falloff;
        }
      }
    }

    this.mouse.vX *= 0.9;
    this.mouse.vY *= 0.9;

    this.dataTexture.needsUpdate = true;
  }

setupEvents() {
  const resetBtn = document.querySelector(".pixel-reset");

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    this.resetDataTexture();
  });
}
  const handleMove = (clientX, clientY) => {
    const rect = this.heroContainer.getBoundingClientRect();
    const newX = (clientX - rect.left) / rect.width;
    const newY = (clientY - rect.top) / rect.height;

    this.mouse.vX = newX - this.mouse.prevX;
    this.mouse.vY = newY - this.mouse.prevY;

    this.mouse.prevX = newX;
    this.mouse.prevY = newY;

    this.mouse.x = newX;
    this.mouse.y = newY;
  };

  this.heroContainer.addEventListener("pointermove", (e) => {
    handleMove(e.clientX, e.clientY);
  });

  this.heroContainer.addEventListener("pointerdown", (e) => {
    handleMove(e.clientX, e.clientY);
  });

  window.addEventListener("resize", () => {
    this.updateCameraAndGeometry();
    this.renderer.setSize(this.width, this.height);
  });
}

  render() {
    this.updateDataTexture();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

  resetDataTexture() {
  if (!this.dataTexture) return;

  const data = this.dataTexture.image.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
  }

  this.mouse.vX = 0;
  this.mouse.vY = 0;

  this.dataTexture.needsUpdate = true;
}

  async init() {
    await new Promise((resolve) => {
      if (this.videoElement.readyState >= 2) resolve();
      else this.videoElement.addEventListener("loadeddata", resolve);
    });

    const texture = this.createVideoTexture();
    this.initializeScene(texture);
    this.setupEvents();
    this.render();
  }
}

new PixelatedVideoEffect();

