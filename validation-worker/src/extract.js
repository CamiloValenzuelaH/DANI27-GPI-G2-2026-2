const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

async function extractTextFromPdf(buffer, maxChars = 50000) {
  const data = await pdfParse(buffer);
  return String(data.text || '').slice(0, maxChars);
}

async function extractTextFromDocx(buffer, maxChars = 50000) {
  const result = await mammoth.extractRawText({ buffer });
  return String(result.value || '').slice(0, maxChars);
}

async function extractTextFromExcel(buffer, maxChars = 50000) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines = [];
  const sheetNames = workbook.SheetNames.slice(0, 5);

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    lines.push(`--- Hoja: ${sheetName} ---`);
    for (const row of rows) {
      lines.push(row.map((cell) => (cell == null ? '' : String(cell))).join(' | '));
    }
  }

  return lines.join('\n').slice(0, maxChars);
}

async function extractTextFromFile(filePath, maxChars = 50000) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === '.pdf') {
    return extractTextFromPdf(buffer, maxChars);
  }

  if (ext === '.docx' || ext === '.doc') {
    return extractTextFromDocx(buffer, maxChars);
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return extractTextFromExcel(buffer, maxChars);
  }

  if (ext === '.txt' || ext === '.md' || ext === '.csv') {
    return buffer.toString('utf-8').slice(0, maxChars);
  }

  throw new Error(`Tipo de archivo no soportado: ${ext}`);
}

module.exports = {
  extractTextFromFile,
};
