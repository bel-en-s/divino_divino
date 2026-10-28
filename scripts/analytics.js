import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

inject();
injectSpeedInsights();

const GA_ID = "G-76CNMYSWKB";
const CONSENT_KEY = "ga_consent";

const COPY = {
  es: { accept: "Aceptar cookies" },
  en: { accept: "Accept cookies" },
};

function currentLang() {
  return localStorage.getItem("lang") === "en" ? "en" : "es";
}

function loadGA() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function grantConsent() {
  localStorage.setItem(CONSENT_KEY, "granted");
  loadGA();
}

function injectBannerStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .cookie-banner {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      background: rgba(227, 228, 216, 0.96);
      color: #5b5c57;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-weight: 400;
      text-transform: none;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      padding: 0.9rem 2rem;
      font-size: 0.8rem;
      line-height: 1.4;
      letter-spacing: 0.01em;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    .cookie-banner__actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .cookie-banner button {
      font-family: inherit;
      font-weight: 400;
      text-transform: none;
      font-size: 0.8rem;
      letter-spacing: 0.01em;
      padding: 0.4rem 1rem;
      cursor: pointer;
      border: 1px solid #222222;
      background: transparent;
      color: #222222;
      border-radius: 0;
      transition: all 0.2s ease;
    }
    .cookie-banner button:hover {
      background: #222222;
      color: #e3e4d8;
    }
    .cookie-banner .cookie-banner__accept {
      background: #222222;
      border-color: #222222;
      color: #e3e4d8;
    }
    .cookie-banner .cookie-banner__accept:hover {
      background: transparent;
      color: #222222;
    }
  `;
  document.head.appendChild(style);
}

function showConsentBanner() {
  injectBannerStyles();

  const copy = COPY[currentLang()];

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");

  const actions = document.createElement("div");
  actions.className = "cookie-banner__actions";

  const accept = document.createElement("button");
  accept.className = "cookie-banner__accept";
  accept.textContent = copy.accept;
  accept.addEventListener("click", () => {
    grantConsent();
    banner.remove();
  });

  actions.append(accept);
  banner.append(actions);
  document.body.appendChild(banner);
}

const consent = localStorage.getItem(CONSENT_KEY);

if (consent === "granted") {
  loadGA();
} else if (consent !== "denied") {
  showConsentBanner();
}
