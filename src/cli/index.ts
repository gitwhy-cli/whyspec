#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "../commands/init.js";
import { planCommand } from "../commands/plan.js";
import { executeCommand } from "../commands/execute.js";
import { captureCommand } from "../commands/capture.js";

const program = new Command();

program
  .name("whyspec")
  .description(
    "The reasoning layer for AI-assisted development — capture WHY code was built the way it was"
  )
  .version("0.1.0")
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
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "show", name }));
    } else {
      console.log(`whyspec show ${name} — not yet implemented`);
    }
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
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "search", query, domain: opts.domain, limit: opts.limit }));
    } else {
      console.log(`whyspec search "${query}" — not yet implemented`);
    }
  });

// ── debug ───────────────────────────────────────────────────────────────────
program
  .command("debug")
  .description("Create a structured debug session (scientific method)")
  .argument("[name]", "Name or description of the bug")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "debug", name }));
    } else {
      console.log(`whyspec debug ${name ?? ""} — not yet implemented`);
    }
  });

// ── list ────────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List all active changes with status")
  .action(async (_opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "list", changes: [] }));
    } else {
      console.log("whyspec list — not yet implemented");
    }
  });

// ── status ──────────────────────────────────────────────────────────────────
program
  .command("status")
  .description("Get detailed status for a change")
  .argument("<name>", "Name of the change")
  .action(async (name, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "status", name }));
    } else {
      console.log(`whyspec status ${name} — not yet implemented`);
    }
  });

// ── template ────────────────────────────────────────────────────────────────
program
  .command("template")
  .description("Get a raw file template (intent, design, tasks, context, debug)")
  .argument("<type>", "Template type: intent | design | tasks | context | debug")
  .action(async (type, _opts, cmd) => {
    const json = cmd.optsWithGlobals().json;
    if (json) {
      console.log(JSON.stringify({ status: "not-implemented", command: "template", type }));
    } else {
      console.log(`whyspec template ${type} — not yet implemented`);
    }
  });

program.parse();
