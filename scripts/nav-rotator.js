const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
const PHRASES = ["Soluciones Digitales", "Webs Creativas", "Tu Mundo Digital"];
const HOLD_MS = 3000;
const ITERATIONS = 4;
const ITER_MS = 25;
const STAGGER_MS = 30;

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

function scrambleTo(el, newText) {
  const oldText = el.textContent || "";
  const len = Math.max(oldText.length, newText.length);
  const display = Array.from({ length: len }, (_, i) => oldText[i] ?? " ");

  for (let i = 0; i < len; i++) {
    const target = newText[i] ?? "";
    const isSpace = !target || target === " ";

    for (let iter = 0; iter < ITERATIONS; iter++) {
      setTimeout(() => {
        display[i] = isSpace ? " " : randomChar();
        el.textContent = display.join("");
      }, i * STAGGER_MS + iter * ITER_MS);
    }

    setTimeout(() => {
      display[i] = target;
      el.textContent = display.join("").trimEnd();
    }, i * STAGGER_MS + ITERATIONS * ITER_MS);
  }
}

const SCROLL_THRESHOLD = 30;

document.addEventListener("DOMContentLoaded", () => {
  const rotators = document.querySelectorAll(".nav-rotator");
  if (!rotators.length) return;

  let idx = 0;
  rotators.forEach((el) => (el.textContent = PHRASES[idx]));

  setInterval(() => {
    idx = (idx + 1) % PHRASES.length;
    rotators.forEach((el) => scrambleTo(el, PHRASES[idx]));
  }, HOLD_MS);

  const navLefts = document.querySelectorAll(".nav-left");
  const sections = document.querySelectorAll("[data-nav-label]");
  const sectionLabels = document.querySelectorAll(".nav-section-label");
  let currentSectionLabel = "";

  const getActiveSection = () => {
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom > 100) return section;
    }
    return null;
  };

  const updateSectionLabel = () => {
    if (!sectionLabels.length) return;
    const active = getActiveSection();
    const newText = active ? active.dataset.navLabel : "";
    if (newText === currentSectionLabel) return;

    sectionLabels.forEach((el) => {
      if (newText) {
        if (currentSectionLabel) {
          scrambleTo(el, newText);
        } else {
          el.textContent = newText;
        }
        el.classList.add("is-visible");
      } else {
        el.classList.remove("is-visible");
      }
    });

    currentSectionLabel = newText;
  };

  const onScroll = () => {
    const collapse = window.scrollY > SCROLL_THRESHOLD;
    navLefts.forEach((el) => el.classList.toggle("is-collapsed", collapse));
    updateSectionLabel();
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
