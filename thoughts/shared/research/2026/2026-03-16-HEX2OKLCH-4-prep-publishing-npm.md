---
date: 2026-03-16T17:12:13Z
researcher: Cursor
git_commit: 373d7984b9ad5aa143b24fe7fddd0cc2b2942138
branch: hex2oklch-4-npm-prep
repository: hex2oklch
topic: "HEX2OKLCH-4 prep for publishing to npm"
tags: [research, codebase, npm, hex2oklch, git, package.json]
status: complete
last_updated: 2026-03-16
last_updated_by: Cursor
---

# Research: HEX2OKLCH-4 prep for publishing to npm

**Date**: 2026-03-16T17:12:13Z  
**Researcher**: Cursor  
**Git Commit**: 373d7984b9ad5aa143b24fe7fddd0cc2b2942138  
**Branch**: hex2oklch-4-npm-prep  
**Repository**: hex2oklch

## Research Question

Prep the hex2oklch library for publishing to npm as a new package named "hex2oklch" (name available). Requirements: (1) clean up git history—squash from 60f55f0 (or 57aa4f8) and older so hex2oklch starts clean without hex2rgb history; (2) prepare package.json with version 1.0.0 for the new package; (3) make any necessary tag updates; (4) provide manual instructions for publishing after prep.

## Summary

- **Git history**: Squashing from **60f55f0** (inclusive) down is the right boundary. Commit 60f55f0 is "[HEX2OKLCH-3] Upgrade hex2oklch to version 4.0.0" — the refactor from hex2rgb to hex2oklch. Everything before it is hex2rgb-era. The five commits from 60f55f0 to HEAD are the hex2oklch-era and can be squashed into one clean initial commit for the new package.
- **Tags**: The repo has 17 tags (0.1.0 through v2.2.0) all pointing at hex2rgb-era commits. v2.2.0 points at 57aa4f8. After rewriting history, these tags will either be removed (if history is rewritten) or become dangling; the doc recommends removing all pre–hex2oklch tags and creating a single **v1.0.0** tag after squash.
- **package.json**: Currently `name: "hex2oklch"`, `version: "4.0.0"`. For a new npm package, set `version` to **1.0.0** as part of prep. No other package.json changes required for npm publish.
- **Publish**: Manual steps are documented below (login, publish, optional tag push).

## Detailed Findings

### Git history and squash boundary

- **57aa4f8**: "2.2.0" — last hex2rgb version bump (package.json only).  
- **60f55f0**: "[HEX2OKLCH-3] Upgrade hex2oklch to version 4.0.0" — refactor to OKLCH: `src/index.js`, README, tests, visual tests, eslint, research docs. This is the first commit where the library is truly hex2oklch.

**Conclusion**: Squashing from **60f55f0 and everything below it** (i.e. 60f55f0 becomes the base of the new history) makes sense. That way hex2oklch’s history contains only the refactor and subsequent work, not the hex2rgb lineage.

**Hex2oklch-era commits (60f55f0 → HEAD)**:

1. `60f55f0` — [HEX2OKLCH-3] Upgrade hex2oklch to version 4.0.0  
2. `d8553c4` — upd readme img  
3. `549a8e2` — Update copyright year in LICENSE-MIT  
4. `404f40d` — Update README to clarify hex2rgb integration with OKLCH  
5. `373d798` — Refactor README to clarify project origin and functionality  

These five can be squashed into one initial commit (e.g. "Initial release: hex2oklch 1.0.0") for a clean start.

### Tags

Current tags (all on hex2rgb history):

- `0.1.0`, `0.2.0`, `0.3.0`, `0.4.0`, `v0.5.0`–`v0.8.0`, `v1.0.0`–`v1.4.0`, `v2.0.0`–`v2.2.0`  
- `v2.2.0` → commit `57aa4f8`

After a squash/rewrite, these commits (and thus these tags) will no longer exist in the new history. **Tag updates**: delete all of the above tags locally (and from remote if already pushed), then create a single **v1.0.0** tag on the new squashed commit after setting package version to 1.0.0.

### package.json (current state)

- **name**: `"hex2oklch"` — correct for npm.  
- **version**: `"4.0.0"` — should be changed to **1.0.0** for the new package.  
- **main / exports**: `"main": "src/index.js"`, `"exports": { ".": "./src/index.js" }` — valid for publish.  
- **repository / bugs / homepage**: Point to `glnster/hex2oklch` — correct.  
- **engines**: `"node": ">=22"` — no change needed for publish.  
- No `files` field — npm will include everything not in `.npmignore`; if there is no `.npmignore`, `.gitignore` is used. Worth confirming only intended files (e.g. `src/`, `README.md`, `LICENSE*`) are published.

### Repository and branch

- **Branch**: `hex2oklch-4-npm-prep`  
- **HEAD**: `373d798`  
- **GitHub**: `glnster/hex2oklch` (from package.json and `gh repo view`).

## Code References

- `package.json` — name, version, exports, repository, engines (unchanged except version for publish).
- Git history: `git log --oneline` (57aa4f8 = 2.2.0; 60f55f0 = HEX2OKLCH-3 refactor).
- Tags: `v2.2.0` → 57aa4f8; all tags 0.1.0–v2.2.0 are hex2rgb-era.

## Manual steps (prep and publish)

Do these **after** you are satisfied with the research doc. No code changes were made in research mode; apply the following yourself.

### 1. Git history cleanup (squash)

Option A — **soft reset and single commit** (recommended if this branch is the only one you care about for hex2oklch):

```bash
# Ensure you're on the branch you want to become main (e.g. hex2oklch-4-npm-prep)
git checkout hex2oklch-4-npm-prep

# Soft reset to the parent of 60f55f0 (so 60f55f0 and all later commits become staged)
git reset --soft 60f55f0^

# Create one commit with the current tree (all hex2oklch work)
git commit -m "Initial release: hex2oklch 1.0.0"
```

Option B — **interactive rebase** to squash only the five commits 60f55f0..HEAD:

```bash
git rebase -i 60f55f0^
# Mark the first commit as pick and the rest as squash (or fixup), then save.
# Then amend the resulting commit message to e.g. "Initial release: hex2oklch 1.0.0"
```

After either option, you will have one commit on top of 60f55f0^ (which is the hex2rgb-era parent). If you want **no** hex2rgb history at all, you need a **orphan branch** or **replace full history**:

- **Orphan branch (clean history, one commit)**:
  - Create a new branch with no history: `git checkout --orphan hex2oklch-clean`
  - Unstage everything: `git rm -rf --cached .`
  - Re-add the files you want (e.g. current working tree): `git add .` then remove any files you don’t want in the repo.
  - Commit: `git commit -m "Initial release: hex2oklch 1.0.0"`
  - Then use this branch as your new main (e.g. rename branches, force-push). This truly drops all prior history.

Choose either “squash 60f55f0..HEAD into one commit” (simpler, keeps one parent from hex2rgb) or “orphan branch” (no hex2rgb history at all).

### 2. Tag updates

- **If you rewrote or replaced history**: Old tags will point at commits that may no longer exist. Remove them locally:

  ```bash
  git tag -d 0.1.0 0.2.0 0.3.0 0.4.0 v0.5.0 v0.6.0 v0.7.0 v0.8.0 v1.0.0 v1.1.0 v1.2.0 v1.3.0 v1.4.0 v2.0.0 v2.1.0 v2.2.0
  ```

  If they were pushed: `git push origin --delete <tagname>` for each (or a loop).

- **Create new tag** for the first hex2oklch release (after setting version to 1.0.0):

  ```bash
  git tag v1.0.0
  ```

### 3. package.json version

- Set version to **1.0.0** for the new package:
  - In `package.json`, set `"version": "1.0.0"`.
- Commit this change (or include it in the squashed commit / orphan initial commit above).

### 4. Publish to npm (manual)

- **Login** (if needed):  
  `npm login`  
  Use your npm account (the one that owns the "hex2oklch" name).

- **Dry run** (optional):  
  `npm publish --dry-run`  
  Check the list of files that would be published.

- **Publish**:  
  `npm publish`  
  This publishes the current package (name `hex2oklch`, version from package.json) to the npm registry. It will not overwrite your existing hex2rgb package (different name).

- **Tag the release in git** (if you didn’t already):  
  `git tag v1.0.0` then `git push origin v1.0.0` (and push your branch if needed).

- **Push branch and tag**:  
  `git push origin hex2oklch-4-npm-prep` (or whatever branch you use as main)  
  `git push origin v1.0.0`

## Historical Context (from thoughts/)

- `thoughts/shared/plans/2026/2026-03-09-HEX2OKLCH-3-hex-to-oklch-refactor.md` — HEX2OKLCH-3 refactor: hex → OKLCH, API `oklch`, `oklchString`, `yiq`; no RGB; in-house conversion; README and tests updated. This is the commit 60f55f0.

## Related Research

- Research and plans under `thoughts/shared/research/2026/` and `thoughts/shared/plans/2026/` for HEX2OKLCH-1 (modernize), HEX2OKLCH-2 (visual testing), HEX2OKLCH-3 (hex-to-oklch refactor).

## Open Questions

- None; prep and publish path are documented. Decide only: squash on top of 60f55f0^ vs orphan branch for zero hex2rgb history.
