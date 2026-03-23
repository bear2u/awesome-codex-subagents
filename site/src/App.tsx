import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { AgentRecord, AgentsPayload, Language, QueryState } from "./types";

const defaultState: QueryState = {
  q: "",
  category: "",
  mode: "",
  model: "",
  agent: "",
  lang: "ko",
};

const dictionary = {
  ko: {
    brand: "Codex Agents Atlas",
    navTag: "GitHub Pages Directory",
    heroEyebrow: "136개 Codex 서브에이전트 · 한국어 탐색",
    heroTitle: "에이전트를 한국어로 찾고, 바로 설치하는 디렉터리",
    heroBody:
      "원본 TOML을 기반으로 카테고리, 설명, 작업 지침을 한국어로 읽고 전역 또는 프로젝트 범위로 즉시 설치할 수 있습니다.",
    primaryCta: "에이전트 찾기",
    secondaryCta: "설치 방식 보기",
    statsAgents: "총 에이전트",
    statsCategories: "카테고리",
    statsInstall: "즉시 설치",
    searchLabel: "에이전트 검색",
    searchPlaceholder: "이름, 설명, 카테고리, 한국어 키워드로 검색",
    categoryLabel: "카테고리",
    modeLabel: "권한",
    modelLabel: "모델",
    all: "전체",
    readOnly: "읽기 전용",
    workspaceWrite: "쓰기 가능",
    noResultsTitle: "조건에 맞는 에이전트가 없습니다.",
    noResultsBody: "검색어를 줄이거나 필터를 초기화해 보세요.",
    clearFilters: "필터 초기화",
    selectedAgent: "선택된 에이전트",
    install: "설치",
    installGlobal: "전역 설치",
    installProject: "프로젝트 설치",
    copyCommand: "명령 복사",
    copied: "복사됨",
    rawDownload: "원본 다운로드",
    githubSource: "GitHub 원본",
    sourcePath: "소스 경로",
    instructionsKo: "한국어 지침",
    instructionsEn: "영문 원문",
    summary: "요약",
    workingMode: "작업 방식",
    implementationChecks: "구현 체크",
    focusOn: "집중 포인트",
    qualityChecks: "품질 체크",
    returnItems: "반환 형식",
    doNot: "하지 말아야 할 것",
    relatedMeta: "실행 정보",
    intro: "에이전트 소개",
    generatedAt: "데이터 생성 시각",
    stickyRail: "카테고리 레일",
    selectPrompt: "목록에서 에이전트를 선택하면 상세 정보와 설치 명령이 열립니다.",
    results: "검색 결과",
    rows: "행 기반 디렉터리",
    loading: "에이전트 데이터를 불러오는 중입니다.",
  },
  en: {
    brand: "Codex Agents Atlas",
    navTag: "GitHub Pages Directory",
    heroEyebrow: "136 Codex subagents · Korean-ready directory",
    heroTitle: "Find the right agent fast and install it immediately",
    heroBody:
      "Browse category, description, and instruction data sourced from the original TOML files, with Korean and English views side by side.",
    primaryCta: "Browse agents",
    secondaryCta: "See install flow",
    statsAgents: "Agents",
    statsCategories: "Categories",
    statsInstall: "Instant install",
    searchLabel: "Search agents",
    searchPlaceholder: "Search by name, description, category, or Korean keywords",
    categoryLabel: "Category",
    modeLabel: "Sandbox",
    modelLabel: "Model",
    all: "All",
    readOnly: "Read-only",
    workspaceWrite: "Workspace-write",
    noResultsTitle: "No agents match the current filters.",
    noResultsBody: "Loosen the query or reset the filter set.",
    clearFilters: "Reset filters",
    selectedAgent: "Selected agent",
    install: "Install",
    installGlobal: "Global install",
    installProject: "Project install",
    copyCommand: "Copy command",
    copied: "Copied",
    rawDownload: "Download raw",
    githubSource: "GitHub source",
    sourcePath: "Source path",
    instructionsKo: "Korean instructions",
    instructionsEn: "Original English",
    summary: "Summary",
    workingMode: "Working mode",
    implementationChecks: "Implementation checks",
    focusOn: "Focus on",
    qualityChecks: "Quality checks",
    returnItems: "Return",
    doNot: "Do not",
    relatedMeta: "Runtime info",
    intro: "Agent intro",
    generatedAt: "Generated",
    stickyRail: "Category rail",
    selectPrompt: "Select an agent from the list to open its detail panel and install commands.",
    results: "Results",
    rows: "Row-based directory",
    loading: "Loading agent data.",
  },
} as const;

function readQueryState(): QueryState {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    mode: params.get("mode") ?? "",
    model: params.get("model") ?? "",
    agent: params.get("agent") ?? "",
    lang: params.get("lang") === "en" ? "en" : "ko",
  };
}

function writeQueryState(state: QueryState) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.mode) params.set("mode", state.mode);
  if (state.model) params.set("model", state.model);
  if (state.agent) params.set("agent", state.agent);
  if (state.lang !== "ko") params.set("lang", state.lang);
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}

function textFor(lang: Language, value: { ko: string; en: string }) {
  return value[lang];
}

function sectionTitle(lang: Language, key: keyof AgentRecord["instructions"]["sections"]) {
  const copy = dictionary[lang];
  return copy[key];
}

function copyToClipboard(value: string) {
  return navigator.clipboard.writeText(value);
}

function useQueryState() {
  const [state, setState] = useState<QueryState>(() => ({ ...defaultState, ...readQueryState() }));

  useEffect(() => {
    writeQueryState(state);
  }, [state]);

  useEffect(() => {
    const onPopState = () => setState({ ...defaultState, ...readQueryState() });
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [state, setState] as const;
}

export default function App() {
  const [queryState, setQueryState] = useQueryState();
  const [copiedKey, setCopiedKey] = useState("");
  const [data, setData] = useState<AgentsPayload | null>(null);
  const copy = dictionary[queryState.lang];

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}agents.generated.json`)
      .then((response) => response.json())
      .then((payload) => setData(payload as AgentsPayload));
  }, []);

  const filteredAgents = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = queryState.q.trim().toLowerCase();

    return data.agents.filter((agent) => {
      const searchHaystack = [
        agent.name,
        agent.categoryLabel.en,
        agent.categoryLabel.ko,
        agent.description.en,
        agent.description.ko,
        agent.instructions.ko,
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchHaystack.includes(query)) {
        return false;
      }
      if (queryState.category && agent.categoryKey !== queryState.category) {
        return false;
      }
      if (queryState.mode && agent.sandboxMode !== queryState.mode) {
        return false;
      }
      if (queryState.model && agent.model !== queryState.model) {
        return false;
      }
      return true;
    });
  }, [data, queryState]);

  const selectedAgent =
    data?.agents.find((agent) => agent.slug === queryState.agent) ?? filteredAgents[0] ?? null;

  useEffect(() => {
    if (!selectedAgent) {
      return;
    }
    if (!queryState.agent) {
      setQueryState((current) => ({ ...current, agent: selectedAgent.slug }));
    }
  }, [queryState.agent, selectedAgent, setQueryState]);

  const modelOptions = useMemo(
    () => (data ? [...new Set(data.agents.map((agent) => agent.model))].sort() : []),
    [data],
  );

  if (!data) {
    return (
      <div className="page-shell">
        <div className="hero-backdrop" />
        <main className="loading-screen">
          <div className="loading-orb" />
          <p>{copy.loading}</p>
        </main>
      </div>
    );
  }

  const onCopy = async (key: string, value: string) => {
    await copyToClipboard(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1400);
  };

  return (
    <div className="page-shell">
      <div className="hero-backdrop" />
      <main className="app-shell app-shell--compact" id="directory">
        <nav className="top-nav top-nav--compact">
          <div>
            <span className="brand-mark" />
            <span className="brand-name">{copy.brand}</span>
          </div>
          <div className="top-nav__actions">
            <span className="nav-tag">
              {copy.statsAgents} {data.totalAgents}
            </span>
            <span className="nav-tag">
              {copy.statsCategories} {data.categories.length}
            </span>
            <button
              className="lang-toggle"
              onClick={() =>
                setQueryState((current) => ({
                  ...current,
                  lang: current.lang === "ko" ? "en" : "ko",
                }))
              }
            >
              {queryState.lang === "ko" ? "EN" : "KO"}
            </button>
          </div>
        </nav>
        <section className="toolbar">
          <div className="toolbar__field toolbar__field--search">
            <label htmlFor="agent-search">{copy.searchLabel}</label>
            <input
              id="agent-search"
              type="search"
              value={queryState.q}
              placeholder={copy.searchPlaceholder}
              onChange={(event) =>
                setQueryState((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
            />
          </div>

          <div className="toolbar__field">
            <label htmlFor="category-select">{copy.categoryLabel}</label>
            <select
              id="category-select"
              value={queryState.category}
              onChange={(event) =>
                setQueryState((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              <option value="">{copy.all}</option>
              {data.categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {textFor(queryState.lang, category.label)}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar__field">
            <label htmlFor="mode-select">{copy.modeLabel}</label>
            <select
              id="mode-select"
              value={queryState.mode}
              onChange={(event) =>
                setQueryState((current) => ({
                  ...current,
                  mode: event.target.value,
                }))
              }
            >
              <option value="">{copy.all}</option>
              <option value="read-only">{copy.readOnly}</option>
              <option value="workspace-write">{copy.workspaceWrite}</option>
            </select>
          </div>

          <div className="toolbar__field">
            <label htmlFor="model-select">{copy.modelLabel}</label>
            <select
              id="model-select"
              value={queryState.model}
              onChange={(event) =>
                setQueryState((current) => ({
                  ...current,
                  model: event.target.value,
                }))
              }
            >
              <option value="">{copy.all}</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="workspace">
          <aside className="category-rail">
            <div className="category-rail__label">{copy.stickyRail}</div>
            {data.categories.map((category) => {
              const active = queryState.category === category.key;
              return (
                <button
                  key={category.key}
                  className={`category-pill${active ? " is-active" : ""}`}
                  onClick={() =>
                    setQueryState((current) => ({
                      ...current,
                      category: active ? "" : category.key,
                    }))
                  }
                >
                  <span>{textFor(queryState.lang, category.label)}</span>
                  <strong>{category.count}</strong>
                </button>
              );
            })}
          </aside>

          <section className="directory-pane">
            <div className="directory-header">
              <div>
                <p>{copy.results}</p>
                <h2>
                  {filteredAgents.length} / {data.totalAgents}
                </h2>
              </div>
              <div className="directory-meta">{copy.rows}</div>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="empty-state">
                <h3>{copy.noResultsTitle}</h3>
                <p>{copy.noResultsBody}</p>
                <button onClick={() => setQueryState(defaultState)}>{copy.clearFilters}</button>
              </div>
            ) : (
              <div className="agent-list">
                {filteredAgents.map((agent) => {
                  const selected = selectedAgent?.slug === agent.slug;
                  return (
                    <button
                      key={agent.slug}
                      className={`agent-row${selected ? " is-selected" : ""}`}
                      onClick={() =>
                        setQueryState((current) => ({
                          ...current,
                          agent: agent.slug,
                        }))
                      }
                    >
                      <div className="agent-row__main">
                        <div className="agent-row__heading">
                          <span className="agent-row__name">{agent.name}</span>
                          <span className="agent-row__category">
                            {textFor(queryState.lang, agent.categoryLabel)}
                          </span>
                        </div>
                        <p>{textFor(queryState.lang, agent.description)}</p>
                      </div>
                      <div className="agent-row__meta">
                        <span>{agent.model}</span>
                        <span>{agent.sandboxMode}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <AnimatePresence initial={false}>
            {selectedAgent ? (
              <motion.aside
                key={selectedAgent.slug}
                className="detail-pane"
                initial={{ opacity: 0, x: 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 48 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="detail-pane__header">
                  <div>
                    <p>{copy.selectedAgent}</p>
                    <h3>{selectedAgent.name}</h3>
                  </div>
                  <span className="detail-pane__chip">{selectedAgent.model}</span>
                </div>

                <div className="detail-pane__intro">
                  <p className="detail-pane__label">{copy.intro}</p>
                  <p>{textFor(queryState.lang, selectedAgent.description)}</p>
                  <p className="detail-pane__muted">{textFor(queryState.lang === "ko" ? "en" : "ko", selectedAgent.description)}</p>
                </div>

                <div className="detail-pane__meta">
                  <p className="detail-pane__label">{copy.relatedMeta}</p>
                  <div className="meta-row">
                    <span>{copy.categoryLabel}</span>
                    <strong>{textFor(queryState.lang, selectedAgent.categoryLabel)}</strong>
                  </div>
                  <div className="meta-row">
                    <span>{copy.modeLabel}</span>
                    <strong>{selectedAgent.sandboxMode}</strong>
                  </div>
                  <div className="meta-row">
                    <span>{copy.generatedAt}</span>
                    <strong>{new Date(data.generatedAt).toLocaleString()}</strong>
                  </div>
                </div>

                <InstructionSection
                  lang={queryState.lang}
                  agent={selectedAgent}
                  sectionKey="summary"
                />
                <InstructionSection
                  lang={queryState.lang}
                  agent={selectedAgent}
                  sectionKey="workingMode"
                />
                {selectedAgent.instructions.sections.implementationChecks.length > 0 ? (
                  <InstructionSection
                    lang={queryState.lang}
                    agent={selectedAgent}
                    sectionKey="implementationChecks"
                  />
                ) : null}
                <InstructionSection lang={queryState.lang} agent={selectedAgent} sectionKey="focusOn" />
                <InstructionSection
                  lang={queryState.lang}
                  agent={selectedAgent}
                  sectionKey="qualityChecks"
                />
                <InstructionSection
                  lang={queryState.lang}
                  agent={selectedAgent}
                  sectionKey="returnItems"
                />

                <section className="detail-section detail-section--warning">
                  <p className="detail-pane__label">{copy.doNot}</p>
                  <p>{textFor(queryState.lang, selectedAgent.instructions.sections.doNot)}</p>
                </section>

                <section className="detail-section" id="install-flow">
                  <div className="install-header">
                    <div>
                      <p className="detail-pane__label">{copy.install}</p>
                      <h4>{queryState.lang === "ko" ? "바로 설치" : "Install now"}</h4>
                    </div>
                  </div>

                  <CommandBlock
                    lang={queryState.lang}
                    label={copy.installGlobal}
                    command={selectedAgent.installCommands.global}
                    copyKey={`${selectedAgent.slug}-global`}
                    copiedKey={copiedKey}
                    onCopy={onCopy}
                  />
                  <CommandBlock
                    lang={queryState.lang}
                    label={copy.installProject}
                    command={selectedAgent.installCommands.project}
                    copyKey={`${selectedAgent.slug}-project`}
                    copiedKey={copiedKey}
                    onCopy={onCopy}
                  />

                  <div className="link-row">
                    <a href={selectedAgent.rawUrl} target="_blank" rel="noreferrer">
                      {copy.rawDownload}
                    </a>
                    <a href={selectedAgent.githubUrl} target="_blank" rel="noreferrer">
                      {copy.githubSource}
                    </a>
                  </div>

                  <div className="source-path">
                    <span>{copy.sourcePath}</span>
                    <code>{selectedAgent.sourcePath}</code>
                  </div>
                </section>

                <section className="detail-section dual-text">
                  <div>
                    <p className="detail-pane__label">{copy.instructionsKo}</p>
                    <pre>{selectedAgent.instructions.ko}</pre>
                  </div>
                  <div>
                    <p className="detail-pane__label">{copy.instructionsEn}</p>
                    <pre>{selectedAgent.instructions.en}</pre>
                  </div>
                </section>
              </motion.aside>
            ) : (
              <motion.aside
                className="detail-pane detail-pane--empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>{copy.selectPrompt}</p>
              </motion.aside>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function InstructionSection({
  lang,
  agent,
  sectionKey,
}: {
  lang: Language;
  agent: AgentRecord;
  sectionKey: keyof AgentRecord["instructions"]["sections"];
}) {
  if (sectionKey === "doNot") {
    return null;
  }

  const entries = agent.instructions.sections[sectionKey];
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  return (
    <section className="detail-section">
      <p className="detail-pane__label">{sectionTitle(lang, sectionKey)}</p>
      <ul>
        {entries.map((entry, index) => (
          <li key={`${sectionKey}-${index}`}>{textFor(lang, entry)}</li>
        ))}
      </ul>
    </section>
  );
}

function CommandBlock({
  lang,
  label,
  command,
  copyKey,
  copiedKey,
  onCopy,
}: {
  lang: Language;
  label: string;
  command: string;
  copyKey: string;
  copiedKey: string;
  onCopy: (key: string, value: string) => Promise<void>;
}) {
  const copy = dictionary[lang];

  return (
    <div className="command-block">
      <div className="command-block__header">
        <span>{label}</span>
        <button onClick={() => onCopy(copyKey, command)}>
          {copiedKey === copyKey ? copy.copied : copy.copyCommand}
        </button>
      </div>
      <pre>{command}</pre>
    </div>
  );
}
