import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

inject();
injectSpeedInsights();

const GA_ID = "G-76CNMYSWKB";
const CONSENT_KEY = "ga_consent";

const COPY = {
  es: {
    text: "Usamos cookies de Google Analytics para medir el tráfico de nuestro sitio.",
    accept: "Aceptar",
    reject: "Rechazar",
  },
  en: {
    text: "We use Google Analytics cookies to measure our site traffic.",
    accept: "Accept",
    reject: "Reject",
  },
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

function denyConsent() {
  localStorage.setItem(CONSENT_KEY, "denied");
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
      justify-content: space-between;
      padding: 0.9rem 2rem;
      font-size: 0.8rem;
      line-height: 1.4;
      letter-spacing: 0.01em;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    .cookie-banner__text {
      margin: 0;
      max-width: 60ch;
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
    .cookie-banner .cookie-banner__reject {
      border: none;
      padding: 0.4rem 0;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .cookie-banner .cookie-banner__reject:hover {
      background: transparent;
      color: #222222;
      opacity: 0.6;
    }
    @media (max-width: 600px) {
      .cookie-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
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

  const text = document.createElement("p");
  text.className = "cookie-banner__text";
  text.textContent = copy.text;

  const actions = document.createElement("div");
  actions.className = "cookie-banner__actions";

  const accept = document.createElement("button");
  accept.className = "cookie-banner__accept";
  accept.textContent = copy.accept;
  accept.addEventListener("click", () => {
    grantConsent();
    banner.remove();
  });

  const reject = document.createElement("button");
  reject.className = "cookie-banner__reject";
  reject.textContent = copy.reject;
  reject.addEventListener("click", () => {
    denyConsent();
    banner.remove();
  });

  actions.append(accept, reject);
  banner.append(text, actions);
  document.body.appendChild(banner);
}

const consent = localStorage.getItem(CONSENT_KEY);

if (consent === "granted") {
  loadGA();
} else if (consent !== "denied") {
  showConsentBanner();
}
