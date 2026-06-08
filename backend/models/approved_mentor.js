import mongoose from 'mongoose';

const approvedMentorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const ApprovedMentor = mongoose.model('ApprovedMentor', approvedMentorSchema);
export default ApprovedMentor;
