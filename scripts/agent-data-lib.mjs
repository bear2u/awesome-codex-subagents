import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "smol-toml";

export const CATEGORY_META = {
  "01-core-development": {
    order: 1,
    label: { en: "Core Development", ko: "코어 개발" },
    description: {
      en: "Application architecture, implementation, UI work, and protocol-focused development.",
      ko: "애플리케이션 아키텍처, 구현, UI 작업, 프로토콜 중심 개발 영역입니다.",
    },
  },
  "02-language-specialists": {
    order: 2,
    label: { en: "Language Specialists", ko: "언어 전문 에이전트" },
    description: {
      en: "Language and framework specialists for ecosystem-specific implementation and debugging.",
      ko: "언어와 프레임워크 생태계에 특화된 구현과 디버깅을 담당합니다.",
    },
  },
  "03-infrastructure": {
    order: 3,
    label: { en: "Infrastructure", ko: "인프라" },
    description: {
      en: "Deployment, containerization, orchestration, and infrastructure-as-code work.",
      ko: "배포, 컨테이너, 오케스트레이션, IaC 관련 작업을 다룹니다.",
    },
  },
  "04-quality-security": {
    order: 4,
    label: { en: "Quality & Security", ko: "품질·보안" },
    description: {
      en: "Review, testing, security, and verification-heavy specialists.",
      ko: "리뷰, 테스트, 보안, 검증 중심의 전문가 그룹입니다.",
    },
  },
  "05-data-ai": {
    order: 5,
    label: { en: "Data & AI", ko: "데이터·AI" },
    description: {
      en: "Data pipelines, LLM integrations, analytics, and database behavior.",
      ko: "데이터 파이프라인, LLM 연동, 분석, 데이터베이스 동작을 다룹니다.",
    },
  },
  "06-developer-experience": {
    order: 6,
    label: { en: "Developer Experience", ko: "개발자 경험" },
    description: {
      en: "Build systems, tooling, documentation, MCP integrations, and refactors.",
      ko: "빌드 시스템, 도구, 문서화, MCP 통합, 리팩터링을 다룹니다.",
    },
  },
  "07-specialized-domains": {
    order: 7,
    label: { en: "Specialized Domains", ko: "전문 도메인" },
    description: {
      en: "Focused domain specialists with clear implementation or review boundaries.",
      ko: "명확한 구현 또는 리뷰 경계를 가진 도메인 특화 에이전트입니다.",
    },
  },
  "08-business-product": {
    order: 8,
    label: { en: "Business & Product", ko: "비즈니스·프로덕트" },
    description: {
      en: "Requirements, UX, and engineering-adjacent communication tasks.",
      ko: "요구사항, UX, 엔지니어링 연계 커뮤니케이션 작업을 다룹니다.",
    },
  },
  "09-meta-orchestration": {
    order: 9,
    label: { en: "Meta & Orchestration", ko: "메타·오케스트레이션" },
    description: {
      en: "Planning and coordination for larger Codex subagent workflows.",
      ko: "대규모 Codex 서브에이전트 워크플로를 계획하고 조율합니다.",
    },
  },
  "10-research-analysis": {
    order: 10,
    label: { en: "Research & Analysis", ko: "리서치·분석" },
    description: {
      en: "Search, validation, comparison, and technical synthesis.",
      ko: "검색, 검증, 비교, 기술적 종합 정리를 담당합니다.",
    },
  },
};

function sectionKeyForTitle(title) {
  if (title === "Working mode:") return "workingMode";
  if (title === "Focus on:") return "focusOn";
  if (title === "Quality checks:") return "qualityChecks";
  if (title === "Return:") return "returnItems";
  if (/^[A-Z][A-Za-z /&-]+ checks:$/.test(title)) return "implementationChecks";
  return null;
}

function cleanupLines(block) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitList(lines) {
  return lines
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function collectSectionLines(lines, startIndex, endIndex) {
  return splitList(lines.slice(startIndex, endIndex));
}

export function parseDeveloperInstructions(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const cleanLines = lines.map((line) => line.trimEnd());
  const doNotLineIndex = cleanLines.findIndex((line) => /^Do not\b/.test(line.trim()));
  const bodyLines = doNotLineIndex >= 0 ? cleanLines.slice(0, doNotLineIndex) : cleanLines;

  const headingIndices = bodyLines
    .map((line, index) => {
      const title = line.trim();
      const key = sectionKeyForTitle(title);
      if (!key) {
        return null;
      }
      return { key, title, index };
    })
    .filter(Boolean);

  const firstSectionIndex = headingIndices.length > 0 ? headingIndices[0].index : bodyLines.length;
  const summaryLines = cleanupLines(bodyLines.slice(0, firstSectionIndex).join("\n"));

  const sections = {
    summary: summaryLines,
    workingMode: [],
    implementationChecks: [],
    focusOn: [],
    qualityChecks: [],
    returnItems: [],
    doNot: doNotLineIndex >= 0 ? cleanLines[doNotLineIndex].trim() : "",
  };

  for (let i = 0; i < headingIndices.length; i += 1) {
    const current = headingIndices[i];
    const next = headingIndices[i + 1];
    const start = current.index + 1;
    const end = next ? next.index : bodyLines.length;
    sections[current.key].push(...collectSectionLines(bodyLines, start, end));
  }

  return sections;
}

function toSlug(filePath) {
  return path.basename(filePath, ".toml");
}

function toGithubBlobUrl(repositoryUrl, relativePath) {
  const normalized = repositoryUrl.replace(/\.git$/, "");
  return `${normalized}/blob/main/${relativePath}`;
}

function toGithubRawUrl(repositoryUrl, relativePath) {
  const normalized = repositoryUrl
    .replace(/\.git$/, "")
    .replace("https://github.com/", "https://raw.githubusercontent.com/");
  return `${normalized}/main/${relativePath}`;
}

export async function loadTranslations(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function loadAgentSourceRecords({ repoRoot, repositoryUrl }) {
  const categoriesDir = path.join(repoRoot, "categories");
  const categoryKeys = Object.keys(CATEGORY_META).sort(
    (left, right) => CATEGORY_META[left].order - CATEGORY_META[right].order,
  );

  const records = [];

  for (const categoryKey of categoryKeys) {
    const categoryDir = path.join(categoriesDir, categoryKey);
    const entries = await fs.readdir(categoryDir);
    const tomlFiles = entries.filter((entry) => entry.endsWith(".toml")).sort();

    for (const fileName of tomlFiles) {
      const absolutePath = path.join(categoryDir, fileName);
      const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
      const parsed = parse(await fs.readFile(absolutePath, "utf8"));
      const slug = toSlug(fileName);
      const instructions = String(parsed.developer_instructions ?? "");

      records.push({
        slug,
        name: String(parsed.name),
        categoryKey,
        categoryLabel: CATEGORY_META[categoryKey].label,
        categoryDescription: CATEGORY_META[categoryKey].description,
        description: String(parsed.description),
        model: String(parsed.model),
        reasoningEffort: String(parsed.model_reasoning_effort),
        sandboxMode: String(parsed.sandbox_mode),
        developerInstructions: instructions,
        sections: parseDeveloperInstructions(instructions),
        sourcePath: relativePath,
        githubUrl: toGithubBlobUrl(repositoryUrl, relativePath),
        rawUrl: toGithubRawUrl(repositoryUrl, relativePath),
      });
    }
  }

  return records;
}

export function buildInstallCommands(rawUrl, slug) {
  return {
    global: `mkdir -p ~/.codex/agents && curl -L ${rawUrl} -o ~/.codex/agents/${slug}.toml`,
    project: `mkdir -p .codex/agents && curl -L ${rawUrl} -o .codex/agents/${slug}.toml`,
  };
}
