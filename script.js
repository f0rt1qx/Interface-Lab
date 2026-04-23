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
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`,
    )
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
