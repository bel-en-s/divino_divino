import * as THREE from "three";

class PixelatedVideoEffect {
  constructor() {
    this.heroContainer = document.querySelector(".hero");
    this.videoElement = document.querySelector(".hero-video");

    if (!this.heroContainer || !this.videoElement) {
      console.debug("Hero container or video element not found");
      return;
    }

    this.mouse = {
      x: 0.5,
      y: 0.5,
      vX: 0,
      vY: 0,
      prevX: 0.5,
      prevY: 0.5
    };

    this.settings = {
      grid: 100,
      radius: 0.1,
      strength: 1,
      relaxation: 0.94
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
        vec2 pixelUv = floor(vUv * uGrid) / uGrid;
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

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= this.settings.relaxation;
      data[i + 1] *= this.settings.relaxation;
    }

    this.dataTexture.needsUpdate = true;
  }

  paintTrail(fromX, fromY, toX, toY) {
    const size = this.settings.grid;
    const data = this.dataTexture.image.data;

    const startX = fromX * size;
    const startY = (1 - fromY) * size;
    const endX = toX * size;
    const endY = (1 - toY) * size;

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + dx * t;
      const y = startY + dy * t;

      const radius = size * this.settings.radius;
      const radiusSq = radius * radius;

      for (let iy = 0; iy < size; iy++) {
        for (let ix = 0; ix < size; ix++) {
          const px = ix - x;
          const py = iy - y;
          const distSq = px * px + py * py;

          if (distSq < radiusSq) {
            const index = 4 * (ix + iy * size);
            const falloff = 1.0 - distSq / radiusSq;

            data[index] += dx * 0.002 * falloff * this.settings.strength;
            data[index + 1] -= dy * 0.002 * falloff * this.settings.strength;
          }
        }
      }
    }

    this.dataTexture.needsUpdate = true;
  }

  setupEvents() {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const handleMove = (clientX, clientY) => {
      const rect = this.heroContainer.getBoundingClientRect();

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      this.paintTrail(this.mouse.prevX, this.mouse.prevY, x, y);

      this.mouse.prevX = x;
      this.mouse.prevY = y;
    };

    if (!isTouchDevice) {
      this.heroContainer.addEventListener("pointermove", (e) => {
        handleMove(e.clientX, e.clientY);
      });
    } else {
      let isTouching = false;

      this.heroContainer.addEventListener("pointerdown", (e) => {
        isTouching = true;

        const rect = this.heroContainer.getBoundingClientRect();
        this.mouse.prevX = (e.clientX - rect.left) / rect.width;
        this.mouse.prevY = (e.clientY - rect.top) / rect.height;
      });

      this.heroContainer.addEventListener("pointermove", (e) => {
        if (!isTouching) return;

        handleMove(e.clientX, e.clientY);
      });

      const stopTouch = () => {
        isTouching = false;
      };

      this.heroContainer.addEventListener("pointerup", stopTouch);
      this.heroContainer.addEventListener("pointercancel", stopTouch);
    }

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

  async init() {
    await new Promise((resolve) => {
      if (this.videoElement.readyState >= 2) resolve();
      else
        this.videoElement.addEventListener("loadeddata", resolve, {
          once: true
        });
    });

    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.setAttribute("muted", "");
    this.videoElement.setAttribute("playsinline", "");

    try {
      await this.videoElement.play();
    } catch (error) {
      console.warn("Video autoplay blocked:", error);
    }

    const texture = this.createVideoTexture();
    this.initializeScene(texture);
    this.setupEvents();
    this.render();
  }
}

new PixelatedVideoEffect();