import noteModel from '../models/noteModels.js';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import streamifier from 'streamifier';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadToCloudinary = (file, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, allowedFormats: 'pdf' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadNote = async (req, res) => {
  const { title, description, subject, semester, handWritten } = req.body;

  if (!req.files.pdfnote || req.files.pdfnote.length === 0) {
    return res.status(400).json({ message: 'PDF Note is required' });
  }

  try {
    // Upload PDF file
    const pdfResult = await uploadToCloudinary(req.files.pdfnote[0], 'pdf-notes/notes', 'raw');
    const pdfUrl = pdfResult.secure_url;

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

export const getAllNotes = async (req, res) => {
  const { semester } = req.query;

  try {
    let filter = {};

    if (semester) {
      const normalizedSemester = semester.toUpperCase();
      filter.semester = normalizedSemester;
    }

    const notes = await noteModel.find(filter);

    if (notes.length === 0) {
      console.log('No notes found for this semester.');
    }

    res.status(200).json(notes);
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

export const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, description, subject, semester, handWritten } = req.body;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (req.files && req.files.pdfnote && req.files.pdfnote.length > 0) {
      const newPdfResult = await uploadToCloudinary(req.files.pdfnote[0], 'pdf-notes/notes', 'raw');
      const oldPdfPublicId = path.basename(note.pdfUrl, path.extname(note.pdfUrl));
      if (oldPdfPublicId) {
        await cloudinary.uploader.destroy(`pdf-notes/notes/${oldPdfPublicId}`, {
          resource_type: 'raw',
        });
      }
      note.pdfUrl = newPdfResult.secure_url;
    }

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

export const incrementDownloadsCount = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.downloadCount += 1;
    await note.save();

    res.status(200).json(note);
  } catch (error) {
    console.error('Error incrementing download count:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const totalCount = async (req, res) => {
  try {
    const notes = await noteModel.find();
    const totalDownloads = notes.reduce((sum, note) => sum + note.downloadsCount, 0);

    res.status(200).json({ totalDownloads });
  } catch (error) {
    console.error('Error calculating total downloads:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
