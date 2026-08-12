const translations = {
  es: {
    "lang-label": "ES",
    "lang-toggle": "SWITCH LANGUAGE",
    "menu-btn": "Menu",
    "nav-cta": "[ \u00a0hablemos de tu proyecto\u00a0 ]",
    "footer-desc": "Sitios web, landing pages y experiencias digitales pensadas para verse bien y funcionar mejor.",
    "footer-cta": "[ \u00a0Hablemos de tu proyecto\u00a0 ]",
    "footer-dev": "Developed by DIVINO DIVINO",
    "nav-index": "Index",
    "nav-work": "Work",
    "nav-contact": "Contact",
    "nav-instagram": "Instagram",
    "nav-belu": "belu",

    "seo-description": "DIVINO DIVINO es un estudio de diseño web creativo y posicionamiento SEO en Buenos Aires. Sitios web, e-commerce y experiencias digitales para pymes y estudios en Argentina.",

    "hero-heading": "Dirección, Diseño y Estrategia",
    "hero-sub": "para TU MUNDO DIGITAL",
    "hero-scroll": "[ \u00a0Scroll to Continue\u00a0 ]",
    "services-heading": "Diseño web creativo",
    "services-desc": "Diseñamos la forma en que una marca existe en internet. La web es el resultado de un proceso que combina estrategia, dirección creativa y desarrollo.",
    "workflow-heading": "De la idea a la experiencia",
    "workflow-1-title": "Descubrimos tu esencia",
    "workflow-1-desc": "Entendemos quién sos, qué querés comunicar y hacia dónde va tu proyecto.",
    "workflow-2-title": "Diseñamos tu mundo digital",
    "workflow-2-desc": "Creamos una experiencia que ordena tus ideas y transforma tu identidad en una presencia digital clara, funcional y memorable.",
    "workflow-3-title": "Ganás tranquilidad",
    "workflow-3-desc": "Dejás de preocuparte por la parte técnica y empezás a disfrutar de una web que te representa, conecta con tu audiencia y acompaña el crecimiento de tu marca.",
    "see-work": "VER TRABAJOS",
    "see-more": "[ \u00a0ver más\u00a0 ]",
    "nosotras-tagline": "Dirección de arte interactivo. Diseño digital. Branding & Visual Diseño web premium.",
    "contact-heading": "Contactanos",
    "contact-sub": "Dirección, diseño y posicionamiento SEO",
    "contact-name": "Nombre",
    "contact-email": "Email",
    "contact-message": "Mensaje",
    "contact-send": "Enviar",
    "see-work-link": "See work",
    "sound-on": "sound on",
    "sound-off": "sound off",
  },
  en: {
    "lang-label": "EN",
    "lang-toggle": "CAMBIAR IDIOMA",
    "menu-btn": "Menu",
    "nav-cta": "[ \u00a0let's talk about your project\u00a0 ]",
    "footer-desc": "Websites, landing pages, and digital experiences designed to look good and work better.",
    "footer-cta": "[ \u00a0Let's talk about your project\u00a0 ]",
    "footer-dev": "Developed by DIVINO DIVINO",
    "nav-index": "Index",
    "nav-work": "Work",
    "nav-contact": "Contact",
    "nav-instagram": "Instagram",
    "nav-belu": "belu",

    "seo-description": "DIVINO DIVINO is a creative web design & SEO studio in Buenos Aires. Websites, e-commerce, and digital experiences for SMEs and studios in Argentina.",

    "hero-heading": "Direction, Design <br />& Strategy",
    "hero-sub": "for YOUR DIGITAL WORLD",
    "hero-scroll": "[ \u00a0Scroll to Continue\u00a0 ]",
    "services-heading": "Creative Web Design",
    "services-desc": "We design the way a brand exists online. The web is the result of a process that combines strategy, creative direction, and development.",
    "workflow-heading": "From Idea to Experience",
    "workflow-1-title": "We discover your essence",
    "workflow-1-desc": "We understand who you are, what you want to communicate, and where your project is headed.",
    "workflow-2-title": "We design your digital world",
    "workflow-2-desc": "We create an experience that organizes your ideas and transforms your identity into a clear, functional, and memorable digital presence.",
    "workflow-3-title": "You gain peace of mind",
    "workflow-3-desc": "Stop worrying about the technical side and start enjoying a website that represents you, connects with your audience, and supports your brand's growth.",
    "see-work": "SEE WORK",
    "see-more": "[ \u00a0see more\u00a0 ]",
    "nosotras-tagline": "Interactive art direction. Digital design.<br> Branding & Visual premium web design.",
    "contact-heading": "Contact us",
    "contact-sub": "Direction, design & SEO positioning",
    "contact-name": "Name",
    "contact-email": "Email",
    "contact-message": "Message",
    "contact-send": "Send",
    "see-work-link": "See work",
    "sound-on": "sound on",
    "sound-off": "sound off",
  },
};

function getLang() {
  return localStorage.getItem("lang") || "es";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  location.reload();
}

function translate() {
  const lang = getLang();
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = translations[lang]?.[key];
    if (text) el.textContent = text;
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    const text = translations[lang]?.[key];
    if (text) el.innerHTML = text;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const text = translations[lang]?.[key];
    if (text) el.placeholder = text;
  });

  const langToggle = document.querySelector(".lang-toggle");
  if (langToggle) {
    langToggle.textContent = translations[lang]?.["lang-toggle"] || (lang === "es" ? "EN" : "ES");
  }

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = translations[lang]?.["seo-description"] || metaDesc.content;
  }

  window.currentLang = lang;
}

function initLangToggle() {
  const toggle = document.querySelector(".lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = getLang() === "es" ? "en" : "es";
      setLang(next);
    });
  }
}

function boot() {
  translate();
  initLangToggle();
  window.translations = translations;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
