#!/usr/bin/env node

/**
 * WhySpec CLI — the reasoning layer for AI-assisted development.
 * Commands: plan, capture, execute
 * All commands support --json for the CLI-as-oracle pattern.
 */

import { Command } from "commander";
import { planCommand } from "../commands/plan.js";
import { captureCommand } from "../commands/capture.js";
import { executeCommand } from "../commands/execute.js";

const program = new Command();

program
  .name("whyspec")
  .description("The reasoning layer for AI-assisted development")
  .version("0.1.0");

program
  .command("plan")
  .description("Create a change plan with intent, design, and tasks")
  .argument("<name>", "Name of the change")
  .option("--json", "Output structured JSON for agent consumption")
  .action(async (name: string, options: { json?: boolean }) => {
    try {
      await planCommand(name, options);
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ error: (err as Error).message }));
      } else {
        console.error(`Error: ${(err as Error).message}`);
      }
      process.exit(1);
    }
  });

program
  .command("capture")
  .description("Capture reasoning context for a change")
  .argument("[name]", "Name of the change (auto-detects if only one)")
  .option("--json", "Output structured JSON for agent consumption")
  .action(async (name: string | undefined, options: { json?: boolean }) => {
    try {
      await captureCommand(name, options);
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ error: (err as Error).message }));
      } else {
        console.error(`Error: ${(err as Error).message}`);
      }
      process.exit(1);
    }
  });

program
  .command("execute")
  .description("Get execution context and track progress for a change")
  .argument("[name]", "Name of the change (auto-detects if only one)")
  .option("--json", "Output structured JSON for agent consumption")
  .action(async (name: string | undefined, options: { json?: boolean }) => {
    try {
      await executeCommand(name, options);
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ error: (err as Error).message }));
      } else {
        console.error(`Error: ${(err as Error).message}`);
      }
      process.exit(1);
    }
  });

program.parse();
