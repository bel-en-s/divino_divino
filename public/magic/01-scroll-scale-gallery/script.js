gsap.registerPlugin(ScrollTrigger, SplitText);

const about = document.querySelector("#about");
const header = about.querySelector(".about-header h3");

let split = null;
let revealTween = null;
let revealed = false;

async function waitForFonts() {
  try {
    await document.fonts.ready;
    document.fonts.check('16px "Roslindale Variable"');
    document.fonts.check('16px "Host Grotesk"');
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (e) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function splitHeader() {
  if (split) split.revert();
  if (revealTween) {
    if (revealTween.scrollTrigger) revealTween.scrollTrigger.kill();
    revealTween.kill();
  }

  split = SplitText.create(header, {
    type: "lines",
    mask: "lines",
    linesClass: "line",
    lineThreshold: 0.1,
    autoSplit: false,
  });

  const lines = split.lines;

  if (revealed) {
    gsap.set(lines, { y: "0%" });
    return;
  }

  gsap.set(lines, { y: "110%" });

  revealTween = gsap.to(lines, {
    y: "0%",
    duration: 1,
    ease: "power4.out",
    stagger: 0.1,
    scrollTrigger: {
      trigger: header,
      start: "top 80%",
      once: true,
      onEnter: () => {
        revealed = true;
      },
    },
  });
}

function initGallery() {
  /* scale each image in and out as it scrolls through the viewport */
  gsap.utils.toArray(".about-img").forEach((image) => {
    const imageScaleTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: image,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    imageScaleTimeline
      .fromTo(image, { scale: 0.5 }, { scale: 1.25, ease: "none" })
      .to(image, { scale: 0.5, ease: "none" });
  });

  /* fade out the header as the image gallery scrolls away */
  gsap.to(header, {
    opacity: 0,
    ease: "power1.out",
    scrollTrigger: {
      trigger: ".about-imgs",
      start: "bottom bottom",
      end: "bottom 30%",
      scrub: true,
    },
  });
}

let resizeTimer;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    splitHeader();
    ScrollTrigger.refresh();
  }, 150);
}

(async () => {
  await waitForFonts();
  splitHeader();
  initGallery();
})();

window.addEventListener("resize", onResize);
