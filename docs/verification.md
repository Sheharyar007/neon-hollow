# Verification — September 6, 2026

## Automated checks

- 12 passing tests cover normalized and bounded movement, keyboard keydown/release/blur, dash and invulnerability, pause, automatic combat, XP collection, unique upgrade choices and overflow, all five weapon families, supplies, ranged/charging/splitting enemies and mutations, boss spawning and extraction requirements, death/restart, and entity limits.
- JavaScript syntax checks passed for the application, local server, and build/balance scripts. The Finder launcher passed a shell syntax check.
- Static build completed. `dist/` contains only the public game files.
- Three reproducible simulation playtests exercised multiple waves and varied builds. They are diagnostics, not a substitute for player feedback or proof of difficulty balance.

## Browser checks

Tested in the Codex in-app browser on this Mac, at the normal 1280 × 720 viewport and a 390 × 844 phone-sized viewport:

- Opening screen and instructions render; the generated arena loads.
- Start begins at full health with the starter weapon and clear HUD.
- Enemies spawn, automatic shots eliminate them, damage is applied, and experience drops appear.
- Keyboard dash moves the runner and shows recharge; the touch stick changes the runner's position.
- XP collection opens the level-up menu and pauses combat. Selecting an upgrade resumes play and updates the arsenal.
- Pause holds time and run state. Resume continues. Restart from game over resets the run; canceling restart preserves it.
- The game-over summary displays elapsed time, kills, score, and personal best. The best persists across reloads.
- Desktop and phone-sized layouts were visually checked. Menus expose native buttons and focus indicators; touch controls are available on narrow screens.
- Optional WebMCP read and upgrade actions registered successfully. A valid choice updated the same game state; an invalid choice failed intentionally without applying an upgrade.
- No unexpected browser console errors were observed.

Fixes made during verification: normalized server root paths; hidden touch controls during overlays; refreshed consecutive upgrade menus; normalized analog movement; limited the starter weapon's target range so enemies remain visible; ensured early choices include a new weapon.

## Scope and access limits

The final boss, victory, and all weapon families were checked in simulation tests. A complete five-minute human victory was not performed in the browser. Physical iPhone/Safari behavior, sustained performance on low-end phones, and screen-reader spatial gameplay were not verified. Menus and announcements are accessible, but combat relies on visual spatial feedback.

The local preview is **http://localhost:4173**. The server binds only to this Mac's loopback address. It is not directly reachable from another device. No hosting, remote connection, commit, or push was performed.

Screenshots are in `artifacts/`: `desktop-start.png`, `mobile-start.png`, `mobile-upgrade.png`, `result-screen.png`, and `desktop-gameplay.png`.

## GitHub Pages preparation — September 6, 2026

- Converted document assets/navigation to relative URLs and resolved the arena image relative to its JavaScript module. Game design and combat behavior are unchanged.
- Added a Pages workflow: checks, 12 gameplay tests, build, artifact verification, and upload of `dist/`, followed by a deployment job using the `github-pages` environment. It runs on `main` pushes and supports manual reruns.
- All 12 tests and application/script syntax checks passed. The workflow YAML parsed successfully; its main trigger, manual trigger, job dependency, and upload directory were checked locally.
- `scripts/verify-build.mjs` checked all 9 public files and 11 references under both root and arbitrary repository URL prefixes, and rejected deployment links/non-public file types by design.
- Served the built `dist/` at `http://localhost:4174/neon-hollow/`. Browser testing confirmed styles, modules, arena artwork, start/play, and home navigation staying within `/neon-hollow/`; no browser errors were reported. Screenshot: `artifacts/pages-preview.png` (local only).
- Local screenshots are now Git-ignored, without deleting them. The deployment build continues to exclude documentation, local server files, and screenshots.
- The live GitHub Actions run and hosted URL cannot be verified until the user creates a repository, pushes, and enables Pages. No account authentication, commit, remote setup, push, or external deployment was performed.
