
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { lenis } from "./lenis-scroll.js";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

// project data array
const projectsData = [
  {
    name: "Lunar Eclipse",
    director: "Amelia Crawford",
    location: "Toronto, ON",
  },
  {
    name: "Visitor Quarters",
    director: "Marcus Reynolds",
    location: "Vancouver Studio, BC",
  },
  {
    name: "Celestial",
    director: "Nina Liu // Weston",
    location: "Austin, TX",
  },
  {
    name: "Streamwave Original",
    director: "Dylan Pierce",
    location: "Sunset Studios - Miami",
  },
  {
    name: "Viewfinder",
    director: "Javier // Rodriguez",
    location: "BLANK Studios - Chicago",
  },
  {
    name: "Rhythm Collective",
    director: "Sophia // Chen",
    location: "London, UK",
  },
  {
    name: "Urban Odyssey",
    director: "Leo Thompson",
    location: "Pioneer Studios - Seattle",
  },
  {
    name: "Prism No. 1",
    director: "Taylor // McKnight",
    location: "Private Estate - Sedona",
  },
  {
    name: "Vision Quest",
    director: "Spencer // Hudson",
    location: "Elevation - Denver",
  },
  {
    name: "Wavelength",
    director: "Kai Nakamura",
    location: "San Francisco, CA",
  },
  {
    name: "Desert Horizon",
    director: "Olivia",
    location: "New Mexico",
  },
  {
    name: "Spectrum",
    director: "Ellis // Moss",
    location: "Harmony Studio - Montreal",
  },
  {
    name: "Vision Quest II",
    director: "Hudson // Wright",
    location: "Elevation Studios - Denver",
  },
  {
    name: "Auteur",
    director: "Leo Thompson",
    location: "Berlin, DE",
  },
  {
    name: "Capsule X Design",
    director: "Sophia // Chen",
    location: "Neon House - Brooklyn",
  },
  {
    name: "Pulse",
    director: "Callum // Winters",
    location: "Echo Pavilion - Portland",
  },
];

// image sources for rotation
const allImageSources = Array.from(
  { length: 20 },
  (_, i) => `/spotlight/spotlight-${i + 1}.jpg`
);

// utility functions
const getRandomImageSet = () => {
  const shuffled = [...allImageSources].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 9);
};

// create dynamic content from project data
function initializeDynamicContent() {
  const projectsContainer = document.querySelector(".projects");
  const locationsContainer = document.querySelector(".locations");

  if (projectsContainer) projectsContainer.style.display = "none";
  if (locationsContainer) locationsContainer.style.display = "none";
}

// rotate images during preloader
function startImageRotation() {
  const gridImages = gsap.utils.toArray(".img");
  const totalCycles = 20;

  for (let cycle = 0; cycle < totalCycles; cycle++) {
    const randomImages = getRandomImageSet();

    gsap.to(
      {},
      {
        duration: 0,
        delay: cycle * 0.15,
        onComplete: () => {
          gridImages.forEach((imgElement, index) => {
            const img = imgElement.querySelector("img");
            if (img && randomImages[index]) {
              img.src = randomImages[index];
            }
          });
        },
      }
    );
  }
}

// cleanup preloader elements and re-enable scrolling
function cleanupPreloader() {
  const overlay = document.querySelector(".overlay");
  const imageGrid = document.querySelector(".image-grid");

  if (overlay) overlay.remove();
  if (imageGrid) imageGrid.remove();

  gsap.killTweensOf([
    ".overlay",
    ".image-grid",
    ".projects",
    ".locations",
    ".loader",
    ".project-item",
    ".location-item",
    ".projects-header",
    ".locations-header",
    ".logo-line-1",
    ".logo-line-2",
    ".img",
  ]);

  if (lenis) {
    lenis.start();
  }
}

// create animation timelines
function createAnimationTimelines() {
  const overlayTimeline = gsap.timeline();
  const imagesTimeline = gsap.timeline();

  // logo text reveal
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

  // fade out overlay
  overlayTimeline.to(".overlay", {
    opacity: 0,
    duration: 0.5,
    delay: 1.5,
  });

  // reveal images
  imagesTimeline.to(".img", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    duration: 1,
    delay: 2.5,
    stagger: 0.05,
    ease: "hop",
    onStart: () => {
      setTimeout(() => {
        startImageRotation();
        gsap.to(".loader", { opacity: 0, duration: 0.3 });
      }, 1000);
    },
  });

  // hide images and complete
  imagesTimeline.to(".img", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    duration: 1,
    delay: 2.5,
    stagger: 0.05,
    ease: "hop",
    onComplete: () => {
      sessionStorage.setItem("preloaderSeen", "true");
      setTimeout(() => {
        cleanupPreloader();
      }, 500);
    },
  });
}

// initialization
function init() {
  initializeDynamicContent();
  createAnimationTimelines();
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  const hasSeenPreloader = sessionStorage.getItem("preloaderSeen") === "true";

  if (hasSeenPreloader) {
    // skip preloader - hide elements and enable scrolling
    const overlay = document.querySelector(".overlay");
    const imageGrid = document.querySelector(".image-grid");

    if (overlay) overlay.style.display = "none";
    if (imageGrid) imageGrid.style.display = "none";

    if (lenis) {
      lenis.start();
    }

    return;
  }

  // disable scrolling during preloader
  if (lenis) {
    lenis.stop();
  }

  init();
});

