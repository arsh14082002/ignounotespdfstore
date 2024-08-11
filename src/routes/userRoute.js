import express from 'express';
import {
  userSignup,
  userSignin,
  getProfile,
  verifyEmail,
  getAllUsers,
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/signup', userSignup);
userRouter.post('/signin', userSignin);
userRouter.get('/profile', auth, getProfile); // Add authMiddleware to protect the route
userRouter.get('/verify/:token', verifyEmail); // Endpoint for email verification
userRouter.get('/admin/users', auth, getAllUsers);

export default userRouter;
