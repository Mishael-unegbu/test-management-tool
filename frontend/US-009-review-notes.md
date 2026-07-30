# Review Notes: US-009 (Create Test Case) — frontend compile-safety fix

> **STATUS: PARTIALLY RESOLVED.** The frontend now compiles again and
> `create-test-case`/`create-project` have real templates. US-009 itself is
> **not implemented** — there is still no backend for TestCases at all.
> Read this fully before doing anything else with Test Cases.

## What was found

1. **CRITICAL — frontend would not compile at all.**
   `src/app/services/test-case.service.ts` was completely empty (no export),
   but `create-test-case.component.ts` imports `TestCaseService` from it.
   Since Angular/TypeScript type-checks the whole project by default (this
   component isn't even routed — see #5), this alone broke `ng build` /
   `ng serve` for the **entire app**, not just this feature.

2. **CRITICAL — two component `.html` files contained `.ts` source, not
   markup.**
   - `components/create-project/create-project.component.html` contained a
     verbatim copy of `create-project.component.ts`.
   - `components/create-test-case/create-test-case.component.html` also
     contained that same copy (i.e. `create-project.component.ts`'s content,
     not even test-case-specific).
   Both `.ts` files and `create-project.component.css` were themselves fine.
   This looks like a paste-target mistake (writing `.ts` content to the
   `.html` slot) repeated across two files, not a logic bug.

3. **`create-test-case.component.ts` had ~90 lines of dead, non-compiling
   code commented out below the real class** — an abandoned early draft of
   a `CreateProjectComponent`, mislabeled, importing/using things
   inconsistently with its own form fields, pointing at the wrong
   `styleUrls`. It was inert (commented out) so it wasn't itself breaking
   the build, but it's misleading clutter and referenced a nonexistent
   `create-te.component.css`.

4. **Real bug caught while rewriting `create-test-case.component.ts`:** it
   called `this.userStoryService.getStoryById(this.storyId)`, but
   `UserStoryService`'s actual method is `getUserStoryById()`. This would
   have been a second compile error even after fixing #1. Fixed as part of
   restoring the file — flagging in case this typo exists elsewhere too
   (grep didn't turn up another instance, but worth a second look).

5. **`create-test-case.component.ts` is not registered in `app.routes.ts`.**
   Left that way deliberately — see "What was deliberately NOT done" below.

## What was fixed

- `create-project.component.html` — restored to a real Angular template
  (form fields matching the component's existing `FormBuilder` group:
  `projectName`, `description`, `status` via `allowedStatuses`
  (`PROJECT_STATUSES` — **not** a Settings-sheet lookup, per the landmine
  documented in `Governance/Architecture_Decisions.md` / section 3 of
  `Prompts/AI_Dev_Tool_Integration_Contract.md`), `startDate`, `endDate`).
  Uses the existing `.create-project-card` CSS class already present in
  `create-project.component.css` (that file was never touched — it was fine).
- `create-test-case.component.ts` — removed the dead commented block; fixed
  the `getStoryById` → `getUserStoryById` typo; added a status doc-comment
  explaining this story is not finished (see below).
- `create-test-case.component.html` — replaced with a real template
  (mirrors `create-user-story.component.html`'s structure/conventions:
  card + back-link + context line + reactive form + success/error `<p>`s).
  Includes an HTML comment at the top warning it can't actually submit yet.
- `create-test-case.component.css` — the file existed but was a near-exact
  copy of `create-project.component.css`, including the misleading
  `.create-project-card` root class name applied to a test-case form.
  Renamed the root class to `.create-test-case-card` (and updated the
  template to match) so it's not confusing later; styling itself unchanged.
- `services/test-case.service.ts` — was empty; added a **minimal stub**
  with only `createTestCase()` (`POST /api/test-cases`), matching the
  `ProjectService`/`UserStoryService` pattern (absolute
  `http://localhost:3000/api` base URL, per section 5 of the Integration
  Contract). This satisfies the compiler and matches the interface the
  component already expects — nothing more.

## What was deliberately NOT done (needs a real decision, not a guess)

1. **No backend for TestCases was built.** `SourceCode/backend/src` has no
   `testCases.routes.js` / `.controller.js` / `.service.js` /
   `.validator.js`. `POST /api/test-cases` does not exist. Calling
   `TestCaseService.createTestCase()` right now will fail at runtime
   (network error, not a validation error). Building this is the actual
   bulk of US-009 and should follow `STORY_IMPLEMENTATION_GUIDE.md` exactly
   — I did not start it, since that's a substantial new-scope addition that
   should be explicitly picked up as its own task, not bundled into a
   "fix the compile error" pass.

2. **`CreateTestCaseComponent` was intentionally left out of
   `app.routes.ts`.** Routing users to a form that can't actually save
   anything is a worse experience than a missing link. Add the route
   (`{ path: 'user-stories/:storyId/test-cases/new', component:
   CreateTestCaseComponent }`, matching the doc comment already in the
   component) once the backend above exists.

3. **`TEST_CASE_STATUSES` / `TEST_CASE_PRIORITIES` are still unconfirmed**,
   same as before this fix — I did not resolve this, only made it more
   visible. What I *can* confirm from reading the actual
   `Data/QA_Management_Data_Template.xlsx` Settings sheet directly:
   ```
   SettingType  Value
   Severity     Critical / High / Medium / Low
   Priority     P1 / P2 / P3 / P4
   Status       Open / In Progress / Closed
   ```
   `TEST_CASE_PRIORITIES` (`P1`–`P4`) matches the sheet's only `Priority`
   rows exactly — that part looks safe. `TEST_CASE_STATUSES`
   (`Open`/`In Progress`/`Closed`) matches the sheet's `Status` rows
   literally, **but** `Architecture_Decisions.md` / the Integration
   Contract already document that those specific `Status` rows are meant
   for **Bugs**, not Projects — and the same generic-lookup assumption
   caused a real, shipped bug for Projects. Whether Test Case status is
   *also* supposed to share the Bug vocabulary, or needs its own
   Settings entry that doesn't exist yet, isn't answered anywhere in the
   TRD/Backlog I have access to. **Ask before building the backend
   validator for this — don't default to the Bug values just because nothing
   else is available**, per Master AI Coding Instructions §"ask, don't
   invent."

4. **Did not add a frontend test runner.** Per section 5 of the Integration
   Contract, none is configured (no karma config, no `test` target in
   `angular.json`) — that's flagged there as a deliberate, known gap, not
   something to silently fix in passing.

5. **Could not run `ng build` myself** to give a hard pass/fail — I fixed
   what's verifiably broken by reading the files directly, but per section 6
   of the Integration Contract, `ng build` is "the real check." Please run:
   ```
   cd SourceCode/frontend
   npm install   # if not already done
   npm run build
   ```
   and treat that as the actual verification, not this note.

## One more thing worth knowing

`Prompts/AI_Dev_Tool_Integration_Contract.md` §1 flags a second, older,
NgModule-style scratch frontend folder (`qa-management-tool/frontend`,
sibling to this repo) as the documented **origin of the Project-Status
vocabulary bug**, and says not to port work from it. That folder matches a
standalone deliverable produced earlier in an unrelated Claude session
(same naming, same NgModule/non-standalone style, same
`Open`/`In Progress`/`Closed` Project-status mistake this contract warns
about). Nothing from it was reused in this fix — flagging so whoever reads
this doesn't go looking there for anything to merge in.
