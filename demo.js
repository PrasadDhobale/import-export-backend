const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function readPdfByPage(filePath) {
    // Load the existing PDF
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const numPages = pdfDoc.getPageCount();

    // Iterate over each page
    for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPage(i);

        // Extract text from the page
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');

        console.log(`Page ${i + 1}:`);
        console.log(pageText);
        console.log('\n\n'); // Add some space between pages

        // You can implement any logic here to read the content incrementally
        // For instance, you can wait for user input or set a timeout before continuing to the next page
    }
}

const filePath = './Drawback_Rates_w_e_f_2020.pdf';
readPdfByPage(filePath);
