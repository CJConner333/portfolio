/* LOGO SPINNER */

const logoRestartButton = document.getElementById("logo-restart");
const logoSpinAnimation = document.getElementById("logo-spin");

if (!(logoRestartButton instanceof HTMLButtonElement)) {
  throw new Error('Logo restart button "#logo-restart" was not found.');
}

if (!(logoSpinAnimation instanceof SVGAnimationElement)) {
  throw new Error('Logo animation "#logo-spin" was not found.');
}

logoRestartButton.addEventListener("click", () => {
  logoSpinAnimation.beginElement();
});

const landingPage = document.getElementById("landing-page");

if (!(landingPage instanceof HTMLElement)) {
  throw new Error('Landing page "#landing-page" was not found.');
}

const mailButton = document.createElement("a");
mailButton.href = "mailto:chris@cjconner.us";
mailButton.className = "mail__btn click";
mailButton.setAttribute("aria-label", "Email me");

const mailIcon = document.createElement("i");
mailIcon.className = "fa-solid fa-envelope";
mailIcon.setAttribute("aria-hidden", "true");
mailButton.append(mailIcon);

landingPage.insertBefore(mailButton, landingPage.querySelector(".scroll"));

const socialList = document.getElementById("social-links");

if (!(socialList instanceof HTMLDivElement)) {
  throw new Error('Social links container "#social-links" was not found.');
}

const socialIcons = [
  { label: "LinkedIn", iconClass: "fa-brands fa-linkedin", href: "" },
  {
    label: "GitHub",
    iconClass: "fa-brands fa-github",
    href: "https://github.com/CJConner333",
  },
  { label: "Resume PDF", iconClass: "fa-solid fa-file-pdf", href: "" },
];

for (const { label, iconClass, href } of socialIcons) {
  const icon = document.createElement("i");
  icon.className = iconClass;
  icon.setAttribute("aria-hidden", "true");

  const item = href
    ? document.createElement("a")
    : document.createElement("span");
  item.className = "social__link";
  if (href && item instanceof HTMLAnchorElement) {
    item.href = href;
  } else {
    item.setAttribute("role", "img");
  }
  item.setAttribute("aria-label", label);
  item.append(icon);
  socialList.append(item);
}

const projectCarousel = document.querySelector(".project__carousel");
if (!(projectCarousel instanceof HTMLElement)) {
  throw new Error('Project carousel ".project__carousel" was not found.');
}

const projectList = projectCarousel.querySelector(".project__list");
const previousProjectButton = projectCarousel.querySelector(
  ".project__list-nav--prev",
);
const nextProjectButton = projectCarousel.querySelector(
  ".project__list-nav--next",
);

if (
  !(projectList instanceof HTMLUListElement) ||
  !(previousProjectButton instanceof HTMLButtonElement) ||
  !(nextProjectButton instanceof HTMLButtonElement)
) {
  throw new Error("Project carousel track or navigation buttons were not found.");
}

previousProjectButton.addEventListener("click", () => {
  projectList.scrollBy({
    left: -projectList.clientWidth,
    behavior: "smooth",
  });
});

nextProjectButton.addEventListener("click", () => {
  projectList.scrollBy({
    left: projectList.clientWidth,
    behavior: "smooth",
  });
});

//* MODAL *//

let isModalOpen = false;
const scaleFactor = 1 / 20;
const contrastToggleButton = document.querySelector(".contrast-toggle");

function moveBackground(event) {
  const shapes = document.querySelectorAll(".shape");
  const x = event.clientX * scaleFactor;
  const y = event.clientY * scaleFactor;

  for (let i = 0; i < shapes.length; ++i) {
    const isOdd = i % 2 !== 0;
    const boolInt = isOdd ? -1 : 1;
    
    shapes[i].style.transform =
      `translate(${x * boolInt}px, ${y * boolInt}px) rotate(${x * boolInt * 10}deg)`;
  }
}

landingPage.addEventListener("pointermove", moveBackground);

function toggleContrast() {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  if (contrastToggleButton instanceof HTMLButtonElement) {
    contrastToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
  }
}

if (contrastToggleButton instanceof HTMLButtonElement) {
  contrastToggleButton.addEventListener("click", toggleContrast);
}

const modal = document.querySelector(".modal");
const contactLinks = document.querySelectorAll("[data-open-modal='contact']");
const closeModalButton = document.querySelector(".modal__exit");
const contactForm = document.getElementById("contact__form");
const contactFeedback = document.getElementById("contact__feedback");
const formResponseFrame = document.querySelector(
  'iframe[name="contactFormResponse"]',
);

/* TURNSTYLE AND CONTACT FORM */

const turnstileContainer =
  contactForm instanceof HTMLFormElement
    ? contactForm.querySelector(".cf-turnstile")
    : null;
const loadingOverlay = document.querySelector(".modal__overlay--loading");
const successOverlay = document.querySelector(".modal__overlay--success");
const submitButton = document.getElementById("contact__submit");
let turnstileWidgetId = null;
let turnstileLoaded = false;
let isSubmitting = false;
let submissionTimeout = null;

function renderTurnstile() {
  if (
    !(turnstileContainer instanceof HTMLElement) ||
    turnstileWidgetId !== null ||
    !turnstileLoaded ||
    typeof window.turnstile === "undefined"
  ) {
    return;
  }

  const sitekey = turnstileContainer.dataset.sitekey;
  if (!sitekey) {
    if (contactFeedback instanceof HTMLElement) {
      contactFeedback.textContent =
        "Contact verification has not been configured yet.";
      contactFeedback.classList.add("form__feedback--error");
    }
    return;
  }

  turnstileWidgetId = window.turnstile.render(turnstileContainer, {
    sitekey,
    action: "contact",
    callback: () => {
      if (contactFeedback instanceof HTMLElement) {
        contactFeedback.textContent = "";
        contactFeedback.classList.remove("form__feedback--error");
      }
    },
    "error-callback": () => {
      if (contactFeedback instanceof HTMLElement) {
        contactFeedback.textContent =
          "Verification failed to load. Please try again.";
        contactFeedback.classList.add("form__feedback--error");
      }
    },
  });
}

function finishSubmission(message, succeeded = false) {
  if (submissionTimeout !== null) {
    window.clearTimeout(submissionTimeout);
    submissionTimeout = null;
  }

  if (loadingOverlay instanceof HTMLElement) {
    loadingOverlay.classList.remove("modal__overlay--visible");
  }
  if (successOverlay instanceof HTMLElement && succeeded) {
    successOverlay.classList.add("modal__overlay--visible");
  }
  if (contactForm instanceof HTMLFormElement && succeeded) {
    contactForm.reset();
  }
  if (contactFeedback instanceof HTMLElement) {
    contactFeedback.textContent = succeeded ? "" : message;
    contactFeedback.classList.toggle("form__feedback--error", !succeeded);
  }

  isSubmitting = false;
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = false;
  }
  if (turnstileWidgetId !== null && typeof window.turnstile !== "undefined") {
    window.turnstile.reset(turnstileWidgetId);
  }
}

function toggleModal(forceOpen = !isModalOpen) {
  isModalOpen = forceOpen;
  document.body.classList.toggle("modal--open", isModalOpen);
  if (modal instanceof HTMLElement) {
    modal.setAttribute("aria-hidden", String(!isModalOpen));
  }
}

contactLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    toggleModal(true);
    renderTurnstile();
  });
});

if (closeModalButton instanceof HTMLButtonElement) {
  closeModalButton.addEventListener("click", () => toggleModal(false));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isModalOpen) {
    toggleModal(false);
  }
});

if (
  contactForm instanceof HTMLFormElement &&
  formResponseFrame instanceof HTMLIFrameElement
) {
  formResponseFrame.addEventListener("load", () => {
    if (!isSubmitting) {
      return;
    }

    let responseDocument;
    try {
      responseDocument = formResponseFrame.contentDocument;
    } catch (error) {
      console.error("Could not read the contact form response frame.", error);
      finishSubmission(
        "We could not read the server response. Please try again.",
      );
      return;
    }

    const status = responseDocument?.documentElement?.dataset.contactStatus;
    if (status !== "success" && status !== "error") {
      return;
    }

    const message = responseDocument.querySelector(
      "[data-contact-message]",
    )?.textContent;
    finishSubmission(
      message || "We could not read the server response. Please try again.",
      status === "success",
    );
  });

  contactForm.addEventListener("submit", (event) => {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    const captchaToken = new FormData(contactForm).get("cf-turnstile-response");
    if (typeof captchaToken !== "string" || captchaToken === "") {
      event.preventDefault();
      if (contactFeedback instanceof HTMLElement) {
        contactFeedback.textContent =
          "Please complete the verification and try again.";
        contactFeedback.classList.add("form__feedback--error");
      }
      return;
    }

    isSubmitting = true;
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }
    if (contactFeedback instanceof HTMLElement) {
      contactFeedback.textContent = "Sending your message...";
      contactFeedback.classList.remove("form__feedback--error");
    }
    if (successOverlay instanceof HTMLElement) {
      successOverlay.classList.remove("modal__overlay--visible");
    }
    if (loadingOverlay instanceof HTMLElement) {
      loadingOverlay.classList.add("modal__overlay--visible");
    }
    submissionTimeout = window.setTimeout(() => {
      finishSubmission("The server did not respond in time. Please try again.");
    }, 60000);
  });
}

if (turnstileContainer instanceof HTMLElement) {
  const turnstileScript = document.createElement("script");
  turnstileScript.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  turnstileScript.async = true;
  turnstileScript.addEventListener("load", () => {
    turnstileLoaded = true;
    if (isModalOpen) {
      renderTurnstile();
    }
  });
  turnstileScript.addEventListener("error", () => {
    if (contactFeedback instanceof HTMLElement) {
      contactFeedback.textContent =
        "Verification could not be loaded. Please refresh the page and try again.";
      contactFeedback.classList.add("form__feedback--error");
    }
  });
  document.head.append(turnstileScript);
}

if (modal instanceof HTMLElement) {
  modal.setAttribute("aria-hidden", "true");
}


