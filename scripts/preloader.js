import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { lenis } from "./lenis-scroll.js";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

// project data array
const projectsData = [
  { name: "Divino Divino", director: "Multimedia Studio", location: "Web // Art // Design" },
  { name: "Culture", director: "Arts // Entertainment", location: "Digital Identity" },
  { name: "Authenticity", director: "Human // Unique", location: "Meaningful Experiences" },
  { name: "Sensory Web", director: "Digital // Physical", location: "Beyond the Screen" },
  { name: "Expression", director: "Art // Technology", location: "Creative Exploration" },
  { name: "Human Touch", director: "Gesture // Process", location: "Beyond AI" },
  { name: "Connection", director: "People // Projects", location: "Audience Engagement" },
  { name: "Visibility", director: "Reach // Discovery", location: "Digital Presence" },
  { name: "Clarity", director: "Strategy // Focus", location: "Brand Positioning" },
  { name: "Perception", director: "Premium // Distinctive", location: "Visual Identity" },
  { name: "Wellbeing", director: "Care // Sensitivity", location: "Digital Spaces" },
  { name: "Interaction", director: "Motion // Code", location: "Web Experiences" },
  { name: "Value", director: "Quality // Purpose", location: "Better Clients" },
  { name: "Growth", director: "Visibility // Strategy", location: "More Inquiries" },
  { name: "Storytelling", director: "Visual // Editorial", location: "Digital Narratives" },
  { name: "Possibilities", director: "Art // Innovation", location: "A Living Internet" },
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

// create dynamic content from project data
function initializeDynamicContent() {
  const projectsContainer = document.querySelector(".projects");
  const locationsContainer = document.querySelector(".locations");

  if (!projectsContainer || !locationsContainer) return;

  projectsData.forEach((project) => {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";

    const projectName = document.createElement("p");
    projectName.textContent = project.name;

    const directorName = document.createElement("p");
    directorName.textContent = project.director;

    projectItem.appendChild(projectName);
    projectItem.appendChild(directorName);
    projectsContainer.appendChild(projectItem);
  });

  projectsData.forEach((project) => {
    const locationItem = document.createElement("div");
    locationItem.className = "location-item";

    const locationName = document.createElement("p");
    locationName.textContent = project.location;

    locationItem.appendChild(locationName);
    locationsContainer.appendChild(locationItem);
  });
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

// hero: scale up so it can shrink into place on reveal
function setHeroEnteringScale() {
  const heroVideo = document.querySelector(".hero-video");
  if (!heroVideo) return;
  gsap.set(heroVideo, { scale: 1.3 });
}

// hero: shrink the initial image into place as the preloader completes
function animateHeroEntrance() {
  const heroVideo = document.querySelector(".hero-video");
  if (!heroVideo) return;
  gsap.to(heroVideo, {
    scale: 1,
    duration: 1.6,
    ease: "power3.inOut",
  });
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

  if (lenis) lenis.start();

  window.dispatchEvent(new CustomEvent("dd:preloaderDone"));
}

function finishPreloader() {
  sessionStorage.setItem("preloaderSeen", "true");
  setTimeout(cleanupPreloader, 500);
}

// create animation timelines
function createAnimationTimelines() {
  const overlayTimeline = gsap.timeline();
  const hasImageGrid = document.querySelectorAll(".img").length > 0;

  gsap.set("nav", { opacity: 0 });
  setHeroEnteringScale();

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

  // projects appear
  overlayTimeline.to([".projects-header", ".project-item"], {
    opacity: 1,
    duration: 0.05,
    stagger: 0.075,
    delay: 1,
  });

  // locations appear
  overlayTimeline.to(
    [".locations-header", ".location-item"],
    {
      opacity: 1,
      duration: 0.05,
      stagger: 0.075,
    },
    "<"
  );

  // text color change
  overlayTimeline.to(".project-item", {
    color: "#e3e4d8",
    duration: 0.15,
    stagger: 0.075,
  });

  overlayTimeline.to(
    ".location-item",
    {
      color: "#e3e4d8",
      duration: 0.15,
      stagger: 0.075,
    },
    "<"
  );

  // fade out projects
  overlayTimeline.to([".projects-header", ".project-item"], {
    opacity: 0,
    duration: 0.05,
    stagger: 0.075,
  });

  // fade out locations
  overlayTimeline.to(
    [".locations-header", ".location-item"],
    {
      opacity: 0,
      duration: 0.05,
      stagger: 0.075,
    },
    "<"
  );

  // fade out overlay + reveal nav + shrink hero
  overlayTimeline.to(".overlay", {
    opacity: 0,
    duration: 0.5,
    delay: 1.5,
    onStart: () => {
      gsap.to("nav", { opacity: 1, duration: 0.5 });
      animateHeroEntrance();
    },
    onComplete: () => {
      if (!hasImageGrid) finishPreloader();
    },
  });

  if (!hasImageGrid) return;

  const imagesTimeline = gsap.timeline();

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
    onComplete: finishPreloader,
  });
}

// initialization
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

  window.dispatchEvent(new CustomEvent("dd:preloaderDone"));
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  initHeroVideo();

  const hasSeenPreloader = sessionStorage.getItem("preloaderSeen") === "true";

  if (hasSeenPreloader) {
    skipPreloader();
    return;
  }

  if (lenis) lenis.stop();
  init();
});
