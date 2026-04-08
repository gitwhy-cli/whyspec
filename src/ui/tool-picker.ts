import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";

export interface ToolChoice {
  name: string;
  value: string;
  /** Tools with skill support get .claude/skills/ or equivalent */
  skillSupport: boolean;
  /** Tools that read AGENTS.md for instructions */
  usesAgentsMd: boolean;
}

export const AVAILABLE_TOOLS: ToolChoice[] = [
  {
    name: "Claude Code",
    value: "claude-code",
    skillSupport: true,
    usesAgentsMd: false,
  },
  {
    name: "Cursor",
    value: "cursor",
    skillSupport: true,
    usesAgentsMd: false,
  },
  {
    name: "GitHub Copilot",
    value: "copilot",
    skillSupport: false,
    usesAgentsMd: true,
  },
  {
    name: "Codex CLI",
    value: "codex",
    skillSupport: false,
    usesAgentsMd: true,
  },
  {
    name: "Windsurf",
    value: "windsurf",
    skillSupport: false,
    usesAgentsMd: true,
  },
  {
    name: "Cline",
    value: "cline",
    skillSupport: false,
    usesAgentsMd: true,
  },
  {
    name: "Amazon Q",
    value: "amazon-q",
    skillSupport: false,
    usesAgentsMd: true,
  },
  {
    name: "RooCode",
    value: "roocode",
    skillSupport: false,
    usesAgentsMd: true,
  },
];

export async function promptToolPicker(): Promise<string[]> {
  const selected = await checkbox({
    message: "Select your AI tools (space to toggle, enter to confirm)",
    choices: AVAILABLE_TOOLS.map((tool) => ({
      name: tool.name,
      value: tool.value,
      checked: tool.value === "claude-code",
    })),
    theme: {
      prefix: chalk.cyan("?"),
    },
  });

  return selected;
}

export function getToolMeta(toolId: string): ToolChoice | undefined {
  return AVAILABLE_TOOLS.find((t) => t.value === toolId);
}

export function needsAgentsMd(selectedTools: string[]): boolean {
  return selectedTools.some((id) => {
    const tool = getToolMeta(id);
    return tool?.usesAgentsMd;
  });
}
