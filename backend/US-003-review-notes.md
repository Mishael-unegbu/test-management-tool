# Review Notes: US-003 (View Project) additions

> **STATUS: RESOLVED.** See "Resolution" section at the bottom for what was
> actually changed. Original findings kept below for reference / to explain
> to the dev tool that produced the flagged changes what went wrong.

Reviewed the changes made to `src/validators/projects.validator.js`,
`src/services/projectsService.js`, and `src/services/excelWorkbook.js`.
Two of these were silent runtime bugs, one was an unapproved architecture
change. Details below.

---

## 1. CRITICAL — Duplicate `module.exports` in `projectsService.js`

The new `viewProject` code was appended with its own `module.exports = { viewProject }`,
followed later in the file by the original `module.exports = { createProject, getProjectById, ... }`.

**In CommonJS, only the last `module.exports` assignment in a file wins.** The second
one completely overwrites the first, silently. Net effect: `viewProject` is defined
but **never actually exported** — nothing that imports this module can reach it, and
there's no error to signal that. It will look like it works in review and fail at
call time (or just silently not be routed).

## 2. CRITICAL — Self-require bug in `projectsService.js`

The new code added this line *inside* `projectsService.js` itself:

```js
const projectsService = require('../services/projectsService');
```

The relative path `../services/projectsService` resolves to
`src/services/services/projectsService.js`, which doesn't exist — this would
throw `Cannot find module` the moment the file loads, crashing the server on
startup.

## 3. Wrong layer — controller logic placed in the service file

`viewProject` read `req.params` and called `res.status(...).json(...)` directly
inside the service file — controller responsibility per `STORY_IMPLEMENTATION_GUIDE.md`.

## 4. Route duplication / ambiguity

A new `GET /api/projects/:id/view` route was proposed, overlapping with the
already-existing `GET /api/projects/:id`.

## 5. Response shape inconsistency

New code wrapped the response as `{ success: true, data: project }`, while the
existing endpoint returns the bare project object.

## 6. Unapproved new dependency + inconsistent validation style

`projects.validator.js` gained `require('express-validator')` (not in
`package.json` — would crash on load) plus an Express-middleware-style validator
that calls `res` directly, inconsistent with every other validator in the file
(plain functions returning `{ valid, errors }`). Same duplicate-`module.exports`
bug present here too.

## 7. `excelWorkbook.js` — no changes detected

Confirmed unchanged from the merged baseline; no changes were actually needed
here for US-003.

---

## Resolution

US-003 View Project needed almost no new code, per the analysis above:

1. `projectsService.js` and `projects.validator.js` were both restored to their
   clean, single-`module.exports` state (no self-require, no `express-validator`).
2. `src/controllers/projects.controller.js`'s existing `getProject` function's
   doc comment was updated to state it now officially implements **US-003 View
   Project** (in addition to its existing role pre-filling the Edit Project form)
   — no new function needed, since `projectsService.getProjectById()` already did
   everything required.
3. `src/routes/projects.routes.js`'s comment for `GET /api/projects/:id` was
   updated to say `US-003 View Project` instead of adding a second `/view` route.
4. Response shape kept as the existing bare object (`res.status(200).json(project)`)
   for consistency with US-001/US-002 and the frontend's `ProjectService`.
5. `tests/controllers/projects.controller.test.js`'s `describe` block for
   `GET /api/projects/:id` was relabeled to reflect US-003; test behavior itself
   was already correct and unchanged.
6. No new npm dependency was added. No service-layer or `excelWorkbook.js`
   changes were needed.
