gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ infinite: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const contactInfo = document.querySelector(".contact-info");
const contactRowMaxGap = window.innerWidth < 1000 ? 5 : 10;

for (let i = 0; i < 10; i++) {
  const clone = contactInfo.cloneNode(true);
  contactInfo.parentElement.appendChild(clone);
}

const contactVisual = document.querySelector(".contact-visual");
const contactRows = document.querySelectorAll(".contact-info-row");

function getVisualCenter() {
  return contactVisual.offsetTop + contactVisual.offsetHeight / 2;
}

contactRows.forEach((row) => {
  ScrollTrigger.create({
    trigger: row,
    start: () => `top+=${getVisualCenter() - 550} center`,
    end: () => `top+=${getVisualCenter() - 450} center`,
    scrub: true,
    onUpdate: (self) => {
      const gap = 1 + (contactRowMaxGap - 1) * self.progress;
      row.style.gap = `${gap}rem`;
    },
  });

  ScrollTrigger.create({
    trigger: row,
    start: () => `top+=${getVisualCenter() - 400} center`,
    end: () => `top+=${getVisualCenter() - 300} center`,
    scrub: true,
    onUpdate: (self) => {
      const gap = contactRowMaxGap - (contactRowMaxGap - 1) * self.progress;
      row.style.gap = `${gap}rem`;
    },
  });
});

const contactIcon = document.querySelector(".contact-icon img");

let currentIconIndex = 1;
let lastCenteredRow = null;

lenis.on("scroll", () => {
  const viewportCenter = window.innerHeight / 2;

  let closestRow = null;
  let minDistance = Infinity;

  contactRows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const rowCenter = rect.top + rect.height / 2;
    const distance = Math.abs(rowCenter - viewportCenter);

    if (distance < minDistance && distance < 25) {
      minDistance = distance;
      closestRow = row;
    }
  });

  if (closestRow && closestRow !== lastCenteredRow) {
    lastCenteredRow = closestRow;
    currentIconIndex = (currentIconIndex % 7) + 1;
    contactIcon.src = `assets/icon_${currentIconIndex}.png`;
  }
});
