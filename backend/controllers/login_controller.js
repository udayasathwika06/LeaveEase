import bcrypt from 'bcryptjs';
import User from '../models/login_model.js';
import Mentor from '../models/mentor_model.js';
import Admin from '../models/admin_model.js';
import ApprovedMentor from '../models/approved_mentor.js';
import Leave from '../models/leave.js';

const allowedAdminEmails = [
  'udayasathvikachiiti@gmail.com',
  'rishi2006h@gmail.com'
];

//register function
async function registerUser(req, res) {
  const { username, email, password, role, batch } = req.body;
  if (role === 'admin' || role === 'mentor') {
    return res.status(400).json({ message: 'Mentor/Admin accounts cannot self-register. Ask an administrator to create your login.' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hashedPassword, 
      username, 
      role: 'student',
      batch: batch || ""
    });
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function getAllStudents(req, res) {
  try {
    const students = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'leaves',
          localField: '_id',
          foreignField: 'studentId',
          as: 'leaves'
        }
      },
      {
        $addFields: {
          leaveCount: { $size: '$leaves' }
        }
      },
      {
        $project: {
          password: 0,
          leaves: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function createStudent(req, res) {
  const { username, email, password, batch } = req.body;
  try {
    if (!username || !email || !password || !batch) {
      return res.status(400).json({ message: 'All student fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'student',
      batch
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ message: 'Student account created successfully', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function deleteStudent(req, res) {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Leave.deleteMany({ studentId: req.params.id });
    res.status(200).json({ message: 'Student and related leave records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function updateStudentBatch(req, res) {
  try {
    const { batch } = req.body;
    if (!batch) {
      return res.status(400).json({ message: 'Batch is required' });
    }

    const student = await User.findByIdAndUpdate(
      req.params.id,
      { batch },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({ message: 'Batch updated successfully', user: student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function getAllAdmins(req, res) {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function createAdmin(req, res) {
  const { username, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!allowedAdminEmails.includes(email)) {
    return res.status(400).json({ message: 'This email is not permitted to be an administrator' });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Administrator account already exists with this email' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered as a student' });
    }

    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res.status(400).json({ message: 'This email is already registered as a mentor' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username: username || '',
      email,
      password: hashedPassword,
    });

    const adminResponse = admin.toObject();
    delete adminResponse.password;
    res.status(201).json({ message: 'Administrator account created successfully', admin: adminResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function deleteAdmin(req, res) {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrator account not found' });
    }
    res.status(200).json({ message: 'Administrator account removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function getApprovedMentors(req, res) {
  try {
    const mentors = await ApprovedMentor.find().sort({ createdAt: -1 });
    res.status(200).json(mentors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function createApprovedMentor(req, res) {
  const { name, email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Mentor email is required' });
  }

  try {
    const existingApproved = await ApprovedMentor.findOne({ email });
    if (existingApproved) {
      return res.status(400).json({ message: 'This mentor email is already approved' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered as a student' });
    }

    const approvedMentor = await ApprovedMentor.create({
      email,
      name: name || '',
    });

    res.status(201).json({ message: 'Mentor email approved successfully', mentor: approvedMentor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function deleteApprovedMentor(req, res) {
  try {
    const mentor = await ApprovedMentor.findByIdAndDelete(req.params.id);
    if (!mentor) {
      return res.status(404).json({ message: 'Approved mentor not found' });
    }
    res.status(200).json({ message: 'Approved mentor removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}


//login function
async function loginUser(req, res) {
  const { email, password, role } = req.body;
  try {
    let user;

    if (role === 'student') {
      user = await User.findOne({ email, role });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else if (role === 'administrator') {
      if (!allowedAdminEmails.includes(email)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      user = await Admin.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await Admin.create({
          username: '',
          email,
          password: hashedPassword,
        });
      }
    } else if (role === 'mentor') {
      const approvedMentor = await ApprovedMentor.findOne({ email });
      if (!approvedMentor) {
        return res.status(401).json({ message: 'Mentor email is not approved yet' });
      }

      user = await Mentor.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await Mentor.create({
          username: approvedMentor.name || '',
          email,
          password: hashedPassword,
          role: 'mentor'
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ message: 'Login successful', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}


// Exporting the functions to be used in routes
export { loginUser, registerUser, getAllStudents, createStudent, deleteStudent, updateStudentBatch, getAllAdmins, createAdmin, deleteAdmin, getApprovedMentors, createApprovedMentor, deleteApprovedMentor };