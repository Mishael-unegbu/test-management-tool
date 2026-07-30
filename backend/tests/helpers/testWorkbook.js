/**
 * Builds a throwaway .xlsx file (in the OS temp dir) with the same sheet/
 * column structure as QA_Management_Data_Template.xlsx, scoped to the
 * sheets the Projects and UserStories services touch. Service tests run
 * against this instead of the real shared workbook, so test runs never
 * write to (or lock) the actual data file.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PROJECTS_COLUMNS = [
  'ProjectID',
  'ProjectName',
  'Description',
  'Status',
  'StartDate',
  'EndDate',
  'CreatedDate',
  'UpdatedDate',
];

const USER_STORIES_COLUMNS = [
  'StoryID',
  'ProjectID',
  'Title',
  'Description',
  'AcceptanceCriteria',
  'Priority',
  'Status',
  'CreatedBy',
  'CreatedDate',
  'UpdatedDate',
];

const AUDIT_LOG_COLUMNS = [
  'AuditID',
  'EntityType',
  'EntityID',
  'Action',
  'ChangedField',
  'OldValue',
  'NewValue',
  'ChangeDate',
];

const SETTINGS_COLUMNS = ['SettingType', 'Value'];

// Matches the real QA_Management_Data_Template.xlsx Settings sheet exactly
// (Severity omitted here since nothing under test reads it yet). Previously
// this fixture seeded fictitious 'Active'/'On Hold'/'Completed' Status rows
// that don't exist in the real workbook — those only ever existed to
// exercise projectsService.getAllowedStatuses(), which is NOT actually used
// for Project validation (see that function's doc comment). Corrected here
// to match production data now that UserStories genuinely depends on
// Status/Priority being accurate.
const DEFAULT_SETTINGS_ROWS = [
  ['Priority', 'P1'],
  ['Priority', 'P2'],
  ['Priority', 'P3'],
  ['Priority', 'P4'],
  ['Status', 'Open'],
  ['Status', 'In Progress'],
  ['Status', 'Closed'],
];

async function createTestWorkbook() {
  const workbook = new ExcelJS.Workbook();

  const projects = workbook.addWorksheet('Projects');
  projects.addRow(PROJECTS_COLUMNS);

  const userStories = workbook.addWorksheet('UserStories');
  userStories.addRow(USER_STORIES_COLUMNS);

  const auditLog = workbook.addWorksheet('AuditLog');
  auditLog.addRow(AUDIT_LOG_COLUMNS);

  const settings = workbook.addWorksheet('Settings');
  settings.addRow(SETTINGS_COLUMNS);
  DEFAULT_SETTINGS_ROWS.forEach((row) => settings.addRow(row));

  const filePath = path.join(os.tmpdir(), `qa-test-workbook-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

function cleanupTestWorkbook(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = { createTestWorkbook, cleanupTestWorkbook };
