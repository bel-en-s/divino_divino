import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 1001px)", () => {
    ScrollTrigger.create({
      trigger: "footer",
      start: "top 100px",
      onEnter: () => {
        document.querySelector(".logo-container")?.classList.add("footer-visible");
      },
      onLeaveBack: () => {
        document.querySelector(".logo-container")?.classList.remove("footer-visible");
      },
    });
  });

  mm.add("(max-width: 1000px)", () => {
    const footer = document.querySelector("footer");
    const logo = document.querySelector(".logo-container");
    if (!footer || !logo || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          logo.classList.toggle("footer-visible", entry.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -100px 0px" }
    );

    observer.observe(footer);

    return () => observer.disconnect();
  });
});
