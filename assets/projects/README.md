# Как добавлять проекты

Для каждого проекта создай отдельную папку внутри `assets/projects/`.

Пример:

```text
assets/projects/my-project/
  cover.jpg
  screen-01.jpg
  screen-02.jpg
```

После этого добавь проект в `data/projects.js`.

Минимальный пример:

```js
{
  id: "my-project",
  title: "Название проекта",
  category: "design",
  categoryLabel: "Дизайн",
  year: "2026",
  role: "UI design",
  cover: "assets/projects/my-project/cover.jpg",
  summary: "Короткое описание для карточки.",
  description: "Подробное описание проекта для окна просмотра.",
  links: [
    { label: "Сайт", url: "https://example.com" }
  ],
  gallery: [
    "assets/projects/my-project/cover.jpg",
    "assets/projects/my-project/screen-01.jpg"
  ]
}
```

Категории для фильтров: `design`, `frontend`, `media`.
