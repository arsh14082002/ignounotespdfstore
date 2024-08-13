import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs-extra';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import noteModel from '../models/noteModels.js';
import Visit from '../models/visitModel.js'; // Adjust the path if necessary

config();

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadToCloudinary = (filePath, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { folder, resource_type: resourceType, allowed_formats: 'pdf' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });
};

export const uploadNote = async (req, res) => {
  const { title, description, subject, semester, handWritten } = req.body;

  if (!req.files.pdfnote || req.files.pdfnote.length === 0) {
    return res.status(400).json({ message: 'PDF Note is required' });
  }

  // Define file path
  const pdfFile = req.files.pdfnote[0];
  const localFilePath = path.join(uploadsDir, pdfFile.originalname);

  try {
    // Ensure the directory exists
    await fs.ensureDir(uploadsDir);

    // Save the file locally
    await fs.outputFile(localFilePath, pdfFile.buffer);

    // Upload PDF file to Cloudinary
    const pdfResult = await uploadToCloudinary(localFilePath, 'pdf-notes/notes', 'raw');
    const pdfUrl = pdfResult.secure_url;

    // Remove the local file
    await fs.remove(localFilePath);

    // Create a new note
    const newNote = new noteModel({
      title,
      description,
      subject,
      semester,
      handWritten,
      pdfUrl,
      bannerUrl: null, // No banner URL
    });

    await newNote.save();

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, description, subject, semester, handWritten } = req.body;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (req.files && req.files.pdfnote && req.files.pdfnote.length > 0) {
      // Define file paths
      const pdfFile = req.files.pdfnote[0];
      const localFilePath = path.join(uploadsDir, pdfFile.originalname);

      // Ensure the directory exists
      await fs.ensureDir(uploadsDir);

      // Save the PDF file locally
      await fs.outputFile(localFilePath, pdfFile.buffer);

      // Upload the new PDF to Cloudinary
      const newPdfResult = await uploadToCloudinary(localFilePath, 'pdf-notes/notes', 'raw');
      const newPdfUrl = newPdfResult.secure_url;

      // Remove the old PDF from Cloudinary if it exists
      const oldPdfPublicId = path.basename(note.pdfUrl, path.extname(note.pdfUrl));
      if (oldPdfPublicId) {
        await cloudinary.uploader.destroy(`pdf-notes/notes/${oldPdfPublicId}`, {
          resource_type: 'raw',
        });
      }

      // Remove the local file after uploading to Cloudinary
      await fs.remove(localFilePath);

      // Update the note with the new PDF URL
      note.pdfUrl = newPdfUrl;
    }

    // Update other note fields
    note.title = title;
    note.description = description;
    note.subject = subject;
    note.semester = semester;
    note.handWritten = handWritten;

    await note.save();

    res.status(200).json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllNotes = async (req, res) => {
  const { semester, page = 1, limit = 20 } = req.query;

  try {
    let filter = {};

    if (semester) {
      const normalizedSemester = semester.toUpperCase();
      filter.semester = normalizedSemester;
    }

    // Convert `page` and `limit` to numbers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Validate `page` and `limit`
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: 'Invalid page number' });
    }
    if (isNaN(pageSize) || pageSize < 1) {
      return res.status(400).json({ message: 'Invalid limit' });
    }

    // Calculate the number of documents to skip
    const skip = (pageNumber - 1) * pageSize;

    // Fetch the notes with pagination
    const notes = await noteModel.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 });

    // Count total number of notes for pagination info
    const totalNotes = await noteModel.countDocuments(filter);

    res.status(200).json({
      notes,
      totalPages: Math.ceil(totalNotes / pageSize),
      currentPage: pageNumber,
      totalNotes,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getSingleNote = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await noteModel.findByIdAndDelete(id);

    const pdfPublicId = path.basename(note.pdfUrl, path.extname(note.pdfUrl));
    if (pdfPublicId) {
      await cloudinary.uploader.destroy(`pdf-notes/notes/${pdfPublicId}`, { resource_type: 'raw' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getNotesBySemester = async (req, res) => {
  const { semester } = req.params; // Get semester from route params
  const { handWritten, subjectCode } = req.query; // Get filters from query parameters

  try {
    // Build the filter object
    let filter = { semester }; // Directly use the semester string

    if (handWritten) {
      filter.handWritten = handWritten === 'true'; // Convert to boolean
    }

    if (subjectCode) {
      filter.subject = subjectCode; // Filter by subject code
    }

    // Query the database with the constructed filter
    const notes = await noteModel.find(filter);

    if (notes.length === 0) {
      // Send the response for no notes found
      return res.status(200).json({ message: 'No notes found for the given filters.' });
    }

    // Send the response with the notes data
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes by filters:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export const getTotalDownloadCount = async (req, res) => {
  try {
    // Aggregate total download count from all notes
    const result = await noteModel.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' },
        },
      },
    ]);

    const totalDownloads = result.length > 0 ? result[0].totalDownloads : 0;

    res.status(200).json({ totalDownloads });
  } catch (error) {
    console.log('Error fetching total download count:', error);

    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// In your noteController.js or equivalent
export const getDownloadCountById = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ downloadCount: note.downloadCount });
  } catch (error) {
    console.error('Error fetching download count by ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// In your noteController.js or equivalent
export const incrementDownloadCount = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Increment the download count
    note.downloadCount += 1;
    await note.save();

    res.status(200).json({
      message: 'Download count incremented successfully',
      downloadCount: note.downloadCount,
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getDeviceCounts = async (req, res) => {
  try {
    const deviceCounts = await Visit.aggregate([
      {
        $group: {
          _id: '$userAgent',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 }, // Sort by count
      },
    ]);

    res.status(200).json(deviceCounts);
  } catch (error) {
    console.error('Error fetching device counts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
