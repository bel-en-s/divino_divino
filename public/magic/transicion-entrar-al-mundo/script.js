import * as THREE from "three";

const slides = [
  {
    title: "Quiet Green",
    description:
      "A cinematic study of solitude, nature, and a gaze that remembers something forgotten.",
    type: "Editorial",
    field: "Fine Art",
    date: "2025",
    image: "img-1.jpg",
  },
  {
    title: "Crimson Reign",
    description:
      "Ornate textures and ceremonial gold unravel across a sea of red—silent power in stillness.",
    type: "Editorial",
    field: "Conceptual",
    date: "2022",
    image: "img-2.jpg",
  },
  {
    title: "Gilded Brow",
    description:
      "A baroque close-up capturing the tactile intimacy of skin, shadow, and the glitter of ritual.",
    type: "Detail Study",
    field: "Experimental",
    date: "2024",
    image: "img-3.jpg",
  },
  {
    title: "Golden Flight",
    description:
      "A blur of motion in sun-soaked gold—freedom becomes visible only in the act of leaving.",
    type: "Motion Still",
    field: "Cinematic",
    date: "2023",
    image: "img-4.jpg",
  },
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;
  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
    vec2 scaledDirection = direction;
    scaledDirection.y *= 2.0;
    return uv - scaledDirection * factor;
  }

  struct LensDistortion {
    vec2 distortedUV;
    float inside;
  };

  LensDistortion getLensDistortion(
    vec2 p,
    vec2 uv,
    vec2 sphereCenter,
    float sphereRadius,
    float focusFactor
  ) {
    vec2 distortionDirection = normalize(p - sphereCenter);
    float focusRadius = sphereRadius * focusFactor;
    float focusStrength = sphereRadius / 3000.0;
    float focusSdf = length(sphereCenter - p) - focusRadius;
    float sphereSdf = length(sphereCenter - p) - sphereRadius;
    float inside = smoothstep(0.0, 1.0, -sphereSdf / (sphereRadius * 0.001));

    float magnifierFactor = focusSdf / (sphereRadius - focusRadius);
    float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
    mFactor = pow(mFactor, 5.0);

    float distortionFactor = mFactor * focusStrength;

    vec2 distortedUV = getDistortedUv(uv, distortionDirection, distortionFactor);

    return LensDistortion(distortedUV, inside);
  }

  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;

    vec2 uv1 = getCoverUV(vUv, uTexture1Size);
    vec2 uv2 = getCoverUV(vUv, uTexture2Size);

    float maxRadius = length(uResolution) * 1.5;
    float bubbleRadius = uProgress * maxRadius;
    vec2 sphereCenter = center * uResolution;
    float focusFactor = 0.25;

    float dist = length(sphereCenter - p);
    float mask = step(bubbleRadius, dist);

    vec4 currentImg = texture2D(uTexture1, uv1);

    LensDistortion distortion = getLensDistortion(
      p, uv2, sphereCenter, bubbleRadius, focusFactor
    );

    vec4 newImg = texture2D(uTexture2, distortion.distortedUV);

    float finalMask = max(mask, 1.0 - distortion.inside);
    vec4 color = mix(newImg, currentImg, finalMask);

    gl_FragColor = color;
  }
`;

gsap.registerPlugin(SplitText);
gsap.config({ nullTargetWarn: false });

let currentSlideIndex = 0;
let isTransitioning = false;
let slideTextures = [];
let shaderMaterial, renderer;

const slider = document.querySelector(".slider");
const canvas = document.querySelector("canvas");

const createCharacterElements = (element) => {
  if (element.querySelectorAll(".char").length > 0) return;

  const words = element.textContent.split(" ");
  element.innerHTML = "";

  words.forEach((word, index) => {
    const wordDiv = document.createElement("div");
    wordDiv.className = "word";

    [...word].forEach((char) => {
      const charDiv = document.createElement("div");
      charDiv.className = "char";
      charDiv.innerHTML = `<span>${char}</span>`;
      wordDiv.appendChild(charDiv);
    });

    element.appendChild(wordDiv);

    if (index < words.length - 1) {
      const spaceChar = document.createElement("div");
      spaceChar.className = "word";
      spaceChar.innerHTML = '<div class="char"><span> </span></div>';
      element.appendChild(spaceChar);
    }
  });
};

const createLineElements = (element) => {
  new SplitText(element, { type: "lines", linesClass: "line" });
  element.querySelectorAll(".line").forEach((line) => {
    line.innerHTML = `<span>${line.textContent}</span>`;
  });
};

const processTextElements = (container) => {
  const title = container.querySelector(".slide-title h1");
  if (title) createCharacterElements(title);

  container
    .querySelectorAll(".slide-description p")
    .forEach(createLineElements);
};

const createSlideElement = (slideData) => {
  const content = document.createElement("div");
  content.className = "slider-content";
  content.style.opacity = "0";

  content.innerHTML = `
    <div class="slide-title"><h1>${slideData.title}</h1></div>
    <div class="slide-description">
      <p>${slideData.description}</p>
      <div class="slide-info">
        <p>Type. ${slideData.type}</p>
        <p>Field. ${slideData.field}</p>
        <p>Date. ${slideData.date}</p>
      </div>
    </div>
  `;

  return content;
};

const animateSlideTransition = (nextIndex) => {
  const currentContent = document.querySelector(".slider-content");

  const timeline = gsap.timeline();

  timeline
    .to([...currentContent.querySelectorAll(".char span")], {
      y: "-100%",
      duration: 0.6,
      stagger: 0.025,
      ease: "power2.inOut",
    })
    .to(
      [...currentContent.querySelectorAll(".line span")],
      {
        y: "-100%",
        duration: 0.6,
        stagger: 0.025,
        ease: "power2.inOut",
      },
      0.1
    )
    .call(
      () => {
        const newContent = createSlideElement(slides[nextIndex]);

        timeline.kill();
        currentContent.remove();
        slider.appendChild(newContent);

        gsap.set(newContent.querySelectorAll("span"), { y: "100%" });

        setTimeout(() => {
          processTextElements(newContent);

          const newChars = newContent.querySelectorAll(".char span");
          const newLines = newContent.querySelectorAll(".line span");

          gsap.set([newChars, newLines], { y: "100%" });
          gsap.set(newContent, { opacity: 1 });

          gsap
            .timeline({
              onComplete: () => {
                isTransitioning = false;
                currentSlideIndex = nextIndex;
              },
            })
            .to(newChars, {
              y: "0%",
              duration: 0.5,
              stagger: 0.025,
              ease: "power2.inOut",
            })
            .to(
              newLines,
              { y: "0%", duration: 0.5, stagger: 0.1, ease: "power2.inOut" },
              0.3
            );
        }, 100);
      },
      null,
      0.5
    );
};

const setupInitialSlide = () => {
  const content = document.querySelector(".slider-content");

  processTextElements(content);

  const chars = content.querySelectorAll(".char span");
  const lines = content.querySelectorAll(".line span");

  gsap.fromTo(
    chars,
    { y: "100%" },
    { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out" }
  );
  gsap.fromTo(
    lines,
    { y: "100%" },
    { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out", delay: 0.2 }
  );
};

const initializeRenderer = async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: { value: null },
      uTexture2: { value: null },
      uProgress: { value: 0.0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture1Size: { value: new THREE.Vector2(1, 1) },
      uTexture2Size: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader,
    fragmentShader,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

  const loader = new THREE.TextureLoader();
  for (const slide of slides) {
    const texture = await new Promise((resolve) =>
      loader.load(slide.image, resolve)
    );
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.userData = {
      size: new THREE.Vector2(texture.image.width, texture.image.height),
    };
    slideTextures.push(texture);
  }

  shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
  shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
  shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
  shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;

  const render = () => {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  };
  render();
};

const handleSlideChange = () => {
  if (isTransitioning) return;

  isTransitioning = true;
  const nextIndex = (currentSlideIndex + 1) % slides.length;

  shaderMaterial.uniforms.uTexture1.value = slideTextures[currentSlideIndex];
  shaderMaterial.uniforms.uTexture2.value = slideTextures[nextIndex];
  shaderMaterial.uniforms.uTexture1Size.value =
    slideTextures[currentSlideIndex].userData.size;
  shaderMaterial.uniforms.uTexture2Size.value =
    slideTextures[nextIndex].userData.size;

  animateSlideTransition(nextIndex);

  gsap.fromTo(
    shaderMaterial.uniforms.uProgress,
    { value: 0 },
    {
      value: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onComplete: () => {
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = slideTextures[nextIndex];
        shaderMaterial.uniforms.uTexture1Size.value =
          slideTextures[nextIndex].userData.size;
      },
    }
  );
};

const handleResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  shaderMaterial.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
};

const initSlider = async () => {
  setupInitialSlide();
  await initializeRenderer();

  slider.addEventListener("click", handleSlideChange);
  window.addEventListener("resize", handleResize);
};

initSlider();
