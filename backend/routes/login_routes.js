import express from 'express'
import { loginUser, registerUser, getAllStudents, createStudent, deleteStudent, updateStudentBatch, getAllAdmins, createAdmin, deleteAdmin, getApprovedMentors, createApprovedMentor, deleteApprovedMentor } from '../controllers/login_controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.delete('/students/:id', deleteStudent);
router.patch('/students/:id', updateStudentBatch);

router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', deleteAdmin);

router.get('/approved-mentors', getApprovedMentors);
router.post('/approved-mentors', createApprovedMentor);
router.delete('/approved-mentors/:id', deleteApprovedMentor);

export default router;
