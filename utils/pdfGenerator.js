const PDFDocument = require('pdfkit');

exports.generatePDF = async (reportData) => {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => buffers);

  // Add Export Policy Section
  doc.fontSize(16).text('EXPORT POLICY OF INDIA', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`ITC-HS Code: ${reportData.exportPolicy.itcHsCode}`);
  doc.text(`Description: ${reportData.exportPolicy.description}`);
  doc.text(`Policy: ${reportData.exportPolicy.policy}`);
  doc.text(`Unit: ${reportData.exportPolicy.unit}`);
  doc.text(`Restriction: ${reportData.exportPolicy.restriction}`);
  reportData.exportPolicy.notes.forEach(note => doc.text(`*Note: ${note}`));
  doc.moveDown();

  // Add Duty Drawback Section
  doc.fontSize(14).text('DUTY DRAWBACK', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Drawback Code: ${reportData.dutyDrawback.drawbackCode}`);
  doc.text(`ITC-HS Code: ${reportData.dutyDrawback.itcHsCode}`);
  doc.text(`Description: ${reportData.dutyDrawback.description}`);
  doc.text(`Drawback Description: ${reportData.dutyDrawback.drawbackDescription}`);
  doc.text(`Unit: ${reportData.dutyDrawback.unit}`);
  doc.text(`Drawback Rate: ${reportData.dutyDrawback.drawbackRate}`);
  doc.text(`Drawback Cap per unit in Rs.: ${reportData.dutyDrawback.drawbackCap}`);
  doc.moveDown();

  // Add Interest Equalisation Section
  doc.fontSize(14).text('INTEREST EQUALISATION SCHEME', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`ITC-HS Code: ${reportData.interestEqualisation.itcHsCode}`);
  doc.text(`Description: ${reportData.interestEqualisation.description}`);
  doc.text(`Product Category: ${reportData.interestEqualisation.productCategory}`);
  doc.text(`MSME Sectors Manufacturers (Rate): ${reportData.interestEqualisation.msmeRate}`);
  doc.text(`Merchant Exporters (Rate): ${reportData.interestEqualisation.merchantExporterRate}`);
  reportData.interestEqualisation.notes.forEach(note => doc.text(`*Note: ${note}`));
  doc.moveDown();

  // Add RODTEP Section
  doc.fontSize(14).text('REMISSION OF DUTIES AND TAXES ON EXPORTED PRODUCTS (RODTEP)', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`ITC-HS Code: ${reportData.rodtep.itcHsCode}`);
  doc.text(`Description: ${reportData.rodtep.description}`);
  doc.text(`RODTEP Description: ${reportData.rodtep.rodtepDescription}`);
  doc.text(`RODTEP Rate as % of FOB: ${reportData.rodtep.rodtepRate}`);
  doc.text(`UQC: ${reportData.rodtep.uqc}`);
  doc.text(`Cap (Rs. Per UQC): ${reportData.rodtep.cap}`);
  reportData.rodtep.notes.forEach(note => doc.text(`*Note: ${note}`));
  doc.moveDown();

  // Add GST Section
  doc.fontSize(14).text('GOODS & SERVICES TAX (GST)', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`ITC-HS Code: ${reportData.gst.itcHsCode}`);
  doc.text(`Description: ${reportData.gst.description}`);
  doc.text(`GST HS Code: ${reportData.gst.gstHsCode}`);
  doc.text(`GST Description: ${reportData.gst.gstDescription}`);
  doc.text(`GST Rate: ${reportData.gst.gstRate}`);
  reportData.gst.notes.forEach(note => doc.text(`*Note: ${note}`));

  // Finalize the document and create buffer
  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};