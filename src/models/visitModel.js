// models/visitModel.js
import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;
