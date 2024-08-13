import Feedback from '../models/feedbackModel.js';

// Create new feedback
export const createFeedback = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Create and save the new feedback
    const feedback = new Feedback({ name, email, message });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Error creating feedback', error });
  }
};

// Get all feedback
export const getAllFeedback = async (req, res) => {
  try {
    // Fetch all feedback, optionally populate user details and sort
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error });
  }
};

// Get feedback by ID
export const getFeedbackById = async (req, res) => {
  const { id } = req.params;

  try {
    // Find feedback by ID and populate user details
    const feedback = await Feedback.findById(id).populate('user');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    res.status(500).json({ message: 'Error fetching feedback by ID', error });
  }
};

// Update feedback by ID
export const updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { message, rating } = req.body;

  try {
    // Find and update feedback by ID
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { message, rating },
      { new: true, runValidators: true },
    ).populate('user');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Error updating feedback', error });
  }
};

// Delete feedback by ID
export const deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete feedback by ID
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Error deleting feedback', error });
  }
};

// Count all feedback
export const countFeedback = async (req, res) => {
  try {
    // Count total number of feedback records
    const count = await Feedback.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting feedback:', error);
    res.status(500).json({ message: 'Error counting feedback', error });
  }
};
