Update the changelog for a new release version.

## Steps

1. Read `changelog.md` to understand the current format and latest documented version.
2. Run `git log --oneline` to find version tag commits (e.g., `4.16.3`, `4.16.4`) and identify undocumented versions.
3. For each undocumented version, determine the commit range:
   - Start: first commit after the previous version tag commit
   - End: the version tag commit itself
4. Run `git diff <prev-version-commit>..<version-commit> -- src/` to understand the actual code changes (not just commit messages).
5. Run `git log --format="%H %ai %s" <prev-version-commit>..<version-commit>` to get commit dates and messages.
6. Add changelog entries in reverse chronological order (newest first) before the existing entries, following the format:
   - `## [x.y.z] - YYYY-MM-DD`
   - Commit hash range: `` `<first-content-commit>` - `<version-tag-commit>` ``
   - Sections: `### Added`, `### Fixed`, `### Changed`, `### Removed` (only include relevant sections)
   - Each item should concisely describe the user-facing change
