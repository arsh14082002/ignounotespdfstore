import express from 'express';
import cors from 'cors';
import noteRouter from './routes/noteRoute.js';
import userRouter from './routes/userRoute.js';

import { trackVisit } from './middleware/trackVisit.js';
import feedbackRouter from './routes/feedbackRoute.js';

const app = express();
app.use(cors({ origin: '*' }));

app.use(express.json());

app.use(trackVisit);

app.use((req, res, next) => {
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api', noteRouter);
app.use('/api', userRouter);
app.use('/api', feedbackRouter);

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
