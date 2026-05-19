const DEFAULT_TEXT = "Digital Solutions";
const SCROLL_THRESHOLD = 30;

document.addEventListener("DOMContentLoaded", () => {
  const navLefts = document.querySelectorAll(".nav-left");
  const sections = document.querySelectorAll("[data-nav-label]");
  const sectionLabels = document.querySelectorAll(".nav-section-label");
  const rotators = document.querySelectorAll(".nav-rotator");

  if (!sectionLabels.length) return;

  rotators.forEach((el) => (el.textContent = DEFAULT_TEXT));

  let currentLabel = "";

  const getActiveSection = () => {
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom > 100) return section;
    }
    return null;
  };

  const updateLabel = () => {
    const active = getActiveSection();
    const newText = active ? active.dataset.navLabel : "";

    if (newText === currentLabel) return;

    // Slide out current label (collapse width → text exits right)
    sectionLabels.forEach((el) => el.classList.remove("is-visible"));

    // When label is active, collapse the rotator
    if (newText) {
      navLefts.forEach((el) => el.classList.add("is-collapsed"));
    }

    setTimeout(() => {
      if (newText) {
        // Slide in new label (expand width → text enters from left)
        sectionLabels.forEach((el) => {
          el.textContent = newText;
          el.classList.add("is-visible");
        });
      } else {
        // Restore rotator visibility based on scroll position
        const collapsed = window.scrollY > SCROLL_THRESHOLD;
        navLefts.forEach((el) => el.classList.toggle("is-collapsed", collapsed));
      }
      currentLabel = newText;
    }, 250);
  };

  const onScroll = () => {
    const collapsed = window.scrollY > SCROLL_THRESHOLD;
    // Only toggle if no label is active (label manages its own collapse state)
    if (!currentLabel) {
      navLefts.forEach((el) => el.classList.toggle("is-collapsed", collapsed));
    }
    updateLabel();
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
