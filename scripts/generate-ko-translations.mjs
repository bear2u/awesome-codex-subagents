import fs from "node:fs/promises";
import path from "node:path";
import { loadAgentSourceRecords } from "./agent-data-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packageJson = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
const repositoryUrl = packageJson.repository.url;

function buildSectionBlock(index, entries) {
  return `@@${index}@@\n${entries.join("\n¤¤¤\n")}\n@@/${index}@@`;
}

function parseTranslatedBlock(text) {
  const sections = [];

  for (let index = 0; index < 9; index += 1) {
    const pattern = new RegExp(`@@${index}@@\\n?([\\s\\S]*?)\\n?@@/${index}@@`);
    const match = text.match(pattern);
    sections[index] = match?.[1]?.trim() ?? "";
  }

  return sections;
}

async function translateText(text) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", "ko");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translation request failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload[0].map((chunk) => chunk[0]).join("");
}

const sourceRecords = await loadAgentSourceRecords({ repoRoot, repositoryUrl });
const translations = {};

for (const [index, record] of sourceRecords.entries()) {
  const block = [
    buildSectionBlock(0, [record.description]),
    buildSectionBlock(1, [record.developerInstructions]),
    buildSectionBlock(2, record.sections.summary),
    buildSectionBlock(3, record.sections.workingMode),
    buildSectionBlock(4, record.sections.implementationChecks),
    buildSectionBlock(5, record.sections.focusOn),
    buildSectionBlock(6, record.sections.qualityChecks),
    buildSectionBlock(7, record.sections.returnItems),
    buildSectionBlock(8, [record.sections.doNot]),
  ].join("\n");

  const translatedBlock = parseTranslatedBlock(await translateText(block));

  const toItems = (value) =>
    value ? value.split("\n¤¤¤\n").map((item) => item.trim()).filter(Boolean) : [];

  translations[record.slug] = {
    description: translatedBlock[0] || record.description,
    instructions: translatedBlock[1] || record.developerInstructions,
    sections: {
      summary: toItems(translatedBlock[2]),
      workingMode: toItems(translatedBlock[3]),
      implementationChecks: toItems(translatedBlock[4]),
      focusOn: toItems(translatedBlock[5]),
      qualityChecks: toItems(translatedBlock[6]),
      returnItems: toItems(translatedBlock[7]),
      doNot: translatedBlock[8] || record.sections.doNot,
    },
  };

  console.log(`[${index + 1}/${sourceRecords.length}] translated ${record.slug}`);
}

await fs.writeFile(
  path.join(repoRoot, "site/data/ko-translations.json"),
  `${JSON.stringify(translations, null, 2)}\n`,
);

console.log(`Saved Korean translations for ${sourceRecords.length} agents.`);
