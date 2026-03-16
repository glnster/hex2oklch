# Manual publish steps (hex2oklch 1.0.0)

Run these after prep is complete and you are ready to publish to npm.

1. **Login** (if needed):
   ```bash
   npm login
   ```
   Use the npm account that owns the "hex2oklch" package name.

2. **Dry run** (optional):
   ```bash
   npm publish --dry-run
   ```
   Confirm the file list is correct (src/, README.md, LICENSE-MIT, package.json, oklch-swatches.png).

3. **Publish**:
   ```bash
   npm publish
   ```
   This publishes hex2oklch@1.0.0 to the npm registry. It does not affect the hex2rgb package (different name).

4. **Push branch and tag**:
   ```bash
   git push origin hex2oklch-4-npm-prep
   git push origin v1.0.0
   ```
   If you use a different branch as main (e.g. after merging or renaming), push that branch instead. If old tags were previously pushed to origin, remove them first: `git push origin --delete <tagname>` for each.

5. **Optional**: Normalize package.json repository URL (clears npm warning):
   ```bash
   npm pkg fix
   ```
   Commit and tag any changes if you run this.
