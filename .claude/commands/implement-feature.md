---
name: implement-feature
description: Automated feature implementation with full CI/CD workflow
model: sonnet
allowed_tools:
  - Bash(*)
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - Skill
---

# Implement Feature Skill

This skill automates the complete feature implementation workflow, from branch creation through PR merge, with CI validation and error recovery.

## Workflow Overview

1. Branch setup (pull main, create feature branch)
2. Implementation (TDD - tests first, then code)
3. Local CI validation
4. Fix errors and re-validate
5. Pre-flight linting check
6. Create PR and monitor remote CI
7. CI parity validation (if needed)
8. Manual testing
9. **Post-Implementation Introspection (MANDATORY)**

## Important: Custom Agents

This project uses **custom agents** defined in `.claude/agents/` directory.

**Available custom agents**:
- `introspection` - Mandatory post-implementation analysis
- `frontend-ci` - CI checks (lint, test, build)

**NEVER** claim a custom agent doesn't exist without checking `.claude/agents/` first.

## Detailed Instructions

### Phase 1: Branch Setup

1. **Check current state**:
   ```bash
   git status
   git rev-parse --abbrev-ref HEAD
   ```

2. **Update main and create feature branch**:
   ```bash
   git fetch origin main:main
   git checkout -b feature/[phase-name]-[feature-name] main
   ```

   Branch naming: `feature/[phase]-[short-description]`
   Example: `feature/phase2-physics-engine`

### Phase 2: Implementation

Implement the feature following TDD principles:

1. **Write tests first** — create test file with all test cases including edge cases
2. **Write implementation** — make tests pass
3. **Run quality checks immediately** (catch ALL issues before running tests):

   ```bash
   # Auto-fix what's fixable
   npm run lint -- --fix

   # Check remaining issues
   npm run lint -- --max-warnings=0
   ```

4. **Fix any remaining lint errors manually**, then re-run to verify

**Why run quality checks in Phase 2?**
- Catches all issues before test iteration
- Avoids extra "fix linting" commits
- Prevents remote CI failures
- Saves time and tokens

**Follow established patterns** — read existing similar files before writing new ones.

### Phase 3: Local CI Validation

Run the frontend-ci agent:

```
Task(subagent_type="frontend-ci", ...)
```

Wait for results.

### Phase 4: Error Recovery

If CI fails:
1. Analyze all failures
2. Fix issues
3. Re-run frontend-ci agent
4. Repeat until all pass

**Critical**: Do NOT proceed until CI passes.

### Phase 5: Pre-flight Linting Check ⚠️ MANDATORY ⚠️

Before creating the PR, run the exact linter commands that remote CI will run:

```bash
npm run lint -- --max-warnings=0
npm run build
```

**BLOCKING**: Do NOT create the PR until both pass with zero errors.

If anything fails: fix violations, commit the fixes, re-run to verify.

### Phase 6: Create PR and Monitor CI

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "feat: implement [feature description]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```

2. **Push branch**:
   ```bash
   git push -u origin $(git rev-parse --abbrev-ref HEAD)
   ```

3. **Create PR using the create-pr skill** (Skill tool → create-pr)

4. **Wait for remote CI** (~90 seconds):
   ```bash
   sleep 90 && gh pr checks
   ```

### Phase 7: CI Parity Validation (if remote CI fails)

If remote CI fails but local passed:
1. Identify which check failed
2. Reproduce locally with the same flags
3. Fix the issue, commit, push
4. Verify with `gh pr checks`

### Phase 8: Manual Testing

**Only required when user-visible UI changes were made.**

Skip if only: test files, type definitions, config files, or documentation changed.

If manual testing is needed:
```bash
npm run dev
```

Provide specific test scenarios based on what changed. Wait for user confirmation before proceeding.

### Phase 9: Post-Implementation Introspection ⚠️ MANDATORY ⚠️

After PR is created and CI passes, spawn the introspection agent.

**Step 0**: Verify agent exists:
```bash
ls .claude/agents/introspection.md
```

**Step 1**: Gather metrics (tracked throughout workflow):
- Total time estimate
- Test iterations
- Linting commits
- CI runs (local + remote failures)
- Notable events

**Step 2**: Spawn introspection agent:
```
Task(
  subagent_type="introspection",
  prompt="Analyze Phase X.Y - [Feature Name] implementation. Metrics: ..."
)
```

---

## Mandatory Completion Checklist

**Do NOT report completion until ALL are checked:**

- [ ] Phase 1: Branch created from main
- [ ] Phase 2: Code written, quality checks run
- [ ] Phase 3: frontend-ci agent passed
- [ ] Phase 4: All errors fixed (or N/A)
- [ ] Phase 5: Pre-flight linting passed
- [ ] Phase 6: PR created, remote CI monitored
- [ ] Phase 7: CI parity resolved (or N/A)
- [ ] Phase 8: Manual testing done (or skipped per criteria)
- [ ] **Phase 9: Introspection agent spawned and completed**

## Notes

- All commands run from the project root (no `frontend/` subdirectory)
- Use Sonnet model for this skill
- Only frontend-ci agent exists (no backend-ci or e2e-ci)
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
