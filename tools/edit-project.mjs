import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import readline from "node:readline/promises";

const rootDir = process.cwd();
const dataFile = path.join(rootDir, "data", "projects.js");
const projectsDir = path.join(rootDir, "assets", "projects");
const supportedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

const categories = {
  design: "Дизайн",
  frontend: "Разработка",
  media: "Медиа",
};

const ask = async (rl, question, fallback = "") => {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || fallback;
};

const askOptional = async (rl, question, currentValue = "") => {
  const suffix = currentValue ? ` [сейчас: ${currentValue}]` : "";
  return (await rl.question(`${question}${suffix}: `)).trim();
};

const normalizePath = (value) => {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed ? path.resolve(rootDir, trimmed) : "";
};

const toSitePath = (absolutePath) => path.relative(rootDir, absolutePath).replaceAll(path.sep, "/");

const loadProjects = async () => {
  const source = await fs.readFile(dataFile, "utf8");
  const sandbox = { window: {} };

  vm.runInNewContext(source, sandbox, {
    filename: dataFile,
  });

  if (!Array.isArray(sandbox.window.portfolioProjects)) {
    throw new Error("data/projects.js должен содержать массив window.portfolioProjects.");
  }

  return sandbox.window.portfolioProjects;
};

const saveProjects = async (projects) => {
  const json = JSON.stringify(projects, null, 2);
  await fs.writeFile(dataFile, `window.portfolioProjects = ${json};\n`, "utf8");
};

const getImagesFromFolder = async (folderPath) => {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(folderPath, entry.name))
    .filter((filePath) => supportedImageExtensions.has(path.extname(filePath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ru"));
};

const parseLinks = (value, currentLinks) => {
  if (!value.trim()) {
    return currentLinks;
  }

  if (value.trim().toLowerCase() === "none") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...urlParts] = item.split("=");
      const url = urlParts.join("=").trim();
      const [rawLabel, rawIcon] = label.split("|").map((part) => part.trim());

      return {
        label: rawLabel || "Ссылка",
        ...(rawIcon ? { icon: rawIcon } : {}),
        url,
      };
    })
    .filter((link) => link.url);
};

const normalizeSitePath = (sitePath) => path.resolve(rootDir, sitePath.replaceAll("/", path.sep));

const isInside = (parentPath, childPath) => {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
};

const getProjectAssetDir = (project) => {
  const assetPaths = [project.cover, ...(project.gallery ?? [])]
    .filter(Boolean)
    .map(normalizeSitePath)
    .filter((assetPath) => isInside(projectsDir, assetPath));

  if (assetPaths.length === 0) {
    return path.join(projectsDir, project.id);
  }

  const [firstAssetPath] = assetPaths;
  return path.dirname(firstAssetPath);
};

const copyReplacementImages = async ({ project, imagePaths }) => {
  const projectDir = getProjectAssetDir(project);
  await fs.mkdir(projectDir, { recursive: true });

  const copiedImages = [];

  for (const [index, imagePath] of imagePaths.entries()) {
    const extension = path.extname(imagePath).toLowerCase();
    const filename = index === 0 ? `cover${extension}` : `screen-${String(index).padStart(2, "0")}${extension}`;
    const destination = path.join(projectDir, filename);

    await fs.copyFile(imagePath, destination);
    copiedImages.push(toSitePath(destination));
  }

  return copiedImages;
};

const collectReplacementImages = async (imagesInput) => {
  const firstImageInput = normalizePath(imagesInput);

  if (!firstImageInput) {
    return [];
  }

  const stat = await fs.stat(firstImageInput).catch(() => null);
  const imagePaths = stat?.isDirectory()
    ? await getImagesFromFolder(firstImageInput)
    : imagesInput.split(",").map(normalizePath).filter(Boolean);

  if (imagePaths.length === 0) {
    throw new Error("Не нашёл изображений. Поддерживаются jpg, jpeg, png, webp, gif и svg.");
  }

  for (const imagePath of imagePaths) {
    const imageStat = await fs.stat(imagePath).catch(() => null);
    const extension = path.extname(imagePath).toLowerCase();

    if (!imageStat?.isFile() || !supportedImageExtensions.has(extension)) {
      throw new Error(`Файл не найден или не является изображением: ${imagePath}`);
    }
  }

  return imagePaths;
};

const formatProjectLine = (project, index) => {
  const category = project.categoryLabel || project.category || "Без категории";
  const year = project.year || "Без года";
  return `${index + 1}. ${project.title} | ${category} | ${year} | id: ${project.id}`;
};

const formatLinks = (links = []) =>
  links.map((link) => `${link.label}${link.icon ? `|${link.icon}` : ""}=${link.url}`).join(", ");

const main = async () => {
  const projects = await loadProjects();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    if (projects.length === 0) {
      console.log("Проектов пока нет.");
      return;
    }

    console.log("\nInterface Lab: редактирование проекта\n");
    projects.forEach((project, index) => console.log(formatProjectLine(project, index)));

    const selected = await ask(rl, "\nНомер проекта для редактирования");
    const selectedIndex = Number.parseInt(selected, 10) - 1;
    const project = projects[selectedIndex];

    if (!project) {
      throw new Error("Проект с таким номером не найден.");
    }

    console.log(`\nРедактируем: ${project.title}`);
    console.log("Оставь поле пустым, если не хочешь его менять.");
    console.log('Для удаления всех ссылок напиши "none" в поле ссылок.\n');

    const title = await askOptional(rl, "Название", project.title);
    const category = await askOptional(rl, "Категория: design, frontend или media", project.category);
    const categoryLabel = await askOptional(rl, "Название категории на сайте", project.categoryLabel);
    const year = await askOptional(rl, "Год", project.year);
    const role = await askOptional(rl, "Роль / стек", project.role);
    const summary = await askOptional(rl, "Короткое описание", project.summary);
    const description = await askOptional(rl, "Подробное описание", project.description);
    const links = await askOptional(
      rl,
      "Ссылки через запятую: GitHub=https://github.com/user/repo или Figma|figma=https://figma.com/file/...",
      formatLinks(project.links),
    );
    const images = await askOptional(
      rl,
      "Новые картинки: путь к папке или файлы через запятую",
      "оставить текущие",
    );

    const nextProject = {
      ...project,
      title: title || project.title,
      category: categories[category] ? category : project.category,
      categoryLabel: categoryLabel || (categories[category] ?? project.categoryLabel),
      year: year || project.year,
      role: role || project.role,
      summary: summary || project.summary,
      description: description || project.description,
      links: parseLinks(links, project.links ?? []),
    };

    if (images && images !== "оставить текущие") {
      const imagePaths = await collectReplacementImages(images);
      const gallery = await copyReplacementImages({ project, imagePaths });
      nextProject.cover = gallery[0];
      nextProject.gallery = gallery;
    }

    projects[selectedIndex] = nextProject;
    await saveProjects(projects);

    console.log("\nПроект обновлён.");
    console.log("Проверь сайт локально, затем выполни:");
    console.log("git add -A");
    console.log(`git commit -m "Update ${nextProject.title} project"`);
    console.log("git push");
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(`\nОшибка: ${error.message}`);
  process.exitCode = 1;
});
