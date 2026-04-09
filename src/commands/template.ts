/**
 * whyspec template — Return a raw file template by type.
 *
 * --json mode: returns { type, content }.
 * Non-JSON mode: prints the raw template content.
 */

import { getTemplate } from "../core/templates.js";

const VALID_TYPES = ["intent", "design", "tasks", "context", "debug"] as const;
type TemplateType = (typeof VALID_TYPES)[number];

function isValidType(type: string): type is TemplateType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export interface TemplateJsonOutput {
  type: string;
  content: string;
}

export async function templateCommand(
  type: string,
  options: { json?: boolean },
): Promise<void> {
  if (!isValidType(type)) {
    const valid = VALID_TYPES.join(", ");
    throw new Error(`Invalid template type "${type}". Valid types: ${valid}`);
  }

  const content = getTemplate(type);

  if (options.json) {
    const output: TemplateJsonOutput = { type, content };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(content);
}
