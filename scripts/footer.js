import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  trigger: "footer",
  start: "top 100px",
  onEnter: () => {
    document.querySelector(".logo-container")?.classList.add("footer-visible");
  },
  onLeaveBack: () => {
    document.querySelector(".logo-container")?.classList.remove("footer-visible");
  }
});
