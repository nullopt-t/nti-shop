import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
