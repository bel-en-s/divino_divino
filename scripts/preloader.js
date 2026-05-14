import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { lenis } from "./lenis-scroll.js";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

function initHeroVideo() {
  const video = document.querySelector(".hero-video");
  if (!video) return;

  video.muted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const playPromise = video.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      document.addEventListener(
        "touchstart",
        () => {
          video.play();
        },
        { once: true }
      );
    });
  }
}

function initializeDynamicContent() {
  const projectsContainer = document.querySelector(".projects");
  const locationsContainer = document.querySelector(".locations");

  if (projectsContainer) projectsContainer.style.display = "none";
  if (locationsContainer) locationsContainer.style.display = "none";
}

function cleanupPreloader() {
  const overlay = document.querySelector(".overlay");

  if (overlay) overlay.remove();

  gsap.killTweensOf([
    ".overlay",
    ".loader",
    ".logo-line-1",
    ".logo-line-2",
  ]);

  if (lenis) lenis.start();
}

function createAnimationTimelines() {
  const overlayTimeline = gsap.timeline();

  gsap.set("nav", { opacity: 0 });

  overlayTimeline.to(".logo-line-1", {
    backgroundPosition: "0% 0%",
    color: "#e3e4d8",
    duration: 1,
    ease: "none",
    delay: 0.5,
    onComplete: () => {
      gsap.to(".logo-line-2", {
        backgroundPosition: "0% 0%",
        color: "#e3e4d8",
        duration: 1,
        ease: "none",
      });
    },
  });

  overlayTimeline.to(".overlay", {
    opacity: 0,
    duration: 0.5,
    delay: 3,
    onStart: () => {
      gsap.to("nav", { opacity: 1, duration: 0.5 });
    },
    onComplete: () => {
      sessionStorage.setItem("preloaderSeen", "true");
      cleanupPreloader();
    },
  });
}

function init() {
  initializeDynamicContent();
  createAnimationTimelines();
}

function skipPreloader() {
  const overlay = document.querySelector(".overlay");
  const imageGrid = document.querySelector(".image-grid");

  if (overlay) overlay.remove();
  if (imageGrid) imageGrid.remove();

  if (lenis) lenis.start();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroVideo();

  const hasSeenPreloader =
    sessionStorage.getItem("preloaderSeen") === "true";

  if (hasSeenPreloader) {
    skipPreloader();
    return;
  }

  if (lenis) lenis.stop();
  init();
});