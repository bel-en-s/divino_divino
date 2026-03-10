import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

console.log("Footer script loaded");
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  trigger: "footer",
  start: "top bottom",
  onEnter: () => {
    console.log("Entered footer");
    document.querySelector(".logo-container").classList.add("footer-visible");
  },
  onLeaveBack: () => {
    console.log("Left footer");
    document.querySelector(".logo-container").classList.remove("footer-visible");
  }
})