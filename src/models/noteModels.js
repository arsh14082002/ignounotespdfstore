import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  subject: {
    type: String,
    required: true,
  },

  semester: {
    type: String,
    required: true,
  },

  pdfUrl: {
    type: String,
    required: true,
  },

  bannerUrl: {
    type: String,
    required: false,
  },

  description: {
    type: String,
  },

  handWritten: {
    type: Boolean,
    required: true,
  },

  downloadCount: {
    type: Number,
    default: 0,
  }, // Add this line
});

const noteModel = mongoose.model('Note', noteSchema);

export default noteModel;
