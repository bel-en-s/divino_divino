import "../globals.css";

import "../css/preloader.css";
import "../css/transition.css";
import "../css/menu.css";
import "../css/home.css";
import "../css/pixelated-video.css";
import "../css/pixelated-text.css";
import "../css/spotlight.css";
import "../css/split-element.css";
import "../css/footer.css";

import "../scripts/lenis-scroll.js";
import "../scripts/preloader.js";
import "../scripts/transition.js";
import "../scripts/menu.js";
import "../scripts/hover.js";
import "../scripts/pixelated-video.js";
import "../scripts/pixelated-text.js";
import "../scripts/parallax.js";
import "../scripts/spotlight.js";
import "../scripts/split-element.js";
import "../scripts/clients.js";


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

document.addEventListener("DOMContentLoaded", () => {
  initHeroVideo();
});