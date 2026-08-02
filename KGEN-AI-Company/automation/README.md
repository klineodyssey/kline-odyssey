# KGEN Cursor Dispatch Wake — repo wiring

**Human decision:** `HUMAN-AUTO-CLOCKIN-001` (方案 2)

## What is already active (no login required)

| Component | Path | Effect |
|-----------|------|--------|
| Session rule | `.cursor/rules/kgen-session-clockin.mdc` | Every Cursor chat in this repo: Boot → company → Human |
| Cloud env install | `.cursor/environment.json` | Cloud Agent VM: Python pipeline deps on boot |
| SOP | `KGEN-AI-Company/CURSOR_SESSION_CLOCKIN_SOP.md` | Full procedure + cost notes |
| AGENTS.md | `AGENTS.md` § Cursor session clock-in | Cloud agent summary |

## GitHub Actions wake (Codex merge → Cloud Agent)

Workflow: `.github/workflows/kgen-cursor-dispatch-wake.yml`

**Trigger:** PR merged to `main` with head branch `codex/*`

**One-time secret (Human or admin):**

1. [Cursor Dashboard → API Keys](https://cursor.com/dashboard/api) → create key
2. GitHub repo **Settings → Secrets → Actions** → `CURSOR_API_KEY`

After the secret is set, every Codex dispatch merge automatically POSTs to `https://api.cursor.com/v1/agents` with prompt in `cursor-dispatch-wake-prompt.txt`.

If the secret is missing, the workflow logs a notice and does **not** fail the merge.

## Optional: Cursor Automations UI (native GitHub trigger)

Same prompt as `cursor-dispatch-wake-prompt.txt`. Create at [cursor.com/automations](https://cursor.com/automations):

- Trigger: GitHub → Pull request merged → `main`, filter `codex/*`
- Repo: `klineodyssey/kline-odyssey`
- Model: Composer 2 Fast

Use **either** GHA+API **or** Automations UI — not both on the same merge unless you want duplicate runs.

## Cost reminder

~$0.03–0.15 per idle wake; + task tokens if cursor-01 claims work. Set Cloud Agent spend limit in Cursor billing.
