import * as THREE from "three";

class PixelDrawEffect {
  constructor() {
    this.hero = document.querySelector(".hero");
    this.video = document.querySelector(".hero-video");

    if (!this.hero || !this.video) return;

    this.settings = {
      grid: 120
    };

    this.init();
  }

  createVideoTexture() {
    const texture = new THREE.VideoTexture(this.video);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
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

    this.dataTexture.needsUpdate = true;
    this.dataTexture.magFilter = THREE.NearestFilter;
    this.dataTexture.minFilter = THREE.NearestFilter;
  }

  drawPixel(x, y) {
    const size = this.settings.grid;

    const px = Math.floor(x * size);
    const py = Math.floor((1 - y) * size);

    const data = this.dataTexture.image.data;
    const index = 4 * (px + py * size);

    data[index] = 0.1;
    data[index + 1] = 0.1;

    this.dataTexture.needsUpdate = true;
  }

  initScene(texture) {
    const width = this.hero.offsetWidth;
    const height = this.hero.offsetHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uDataTexture: { value: this.dataTexture },
        uGrid: { value: this.settings.grid }
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

          vec2 offset = texture2D(uDataTexture, pixelUv).rg;

          vec2 uv = pixelUv - offset;

          gl_FragColor = texture2D(uTexture, uv);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(width, height);

    const canvas = this.renderer.domElement;

    canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";

    this.video.style.opacity = "0";

    this.hero.appendChild(canvas);
  }

  setupEvents() {
    this.hero.addEventListener("pointermove", (e) => {
      const rect = this.hero.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      this.drawPixel(x, y);
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

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
    this.setupEvents();
    this.render();
  }
}

new PixelDrawEffect();