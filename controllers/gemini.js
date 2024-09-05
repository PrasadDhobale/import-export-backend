require('dotenv').config();
const axios = require('axios');
const Report = require('../models/reportModel');
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    maxOutputTokens: 2048,
    apiKey: "AIzaSyAkC7ADGkfRyiJddP7g1cBl7yjnpgOGyVk",
});

const invokeWithRetry = async (messages, retries = 5, delay = 1000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await model.invoke(messages);
            return res;
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
    rate should be in the percentage. If any field dont have any data then specify that also.
    Please generate the report dynamically based on the ITC-HS code provided. Ensure that all data is accurate, up-to-date, and formatted as specified for storage in MongoDB. The response should be strictly in JSON format.
        
    Even dont use back ticks for mentioning the json language as text.
    Before generating the report, research properly on each and every section. Everything should be accurate.
    You can refer indiantradeportal.in for the details.
    `;
    
    

      const messages = [
          ["human", prompt]
      ];

      const response = await invokeWithRetry(messages);
      const content = formatContent(response.content);  // Parse JSON response directly for accurate data handling
      return JSON.parse(content);
      
  } catch (error) {
      console.error('Error generating report data:', error);
      throw new Error('Failed to generate report data');
  }
};


// Controller function to create and send the report as a JSON response
exports.createReport = async (req, res) => {
    const { itcHsCode, fromCountry, toCountry } = req.body;

    try {
        // Generate the report data
        const reportData = await generateReportData(itcHsCode, fromCountry, toCountry);
        
        // Save the report data to MongoDB in the correct format
        const report = new Report({ itcHsCode, fromCountry, toCountry, reportData });
        await report.save();

        // Send the JSON report as a response
        res.json(reportData);

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};


function formatContent(content) {
  // Basic formatting of the content string
  return content.replace(/\*\*/g, '').replace(/\\n/g, '\n');
}
