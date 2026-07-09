# Codex Review Protocol

Codex reviews every Cursor result before commit and push.

## Review Steps

1. Check the diff.
2. Check whether protected paths were touched.
3. Check whether Canon is contradicted.
4. Check whether JSON files are valid.
5. Check whether GitHub Pages can deploy or whether URLs are likely to publish.
6. Check whether the Cursor report is complete.
7. Commit and push only if the result is safe.
8. If the result is not safe, return the task to `CURSOR_WORK_QUEUE.md` with correction instructions.

## Required Review Evidence

Codex should record:

- changed files;
- protected path check result;
- JSON validation result;
- link check result;
- remaining warnings;
- commit SHA if approved;
- reason if rejected.

