import mongoose from 'mongoose';

// Define the feedback schema
const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
  },

  email: {
    type: String,
  },

  message: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Feedback model
const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
