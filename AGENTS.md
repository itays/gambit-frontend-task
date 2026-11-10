## Rules

| Rule                                                                                                                                                                                                                                          | Enforced by                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| New UI functionality ships with a Playwright test in `e2e/*.e2e.ts`, in the same PR. The test drives the user flow in Chromium. App-level component tests in `src/**/*.test.tsx` do not replace it. Run `npm run test:e2e` before committing. | Review only. Whether a change counts as new UI functionality is a judgment call. |

## Agent skills

### Issue tracker

Issues live in GitHub Issues (itays/gambit-frontend-task), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
