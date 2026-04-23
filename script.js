const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const filters = document.querySelectorAll(".filter");
const projectsGrid = document.querySelector("#projects-grid");
const projectModal = document.querySelector("#project-modal");
const projectModalGallery = document.querySelector("#project-modal-gallery");
const projectModalMeta = document.querySelector("#project-modal-meta");
const projectModalTitle = document.querySelector("#project-modal-title");
const projectModalDescription = document.querySelector("#project-modal-description");
const projectModalLinks = document.querySelector("#project-modal-links");
const projects = window.portfolioProjects ?? [];
let activeFilter = "all";

const linkIcons = {
  behance:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 11.2c1.1 0 1.8-.5 1.8-1.4 0-1-.7-1.4-1.9-1.4H5v2.8h2.8Zm.4 4.4c1.3 0 2.1-.6 2.1-1.7s-.8-1.7-2.1-1.7H5v3.4h3.2ZM3 6.6h5c2.2 0 3.6 1 3.6 2.8 0 1.2-.6 2-1.6 2.4 1.4.4 2.3 1.4 2.3 3 0 2.1-1.7 3.4-4.3 3.4H3V6.6Zm11.2 2.1h5.2v1.5h-5.2V8.7Zm2.8 2.4c-1.2 0-2 .8-2.1 1.9h4.1c-.1-1.2-.8-1.9-2-1.9Zm.2 5.8c.9 0 1.5-.3 2-1l1.5.9c-.8 1.1-1.9 1.7-3.6 1.7-2.7 0-4.3-1.8-4.3-4.3 0-2.4 1.6-4.4 4.2-4.4 2.5 0 4 1.9 4 4.2v.6h-6.1c.2 1.5 1.1 2.3 2.3 2.3Z"/></svg>',
  demo:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>',
  dribbble:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm5.9 4.2a7 7 0 0 1 1.6 4.4c-1.8-.4-3.4-.5-4.9-.3-.2-.5-.4-.9-.6-1.4 1.5-.6 2.8-1.5 3.9-2.7ZM12 5c1.7 0 3.3.6 4.5 1.6-.9 1-2 1.7-3.3 2.2-.8-1.4-1.7-2.6-2.6-3.7.5-.1.9-.1 1.4-.1Zm-3.6.9c1 1.1 1.9 2.3 2.7 3.6-1.7.4-3.7.6-6 .6.5-1.8 1.7-3.3 3.3-4.2ZM5 12v-.1c2.8 0 5.2-.3 7-.8.2.4.4.8.5 1.2-2.3.8-4.2 2.3-5.6 4.5A7 7 0 0 1 5 12Zm7 7a7 7 0 0 1-3.7-1c1.2-2 2.9-3.3 4.9-4 .5 1.4.9 2.9 1.1 4.5-.7.3-1.5.5-2.3.5Zm4.1-1.6c-.2-1.4-.5-2.8-1-4 1.3-.1 2.7 0 4.1.4-.4 1.5-1.5 2.8-3.1 3.6Z"/></svg>',
  figma:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h4v7H8a3.5 3.5 0 1 1 0-7Zm4 0h4a3.5 3.5 0 1 1 0 7h-4V2ZM8 10h4v4H8a2 2 0 1 1 0-4Zm4 0h4a3.5 3.5 0 1 1-3.5 3.5V10H12Zm-4 5h4v3a3.5 3.5 0 1 1-4-3Z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.7 7.7c-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 2.8 1a9.7 9.7 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.5.2 2.5.1 2.8a3.9 3.9 0 0 1 1.1 2.8c0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v3.5c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>',
  link:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.8-2.8a3 3 0 1 1 4.2 4.2l-2.1 2.1a3 3 0 0 1-4.2 0 1 1 0 0 1 1.4-1.4 1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 1 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-2.8 2.8a3 3 0 1 1-4.2-4.2l2.1-2.1a3 3 0 0 1 4.2 0 1 1 0 0 1-1.4 1.4 1 1 0 0 0-1.4 0L7.8 12a1 1 0 1 0 1.4 1.4l2.8-2.8a1 1 0 0 1 1.4 0Z"/></svg>',
};

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open") ?? false;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("is-locked", isOpen);
});

nav?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) {
    return;
  }

  nav.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-locked");
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const inferLinkIcon = (link) => {
  const value = `${link.icon ?? ""} ${link.label ?? ""} ${link.url ?? ""}`.toLowerCase();

  if (value.includes("github.com") || value.includes("github")) return "github";
  if (value.includes("figma.com") || value.includes("figma")) return "figma";
  if (value.includes("behance.net") || value.includes("behance")) return "behance";
  if (value.includes("dribbble.com") || value.includes("dribbble")) return "dribbble";
  if (value.includes("demo") || value.includes("сайт") || value.includes("site")) return "demo";

  return "link";
};

const renderProjectLink = (link) => {
  const iconName = inferLinkIcon(link);
  const icon = linkIcons[iconName] ?? linkIcons.link;

  return `
    <a class="project-link project-link--${escapeHtml(iconName)}" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
      <span class="project-link__icon">${icon}</span>
      <span>${escapeHtml(link.label)}</span>
    </a>
  `;
};

const renderProjects = () => {
  if (!projectsGrid) {
    return;
  }

  const filteredProjects =
    activeFilter === "all" ? projects : projects.filter((project) => project.category === activeFilter);

  if (filteredProjects.length === 0) {
    projectsGrid.innerHTML = '<p class="projects-empty">В этой категории пока нет проектов.</p>';
    return;
  }

  projectsGrid.innerHTML = filteredProjects
    .map(
      (project, index) => `
        <article class="work-card reveal is-visible" data-project-id="${escapeHtml(project.id)}">
          <button class="work-card__button" type="button" aria-label="Открыть проект ${escapeHtml(project.title)}">
            <div class="work-card__image">
              <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)}" loading="lazy" />
              <span>${String(index + 1).padStart(2, "0")}</span>
            </div>
            <div class="work-card__body">
              <p class="work-card__meta">${escapeHtml(project.categoryLabel)} / ${escapeHtml(project.year)}</p>
              <h3>${escapeHtml(project.title)}</h3>
              <p>${escapeHtml(project.summary)}</p>
            </div>
          </button>
        </article>
      `,
    )
    .join("");
};

const openProject = (projectId) => {
  const project = projects.find((item) => item.id === projectId);

  if (!project || !projectModal || !projectModalGallery || !projectModalMeta || !projectModalTitle || !projectModalDescription || !projectModalLinks) {
    return;
  }

  projectModalGallery.innerHTML = project.gallery
    .map((image) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" loading="lazy" />`)
    .join("");
  projectModalMeta.textContent = `${project.categoryLabel} / ${project.year} / ${project.role}`;
  projectModalTitle.textContent = project.title;
  projectModalDescription.textContent = project.description;
  projectModalLinks.innerHTML = project.links
    .map(renderProjectLink)
    .join("");

  projectModal.classList.add("is-open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
};

const closeProject = () => {
  projectModal?.classList.remove("is-open");
  projectModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
};

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter ?? "all";

    filters.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    renderProjects();
  });
});

projectsGrid?.addEventListener("click", (event) => {
  const card = event.target instanceof Element ? event.target.closest("[data-project-id]") : null;

  if (!(card instanceof HTMLElement)) {
    return;
  }

  openProject(card.dataset.projectId ?? "");
});

projectModal?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.hasAttribute("data-close-modal")) {
    closeProject();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProject();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12,
  },
);

renderProjects();

const revealItems = document.querySelectorAll(".reveal");
revealItems.forEach((item) => revealObserver.observe(item));
