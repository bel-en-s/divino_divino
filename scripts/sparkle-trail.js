const SPARKLE_PROBABILITY = 0.06;
const SPARKLE_LIFETIME_MS = 800;

const SPARK_SVG =
  '<svg viewBox="0 0 24 24"><path d="M12 1l1.6 8.4L22 12l-8.4 1.6L12 22l-1.6-8.4L2 12l8.4-1.6L12 1z" fill="currentColor"/></svg>';

function spawnSparkle(x, y) {
  const s = document.createElement("div");
  s.className = "spark";
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.innerHTML = SPARK_SVG;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), SPARKLE_LIFETIME_MS);
}

document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector("footer");
  if (!footer) return;

  footer.addEventListener("mousemove", (e) => {
    if (Math.random() < SPARKLE_PROBABILITY) {
      spawnSparkle(e.clientX, e.clientY);
    }
  });
});
