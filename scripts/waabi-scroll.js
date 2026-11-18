import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({ ignoreMobileResize: true });

const isMobileLike =
  window.matchMedia?.("(pointer: coarse)")?.matches || window.innerWidth <= 1000;
if (isMobileLike) ScrollTrigger.normalizeScroll(true);

function initWaabiScroll() {
  const scroller = document.querySelector(".waabi-scroll");
  if (!scroller || scroller.dataset.initialized === "true") return;
  scroller.dataset.initialized = "true";

  const heroCopySplit = SplitType.create(".waabi-hero-copy h3", {
    type: "words",
    wordsClass: "word",
  });

  ScrollTrigger.matchMedia().add(
    {
      desktop: "(min-width: 1001px)",
      mobile: "(max-width: 1000px)",
    },
    (ctx) => {
      const { desktop } = ctx.conditions;
      const innerWidth = () => window.innerWidth;
      const innerHeight = () => window.innerHeight;
      let copyHidden = false;

      ScrollTrigger.create({
        trigger: ".waabi-hero",
        start: "top top",
        end: () => `+=${desktop ? innerHeight() * 3.5 : innerHeight() * 3}`,
        pin: true,
        pinSpacing: false,
        pinType: desktop ? "fixed" : "transform",
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          const headerAmount = Math.min(progress / 0.29, 1);
          gsap.set(".waabi-hero-header", { yPercent: -headerAmount * 100 });

          const wordsAmount = Math.max(0, Math.min((progress - 0.29) / 0.21, 1));
          const total = heroCopySplit.words.length;
          heroCopySplit.words.forEach((word, index) => {
            const start = index / total;
            const end = (index + 1) / total;
            const opacity = Math.max(0, Math.min((wordsAmount - start) / (end - start), 1));
            gsap.set(word, { opacity });
          });

          if (progress > 0.64 && !copyHidden) {
            copyHidden = true;
            gsap.to(".waabi-hero-copy h3", { opacity: 0, duration: 0.2 });
          } else if (progress <= 0.64 && copyHidden) {
            copyHidden = false;
            gsap.to(".waabi-hero-copy h3", { opacity: 1, duration: 0.2 });
          }

          const imageAmount = Math.max(0, Math.min((progress - 0.71) / 0.29, 1));
          const targetSize =
            Math.min(innerWidth(), innerHeight()) * (desktop ? 0.22 : 0.32);
          const width = gsap.utils.interpolate(innerWidth(), targetSize, imageAmount);
          const height = gsap.utils.interpolate(innerHeight(), targetSize, imageAmount);
          const radius = gsap.utils.interpolate(0, 10, imageAmount);
          gsap.set(".waabi-hero-img", { width, height, borderRadius: radius });
        },
      });

      const shift = Math.min(225, innerWidth() * 0.16);

      const columns = desktop
        ? [
            { el: "#waabi-imgs-col-1", fromY: innerHeight() * 1.15, toY: -innerHeight() * 0.55, x: 0 },
            { el: "#waabi-imgs-col-2", fromY: innerHeight() * 0.7, toY: -innerHeight() * 0.35, x: -shift },
            { el: "#waabi-imgs-col-3", fromY: innerHeight() * 0.7, toY: -innerHeight() * 0.35, x: shift },
            { el: "#waabi-imgs-col-4", fromY: innerHeight() * 1.15, toY: -innerHeight() * 0.55, x: 0 },
          ]
        : [
            { el: "#waabi-imgs-col-1", fromY: innerHeight() * 0.7, toY: -innerHeight() * 0.35, x: 0 },
            { el: "#waabi-imgs-col-2", fromY: innerHeight() * 0.45, toY: -innerHeight() * 0.2, x: 0 },
            { el: "#waabi-imgs-col-3", fromY: innerHeight() * 0.45, toY: -innerHeight() * 0.2, x: 0 },
            { el: "#waabi-imgs-col-4", fromY: innerHeight() * 0.7, toY: -innerHeight() * 0.35, x: 0 },
          ];

      columns.forEach(({ el, fromY, toY, x }) => {
        gsap.set(el, { x, y: fromY });
        gsap.to(el, {
          y: toY,
          ease: "none",
          scrollTrigger: {
            trigger: ".waabi-about",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
    }
  );
}

document.addEventListener("DOMContentLoaded", initWaabiScroll);
window.addEventListener("load", () => ScrollTrigger.refresh());
