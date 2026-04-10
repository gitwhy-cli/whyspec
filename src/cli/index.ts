#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { runInit } from "../commands/init.js";
import { planCommand } from "../commands/plan.js";
import { executeCommand } from "../commands/execute.js";
import { captureCommand } from "../commands/capture.js";
import { showCommand } from "../commands/show.js";
import { searchCommand } from "../commands/search.js";
import { debugCommand } from "../commands/debug.js";
import { listCommand } from "../commands/list.js";
import { statusCommand } from "../commands/status.js";
import { templateCommand } from "../commands/template.js";

function getCliVersion(): string {
  try {
    const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url));
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("whyspec")
  .description(
    "The reasoning layer for AI-assisted development — capture WHY code was built the way it was"
  )
  .version(getCliVersion())
  .option("--json", "Output structured JSON for agent consumption");

// ── init ────────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Initialize WhySpec in the current project")
  .action(async () => {
    await runInit();
  });

// ── plan ────────────────────────────────────────────────────────────────────
program
  .command("plan")
  .description("Create a change folder with intent, design, and task templates")
  .argument("[name]", "Name of the change (e.g., add-jwt-auth)")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await planCommand(name, { json });
  });

// ── execute ─────────────────────────────────────────────────────────────────
program
  .command("execute")
  .description("Get execution context from a plan (intent + design + tasks)")
  .argument("[name]", "Name of the change to execute")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await executeCommand(name, { json });
  });

// ── capture ─────────────────────────────────────────────────────────────────
program
  .command("capture")
  .description("Capture reasoning after implementation (creates ctx_<id>.md)")
  .argument("[name]", "Name of the change to capture")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await captureCommand(name, { json });
  });

// ── show ────────────────────────────────────────────────────────────────────
program
  .command("show")
  .description("Display the full story of a change with Decision Bridge delta")
  .argument("<name>", "Name of the change to show")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await showCommand(name, { json });
  });

// ── search ──────────────────────────────────────────────────────────────────
program
  .command("search")
  .description("Search past decisions and reasoning across all changes")
  .argument("<query>", "Search query")
  .option("--domain <domain>", "Filter by domain")
  .option("--limit <n>", "Maximum results", "10")
  .action(async (query, opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await searchCommand(query, { json, domain: opts.domain, limit: opts.limit });
  });

// ── debug ───────────────────────────────────────────────────────────────────
program
  .command("debug")
  .description("Create a structured debug session (scientific method)")
  .argument("[name]", "Name or description of the bug")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await debugCommand(name, { json });
  });

// ── list ────────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List all active changes with status")
  .action(async (_opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await listCommand({ json });
  });

// ── status ──────────────────────────────────────────────────────────────────
program
  .command("status")
  .description("Get detailed status for a change")
  .argument("<name>", "Name of the change")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await statusCommand(name, { json });
  });

// ── template ────────────────────────────────────────────────────────────────
program
  .command("template")
  .description("Get a raw file template (intent, design, tasks, context, debug)")
  .argument("<type>", "Template type: intent | design | tasks | context | debug")
  .action(async (type, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    await templateCommand(type, { json });
  });

program.parse();
