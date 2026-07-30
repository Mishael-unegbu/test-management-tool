# SourceCode

Angular frontend + Node/Express backend, Excel-backed storage, per TRD V2 and the Product Backlog.

**Adding a new user story?** Read `/backend/STORY_IMPLEMENTATION_GUIDE.md` first —
it defines the file/folder pattern every resource follows so multiple people
(or AI tools) can implement different stories with minimal conflicts.

## Backend (`/backend`)

```
cd backend
npm install
npm start
```

Runs on `http://localhost:3000`. Writes/reads the workbook at `../../Data/QA_Management_Data_Template.xlsx`
by default. Override with an `EXCEL_FILE_PATH` environment variable if your SharePoint sync folder lives elsewhere
(copy `.env.example` to `.env` and set it there).

Structure: `routes/` → `controllers/` → `services/` → `validators/`, one file
per resource, with shared low-level Excel I/O in `services/excelWorkbook.js`
and shared append-only audit logging in `services/auditLogService.js`. See
`STORY_IMPLEMENTATION_GUIDE.md` for the full convention.

Stories implemented so far:
- **US-001 Create Project** — `POST /api/projects`. Body: `{ projectName, description?, status?, startDate?, endDate? }`.
  Assigns the next simple incrementing `ProjectID`, rejects duplicate names (409), logs to `AuditLog`.
- **US-002 Edit Project** — `PUT /api/projects/:id`. Body: any of `{ ProjectName, Description, Status, StartDate, EndDate }`.
  Rejects edits to immutable fields (`ProjectID`, `CreatedDate`, `UpdatedDate`), validates `Status` against the
  `Settings` sheet's allowed values, logs each changed field to `AuditLog`.
- **US-003 View Project** — `GET /api/projects/:id`. Returns the bare project object, or `404` if not found.
  Also doubles as the read used to pre-populate the Edit Project form.
- `GET /api/health` — returns which Excel file path the server is using.

Tests: `npm test` (Jest + Supertest). Validators are pure unit tests; services run
against a throwaway in-memory workbook (never the real data file); controllers
mock the service layer.

An earlier, pre-merge version of the backend is kept for reference in `/backend/_legacy`
(not used by the running app). See `/backend/US-003-review-notes.md` for a record of
issues found and fixed while integrating the US-003 changes.

## Frontend (`/frontend`)

```
cd frontend
npm install
npm start
```

Runs on `http://localhost:4200` (Angular dev server) and calls the backend at `http://localhost:3000/api`.

Screens (all standalone components):
- `/` — Create Project (`app-create-project`) → `POST /api/projects`
- `/projects/:id/edit` — Edit Project (`app-edit-project`) → `GET`/`PUT /api/projects/:id`
- `/test-cases` — **US-016 View Test Cases** (`app-test-case-list`) → `GET /api/test-cases`, or
  `GET /api/user-stories/:storyId/test-cases` when a `?storyId=` query param is present
- `/test-cases/:id/edit` — **US-017 Edit Test Case** (`app-edit-test-case`) → `GET`/`PUT /api/test-cases/:id`

The test case screens also read `GET /api/user-stories/:id` for the story title shown in the
banner / story context line. Those endpoints, and the whole TestCases resource, still need to be
implemented on the backend.

## Known `npm audit` findings (backend)

`npm audit` reports vulnerabilities originating from `exceljs`'s internal
`archiver` / `glob` / `brace-expansion` / `uuid` dependency chain — not from code
written in this project. The only automated fix (`npm audit fix --force`) downgrades
`exceljs` to `3.4.0`, a breaking API change we are intentionally not taking, since it
would violate the "preserve backward compatibility" rule in the Master AI Instructions.

Accepted as low-risk for now because:
- No user-supplied input is ever passed into glob patterns; `archiver` is only used
  internally by `exceljs` to zip/unzip the `.xlsx` file at a path we control.
- Per TRD V2, this app has no auth, no multi-user access, and runs on `localhost` only.

Revisit if `exceljs` ships a patched release, or before this app is ever exposed
beyond localhost.

## Notes / Constraints followed

- No sheet or column renames.
- No new architecture, no SQLite, no auth, no multi-user functionality introduced.
- Only the Projects, AuditLog, and Settings sheets are touched — no other modules modified.
- Both servers must be started with your SharePoint-synced Excel file closed in Excel itself
  (Excel locks the file for exclusive access while open, which will cause writes to fail).
