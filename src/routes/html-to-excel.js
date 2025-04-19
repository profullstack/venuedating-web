import { excelService } from '../services/excel-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML tables to Excel spreadsheet
 * @param {Object} c - Hono context
 * @returns {Response} - Excel file response
 */
export async function htmlToExcelHandler(c) {
  try {
    const { html, filename = 'document.xlsx', sheetName = 'Sheet1' } = c.get('body');
    
    // Generate Excel spreadsheet from HTML tables
    const excelBuffer = excelService.generateExcel(html, sheetName);
    
    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the Excel buffer
    return c.body(excelBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to Excel endpoint
 */
export const htmlToExcelRoute = {
  method: 'POST',
  path: '/api/1/html-to-excel',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToExcelHandler
};