const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const filters = document.querySelectorAll(".filter");
const workCards = document.querySelectorAll(".work-card");
const revealItems = document.querySelectorAll(".reveal");

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

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter ?? "all";

    filters.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    workCards.forEach((card) => {
      const shouldShow = selectedCategory === "all" || card.dataset.category === selectedCategory;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
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

revealItems.forEach((item) => revealObserver.observe(item));
