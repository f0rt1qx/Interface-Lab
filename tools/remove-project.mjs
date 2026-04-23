import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import readline from "node:readline/promises";

const rootDir = process.cwd();
const dataFile = path.join(rootDir, "data", "projects.js");
const projectsDir = path.join(rootDir, "assets", "projects");

const ask = async (rl, question, fallback = "") => {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || fallback;
};

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
    return null;
  }

  const [firstAssetPath] = assetPaths;
  const candidateDir = path.dirname(firstAssetPath);

  const allInSameDir = assetPaths.every((assetPath) => path.dirname(assetPath) === candidateDir);

  return allInSameDir && isInside(projectsDir, candidateDir) ? candidateDir : null;
};

const formatProjectLine = (project, index) => {
  const category = project.categoryLabel || project.category || "Без категории";
  const year = project.year || "Без года";
  return `${index + 1}. ${project.title} | ${category} | ${year} | id: ${project.id}`;
};

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

    console.log("\nInterface Lab: удаление проекта\n");
    projects.forEach((project, index) => console.log(formatProjectLine(project, index)));

    const selected = await ask(rl, "\nНомер проекта для удаления");
    const selectedIndex = Number.parseInt(selected, 10) - 1;
    const project = projects[selectedIndex];

    if (!project) {
      throw new Error("Проект с таким номером не найден.");
    }

    console.log(`\nВыбран проект: ${project.title}`);
    const assetDir = getProjectAssetDir(project);

    if (assetDir) {
      console.log(`Папка изображений: ${path.relative(rootDir, assetDir)}`);
    } else {
      console.log("Папку изображений автоматически определить нельзя, удалю только карточку.");
    }

    const confirmCard = await ask(rl, 'Удалить карточку из data/projects.js? Напиши "yes"');

    if (confirmCard.toLowerCase() !== "yes") {
      console.log("Удаление отменено.");
      return;
    }

    const nextProjects = projects.filter((_, index) => index !== selectedIndex);
    await saveProjects(nextProjects);
    console.log("Карточка удалена из data/projects.js.");

    if (assetDir) {
      const confirmAssets = await ask(
        rl,
        'Удалить папку с изображениями проекта? Напиши "delete files"',
        "no",
      );

      if (confirmAssets.toLowerCase() === "delete files") {
        await fs.rm(assetDir, { recursive: true, force: true });
        console.log("Папка с изображениями удалена.");
      } else {
        console.log("Файлы проекта оставлены на месте.");
      }
    }

    console.log("\nПроверь сайт локально, затем выполни:");
    console.log("git add -A");
    console.log(`git commit -m "Remove ${project.title} project"`);
    console.log("git push");
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(`\nОшибка: ${error.message}`);
  process.exitCode = 1;
});
