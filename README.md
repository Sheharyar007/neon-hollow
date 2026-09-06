# Neon Hollow

An original, single-player survival game built in the Test WebApp project. Move through an abandoned botanical arena, collect experience, build an arsenal, and survive five minutes after defeating the Hollow Keeper.

## Play locally

On this Mac, double-click `Start Neon Hollow.command` in Finder. It uses Node.js if installed, or the bundled Codex runtime already present on this Mac. Keep its Terminal window open while playing.

For other computers, Node.js 22 or newer is required. There are no packages to install.

```sh
node server.mjs
```

Open **http://localhost:4173** on this Mac. The server binds only to `127.0.0.1`; this address is not reachable from an iPhone or another computer. A future LAN preview needs an explicit network binding decision. Nothing is published.

- Move: **WASD** or **arrow keys**. Weapons aim and fire automatically.
- Dash: **Space**, with a three-second recharge. On touch screens use the stick and dash button.
- Upgrades: collect blue experience shards, then click a choice or press **1–3**.
- Pause/resume: **P**, **Escape**, or the pause button. Switching away automatically pauses.
- Sound is optional and starts off. Restart from the pause or result screen.
- Survive ten escalating waves. The Keeper arrives at 04:30; defeat it and reach 05:00 to win. If it is still alive at 05:00, the fight continues.

Supplies include health (`+`), a magnet that pulls in experience (`◎`), and a screen-clearing nova (`✷`). Five weapons each have five levels, plus five families of survival upgrades. Seven regular enemy archetypes gain four mutation tiers; elites and the final boss add pressure. This is a coherent first demo, not 30 independently designed enemy species.

## Project map

- `src/engine.js`: fixed-step simulation, combat, waves, upgrades, pickups, and win/loss rules; no browser dependency.
- `src/data.js`: weapon and enemy definitions, progression constants, display helpers.
- `src/render.js`: canvas presentation, camera, character drawing and effects.
- `src/input.js`: keyboard and pointer controls.
- `src/main.js`: accessible menus, HUD, lifecycle and optional browser tool integration.
- `src/audio.js`: optional synthesized audio cues.
- `styles.css`: responsive interface and visual tokens.
- `public/assets/arena.png`: original generated arena art. See [art notes](docs/art.md).
- `tests/game.test.mjs`: behavior tests for the simulation.

This local prototype uses native browser modules and Canvas 2D. It has no accounts, backend, external requests, or runtime dependencies. Only the personal best score is saved in the current browser. Clearing browser storage clears that score. A screen reader can access instructions, menus, and status announcements; spatial action gameplay itself remains visual.

## Verify and build

```sh
node --test tests/game.test.mjs
node scripts/build.mjs
```

With npm available, `npm run check`, `npm test`, and `npm run build` provide the same checks. The build copies only public game files into `dist/`; `server.mjs` serves the editable source. `node scripts/balance.mjs` runs three reproducible simulation playtests to help evaluate tuning; it is diagnostic, not a guarantee that a human player will win.

See [verification notes](docs/verification.md) for this version's checks and limits.

## Project guidance

- [Engineering](docs/engineering.md)
- [Design](docs/design.md)
- [Contributor instructions](AGENTS.md)

Before the next feature, get feedback on movement, readability, difficulty, and upgrade variety. Tune this playable loop before adding more systems.

## Publish with GitHub Pages

GitHub Pages fits this game because the complete application is static HTML, CSS, JavaScript, and images. Once deployed, its HTTPS link works on your phone and can be sent to friends; your Mac does not need to stay on. Each browser keeps its own best score. This does not add multiplayer or cloud score synchronization.

Use your **GitHub account** for the repository and publishing. On GitHub Free, Pages requires a **public repository**, so the uploaded source is visible to everyone. Eligible paid plans support private source repositories, but a private repository does not automatically make its Pages website private. See [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [site visibility](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

### First-time setup and push

These are instructions for you to run when ready. No account, remote, commit, push, or published site has been created by this preparation.

1. Sign in to GitHub and [create a repository](https://github.com/new) named `neon-hollow` (or use another name consistently below). Choose **Public** for free Pages. Leave **Add a README**, **.gitignore**, and **license** unselected: this existing project already has its initial files.
2. If needed, install [GitHub CLI](https://cli.github.com/). In Terminal, sign in through the browser and configure Git authentication:

   ```sh
   gh auth login --hostname github.com --git-protocol https --web --scopes workflow
   gh auth setup-git --hostname github.com
   ```

   The `workflow` scope allows the initial push to include the deployment workflow. Complete sign-in with GitHub; do not paste credentials into this project. See [CLI sign-in](https://cli.github.com/manual/gh_auth_login).

3. Open this project in Terminal. Replace the example author values below with your name and the commit email shown in **GitHub → Settings → Emails** (you may use the GitHub-provided no-reply address):

   ```sh
   cd "$HOME/Documents/ChatGPT/Test WebApp"
   git config --local user.name "YOUR NAME"
   git config --local user.email "YOUR COMMIT EMAIL"
   git status
   git add .
   git diff --cached --stat
   ```

   Review the staged files. The build folder and local QA screenshots are ignored; the game source and original arena artwork are included. Then create the initial commit and push, replacing `YOUR_GITHUB_USERNAME` and the repository name if different:

   ```sh
   git commit -m "Add Neon Hollow survival game"
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/neon-hollow.git
   git push -u origin main
   ```

4. In that repository, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**. The custom workflow is already included; you do not need to generate another one.
5. Open **Actions → Deploy Neon Hollow to Pages → Run workflow**, choose **main**, and run it. This also recovers the first deployment if its automatic run happened before Pages was enabled. Wait until both **build** and **deploy** are green.
6. Copy the live URL from **Settings → Pages** or the deployment result. Normally it is `https://YOUR_GITHUB_USERNAME.github.io/neon-hollow/`. Open that URL on your phone and share it with friends. This example is not an existing deployment.

For the publishing-source setting, see [GitHub's instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Future updates

Review and commit your local changes, then run `git push`. Each push to `main` runs syntax checks, the gameplay tests, the static build, and deployment verification before publishing. The workflow deploys only `dist/`; it does not publish project documentation, the local server, or QA screenshots. No manual `gh-pages` branch or committed `dist/` folder is needed. The workflow uses GitHub's built-in token; no repository secrets are required.

### Check the production artifact locally

With Node.js 22+ available in Terminal:

```sh
node scripts/build.mjs
node scripts/verify-build.mjs
node server.mjs --production
```

Open **http://localhost:4174/neon-hollow/**. This serves the exact built files under a repository-style prefix, independently of the source preview at **http://localhost:4173**. The game also supports a different repository name or a root-domain Pages site without editing its paths. Stop this production preview with Control-C when finished. Both local URLs remain Mac-only; sharing requires the actual Pages deployment above.

On this Mac, if `node` is not on your Terminal path, use the bundled executable in place of `node` in those commands:

```sh
"$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/build.mjs
```

## Git status

The project uses `main`, with `origin` set to [Sheharyar007/neon-hollow](https://github.com/Sheharyar007/neon-hollow). The Pages workflow is prepared; publishing still depends on enabling GitHub Actions as the Pages source and completing a successful deployment. The first-time setup instructions above also apply when publishing a new copy to another repository.
