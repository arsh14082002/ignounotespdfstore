import connectDB from './src/config/db.js';
import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000; // Fallback to 5000 if PORT is not defined

connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Set the server timeout to 5 minutes (300000 milliseconds)
server.setTimeout(300000); // 5 minutes timeout
