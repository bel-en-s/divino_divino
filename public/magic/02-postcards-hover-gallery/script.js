gsap.registerPlugin(ScrollTrigger, SplitText);

const MOBILE_BREAKPOINT = 1000;

const footer = document.querySelector("#footer");
const headingBlock = footer.querySelector(".footer-heading");
const heading = headingBlock.querySelector("h2");
const button = footer.querySelector(".slide-button");
const buttonContainer = footer.querySelector(".footer-button-container");
const postcardsContainer = footer.querySelector(".footer-postcards");

async function waitForFonts() {
  try {
    await document.fonts.ready;
    document.fonts.check('16px "Roslindale Variable"');
    document.fonts.check('16px "Host Grotesk"');
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (e) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/* split the button label into default + hover characters */
function buildButtonChars() {
  const label = button.getAttribute("data-label") || "Button";
  const textSpan = button.querySelector(".slide-button-text");
  textSpan.innerHTML = "";

  label.split("").forEach((char) => {
    const wrap = document.createElement("span");
    wrap.className = "slide-char";

    const def = document.createElement("span");
    def.className = "char-default";
    def.textContent = char === " " ? "\u00A0" : char;

    const hov = document.createElement("span");
    hov.className = "char-hover";
    hov.textContent = char === " " ? "\u00A0" : char;

    wrap.appendChild(def);
    wrap.appendChild(hov);
    textSpan.appendChild(wrap);
  });
}

/* line-by-line text reveal (SplitText), rebuilt on resize */
const reveals = [];

function createReveal(element, trigger, start) {
  const item = {
    element,
    trigger: trigger || element,
    start: start || "top 80%",
    split: null,
    tween: null,
    revealed: false,
  };
  reveals.push(item);
  buildReveal(item);
}

function buildReveal(item) {
  if (item.split) item.split.revert();
  if (item.tween) {
    if (item.tween.scrollTrigger) item.tween.scrollTrigger.kill();
    item.tween.kill();
  }

  item.split = SplitText.create(item.element, {
    type: "lines",
    mask: "lines",
    linesClass: "line",
    lineThreshold: 0.1,
    autoSplit: false,
  });

  if (item.revealed) {
    gsap.set(item.split.lines, { y: "0%" });
    return;
  }

  gsap.set(item.split.lines, { y: "110%" });

  item.tween = gsap.to(item.split.lines, {
    y: "0%",
    duration: 1,
    ease: "power4.out",
    stagger: 0.1,
    scrollTrigger: {
      trigger: item.trigger,
      start: item.start,
      once: true,
      onEnter: () => {
        item.revealed = true;
      },
    },
  });
}

function initTextReveals() {
  createReveal(heading);
  footer.querySelectorAll(".footer-bar p").forEach((el) => {
    createReveal(el, headingBlock);
  });
}

/* slide the button into view on scroll */
function initButtonEntrance() {
  gsap.set(buttonContainer, { autoAlpha: 0, y: 40 });

  ScrollTrigger.create({
    trigger: headingBlock,
    start: "top 50%",
    once: true,
    onEnter: () => {
      gsap.to(buttonContainer, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    },
  });
}

/* postcard fan-out + button character hover (desktop only) */
let postcardTimeline = null;
let charTimeline = null;
let isHoverActive = false;

function initHoverEffects() {
  const cards = gsap.utils.toArray(".footer-postcard");
  const defaultChars = button.querySelectorAll(".char-default");
  const hoverChars = button.querySelectorAll(".char-hover");

  gsap.set(cards, { yPercent: 250, xPercent: 0, rotation: 0 });
  gsap.set(defaultChars, { yPercent: 0 });
  gsap.set(hoverChars, { yPercent: -100 });

  postcardTimeline = gsap.timeline({ paused: true });
  cards.forEach((card, index) => {
    postcardTimeline.to(
      card,
      {
        yPercent: 55,
        xPercent: parseFloat(card.dataset.x),
        rotation: parseFloat(card.dataset.rotation),
        duration: 0.8,
        ease: "power3.out",
      },
      index * 0.07,
    );
  });

  const handleEnter = () => {
    if (charTimeline) charTimeline.kill();

    const tl = gsap.timeline();
    tl.to(defaultChars, { yPercent: 100, duration: 0.3, ease: "power3.out", stagger: 0.01 }, 0);
    tl.to(hoverChars, { yPercent: 0, duration: 0.3, ease: "power3.out", stagger: 0.01 }, 0.1);
    charTimeline = tl;

    postcardTimeline.play();
  };

  const handleLeave = () => {
    if (charTimeline) charTimeline.kill();

    const tl = gsap.timeline();
    tl.to(hoverChars, { yPercent: -100, duration: 0.4, ease: "power3.inOut", stagger: 0.01 }, 0);
    tl.to(defaultChars, { yPercent: 0, duration: 0.4, ease: "power3.inOut", stagger: 0.01 }, 0.15);
    charTimeline = tl;

    postcardTimeline.reverse();
  };

  const enableHover = () => {
    if (isHoverActive) return;
    button.addEventListener("mouseenter", handleEnter);
    button.addEventListener("mouseleave", handleLeave);
    postcardsContainer.style.display = "";
    isHoverActive = true;
  };

  const disableHover = () => {
    if (!isHoverActive) return;
    button.removeEventListener("mouseenter", handleEnter);
    button.removeEventListener("mouseleave", handleLeave);
    postcardTimeline.pause(0);
    postcardsContainer.style.display = "none";
    isHoverActive = false;
  };

  const handleResize = () => {
    window.innerWidth < MOBILE_BREAKPOINT ? disableHover() : enableHover();
  };

  handleResize();
  window.addEventListener("resize", handleResize);
}

let resizeTimer;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    reveals.forEach(buildReveal);
    ScrollTrigger.refresh();
  }, 150);
}

(async () => {
  await waitForFonts();
  buildButtonChars();
  initTextReveals();
  initButtonEntrance();
  initHoverEffects();
})();

window.addEventListener("resize", onResize);
