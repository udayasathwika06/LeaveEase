import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/leaveeaseDB';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Import routes
import loginRoutes from './routes/login_routes.js';
app.use('/api/auth', loginRoutes);

import leaveRoutes from "./routes/leaveRoutes.js";

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static frontend files (from root directory)
app.use(express.static(path.join(__dirname, "../")));

app.use("/api/leaves", leaveRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

