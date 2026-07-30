# Backend Story Implementation Guide

This backend follows one consistent pattern across every resource (Projects,
and — as they're approved — UserStories, TestCases, TestExecutions, Bugs,
Attachments, Settings). Follow it exactly when adding a new user story, so
multiple people/AI tools can work on different stories with minimal file
conflicts and no architectural drift.

**Read first, in this order:** `/Governance/TRD_V2.docx`, `/Governance/Product_Backlog.docx`,
`/Prompts/Master AI Coding Instructions.docx`, and the actual sheet headers in
`/Data/QA_Management_Data_Template.xlsx`. Never assume — verify against these.

## Folder structure (per layer, not per story)

```
backend/
├── server.js                  # entry point only — starts the listener
├── src/
│   ├── app.js                 # Express app + route mounting + error handling (edit only to mount a NEW resource's router)
│   ├── config.js              # env config (EXCEL_FILE_PATH, PORT)
│   ├── routes/
│   │   └── {resource}.routes.js
│   ├── controllers/
│   │   └── {resource}.controller.js
│   ├── services/
│   │   ├── excelWorkbook.js   # shared low-level I/O primitives — reuse, don't duplicate
│   │   ├── auditLogService.js # shared append-only audit logging — reuse, don't duplicate
│   │   └── {resource}Service.js
│   └── validators/
│       └── {resource}.validator.js
└── tests/
    ├── helpers/
    │   └── testWorkbook.js    # shared throwaway-workbook builder for service tests
    ├── services/{resource}Service.test.js
    ├── controllers/{resource}.controller.test.js
    └── validators/{resource}.validator.test.js
```

`{resource}` = the Excel sheet/TRD module the story belongs to, camelCase for
service files, lowercase for others: `projects`, `userStories`, `testCases`,
`testExecutions`, `bugs`, `attachments`, `settings`.

## Rule: one story = edits inside one resource's four files (+ their tests)

Adding **US-006 Edit User Story**, for example, should only touch:
- `src/services/userStoriesService.js`
- `src/validators/userStories.validator.js`
- `src/controllers/userStories.controller.js`
- `src/routes/userStories.routes.js`
- matching files under `tests/`

If the resource's router doesn't exist yet (first story for that module),
also add **one line** to `src/app.js` to mount it — that's the only shared
file a new module ever needs to touch, keeping merge conflicts to a minimum.

## Layer responsibilities

- **routes** — thin wiring only (`router.post('/', controllerFn)`). No logic.
- **controllers** — HTTP concerns only: read `req`, call the validator, call
  the service, map results/errors to status codes. No Excel access here.
- **validators** — pure functions, no I/O, easy to unit test. Name them
  `validate{Action}{Resource}Payload`, e.g. `validateCreateProjectPayload`,
  `validateEditProjectPayload`.
- **services** — all Excel I/O and business rules for that resource. Always
  build on top of `excelWorkbook.js` primitives (`loadWorkbook`,
  `getWorksheetOrThrow`, `getHeaderMap`, `readAllRows`, `findRowByColumnValue`,
  `appendRowByHeader`, `nextNumericId`) rather than reading/writing cells
  directly. Every service function accepts an optional trailing `filePath`
  argument (defaults to `config.EXCEL_FILE_PATH`) so it's testable against a
  throwaway workbook.

## Storage rules (non-negotiable, from Master AI Coding Instructions)

- Never rename a sheet or column.
- Always look up columns by header name via `getHeaderMap()`, never by fixed index.
- `TestExecutions`, `BugActivities`, and `AuditLog` are **append-only** —
  never update or delete existing rows in those sheets.
- Any Create/Update/Delete action on a resource should call
  `auditLogService.appendAuditLogEntry(workbook, {...})` in the **same**
  load→mutate→save cycle as the resource change, so they persist together.
- ID format: default to a simple incrementing integer via `nextNumericId()`
  unless the Product Backlog / an existing sheet already establishes a
  different convention (e.g. User Stories already use `US-XXX` in the
  backlog — check before assuming a plain integer applies there too).

## Testing conventions

- **Validators**: plain Jest unit tests, no mocking needed.
- **Services**: use `tests/helpers/testWorkbook.js`'s pattern — build a
  throwaway `.xlsx` per test with just the sheets/columns that resource
  needs, run against it via the `filePath` parameter, delete it afterward.
  Never point tests at the real `/Data/QA_Management_Data_Template.xlsx`.
- **Controllers**: `jest.mock()` the service module and test via `supertest`
  against `src/app.js` (not `server.js`, which opens a real port).

## Before implementing a story

1. Confirm the story number/title matches the Product Backlog exactly.
2. Confirm which Excel sheet(s) and columns it touches — don't touch others.
3. If a required column or sheet doesn't exist yet, stop and ask rather than
   inventing one.
4. Implement only that story. Don't refactor unrelated resources in the same
   change.
