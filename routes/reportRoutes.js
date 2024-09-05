const express = require('express');
const router = express.Router();
const { createExportReport } = require('../controllers/reportController');
const { getDDB } = require('../controllers/ddbController');

router.post('/export', createExportReport);
router.post('/getddb', getDDB);

module.exports = router;
