---
name: whyspec-debug
description: Use when encountering any bug, test failure, or unexpected behavior — before proposing fixes.
argument-hint: "<bug-description-or-change-name>"
---

# WhySpec Debug — Scientific Investigation

Debug systematically. No fix without root cause.

The investigation is automatically saved as a context file when resolved.

---

**Input**: A bug description, error message, or change name for an existing debug session.

## Iron Law

**NO FIX WITHOUT VERIFIED ROOT CAUSE.** Guessing at fixes creates more bugs than it solves. A wrong diagnosis leads to a wrong fix that masks the real problem.

## Red Flags — If You're Thinking This, STOP

- "The fix is obvious, I'll just apply it" → If it's obvious, verification takes 10 seconds. Do it.
- "I'll try this fix and see if it works" → That's guess-and-check, not debugging. Form a hypothesis first.
- "This is too simple to need the full process" → Simple bugs have root causes too. The process is fast for simple bugs.
- "I already know what's wrong from the stack trace" → The stack trace shows WHERE, not WHY. Investigate the WHY.
- "Let me just add some logging and see" → Logging is a test for a hypothesis. What's your hypothesis?

## Rationalization Table

| If you catch yourself thinking... | Reality |
|----------------------------------|---------|
| "The fix is obvious, skip investigation" | Obvious fixes have root causes too. Verify in 30 seconds. |
| "It's just a typo/config issue" | Confirm it. Read the code. Don't assume. |
| "I'll just try this quick fix first" | The first fix sets the pattern. Do it right from the start. |
| "No time for full investigation" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "I already know what's wrong" | Then verification should take 10 seconds. Do it anyway. |
| "It works on my machine" | That's a symptom, not a diagnosis. Find the environmental difference. |
| "The error message tells me exactly what's wrong" | Error messages describe symptoms. Root causes are upstream. |
| "Let me just revert the last change" | Revert is a workaround, not a fix. Why did the change break things? |

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Grep** | Search for error messages, function names, patterns in code | Don't grep before forming hypotheses — symptoms first |
| **Read** | Read suspect files, stack trace locations, config files | Don't read unrelated files — stay focused on hypotheses |
| **Bash** | Run tests to reproduce, `git log`/`git diff` to find trigger commits, execute test commands for hypotheses | Don't run destructive commands or modify production data |
| **Glob** | Find files by pattern when error references unknown paths | Don't glob the entire repo — scope to suspect areas |
| **Write** | Write/update debug.md (investigation state) and ctx_<id>.md (final capture) | Don't write fix code until root cause is verified |
| **WebSearch** | ONLY for: error messages with no codebase matches, library changelogs, CVE lookups | Never search web for: "how to debug X", generic solutions, or before investigating the codebase |
| **AskUserQuestion** | Escalation ONLY — after 2 rounds of failed hypotheses, or when root cause is outside codebase | Don't ask before investigating. The codebase has the answers. |

### Codebase First, Web Never-First

Read the codebase BEFORE considering web search. Web search is justified ONLY when:
- Error message has zero matches in the codebase or git history
- Library version changelog needed (breaking changes between versions)
- Security advisory lookup (CVEs)
- Stack trace references internal framework code you can't read locally

Never search the web for: "how to fix X", architecture decisions, or generic debugging advice.

## Step 0: Team Knowledge Search

Before investigating, check if someone has reasoned about this domain before:

```bash
whyspec search --json "<keywords from bug description>"
```

If results exist:
- Display relevant titles and key decisions from past investigations
- Note past decisions that might inform the current bug (e.g., "The auth middleware was deliberately changed in add-auth — this might explain the current session bug")

If no results: note "No prior context found" and continue.

This takes seconds. It prevents re-investigating solved problems.

## Step 1: Symptoms Gathering

Create the debug session:

```bash
whyspec debug --json "<bug-name>"
```

Parse the JSON response:
- `path`: Debug session directory
- `template`: debug.md template structure
- `related_contexts`: Past contexts in the same domain

**Gather symptoms** — investigate the codebase directly. Only ask the user if you genuinely can't find the information yourself:

| Symptom | What to capture |
|---------|----------------|
| Expected behavior | What SHOULD happen |
| Actual behavior | What ACTUALLY happens |
| Error messages | Exact text, stack traces, error codes |
| Reproduction steps | Minimal sequence to trigger the bug |
| Timeline | When it started, what changed recently |
| Scope | Who is affected, how often, which environments |

<examples>
<good>
## Symptoms
**Expected:** POST /api/users returns 201 with user object
**Actual:** Returns 500 with "Cannot read properties of undefined (reading 'email')"
**Error:** TypeError at src/handlers/users.ts:47 — `req.body.email` is undefined
**Stack trace:**
```
TypeError: Cannot read properties of undefined (reading 'email')
    at createUser (src/handlers/users.ts:47:28)
    at Layer.handle (node_modules/express/lib/router/layer.js:95:5)
```
**Reproduction:** `curl -X POST localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"test"}'`
**Timeline:** Started after commit a1b2c3d (merged express-validator upgrade, Apr 8)
**Scope:** All POST endpoints with body parsing, not just /users. GET endpoints unaffected.
Why good: Exact error with file:line, exact reproduction command,
identified the trigger commit, and noticed the scope is broader than reported.
</good>

<bad>
## Symptoms
**Expected:** API should work
**Actual:** Getting 500 errors
**Error:** Server error
Why bad: Vague symptoms lead to vague hypotheses. No file, no line,
no reproduction steps, no timeline.
</bad>
</examples>

**Write debug.md immediately** to `<path>/debug.md`. It persists across context resets.

## Step 2: Hypothesis Formation

Form **3 or more falsifiable hypotheses**:

<examples>
<good>
### H1: express-validator upgrade broke body parsing middleware order
- **Test:** `git diff a1b2c3d -- src/app.ts` — check if middleware registration order changed
- **Disproof:** If middleware order is identical pre/post upgrade, this is wrong
- **Status:** UNTESTED
- **Likelihood:** HIGH (scope matches — all POST endpoints affected, timing matches upgrade)

### H2: express-validator v7 changed req.body population timing
- **Test:** Add `console.log(req.body)` before and after validation middleware, compare output
- **Disproof:** If req.body is populated before validation in both versions, this is wrong
- **Status:** UNTESTED
- **Likelihood:** MEDIUM (v7 changelog mentions "async validation" changes)

### H3: Content-Type header handling changed in the upgrade
- **Test:** Send request with `Content-Type: application/json; charset=utf-8` — does it parse?
- **Disproof:** If extended Content-Type works the same in both versions, this is wrong
- **Status:** UNTESTED
- **Likelihood:** LOW (but worth testing — charset handling has caused issues before)
Why good: Each hypothesis is specific, testable, and falsifiable.
They target different root causes. Likelihood is justified with evidence.
</good>

<bad>
### H1: Something is wrong with the API
- **Test:** Check the API
- **Disproof:** If the API works
### H2: Maybe a dependency issue
- **Test:** Check dependencies
Why bad: Not specific enough to test. "Check the API" is not a concrete action.
</bad>
</examples>

Rank by likelihood. Test the most likely first. Update debug.md before proceeding.

## Step 3: Hypothesis Testing

Test each hypothesis **one at a time, sequentially**:

1. Execute the test described in the hypothesis
2. Record evidence — exact output, logs, observed behavior
3. Evaluate — support, refute, or inconclusive?
4. Update status: `CONFIRMED`, `DISPROVED`, or `INCONCLUSIVE`
5. Update debug.md immediately

**Rules:**
- **One hypothesis at a time** — never test multiple simultaneously
- **Max 3 tests per hypothesis** — if inconclusive after 3, mark INCONCLUSIVE and move on
- **Preserve the crime scene** — record current state before modifying suspect code
- **Update debug.md after each test** — don't batch

If ALL hypotheses are disproved:
- Form new hypotheses based on what evidence revealed
- If stuck after a second round, escalate to the user

## Step 4: Root Cause Verification

Before proposing ANY fix:

1. **State the root cause** clearly and specifically
2. **Explain the causal chain**: [trigger] → [mechanism] → [symptom]
3. **Verify predictive power**: can you predict the symptom from the cause?

```markdown
## Root Cause
**Cause:** express-validator v7 switched to async validation, body parsing
now completes AFTER route handler starts executing
**Causal chain:** express-validator upgrade → async body parsing → req.body
undefined when handler reads it synchronously → TypeError
**Verified by:** Adding `await` before validation resolved the issue in test
**Confidence:** HIGH
```

| Confidence | Criteria | Action |
|-----------|----------|--------|
| HIGH | Reliable reproduction, clear causal chain | Proceed to fix |
| MEDIUM | Strong evidence, some uncertainty | Proceed with caution, note risks |
| LOW | Circumstantial evidence | **Escalate — do NOT fix** |

## Step 5: Fix + Auto-Capture

Once root cause is verified (HIGH or MEDIUM confidence):

1. **Implement the minimal fix** — fix the bug, don't refactor surrounding code
2. **Verify the fix** — run reproduction steps again, run test suite
3. **Update debug.md** — add fix details and prevention measures:
   ```markdown
   ## Fix
   **Change:** Added `await` before express-validator `validationResult()` calls
   **Files:** src/middleware/validate.ts (3 lines changed)
   **Verification:** `npm test` — 47 pass, 0 fail. Manual curl test returns 201.

   ## Prevention
   - Added eslint rule for async validation middleware
   - Added integration test: POST with body → verify req.body populated
   - Updated UPGRADE.md with express-validator v7 migration notes
   ```
4. **Commit** atomically with root cause in message
5. **Auto-capture** reasoning:
   ```bash
   whyspec capture --json "<bug-name>"
   ```
   Write `<path>/ctx_<id>.md` with the full investigation story.

6. **Show summary:**
   ```
   ## Debug Complete: <bug-name>

   Root cause: [one-line summary]
   Fix: [what was changed]
   Context: ctx_<id>.md

   Investigation:
     Hypotheses tested: N (M confirmed, P disproved)
     Evidence entries: N
     Past contexts referenced: N

   View full investigation: /whyspec:show <bug-name>
   ```

## Resuming an Investigation

If debug.md already exists for a change:
1. Read debug.md
2. Check Status and resume from the appropriate step
3. Announce: "Resuming debug session: <name> — Status: <status>"

## Escalation Rules

| Trigger | Action |
|---------|--------|
| All hypotheses disproved (2 rounds) | Present full evidence, ask for new direction |
| Cannot reproduce | Document symptoms, ask for environment details |
| Root cause outside codebase | Document findings, suggest infrastructure investigation |
| Confidence is LOW | Present evidence, explain uncertainty, do NOT fix |
| Fix introduces significant risk | Present fix + risk assessment, ask for approval |
| 3 failed fix attempts | Stop. Present what was tried. Ask for help. |

**Never silently give up.** If stuck, present evidence and ask.

## Guardrails

- **No fix without root cause** — the Iron Law is non-negotiable
- **Max 3 tests per hypothesis** — escalate if inconclusive
- **Always capture reasoning** — every debug session produces both debug.md AND ctx_<id>.md
- **Write debug.md incrementally** — update after EVERY step, not at the end
- **Don't skip team knowledge** — always run Step 0
- **Test one hypothesis at a time** — sequential testing produces clean evidence
- **Preserve evidence** — record state before modifying suspect code
- **Minimal fixes only** — fix the bug, don't refactor
