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

const socialList = document.getElementById("social-links");

if (!(socialList instanceof HTMLDivElement)) {
  throw new Error('Social links container "#social-links" was not found.');
}

const socialIcons = [
  { label: "LinkedIn", iconClass: "fa-brands fa-linkedin", href: "" },
  { label: "GitHub", iconClass: "fa-brands fa-github", href: "https://github.com/CJConner333" },
  { label: "Resume PDF", iconClass: "fa-solid fa-file-pdf", href: "" },
];

for (const { label, iconClass, href } of socialIcons) {
  const icon = document.createElement("i");
  icon.className = iconClass;
  icon.setAttribute("aria-hidden", "true");

  const item = href ? document.createElement("a") : document.createElement("span");
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