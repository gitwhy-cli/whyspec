import {
  GeneratedFile,
  WHYSPEC_COMMANDS,
  COMMAND_DESCRIPTIONS,
  WhySpecCommand,
} from "./types.js";
import { getSkillInstructions } from "./claude-code.js";

/**
 * OpenCode-convention "Use this skill when" / "Do not use this skill when"
 * sections that wrap the shared WhySpec instructions.
 */
function getOpenCodeUsageHints(command: WhySpecCommand): {
  useWhen: string[];
  doNotUseWhen: string[];
} {
  switch (command) {
    case "plan":
      return {
        useWhen: [
          "Planning a new feature, refactor, or bug fix before writing code",
          "Capturing design decisions and trade-offs upfront",
          "Setting up the Decision Bridge for a change",
        ],
        doNotUseWhen: [
          "Already mid-implementation — use whyspec-execute instead",
          "Making a trivial one-line fix that needs no planning",
        ],
      };
    case "execute":
      return {
        useWhen: [
          "Starting implementation of a planned WhySpec change",
          "Resuming work on a partially completed change",
          "Working through tasks from a WhySpec plan",
        ],
        doNotUseWhen: [
          "No plan exists yet — use whyspec-plan first",
          "Doing exploratory coding with no defined tasks",
        ],
      };
    case "capture":
      return {
        useWhen: [
          "Just finished implementing a change and want to preserve reasoning",
          "Resolving the Decision Bridge after coding",
          "Recording surprises and unplanned decisions",
        ],
        doNotUseWhen: [
          "Still mid-implementation — finish tasks first",
          "No implementation has been done yet",
        ],
      };
    case "show":
      return {
        useWhen: [
          "Reviewing the full story of a change — intent, design, tasks, reasoning",
          "Understanding why a past change was built the way it was",
          "Comparing planned decisions vs actual outcomes",
        ],
        doNotUseWhen: [
          "Looking for code changes — use git log instead",
          "Searching across multiple changes — use whyspec-search instead",
        ],
      };
    case "search":
      return {
        useWhen: [
          "Looking for why something was built a certain way",
          "Finding past decisions about a specific domain or topic",
          "Checking if similar reasoning exists before making a decision",
        ],
        doNotUseWhen: [
          "Searching for code patterns — use grep or find instead",
          "Looking at a specific known change — use whyspec-show instead",
        ],
      };
    case "debug":
      return {
        useWhen: [
          "Encountering a bug, test failure, or unexpected behavior",
          "Starting a structured debugging investigation",
          "Applying the scientific method to find root causes",
        ],
        doNotUseWhen: [
          "The bug is already diagnosed — just fix it",
          "Doing general code exploration without a specific issue",
        ],
      };
  }
}

function renderSkillContent(command: WhySpecCommand): string {
  const hints = getOpenCodeUsageHints(command);
  const instructions = getSkillInstructions(command);

  const useWhenSection = hints.useWhen.map((h) => `- ${h}`).join("\n");
  const doNotUseSection = hints.doNotUseWhen.map((h) => `- ${h}`).join("\n");

  return `# WhySpec ${command[0].toUpperCase()}${command.slice(1)}

## Use this skill when

${useWhenSection}

## Do not use this skill when

${doNotUseSection}

## Instructions

${instructions}
`;
}

/**
 * Generate OpenCode skill files.
 *
 * OpenCode discovers skills from .opencode/skills/<skill-name>/SKILL.md.
 * Each skill needs SKILL.md with YAML frontmatter containing name and description.
 */
export function generateOpenCodeSkills(
  projectRoot: string = "",
): GeneratedFile[] {
  const prefix = projectRoot ? `${projectRoot}/` : "";

  return WHYSPEC_COMMANDS.map((command) => {
    const frontmatter = [
      "---",
      `name: whyspec-${command}`,
      `description: ${COMMAND_DESCRIPTIONS[command]}`,
      "compatibility: opencode",
      "---",
    ].join("\n");

    const content = renderSkillContent(command);

    return {
      path: `${prefix}.opencode/skills/whyspec-${command}/SKILL.md`,
      content: `${frontmatter}\n\n${content}`,
    };
  });
}
