export type LocalizedText = {
  en: string;
  ko: string;
};

export type InstructionSections = {
  summary: LocalizedText[];
  workingMode: LocalizedText[];
  implementationChecks: LocalizedText[];
  focusOn: LocalizedText[];
  qualityChecks: LocalizedText[];
  returnItems: LocalizedText[];
  doNot: LocalizedText;
};

export type AgentRecord = {
  slug: string;
  name: string;
  categoryKey: string;
  categoryLabel: LocalizedText;
  categoryDescription: LocalizedText;
  description: LocalizedText;
  instructions: {
    en: string;
    ko: string;
    sections: InstructionSections;
  };
  model: string;
  reasoningEffort: string;
  sandboxMode: string;
  sourcePath: string;
  githubUrl: string;
  rawUrl: string;
  installCommands: {
    global: string;
    project: string;
  };
};

export type CategorySummary = {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
  count: number;
};

export type AgentsPayload = {
  generatedAt: string;
  totalAgents: number;
  categories: CategorySummary[];
  agents: AgentRecord[];
};

export type Language = "ko" | "en";

export type QueryState = {
  q: string;
  category: string;
  mode: string;
  model: string;
  agent: string;
  lang: Language;
};
