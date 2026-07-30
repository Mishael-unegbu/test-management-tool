const app = require('./src/app');
const config = require('./src/config');

app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`QA Management Tool backend listening on http://localhost:${config.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Using Excel workbook: ${config.EXCEL_FILE_PATH}`);
});
