// Import necessary modules and configurations
import nodemailer from 'nodemailer';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

// console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// User signup controller
export const userSignup = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    // Check if email already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];

    // Create new user
    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      username,
      isVerified: false,
    });

    // Generate email verification token and link
    const verificationToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });
    const verificationLink = `http://localhost:5000/api/verify/${verificationToken}`;

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Hi ${fullname},\n\nPlease verify your email address by clicking the following link:\n\n${verificationLink}\n\nBest regards,\nThe Team`,
    };

    // Send verification email
    await transporter.sendMail(mailOptions);

    // Respond with message
    res
      .status(201)
      .json({ message: 'Signup successful! Please verify your email to complete registration.' });
  } catch (error) {
    console.error('Error in userSignup controller:', error.message);
    res.status(500).json({ message: 'Error signing up user', error: error.message });
  }
};

// User signin controller
export const userSignin = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(400).json({ message: 'Email or username not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified' });
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error signing in user' });
  }
};

// Get user profile controller
export const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate('todos');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      profileImg: user.profile_img,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile data' });
  }
};

// Verify email controller
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// Get all users (admin only) controller
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};
