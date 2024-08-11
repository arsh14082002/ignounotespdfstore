import { Router } from 'express';
import multer from 'multer';
import {
  deleteNote,
  getAllNotes,
  getNotesBySemester,
  getSingleNote,
  updateNote,
  incrementDownloadsCount,
  uploadNote,
  totalCount,
} from '../controllers/noteController.js';
import auth from '../middleware/auth.js';

const noteRouter = Router();

const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 3e7 }, // 30 MB
});

// Handle multiple file uploads
const uploadMiddleware = upload.fields([
  { name: 'pdfnote', maxCount: 1 },
  // { name: 'bannerImage', maxCount: 1 },
]);

noteRouter.post('/uploads', auth, uploadMiddleware, uploadNote);
noteRouter.get('/notes', getAllNotes);
noteRouter.get('/notes/:id', auth, getSingleNote); // New route for fetching a single note
noteRouter.delete('/notes/:id', auth, deleteNote);
noteRouter.put('/notes/:id', auth, uploadMiddleware, updateNote);
noteRouter.get('/notes/semester/:semester', getNotesBySemester);
noteRouter.post('/increment-download/:id', auth, incrementDownloadsCount);
noteRouter.get('/total-downloads', auth, totalCount);

export default noteRouter;
