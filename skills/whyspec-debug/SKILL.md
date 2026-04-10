---
name: whyspec-debug
description: Debug with scientific method — gather symptoms, form falsifiable hypotheses, test systematically, verify root cause before fixing. Searches team knowledge first and captures the full investigation as persistent context.
---

# WhySpec Debug — Scientific Investigation

Debug systematically. No fix without root cause.

This skill implements a structured debugging process that captures the full investigation
as persistent context — symptoms, hypotheses, evidence, root cause, and fix rationale.

The investigation is automatically saved as a context file when resolved.

---

## Purpose

Debugging is not guessing. This skill enforces:

1. **Team knowledge first** — search past reasoning before reinventing
2. **Scientific method** — falsifiable hypotheses tested with evidence
3. **Iron Law** — no fix is proposed until root cause is verified
4. **Persistent state** — debug.md survives context resets so investigations can resume
5. **Reasoning capture** — every investigation produces a context file for future developers

---

**Input**: A bug description, error message, or change name for an existing debug session.

---

## Step 0: Team Knowledge Search

Before investigating, check if someone has reasoned about this domain before:

```bash
whyspec search --json "<keywords from bug description>"
```

If results exist:
- Display: "Found N past contexts in this domain"
- List relevant titles and key decisions from past investigations
- Note any past decisions that might inform the current bug

If no results: note "No prior context found" and continue.

This step takes seconds. It prevents re-investigating solved problems and surfaces past decisions that may explain the current behavior.

---

## Step 1: Symptoms Gathering

Create the debug session:

```bash
whyspec debug --json "<bug-name>"
```

Parse the JSON response:
- `path`: Debug session directory (e.g., `.gitwhy/changes/<bug-name>/`)
- `template`: debug.md template structure
- `related_contexts`: Past contexts in the same domain (from Step 0)

**Gather symptoms** — use **AskUserQuestion** if the user hasn't provided enough detail, or investigate the codebase directly:

| Symptom | What to capture |
|---------|----------------|
| Expected behavior | What SHOULD happen |
| Actual behavior | What ACTUALLY happens |
| Error messages | Exact text, stack traces, error codes |
| Reproduction steps | Minimal sequence to trigger the bug |
| Timeline | When it started, what changed recently |
| Scope | Who is affected, how often, which environments |

**Write debug.md immediately** — this file IS the investigation state:

```markdown
# Debug: <bug-name>

## Status: INVESTIGATING

## Symptoms

**Expected:** [what should happen]
**Actual:** [what actually happens]
**Error:**
```
[exact error message or stack trace]
```
**Reproduction:** [minimal steps to reproduce]
**Timeline:** [when it started, what changed recently]
**Scope:** [who/what is affected, frequency]

## Related Past Contexts

[Results from Step 0, or "None found"]
[If found: relevant decisions, reasoning excerpts]

## Hypotheses

[Populated in Step 2]

## Evidence Log

[Populated in Step 3]

## Root Cause

[Populated in Step 4]

## Fix

[Populated in Step 5]

## Prevention

[Populated in Step 5]
```

**CRITICAL**: Write debug.md to `<path>/debug.md` NOW, after this step. It persists across context resets and enables resuming the investigation.

---

## Step 2: Hypothesis Formation

Form **3 or more falsifiable hypotheses**. Each must include a specific claim, a concrete test, and a way to disprove it:

```markdown
## Hypotheses

### H1: [Specific, testable claim about the root cause]
- **Test:** [Concrete action — a command to run, a log to check, a condition to verify]
- **Disproof:** [What evidence would prove this hypothesis WRONG]
- **Status:** UNTESTED
- **Likelihood:** HIGH / MEDIUM / LOW

### H2: [Different claim — consider a different subsystem or mechanism]
- **Test:** [Concrete action]
- **Disproof:** [What would disprove it]
- **Status:** UNTESTED
- **Likelihood:** HIGH / MEDIUM / LOW

### H3: [Third claim — consider edge cases, race conditions, configuration]
- **Test:** [Concrete action]
- **Disproof:** [What would disprove it]
- **Status:** UNTESTED
- **Likelihood:** HIGH / MEDIUM / LOW
```

**Hypothesis quality rules:**
- Each hypothesis must be **specific enough to test** — "something is wrong with auth" is not a hypothesis
- Each hypothesis must be **falsifiable** — there must be evidence that could prove it wrong
- Hypotheses should target **different root causes** — not three variations of the same idea
- **Use past contexts**: if Step 0 found related reasoning, let those decisions inform your hypotheses. A past choice ("we used X because of Y") might explain the current behavior.

Rank by likelihood. Test the most likely first.

Update debug.md with all hypotheses before proceeding.

---

## Step 3: Hypothesis Testing

Test each hypothesis **one at a time, sequentially**. For each:

1. **Execute the test** described in the hypothesis
2. **Record evidence** — exact output, logs, observed behavior
3. **Evaluate** — does the evidence support, refute, or leave the hypothesis inconclusive?
4. **Update status**: `CONFIRMED`, `DISPROVED`, or `INCONCLUSIVE`
5. **Update debug.md immediately** with findings

```markdown
## Evidence Log

### H1: [claim] — DISPROVED
**Test performed:** [exact command or action taken]
**Evidence:**
```
[exact output, log entries, or observations]
```
**Conclusion:** [why this hypothesis is disproved — what the evidence shows]

### H2: [claim] — CONFIRMED
**Test performed:** [exact command or action taken]
**Evidence:**
```
[exact output showing the root cause]
```
**Conclusion:** [why this is confirmed — the causal link between evidence and symptom]
```

**Testing rules:**

- **One hypothesis at a time** — never test multiple simultaneously. Confounded evidence is useless.
- **Max 3 tests per hypothesis** — if evidence is inconclusive after 3 attempts, mark INCONCLUSIVE and move to the next.
- **Preserve the crime scene** — before modifying suspect code, record its current state in the evidence log.
- **Update debug.md after each test** — don't batch. Each test result is written immediately.

If ALL hypotheses are disproved or inconclusive:
- Form new hypotheses based on what the evidence revealed
- If still stuck after a second round, escalate to the user (see Escalation Rules)

---

## Step 4: Root Cause Verification — The Iron Law

**No fix without verified root cause.**

Before proposing ANY fix, you must:

1. **State the root cause clearly and specifically**
2. **Explain the causal chain**: [trigger] → [mechanism] → [symptom]
3. **Verify predictive power**: can you predict the symptom from the cause? Can you reliably reproduce it?

Update debug.md:

```markdown
## Root Cause

**Cause:** [precise description of what is wrong — not symptoms, the actual defect]
**Causal chain:** [trigger event] → [mechanism/code path] → [observed symptom]
**Verified by:** [how the causal link was confirmed — which test, which evidence]
**Confidence:** HIGH / MEDIUM / LOW
```

**Confidence thresholds:**

| Confidence | Criteria | Action |
|-----------|----------|--------|
| HIGH | Reproduction is reliable, causal chain is clear, evidence is unambiguous | Proceed to fix |
| MEDIUM | Strong evidence but some uncertainty remains | Proceed with caution, note risks |
| LOW | Circumstantial evidence, cannot reliably reproduce | **Escalate to user** — do NOT fix |

If confidence is LOW:
- Present all evidence gathered to the user via **AskUserQuestion**
- Show: what was tested, what was found, what remains uncertain
- Ask for additional context, access, or direction
- **Do NOT guess at a fix**

Update debug.md status: `## Status: ROOT CAUSE IDENTIFIED`

---

## Step 5: Fix + Auto-Capture

Once root cause is verified with HIGH or MEDIUM confidence:

### 5a. Implement the fix

- Make the **minimal, targeted change** that addresses the root cause
- Don't refactor surrounding code — fix the bug, nothing more
- Verify the fix resolves the symptom (run the reproduction steps again)

### 5b. Update debug.md

```markdown
## Fix

**Change:** [what was modified and how]
**Files:** [files changed]
**Verification:** [how the fix was confirmed — test results, manual reproduction]

## Prevention

**How to prevent recurrence:**
- [Concrete preventive measure — e.g., "add input validation for X"]
- [Process improvement — e.g., "add test case for this edge case"]
- [Monitoring — e.g., "add alert for this error pattern"]
```

Update debug.md status: `## Status: RESOLVED`

### 5c. Commit the fix

Commit atomically with a clear message referencing the root cause.

### 5d. Auto-capture reasoning

Generate a context file to preserve the full investigation:

```bash
whyspec capture --json "<bug-name>"
```

Write `<path>/ctx_<id>.md` in SaaS XML format:

```xml
<context>
  <title>Debug: [short description — bug and fix]</title>

  <story>
    Phase 1 — Symptoms:
    [What was observed, when it started, reproduction steps]

    Phase 2 — Investigation:
    [Hypotheses formed, tests performed, evidence gathered]
    [Which hypotheses were disproved and why]

    Phase 3 — Root Cause:
    [The actual defect, causal chain, how it was verified]

    Phase 4 — Fix:
    [What was changed, how the fix was confirmed]
  </story>

  <reasoning>
    Why the bug existed and why this fix is correct.

    <decisions>
      - [Fix approach chosen] — [rationale for this approach]
    </decisions>

    <rejected>
      - [Alternative fix considered] — [why it was rejected]
      - [Disproved hypothesis] — [what evidence ruled it out]
    </rejected>

    <tradeoffs>
      - [Any trade-offs in the fix — scope, performance, complexity]
    </tradeoffs>
  </reasoning>

  <files>
    [Files changed to fix the bug]
  </files>

  <verification>[Test results confirming the fix]</verification>
  <risks>[Potential side effects, related areas to watch]</risks>
</context>
```

### 5e. Show summary

```
## Debug Complete: <bug-name>

Root cause: [one-line summary]
Fix: [what was changed]
Context: ctx_<id>.md

Investigation:
  Hypotheses tested: N (M confirmed, P disproved)
  Evidence entries: N
  Past contexts referenced: N

View full investigation: /whyspec-show <bug-name>
```

---

## Resuming an Investigation

If the user invokes `/whyspec-debug` and a `debug.md` already exists for that change:

1. **Read debug.md** from the change folder
2. **Check the Status field** and resume from the appropriate step:

| Status | Resume from |
|--------|-------------|
| `INVESTIGATING` | Last completed step — check which sections are populated |
| `ROOT CAUSE IDENTIFIED` | Step 5 — implement the fix |
| `RESOLVED` | Investigation is complete — show summary |

3. **Announce**: "Resuming debug session: <name> — Status: <status>"
4. **Show progress**: display completed sections and what remains

This is why writing debug.md incrementally is critical — it's the contract for resumability.

---

## Escalation Rules

Escalate to the user (via **AskUserQuestion**) when:

| Trigger | What to present |
|---------|----------------|
| All hypotheses disproved (2 rounds) | Full evidence summary, ask for new direction |
| Cannot reproduce | Symptoms documented, ask for environment details or access |
| Root cause outside codebase | Findings documented, suggest infrastructure/environment investigation |
| Root cause confidence is LOW | Evidence summary, explain uncertainty, ask for guidance |
| Fix would introduce significant risk | Proposed fix, risk assessment, ask for approval |

When escalating, always present:
- What was tested and what was found
- What remains uncertain
- A specific question or request for the user

**Never silently give up.** If you're stuck, say so with evidence.

---

## Guardrails

- **No fix without root cause** — the Iron Law is non-negotiable. Never propose a fix based on a guess, a hunch, or pattern-matching without evidence.
- **Max 3 tests per hypothesis** — if evidence is inconclusive after 3 attempts, mark INCONCLUSIVE and form new hypotheses or escalate.
- **Always capture reasoning** — every debug session MUST produce both `debug.md` AND `ctx_<id>.md`. No silent fixes. The investigation is as valuable as the fix.
- **Write debug.md incrementally** — update after EVERY step, not at the end. This is the resumability contract. If context resets, the investigation survives.
- **Don't skip team knowledge** — always run Step 0, even for "obvious" bugs. Past contexts prevent repeated mistakes and surface relevant decisions.
- **Don't guess at root cause** — if uncertain after investigation, escalate. Wrong diagnosis leads to wrong fixes that mask the real problem.
- **Test one hypothesis at a time** — never test multiple simultaneously. Sequential testing produces clean evidence.
- **Preserve evidence** — before modifying suspect code, record its current state. Don't destroy the crime scene.
- **Minimal fixes only** — fix the bug, don't refactor. Keep the diff focused on the root cause.
- **Don't skip prevention** — after fixing, always document how to prevent recurrence. Future developers need this.
