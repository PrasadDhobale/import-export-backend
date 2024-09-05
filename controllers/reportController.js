require('dotenv').config();
const Groq = require('groq-sdk');
const Report = require('../models/reportModel');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const groq = new Groq({
    apiKey: "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",
});

const invokeWithRetry = async (messages, retries = 5, delay = 1000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await groq.chat.completions.create({
                messages,
                model: "llama3-groq-70b-8192-tool-use-preview",
                temperature: 0.5,
                max_tokens: 1024,
                top_p: 0.65,
                stream: false // Change stream to false for non-stream responses
            });

            // Access response content based on the response structure
            return response.choices[0]?.message?.content;

        } catch (error) {
            if (error.code === 429) {
                console.warn(`Rate limit exceeded. Retrying in ${delay} ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                console.error('Error invoking model:', error.message);
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
}

const generateReportData = async (itcHsCode, fromCountry, toCountry) => {
    try {
        const prompt = `
        Generate a detailed feasibility report for exporting a product with ITC-HS code ${itcHsCode} from ${fromCountry} to ${toCountry}. The report should be formatted as a JSON array, with each section represented as a JSON object. Below is an example structure for reference:                
        [
            {
                "section": "Export Policy",
                "ITC-HS Code": "${itcHsCode}",
                "Description": "Description of the product",
                "Policy": "Export policy details",
                "Unit": "Unit of measure",
                "Restriction": "Export restrictions",
                "Notes": "Additional notes on export policy"
            },
            {
                "section": "Duty Drawback",
                "Duty Drawback Code": "Relevant code",
                "ITC-HS Code": "${itcHsCode}",
                "Description": "Description of the product",
                "Drawback Description": "Details of duty drawback",
                "Unit": "Unit of measure",
                "Drawback Rate": "Percentage rate",
                "Drawback Cap Per Unit in Rs": "Cap details"
            },
            {
                "section": "Interest Equalisation Scheme",
                "ITC-HS Code": "${itcHsCode}",
                "Description": "Description of the product",
                "ITC-HS Code (4 digit)": "4-digit code",
                "Product Category": "Category",
                "ITC-HS Product Description (4 digit)": "4-digit description",
                "MSME Sectors Manufacturers Rate": "Rate for MSMEs",
                "Merchant Exporters Rate": "Rate for merchants",
                "Notes": "Additional notes on interest equalisation"
            },
            {
                "section": "RODTEP",
                "ITC-HS Code": "${itcHsCode}",
                "Description": "Description of the product",
                "RODTEP Description": "Details on RODTEP",
                "RODTEP Rate as % of FOB": "Rate as percentage of FOB",
                "UQC": "Unit quantity code",
                "Cap (Rs. Per UQC)": "Cap details",
                "Notes": "Additional notes on RODTEP"
            },
            {
                "section": "GST",
                "ITC-HS Code": "${itcHsCode}",
                "Description": "Description of the product",
                "GST HS Code": "GST HS code",
                "GST Description": "Details on GST",
                "GST Rate": "GST rate",
                "Notes": "Additional notes on GST"
            }
        ]
        
        Ensure all data is accurate, up-to-date, and formatted as specified for storage in MongoDB. The response should be strictly in JSON format.
        `;

        const messages = [
            { role: "user", content: prompt }
        ];

        const responseContent = await invokeWithRetry(messages);
        const content = formatContent(responseContent);  // Format the content to clean up as needed
        return JSON.parse(content);
        
    } catch (error) {
        console.error('Error generating report data:', error);
        throw new Error('Failed to generate report data');
    }
};


exports.createExportReport = async (req, res) => {
    const { itcHsCode, fromCountry, toCountry } = req.body;

    try {
        // Generate the report data
        const reportData = await generateReportData(itcHsCode, fromCountry, toCountry);
        
        // Save the report data to MongoDB
        const report = new Report({ itcHsCode, fromCountry, toCountry, reportData });
        await report.save();

        // Create a PDF document
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, `report_${Date.now()}.pdf`);
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Title
        doc.fontSize(20).text('Feasibility Report', { align: 'center' });
        doc.moveDown();

        // Report Information
        doc.fontSize(12).text(`ITC-HS Code: ${itcHsCode}`);
        doc.text(`From: ${fromCountry}`);
        doc.text(`To: ${toCountry}`);
        doc.moveDown();

        // Add each section from the report data
        reportData.forEach(section => {
            doc.fontSize(16).text(section.section, { underline: true });
            doc.fontSize(12);
            Object.entries(section).forEach(([key, value]) => {
                if (key !== 'section') {
                    doc.text(`${key}: ${value}`);
                }
            });
            doc.moveDown();
        });

        // Finalize the PDF
        doc.end();

        writeStream.on('finish', () => {
            // Send the PDF file as a response
            res.download(pdfPath, `report_${Date.now()}.pdf`, (err) => {
                if (err) {
                    console.error('Error sending the PDF:', err);
                    res.status(500).json({ error: 'Failed to send the PDF' });
                }

                // Delete the file after sending
                fs.unlinkSync(pdfPath);
            });
        });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};


function formatContent(content) {
  // Basic formatting of the content string
  return content.replace(/\*\*/g, '').replace(/\\n/g, '\n');
}
