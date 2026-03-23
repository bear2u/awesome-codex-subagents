import fs from "node:fs/promises";
import path from "node:path";
import {
  buildInstallCommands,
  CATEGORY_META,
  loadAgentSourceRecords,
  loadTranslations,
} from "./agent-data-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
const repositoryUrl = packageJson.repository.url;

const translations = await loadTranslations(path.join(repoRoot, "site/data/ko-translations.json"));
const sourceRecords = await loadAgentSourceRecords({ repoRoot, repositoryUrl });

const agents = sourceRecords.map((record) => {
  const translated = translations[record.slug] ?? {};
  const translatedSections = translated.sections ?? {};

  return {
    slug: record.slug,
    name: record.name,
    categoryKey: record.categoryKey,
    categoryLabel: record.categoryLabel,
    categoryDescription: record.categoryDescription,
    description: {
      en: record.description,
      ko: translated.description ?? record.description,
    },
    instructions: {
      en: record.developerInstructions,
      ko: translated.instructions ?? record.developerInstructions,
      sections: {
        summary: record.sections.summary.map((entry, index) => ({
          en: entry,
          ko: translatedSections.summary?.[index] ?? entry,
        })),
        workingMode: record.sections.workingMode.map((entry, index) => ({
          en: entry,
          ko: translatedSections.workingMode?.[index] ?? entry,
        })),
        implementationChecks: record.sections.implementationChecks.map((entry, index) => ({
          en: entry,
          ko: translatedSections.implementationChecks?.[index] ?? entry,
        })),
        focusOn: record.sections.focusOn.map((entry, index) => ({
          en: entry,
          ko: translatedSections.focusOn?.[index] ?? entry,
        })),
        qualityChecks: record.sections.qualityChecks.map((entry, index) => ({
          en: entry,
          ko: translatedSections.qualityChecks?.[index] ?? entry,
        })),
        returnItems: record.sections.returnItems.map((entry, index) => ({
          en: entry,
          ko: translatedSections.returnItems?.[index] ?? entry,
        })),
        doNot: {
          en: record.sections.doNot,
          ko: translatedSections.doNot ?? record.sections.doNot,
        },
      },
    },
    model: record.model,
    reasoningEffort: record.reasoningEffort,
    sandboxMode: record.sandboxMode,
    sourcePath: record.sourcePath,
    githubUrl: record.githubUrl,
    rawUrl: record.rawUrl,
    installCommands: buildInstallCommands(record.rawUrl, record.slug),
  };
});

const categories = Object.entries(CATEGORY_META)
  .sort(([, left], [, right]) => left.order - right.order)
  .map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    count: agents.filter((agent) => agent.categoryKey === key).length,
  }));

const payload = {
  generatedAt: new Date().toISOString(),
  totalAgents: agents.length,
  categories,
  agents,
};

await fs.writeFile(
  path.join(repoRoot, "site/public/agents.generated.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
);

console.log(`Generated data for ${agents.length} agents across ${categories.length} categories.`);
