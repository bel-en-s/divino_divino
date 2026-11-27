import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 1001px)", () => {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        onEnter: () => el.classList.add("is-revealed"),
        onLeaveBack: () => el.classList.remove("is-revealed"),
      });
    });
  });

  mm.add("(max-width: 1000px)", () => {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("is-revealed");
    });
  });
});
