# HEX2OKLCH-4: Prep for Publishing to npm — Implementation Plan

## Overview

Prepare the hex2oklch library for publishing to npm as a new package named "hex2oklch". This includes cleaning git history so the package starts without hex2rgb lineage, setting package version to 1.0.0, updating tags, and documenting manual publish steps. No library code changes; only prep and version bump.

## Current State Analysis

- **Git**: Branch `hex2oklch-4-npm-prep`, HEAD at `373d798`. Five hex2oklch-era commits from `60f55f0` ("[HEX2OKLCH-3] Upgrade hex2oklch to version 4.0.0") through HEAD. All history before `60f55f0` is hex2rgb-era (e.g. `57aa4f8` = "2.2.0").
- **Tags**: 17 tags (0.1.0 through v2.2.0) all point at hex2rgb-era commits; v2.2.0 → `57aa4f8`. After history rewrite these will be invalid or dangling.
- **package.json**: `name: "hex2oklch"`, `version: "4.0.0"`. `main`/`exports`, `repository`, `engines` are correct for publish. No `files` field; npm uses `.gitignore` when `.npmignore` is absent—confirm intended files (e.g. `src/`, README, LICENSE) are published.

### Key Discoveries

- Research: `thoughts/shared/research/2026/2026-03-16-HEX2OKLCH-4-prep-publishing-npm.md` — Squash boundary: **60f55f0** (inclusive); five commits 60f55f0..HEAD to squash into one "Initial release: hex2oklch 1.0.0". Alternative: orphan branch for zero hex2rgb history.
- package.json: Only change needed for npm prep is `"version": "1.0.0"`.
- Tags: Remove all 17 hex2rgb-era tags (locally and remote if pushed); create single **v1.0.0** after squash.

## Desired End State

- Git history shows one initial hex2oklch commit (or an orphan branch with one commit); no hex2rgb commits in the published history (or optionally one parent, per chosen strategy).
- All hex2rgb-era tags removed; single tag **v1.0.0** on the release commit.
- package.json has `"version": "1.0.0"`.
- Manual publish steps documented and optionally executed: npm login, dry-run, publish, push branch and v1.0.0.

### Verification

- `git log --oneline` shows intended history (one or few commits for hex2oklch).
- `git tag -l` shows only `v1.0.0` (or none if tag created later).
- `npm publish --dry-run` lists only intended files (e.g. `src/`, README, LICENSE*).
- After publish: package "hex2oklch" at 1.0.0 exists on npm; no overwrite of hex2rgb (different name).

## What We're NOT Doing

- Changing any library source code (`src/index.js`) or tests.
- Adding or changing dependencies, scripts, or package.json fields other than `version`.
- Automating the actual `npm publish` or git push in this plan (manual steps only).
- Migrating or modifying the hex2rgb package.

## Implementation Approach

Execute in order: (1) set package version to 1.0.0 and decide history strategy; (2) perform git history cleanup (squash or orphan); (3) update tags; (4) verify with dry-run and document manual publish. All steps are manual/shell except the single version edit in package.json.

---

## Phase 1: Version and strategy

### Overview

Set package version to 1.0.0 and decide whether to squash on top of 60f55f0^ (keeps one hex2rgb parent) or use an orphan branch (no hex2rgb history).

### Changes Required

#### 1. package.json version

**File**: `package.json`  
**Change**: Set `"version": "1.0.0"` (from `"4.0.0"`).

#### 2. Strategy decision

- **Option A — Squash (simpler)**: Soft reset to `60f55f0^`, then single commit with message "Initial release: hex2oklch 1.0.0". History will contain one hex2rgb parent then one hex2oklch commit.
- **Option B — Orphan branch**: New branch with no history; one commit with current tree. Zero hex2rgb history.

No automated code change for strategy; document choice and proceed in Phase 2.

**Decision recorded**: Option A — Squash (soft reset to `60f55f0^`, single commit "Initial release: hex2oklch 1.0.0"). Keeps one hex2rgb parent in history.

### Success Criteria

#### Automated Verification

- [x] package.json contains `"version": "1.0.0"`.
- [x] `npm run lint` and `npm test` still pass (no code change).

#### Manual Verification

- [x] Decision recorded: squash vs orphan (for audit).

**Implementation Note**: After completing this phase, proceed to Phase 2 using the chosen strategy.

---

## Phase 2: Git history cleanup

### Overview

Rewrite history so hex2oklch has a single initial commit (squash) or a single commit on an orphan branch. Execute only one of the options below.

### Changes Required

#### Option A — Soft reset and single commit (squash)

```bash
git checkout hex2oklch-4-npm-prep
git reset --soft 60f55f0^
git commit -m "Initial release: hex2oklch 1.0.0"
```

#### Option B — Interactive rebase (squash)

```bash
git rebase -i 60f55f0^
# Mark first commit pick, rest squash/fixup; save. Amend message to "Initial release: hex2oklch 1.0.0"
```

#### Option C — Orphan branch (no hex2rgb history)

```bash
git checkout --orphan hex2oklch-clean
git rm -rf --cached .
git add .
# Remove any files not wanted in repo, then:
git commit -m "Initial release: hex2oklch 1.0.0"
# Then replace main: e.g. git branch -D main && git branch -m main, or use this branch as new main
```

### Success Criteria

#### Automated Verification

- [x] `git log --oneline` shows intended result: one (or one plus parent) hex2oklch commit(s); no long hex2rgb tail if orphan chosen.
- [x] Working tree unchanged: `npm test` and `npm run lint` still pass.

#### Manual Verification

- [x] History looks correct; no accidental loss of desired files.

**Implementation Note**: After Phase 2, old tags will point at commits that may no longer exist. Proceed to Phase 3 to remove them and create v1.0.0.

---

## Phase 3: Tag updates

### Overview

Remove all hex2rgb-era tags locally (and from remote if already pushed). Create tag **v1.0.0** on the new release commit.

### Changes Required

#### 1. Delete old tags locally

```bash
git tag -d 0.1.0 0.2.0 0.3.0 0.4.0 v0.5.0 v0.6.0 v0.7.0 v0.8.0 v1.0.0 v1.1.0 v1.2.0 v1.3.0 v1.4.0 v2.0.0 v2.1.0 v2.2.0
```

If any were pushed: `git push origin --delete <tagname>` for each (or loop).

#### 2. Create new tag

```bash
git tag v1.0.0
```

### Success Criteria

#### Automated Verification

- [x] `git tag -l` lists only `v1.0.0` (or intended set).
- [x] `git rev-parse v1.0.0` points at the initial hex2oklch release commit.

#### Manual Verification

- [ ] If old tags existed on remote, they are removed to avoid confusion.

---

## Phase 4: Verify publish list and document manual publish

### Overview

Confirm which files npm would publish (dry-run), then document and optionally run manual publish and push steps.

### Changes Required

#### 1. Dry run

```bash
npm publish --dry-run
```

Confirm listed files are correct (e.g. `src/`, README.md, LICENSE, package.json; no dev-only or local paths). Add `.npmignore` if needed so only intended files are included (research noted no `files` field, so .gitignore applies if .npmignore absent).

#### 2. Document manual publish steps (for executor)

- **Login**: `npm login` (npm account that owns "hex2oklch").
- **Publish**: `npm publish`.
- **Push**: `git push origin <branch>` (e.g. main or hex2oklch-4-npm-prep); `git push origin v1.0.0`.

### Success Criteria

#### Automated Verification

- [x] `npm publish --dry-run` completes and file list is reviewed (and adjusted via .npmignore if necessary).

#### Manual Verification

- [ ] After publish: package "hex2oklch" at version 1.0.0 is visible on npm.
- [ ] Branch and tag v1.0.0 pushed to origin as desired.

---

## Testing Strategy

- **No new automated tests** for this prep (library behavior unchanged).
- **Verification**: Lint and existing test suite must still pass after version bump and after history rewrite (working tree unchanged).
- **Manual**: Dry-run file list; actual publish and push once.

## Performance Considerations

None; prep is one-time git and metadata operations.

## Migration Notes

- If the repo is already cloned elsewhere or CI uses branch/tags, coordinate force-push and tag deletion with the team.
- After force-push, other clones should re-clone or reset to the new history.

## References

- Research: `thoughts/shared/research/2026/2026-03-16-HEX2OKLCH-4-prep-publishing-npm.md`
- Prior refactor plan: `thoughts/shared/plans/2026/2026-03-09-HEX2OKLCH-3-hex-to-oklch-refactor.md`
- package.json: version and name at lines 2–3
