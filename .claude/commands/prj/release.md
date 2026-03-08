---
description: Run pre-release checklist, validate, version bump, and publish npm package.
argument-hint: [auto|patch|minor|major] [--dry-run] [--skip-publish]
---

# Release Command

Run the full maintainer checklist from `docs/maintainer-checklist.md`, perform pre-release validation, and publish a new version.

**Branch strategy**: `dev` → `qa` → `release` → `main`
- `dev`: development
- `qa`: testing/QA verification
- `release`: latest npm publish (version bump + tag here)
- `main`: stable, proven version (promote separately)

## Arguments

Parse `$ARGUMENTS` for:
- **Version type** (default: `auto`): `auto`, `patch`, `minor`, or `major`
- **--dry-run** (optional): Run all checks but skip actual version bump and publish
- **--skip-publish** (optional): Version bump and commit but do not run `npm publish`

If no arguments are provided, default to `auto`.

## Procedure

### Phase 0: Auto Version Detection (when version type is `auto` or omitted)

When version type is `auto` (or no version type given), analyze commits since the last release to automatically determine the appropriate semver bump.

#### 0.1 Collect Commits Since Last Tag

```bash
git describe --tags --abbrev=0 2>/dev/null
```
- If a tag exists, use it as the baseline
- If no tag exists, use the initial commit as baseline

```bash
git log <baseline>..HEAD --format="%H %s" --no-merges
```

#### 0.2 Parse Commit Types

Read `docs/commit-convention.md` for the project's commit type definitions. Classify every commit since the last tag:

| Commit Pattern | Classification |
|---|---|
| Subject contains `!` after scope (e.g. `feat(core)!:`) | **BREAKING** |
| Body contains `BREAKING CHANGE:` or `BREAKING-CHANGE:` | **BREAKING** |
| Type is `feat` | **FEATURE** |
| Type is `fix` | **BUGFIX** |
| Type is `refactor`, `perf` | **IMPROVEMENT** |
| Type is `docs`, `chore`, `style`, `test`, `ci`, `init` | **MAINTENANCE** |

To inspect full commit messages (for body-level BREAKING CHANGE detection):
```bash
git log <baseline>..HEAD --format="%H" --no-merges
```
Then for each commit hash:
```bash
git log -1 --format="%B" <hash>
```

#### 0.3 Determine Version Bump

Apply these rules in priority order (highest wins):

1. **major** — Any commit classified as **BREAKING**
2. **minor** — Any commit classified as **FEATURE**
3. **patch** — All other cases (BUGFIX, IMPROVEMENT, MAINTENANCE only)

Special rules for pre-1.0 versions (current: 0.x.y):
- Treat BREAKING as **minor** instead of major (pre-1.0 convention)
- Treat FEATURE as **minor**
- All others as **patch**

#### 0.4 Present Decision

Display the analysis to the user in this format:

```
Version Auto-Detection
──────────────────────
Current version : 0.1.0
Last tag        : v0.1.0 (or "none")
Commits since   : N commits

Commit Breakdown:
  BREAKING    : 0
  FEATURE     : 3  ← feat(cli): add interactive mode, ...
  BUGFIX      : 2
  IMPROVEMENT : 1
  MAINTENANCE : 5

Decision: minor (0.1.0 → 0.2.0)
Reason : New features detected (feat commits present)
```

Then ask: **"Proceed with `minor` bump to 0.2.0? (yes / or specify: patch, minor, major)"**

- If user confirms → proceed with the detected version type
- If user specifies a different type → use that instead

### Phase 1: Pre-Release Validation

Execute all checks sequentially. If any check fails, **stop immediately** and report the failure with actionable fix instructions.

#### 1.1 Git State & Remote Sync

```bash
git status
```
- If there are uncommitted changes → STOP and ask the user to commit or stash first
- Confirm current branch is `dev`

Verify remote sync for all branches involved in release:
```bash
git fetch origin
git rev-list --count HEAD..origin/dev
git rev-list --count HEAD..origin/qa
git rev-list --count HEAD..origin/release
```
- If `dev` is behind remote → STOP and ask to `git pull origin dev` first
- If `qa` or `release` are behind remote → will be synced in Phase 2

#### 1.2 Code Quality Checks
```bash
npm run lint
```
```bash
npx tsc --noEmit
```
```bash
npm run build:lib
```

After build, verify output files exist:
```bash
ls -la dist/index.js dist/index.d.ts dist/cli.js
```

#### 1.3 Security Checks
```bash
npm audit
```
- If **critical** or **high** vulnerabilities found → STOP and report
- If **moderate** or **low** → warn but continue

```bash
npm pack --dry-run
```
- Verify ONLY `dist/`, `bin/`, `README.md`, `LICENSE` are included
- If `.env`, `node_modules`, `reference/`, or any sensitive file detected → STOP

#### 1.4 Dependency Health
```bash
npm outdated
```
- Report outdated packages as informational (do not block release)
- Highlight any AI SDK (`ai`, `@ai-sdk/*`) outdated packages with a warning

#### 1.5 Documentation Sync Check

Read `git log` since the last version tag to identify what changed:
```bash
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
```

Cross-reference changed files against documentation mapping:
- `src/cli.ts` changed → check `docs/cli-guide.md` is updated
- `src/index.ts` or `src/core/*` changed → check `docs/library-guide.md`
- `src/core/provider.ts` changed → check `docs/providers.md`
- `package.json` dependencies changed → check `docs/getting-started.md`
- `.env.example` changed → check docs mention matching env vars

Report any potentially stale documentation as warnings. Ask the user whether to proceed or fix first.

### Phase 2: Branch Merge Pipeline

**If `--dry-run` is set, skip Phase 2-4 entirely and report "Dry run complete. All checks passed."**

#### 2.1 dev → qa

```bash
git checkout qa
git pull origin qa
git merge dev
git push origin qa
```

Report to user: "Merged dev → qa. QA verification point."
Ask: **"QA checks passed? Continue to release? (yes/no)"**

- If user says no → STOP (user should verify qa branch and re-run later)
- If user says yes → continue

#### 2.2 qa → release

```bash
git checkout release
git pull origin release
git merge qa
```

Stay on `release` branch for Phase 3.

### Phase 3: Version Bump & Tag (on `release` branch)

#### 3.1 Generate Changelog Entry

From the git log collected in Phase 0/1, classify each commit by type and write a changelog entry following the format in `docs/maintainer-checklist.md`:

```markdown
## [NEW_VERSION] - YYYY-MM-DD

### Added
- feat commits

### Changed
- refactor/chore commits

### Fixed
- fix commits
```

Read the current `CHANGELOG.md` and prepend the new entry below the title line. Use the Edit tool.

#### 3.2 Version Bump

Update `package.json` version field using the Edit tool (do NOT use `npm version` as it auto-commits):
- patch: 0.1.0 → 0.1.1
- minor: 0.1.0 → 0.2.0
- major: 0.1.0 → 1.0.0

#### 3.3 Commit Release & Tag

Stage and commit with the following format:
```
chore(release): release vX.Y.Z

- Bump version to X.Y.Z
- Update CHANGELOG.md

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Then create a git tag:
```bash
git tag vX.Y.Z
```

### Phase 4: Publish & Sync

**If `--skip-publish` is set, skip 4.1-4.2 and go to 4.3.**

Before publishing, ask the user for explicit confirmation:
> "Ready to publish vX.Y.Z to npm. Proceed? (This will push release branch + tags)"

#### 4.1 Publish to npm
```bash
npm publish --access public
```

#### 4.2 Push release branch + tags
```bash
git push origin release --tags
```

#### 4.3 Back-merge to dev (sync version bump)
```bash
git checkout dev
git merge release
git push origin dev
```

#### 4.4 GitHub Release
```bash
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

If `gh` fails or is not available, provide the manual GitHub release URL.

#### 4.5 Prompt for main promote (optional)

Ask: **"Promote vX.Y.Z to main (stable) now, or wait for stability verification?"**

- If user says **now**:
  ```bash
  git checkout main
  git pull origin main
  git merge release
  git push origin main
  ```
- If user says **wait**: print reminder
  > "Remember to promote release → main after verifying stability."

Finally, return to dev branch:
```bash
git checkout dev
```

### Phase 5: Post-Release Report

Print a summary:

```
Release vX.Y.Z Summary
──────────────────────
✅ Lint            passed
✅ TypeCheck       passed
✅ Build           passed
✅ Security        no critical issues
✅ Package         N files, XX KB
✅ dev → qa        merged
✅ qa → release    merged
✅ Changelog       updated
✅ Version         X.Y.Z
✅ Git Tag         vX.Y.Z
✅ npm Publish     success (or skipped)
✅ GitHub Release  created (or skipped)
✅ release → dev   back-merged
✅ release → main  promoted (or deferred)
```

## Required Rules
- **NEVER publish without passing all Phase 1 checks**
- **NEVER publish with uncommitted changes**
- **NEVER force-push during release**
- **NEVER create tags on any branch other than `release`**
- **Always ask for user confirmation before npm publish, git push, and main promote**
- If any step fails, stop and report — do not attempt to auto-fix and continue silently
- After release, always return to `dev` branch
