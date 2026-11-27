import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("hop", "0.9, 0, 0.1, 1");
CustomEase.create("glide", "0.8, 0, 0.2, 1");

let started = false;
let split = null;

const TEXT_TARGETS = ".hero-header h1, .hero-social p, .hero-social a";

function whenFontsReady(fn) {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fn);
  } else {
    fn();
  }
}

function applyInitialState() {
  gsap.set(TEXT_TARGETS, { opacity: 0 });
}

function splitHeroText() {
  if (split) return;

  const targets = document.querySelectorAll(TEXT_TARGETS);
  if (!targets.length) return;

  split = SplitText.create(targets, {
    type: "lines",
    linesClass: "line",
    mask: "lines",
    autoSplit: true,
  });

  gsap.set(".hero .line", { y: "140%" });
}

function playReveal() {
  if (started) return;
  started = true;

  gsap.set(TEXT_TARGETS, { opacity: 1 });

  const tl = gsap.timeline();

  tl.to(
    ".hero-header .line",
    {
      y: "0%",
      duration: 1,
      stagger: 0.08,
      ease: "power3.out",
    },
    "<0.5",
  );

  tl.to(
    ".hero-social .line",
    {
      y: "0%",
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
    },
    "<0.25",
  );
}

function init() {
  applyInitialState();

  whenFontsReady(splitHeroText);

  if (!document.querySelector(".overlay")) {
    whenFontsReady(playReveal);
    return;
  }

  window.addEventListener(
    "dd:preloaderDone",
    () => whenFontsReady(playReveal),
    { once: true },
  );

  setTimeout(() => whenFontsReady(playReveal), 8000);
}

init();
