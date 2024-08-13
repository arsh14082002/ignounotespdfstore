import express from 'express';
import {
  deleteFeedback,
  createFeedback,
  getAllFeedback,
  //   getFeedbackById,
  updateFeedback,
  countFeedback,
} from '../controllers/feedbackController.js';

const feedbackRouter = express.Router();

// Routes for feedback operations
feedbackRouter.post('/feedback', createFeedback);
feedbackRouter.get('/feedback', getAllFeedback);
// feedbackRouter.get('/:id', getFeedbackById);
// feedbackRouter.put('/:id', updateFeedback);
feedbackRouter.delete('/feedback/:id', deleteFeedback);
feedbackRouter.get('/feedback/count', countFeedback);

export default feedbackRouter;
