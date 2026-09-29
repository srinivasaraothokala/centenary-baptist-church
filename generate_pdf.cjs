const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlPath = path.resolve(__dirname, 'phase6-step12-audit-report.html');
  const pdfPath = path.resolve(__dirname, 'phase6-step12-audit-report.pdf');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
  });
  await browser.close();
  console.log('PDF saved:', pdfPath);
})();
