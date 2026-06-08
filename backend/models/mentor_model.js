import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema({
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
    enum: ['mentor'],
    required: true,
    default: 'mentor',
  }
}, { timestamps: true });

const Mentor = mongoose.model('Mentor', mentorSchema);
export default Mentor;
