import {
  GeneratedFile,
  WHYSPEC_COMMANDS,
  COMMAND_DESCRIPTIONS,
  WhySpecCommand,
} from "./types.js";
import { generateClaudeCodeSkills } from "./claude-code.js";

function getDisplayName(command: WhySpecCommand): string {
  return `WhySpec ${command[0].toUpperCase()}${command.slice(1)}`;
}

function getDefaultPrompt(command: WhySpecCommand): string {
  switch (command) {
    case "plan":
      return "Use WhySpec to plan this change before coding.";
    case "execute":
      return "Use WhySpec to execute the current planned change.";
    case "capture":
      return "Use WhySpec to capture the reasoning behind the implementation.";
    case "show":
      return "Use WhySpec to show the full story and Decision Bridge for this change.";
    case "search":
      return "Use WhySpec to search past decisions and reasoning for this topic.";
    case "debug":
      return "Use WhySpec to debug this issue with the scientific method.";
  }
}

function renderOpenAiMetadata(command: WhySpecCommand): string {
  return `interface:
  display_name: "${getDisplayName(command)}"
  short_description: "${COMMAND_DESCRIPTIONS[command]}"
  default_prompt: "${getDefaultPrompt(command)}"
`;
}

/**
 * Generate Codex-native skill files.
 *
 * Codex discovers skills from $CODEX_HOME/skills/<skill-name>/.
 * Each skill needs SKILL.md and optional UI metadata in agents/openai.yaml.
 */
export function generateCodexSkills(
  projectRoot: string = "",
): GeneratedFile[] {
  const prefix = projectRoot ? `${projectRoot}/` : "";
  const claudeSkills = generateClaudeCodeSkills().map((file) => {
    const commandMatch = file.path.match(/whyspec-(plan|execute|capture|show|search|debug)\//);
    if (!commandMatch) {
      return file;
    }
    return {
      ...file,
      path: `${prefix}whyspec-${commandMatch[1]}/SKILL.md`,
    };
  });

  const metadataFiles = WHYSPEC_COMMANDS.map((command) => ({
    path: `${prefix}whyspec-${command}/agents/openai.yaml`,
    content: renderOpenAiMetadata(command),
  }));

  return [...claudeSkills, ...metadataFiles];
}
