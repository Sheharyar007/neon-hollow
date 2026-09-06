# Engineering guidance

## Organization and dependencies

Start with one application and a small dependency set. Prefer the chosen framework's normal folder structure. Keep interface code, business rules, and data access easy to distinguish; use a separate backend service only when the requirements justify one.

Keep related feature code together. Extract shared components or utilities when they have a clear repeated use. Give important modules a single responsibility and descriptive names. Record consequential architecture choices and their reasons in this document as they arise.

When a stack is selected, pin its supported runtime, use one package manager and commit its lockfile, and add consistent formatting, linting, type checks where supported, and build commands. Choose versions at that time rather than committing an arbitrary stack now.

## Frontend

Use semantic markup and accessible platform controls first. Separate presentation from data fetching and business rules where it improves clarity. Keep state near its owner; introduce global state only when multiple parts of the interface need it.

Give each data-driven view explicit loading, empty, error, and success states. Handle failed requests without losing user input. Apply the shared design guidance and verify narrow screens as well as desktop layouts.

## Backend and data

If server logic is needed, validate untrusted input at the server boundary. Enforce authentication and authorization on the server for protected operations. Keep secrets on the server and use safe configuration placeholders in documentation.

Keep business rules separate from transport and storage details where practical. Return consistent, useful errors without exposing secrets or internal stack traces. Use structured logs that exclude sensitive data. For persistent storage, keep schema migrations in source control and define safe development data.

## Verification and updates

For each change, define observable acceptance criteria and run the applicable formatting, lint, type, test, and build checks that the project provides. Add tests for meaningful behavior, business rules, integration boundaries, and regressions. Avoid tests that merely repeat implementation details.

Review affected flows in a browser, including keyboard navigation, a narrow viewport, and failure states. When an automated check cannot cover usability, document the manual check. Keep setup instructions accurate so a fresh checkout can be used without undocumented steps.

Add continuous integration when runnable application checks exist. Review dependency updates in small batches and verify the affected behavior before release. Select hosting and release procedures once deployment requirements are known.

## Decisions so far

- Neon Hollow is a local, single-player browser game. Native JavaScript modules and Canvas 2D keep this first version dependency-free. Node.js 22+ serves local files and runs tests; no frontend framework or package installation is needed.
- Simulation, input, presentation, content data, audio, and DOM interface are separate modules. The simulation uses a fixed 60 Hz timestep and bounded entity/effect counts.
- No backend, database, or authentication is needed. GitHub Pages can host the static build. The local server exposes only game files and binds to loopback. Personal best scores are optional browser-local state.
- The static build is a source copy into `dist/`. Formatting and syntax checks apply to source; simulation tests cover meaningful gameplay rules. A GitHub Actions workflow is prepared to validate and deploy only `dist/` on pushes to `main`; external setup and publishing still require user action.
