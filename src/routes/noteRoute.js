import { Router } from 'express';
import multer from 'multer';
import {
  deleteNote,
  getAllNotes,
  getNotesBySemester,
  getSingleNote,
  updateNote,
  uploadNote,
  getTotalDownloadCount,
  incrementDownloadCount,
  getDownloadCountById,
  getDeviceCounts,
} from '../controllers/noteController.js';
import auth from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/multer.js';

const noteRouter = Router();

noteRouter.post('/uploads', auth, uploadMiddleware, uploadNote);
noteRouter.get('/notes', getAllNotes);
noteRouter.get('/notes/:id', auth, getSingleNote);
noteRouter.delete('/notes/:id', auth, deleteNote);
noteRouter.put('/notes/:id', auth, uploadMiddleware, updateNote);
noteRouter.get('/notes/semester/:semester', getNotesBySemester);
noteRouter.get('/total-downloads', getTotalDownloadCount);
noteRouter.get('/download-count/:id', getDownloadCountById);
noteRouter.post('/increment-download/:id', incrementDownloadCount);
noteRouter.get('/device-counts', getDeviceCounts);

export default noteRouter;
