const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  itcHsCode: String,
  fromCountry: String,
  toCountry: String,
  reportData: Array,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
