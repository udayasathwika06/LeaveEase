import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['administrator'],
    required: true,
    default: 'administrator',
  },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
