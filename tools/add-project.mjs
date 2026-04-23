import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
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

const translitMap = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const ask = async (rl, question, fallback = "") => {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || fallback;
};

const slugify = (value) => {
  const transliterated = value
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("");

  return (
    transliterated
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "project"
  );
};

const normalizePath = (value) => {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");

  if (!trimmed) {
    return "";
  }

  return path.resolve(rootDir, trimmed);
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

const parseLinks = (value) => {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...urlParts] = item.split("=");
      const url = urlParts.join("=").trim();

      return {
        label: label.trim() || "Ссылка",
        url,
      };
    })
    .filter((link) => link.url);
};

const copyProjectImages = async ({ imagePaths, slug }) => {
  const projectDir = path.join(projectsDir, slug);
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

const ensureUniqueId = (projects, preferredId) => {
  const usedIds = new Set(projects.map((project) => project.id));

  if (!usedIds.has(preferredId)) {
    return preferredId;
  }

  let index = 2;
  let nextId = `${preferredId}-${index}`;

  while (usedIds.has(nextId)) {
    index += 1;
    nextId = `${preferredId}-${index}`;
  }

  return nextId;
};

const main = async () => {
  const projects = await loadProjects();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\nInterface Lab: добавление проекта\n");

    const title = await ask(rl, "Название проекта");
    const suggestedSlug = slugify(title);
    const slug = ensureUniqueId(projects, slugify(await ask(rl, "URL-имя проекта", suggestedSlug)));
    const categoryInput = await ask(rl, "Категория: design, frontend или media", "frontend");
    const category = categories[categoryInput] ? categoryInput : "frontend";
    const categoryLabel = await ask(rl, "Название категории на сайте", categories[category]);
    const year = await ask(rl, "Год", String(new Date().getFullYear()));
    const role = await ask(rl, "Твоя роль / стек", "UI design, frontend");
    const summary = await ask(rl, "Короткое описание для карточки");
    const description = await ask(rl, "Подробное описание для окна проекта", summary);
    const linksInput = await ask(
      rl,
      "Ссылки через запятую в формате Название=https://example.com",
      "",
    );
    const imagesInput = await ask(
      rl,
      "Пути к картинкам через запятую или путь к папке с картинками",
      "",
    );

    let imagePaths = [];
    const firstImageInput = normalizePath(imagesInput);

    if (!firstImageInput) {
      throw new Error("Нужно указать хотя бы одну картинку.");
    }

    const stat = await fs.stat(firstImageInput).catch(() => null);

    if (stat?.isDirectory()) {
      imagePaths = await getImagesFromFolder(firstImageInput);
    } else {
      imagePaths = imagesInput.split(",").map(normalizePath).filter(Boolean);
    }

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

    const gallery = await copyProjectImages({ imagePaths, slug });

    const project = {
      id: slug,
      title,
      category,
      categoryLabel,
      year,
      role,
      cover: gallery[0],
      summary,
      description,
      links: parseLinks(linksInput),
      gallery,
    };

    projects.unshift(project);
    await saveProjects(projects);

    console.log("\nПроект добавлен.");
    console.log(`Папка: ${pathToFileURL(path.join(projectsDir, slug)).href}`);
    console.log("Проверь сайт локально, затем выполни:");
    console.log("git add -A");
    console.log(`git commit -m "Add ${title} project"`);
    console.log("git push");
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(`\nОшибка: ${error.message}`);
  process.exitCode = 1;
});
