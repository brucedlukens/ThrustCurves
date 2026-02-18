---
name: create-pr
description: Create a GitHub pull request with proper formatting
model: haiku
---

# Create Pull Request Skill

This skill creates a GitHub pull request using the gh CLI with proper body formatting.

## Instructions

When invoked, this skill should:

1. **Run pre-flight CI checks**:
   ```bash
   npm run lint -- --max-warnings=0
   npm run test:coverage
   npm run build
   ```
   If any fail, report which ones and exit. Ask user if they want to proceed anyway.

2. **Check if current branch is pushed**:
   ```bash
   git rev-parse --abbrev-ref HEAD
   git rev-parse --abbrev-ref @{upstream} 2>/dev/null || echo "not pushed"
   ```
   If not pushed, ask user if they want to push first.

3. **Gather PR information**:
   - **Title**: Ask user or suggest based on recent commits
   - **Base branch**: Default to `main`
   - **Known Issues**: Ask user if there are any known issues or remaining work

4. **Create PR body file** using the Write tool:
   - Path: `C:\Users\Bruce\workspace\ThrustCurves\.pr-body.md`
   - Use Write tool, NOT bash heredocs (heredocs fail with backticks)

5. **Create the PR**:
   ```bash
   gh pr create --base main --head $(git rev-parse --abbrev-ref HEAD) --title "Title" --body-file .pr-body.md
   ```

6. **Monitor initial CI** (optional):
   ```bash
   sleep 90 && gh pr checks
   ```
   Parse for specific failures and report with error details.

7. **Clean up**:
   ```bash
   rm .pr-body.md
   ```

8. Return the PR URL to the user.

## PR Body Template

```markdown
## Summary

[Brief description of what this PR does]

## Changes

- [Key change 1]
- [Key change 2]

## Testing

- ✅ All tests passing
- ✅ ESLint clean
- ✅ TypeScript build passing

## Known Issues

[If applicable - any known issues, limitations, or remaining work]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Notes

- **IMPORTANT**: Use the Write tool to create the PR body file, NOT bash heredocs
- Use `--body-file` with the path to the file created by Write tool
- Always specify `--base` and `--head` explicitly
- Clean up temp files after creation
