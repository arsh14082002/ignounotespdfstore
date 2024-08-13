import multer from 'multer';

const storage = multer.memoryStorage(); // Use memory storage for initial upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 3e7 }, // 30 MB
});

// Handle multiple file uploads
export const uploadMiddleware = upload.fields([
  { name: 'pdfnote', maxCount: 1 },
  // { name: 'bannerImage', maxCount: 1 },
]);
