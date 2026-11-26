import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

function isCoarsePointer() {
  return window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
}

document.addEventListener("DOMContentLoaded", () => {
  const isMobileLike = isCoarsePointer() || window.innerWidth <= 1000;

  if (isMobileLike) {
    window.lenis = null;
    return;
  }

  lenis = new Lenis({
    smoothWheel: true,
    syncTouch: false,
    lerp: 0.1,
    duration: 1.2,
    autoRaf: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  window.lenis = lenis;
});

export { lenis };