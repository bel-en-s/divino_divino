import { scrambleIn } from "./scramble.js";

// segundo access key (holadivinodivino@gmail.com). Reemplazalo por el que crees en web3forms.com
const SECOND_ACCESS_KEY = "PONER_AQUI_EL_SEGUNDO_ACCESS_KEY";

const tr = (key, fallback) => (window.t && window.t(key)) || fallback;

function track(event, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params || {});
  }
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (!link) return;
  const href = link.getAttribute("href") || "";
  let label = "";
  if (href.startsWith("mailto:")) label = "email_click";
  else if (href.includes("wa.me")) label = "whatsapp_click";
  else if (href.includes("calendly.com")) label = "calendly_click";
  if (label) track("contact_click", { event_category: "outbound", event_label: label });
});

// main execution
document.addEventListener("DOMContentLoaded", () => {
  const contactTextElements = document.querySelectorAll(
    ".contact-copy h4, .contact-copy-footer p"
  );

  // apply staggered scramble effect
  contactTextElements.forEach((element, index) => {
    if (element.textContent.trim()) {
      const delay = 0.75 + index * 0.1;

      scrambleIn(element, delay, {
        duration: 0.1,
        charDelay: 50,
        stagger: 25,
        skipChars: 0,
        maxIterations: 5,
      });
    }
  });

  // contact form submission (shared by landing + /contact)
  document.querySelectorAll(".formulario-landing").forEach((form) => {
    const result = form.querySelector(".form-result");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      result.textContent = tr("form-sending", "Sending...");
      result.style.color = "";

      const formData = new FormData(form);

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData,
        });

        if (SECOND_ACCESS_KEY !== "PONER_AQUI_EL_SEGUNDO_ACCESS_KEY") {
          const secondData = new FormData(form);
          secondData.set("access_key", SECOND_ACCESS_KEY);
          fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: secondData,
          }).catch(() => {});
        }

        const data = await response.json();

        if (data.success) {
          track("generate_lead", { event_category: "contact", event_label: "form_submit" });
          result.textContent = tr("form-success", "Thanks! Your message has been sent.");
          form.reset();
        } else {
          result.textContent = tr("form-error", "There was an error sending your message. Please try again.");
          result.style.color = "var(--tone-500)";
        }
      } catch (err) {
        result.textContent = tr("form-conn-error", "Connection error.");
        result.style.color = "var(--tone-500)";
      }
    });
  });
});
