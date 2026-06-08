import mongoose from "mongoose";

const loginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
    enum: ['student', 'admin'],
    default: 'student',
  },
  batch: {
    type: String,
    default: ""
  }
},{timestamps: true});

const Login = mongoose.model("LoginRegister", loginSchema);
export default Login;