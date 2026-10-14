const settings = {
  scrollSensitivity: 1200,
  smoothness: 0.5,
  bufferSlides: 2,
  imageShift: 25,
  copyShift: 15,
  titleHold: 0.1,
  imageZoom: 1.25,
  revealOverlap: 0.5,
  gooeyCompleteAt: 1.5,
  gooeyBlur: 0.35,
};

const slides = [
  {
    name: "Paul Cézanne",
    description: "pintor postimpresionista frances<br />que tendio el puente entre<br />el impresionismo y el cubismo",
    years: "1839–1906",
    accent: "#a9d0f5",
    background: "#77766d",
  },
  {
    name: "Francisco de Goya",
    description: "pintor y grabador español<br />uno de los grandes maestros<br />entre el clasicismo y lo moderno",
    years: "1746–1828",
    accent: "#f5a97a",
    background: "#4166f5",
    oval: "left",
  },
  {
    name: "Ana Mendieta",
    description: "artista cubana de performance<br />y body art, célebre por sus<br />siluetas de tierra y cuerpo",
    years: "1948–1985",
    accent: "#c9a97a",
    background: "#625a58",
  },
  {
    name: "Leonor Fini",
    description: "pintora surrealista de origen<br />argentino, exploró los sueños<br />la androginia y lo fantástico",
    years: "1907–1996",
    accent: "#b7e0a0",
    background: "#481104",
    oval: "right",
  },
  {
    name: "Hilma af Klint",
    description: "pintora sueca, pionera<br />del arte abstracto, con una<br />obra guiada por lo espiritual",
    years: "1862–1944",
    accent: "#e8e8e8",
    background: "#514f4a",
  },
];

const columns = {
  left: { el: document.querySelector(".left"), visibleSlides: new Map() },
  right: { el: document.querySelector(".right"), visibleSlides: new Map() },
};

let scrollPosition = 1;
let scrollTarget = 1;
let lastTouchY = 0;

function gooeyWrap(html) {
  return html
    .split("<br>")
    .map((p) => `<span class="line"><span class="line-inner">${p}</span></span>`)
    .join("");
}

function createSlide(side, index) {
  const slideIndex = ((index % slides.length) + slides.length) % slides.length;
  const data = slides[slideIndex];

  const imgNum = slideIndex + 1;

  const el = document.createElement("div");
  el.className = "slide";
  el.style.zIndex = index;
  el.style.setProperty("--accent", data.accent);
  el.style.setProperty("--bg", data.background);
  if (side === data.oval) el.classList.add("oval");
  el.innerHTML = `
    <div class="img-frame">
      <img src="assets/slide_img_${side}_${imgNum}.webp" alt="" onerror="this.onerror=null; this.src='assets/slide_img_${side}_${imgNum}.jpg'" />
      <div class="overlay"></div>
    </div>
    <div class="copy" style="color:var(--accent)">
      <div class="slide-description">${gooeyWrap(data.description)}</div>
      <div class="slide-title">${gooeyWrap(data.name)}</div>
      <div class="slide-years">${gooeyWrap(data.years)}</div>
    </div>
  `;

  columns[side].el.appendChild(el);
  el.lineInners = el.querySelectorAll(".line-inner");
  columns[side].visibleSlides.set(index, el);
}

function getRevealShape(side, revealAmount) {
  const d =
    Math.max(0, Math.min(1, revealAmount)) * (100 + settings.revealOverlap);
  return side === "left"
    ? `polygon(0% ${100 - d}%, 100% ${100 - d}%, 100% 100%, 0% 100%)`
    : `polygon(0% 0%, 100% 0%, 100% ${d}%, 0% ${d}%)`;
}

function getTitlePosition(slideProgress) {
  const fromCenter = slideProgress - 1;
  const past = Math.abs(fromCenter) - settings.titleHold;
  if (past <= 0) return 1;
  const t = past / (1 - settings.titleHold);
  return 1 + Math.sign(fromCenter) * t * t * (3 - 2 * t);
}

function updateSlider() {
  const first = Math.floor(scrollPosition) - settings.bufferSlides;
  const last = Math.floor(scrollPosition) + settings.bufferSlides + 1;

  for (const side of ["left", "right"]) {
    const visibleSlides = columns[side].visibleSlides;
    const driftDirection = side === "left" ? 1 : -1;

    for (let i = first; i <= last; i++) {
      if (!visibleSlides.has(i)) createSlide(side, i);
    }

    for (const [index, el] of visibleSlides) {
      if (index < first || index > last) {
        el.remove();
        visibleSlides.delete(index);
        continue;
      }

      const revealAmount = scrollPosition - index;
      const slideProgress = Math.max(0, Math.min(2, revealAmount));

      el.style.clipPath = getRevealShape(side, revealAmount);

      const imageDrift =
        (1 - slideProgress) * settings.imageShift * driftDirection;
      el.querySelector("img").style.transform =
        `translateY(${imageDrift}%) scale(${settings.imageZoom})`;

      const titleDrift =
        (1 - getTitlePosition(slideProgress)) *
        settings.copyShift *
        driftDirection;
      el.querySelector(".copy").style.transform = `translateY(${titleDrift}%)`;

      const gooeyReveal = Math.max(
        0,
        Math.min(1, revealAmount / settings.gooeyCompleteAt),
      );
      const gooeyEase = 1 - Math.pow(1 - gooeyReveal, 3);
      const gooeyBlur = (1 - gooeyEase) * settings.gooeyBlur;
      el.lineInners.forEach((line) => {
        line.style.filter = `blur(${gooeyBlur.toFixed(4)}em)`;
      });
    }
  }
}

window.addEventListener("wheel", (e) => {
  scrollTarget += e.deltaY / settings.scrollSensitivity;
});

window.addEventListener(
  "touchstart",
  (e) => (lastTouchY = e.touches[0].clientY),
);

window.addEventListener("touchmove", (e) => {
  scrollTarget +=
    ((lastTouchY - e.touches[0].clientY) * 8) / settings.scrollSensitivity;
  lastTouchY = e.touches[0].clientY;
});

function animateSlider() {
  scrollPosition += (scrollTarget - scrollPosition) * settings.smoothness;
  updateSlider();
  requestAnimationFrame(animateSlider);
}

animateSlider();
