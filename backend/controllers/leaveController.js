import Leave from "../models/leave.js";
import User from "../models/login_model.js";
import Withdrawn from "../models/withdrawn.js";

// Helper function to convert DB objects into CSV string
function convertToCSV(data) {
  const headers = ['studentName', 'batch', 'leaveType', 'fromDate', 'toDate', 'reason', 'status', 'viewed', 'createdAt'];
  const headerLabels = ['Student Name', 'Batch', 'Leave Type', 'From Date', 'To Date', 'Reason', 'Status', 'Viewed', 'Applied Date'];
  const csvRows = [headerLabels.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (header === 'fromDate' || header === 'toDate' || header === 'createdAt') {
        if (val) {
          const d = new Date(val);
          val = d.toISOString().split('T')[0];
        } else {
          val = '';
        }
      } else if (typeof val === 'boolean') {
        val = val ? 'Yes' : 'No';
      } else if (val === null || val === undefined) {
        val = '';
      } else {
        val = `"${String(val).replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export const applyLeave = async(req,res)=>{
    try{
        const leave = await Leave.create({
            studentId:req.body.studentId,
            studentName:req.body.studentName,
            batch:req.body.batch,
            leaveType:req.body.leaveType,
            fromDate:req.body.fromDate,
            toDate:req.body.toDate,
            reason:req.body.reason,
            document:req.file ? req.file.filename : ""
        });

        res.status(201).json(leave);

    }catch(err){
        res.status(500).json(err);
    }
};

export const addLeaveByAdmin = async (req, res) => {
    try {
        const {
            studentEmail,
            studentName,
            batch,
            leaveType,
            fromDate,
            toDate,
            reason
        } = req.body;

        if (!studentEmail || !reason) {
            return res.status(400).json({ message: 'Student email and reason are required.' });
        }

        const student = await User.findOne({ email: studentEmail, role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found. Please register the student first.' });
        }

        if (!batch || batch !== student.batch) {
            return res.status(400).json({ message: 'Student email and batch must match the registered student record.' });
        }

        const leave = await Leave.create({
            studentId: student._id,
            studentName: studentName || student.username,
            batch: student.batch,
            leaveType: leaveType || "Personal Leave",
            fromDate: fromDate || new Date(),
            toDate: toDate || fromDate || new Date(),
            reason,
            document: "",
            status: "Approved",
            viewed: true
        });

        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getStudentLeaves = async(req,res)=>{
    try{
        const leaves = await Leave.find({
            studentId:req.params.id
        }).sort({createdAt:-1});

        res.json(leaves);

    }catch(err){
        res.status(500).json(err);
    }
};

export const getAllLeaves = async(req,res)=>{
    try{
        const leaves = await Leave.find()
        .sort({createdAt:-1});

        res.json(leaves);

    }catch(err){
        res.status(500).json(err);
    }
};

export const approveLeave = async(req,res)=>{
    try {
        await Leave.findByIdAndUpdate(
            req.params.id,
            {
                status:"Approved",
                viewed:true
            }
        );
        res.json({
            message:"Approved"
        });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const rejectLeave = async(req,res)=>{
    try {
        await Leave.findByIdAndUpdate(
            req.params.id,
            {
                status:"Rejected",
                viewed:true
            }
        );
        res.json({
            message:"Rejected"
        });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const toggleViewed = async(req,res)=>{
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: "Leave not found" });
        leave.viewed = !leave.viewed;
        await leave.save();
        res.json(leave);
    } catch(err) {
        res.status(500).json(err);
    }
};

export const exportAllLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find().sort({ createdAt: -1 });
        const csv = convertToCSV(leaves);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=all_leave_records.csv');
        return res.status(200).send(csv);
    } catch(err) {
        res.status(500).json(err);
    }
};

export const exportBatchLeaves = async(req, res) => {
    try {
        const { batch } = req.params;
        const leaves = await Leave.find({ batch }).sort({ createdAt: -1 });
        const csv = convertToCSV(leaves);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=leave_records_batch_${batch.replace(/\s+/g, '_')}.csv`);
        return res.status(200).send(csv);
    } catch(err) {
        res.status(500).json(err);
    }
};

export const exportStudentLeaves = async(req, res) => {
    try {
        const { studentId } = req.params;
        const leaves = await Leave.find({ studentId }).sort({ createdAt: -1 });
        const csv = convertToCSV(leaves);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=student_leave_records.csv`);
        return res.status(200).send(csv);
    } catch(err) {
        res.status(500).json(err);
    }
};
export const deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findByIdAndDelete(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave record not found." });
        }
        res.json({ message: "Leave record deleted successfully." });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const withdrawLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found." });
        }

        if (leave.viewed) {
            return res.status(400).json({ message: "Cannot withdraw a request that has already been reviewed." });
        }

        const withdrawnRecord = await Withdrawn.create({
            studentId: leave.studentId,
            studentName: leave.studentName,
            batch: leave.batch,
            leaveType: leave.leaveType,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            reason: leave.reason,
            document: leave.document,
            status: leave.status,
            viewed: leave.viewed,
            withdrawnAt: new Date()
        });

        await Leave.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Leave request withdrawn successfully.", withdrawn: withdrawnRecord });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getWithdrawnStudentLeaves = async (req, res) => {
    try {
        const { studentId } = req.params;
        const withdrawnLeaves = await Withdrawn.find({ studentId }).sort({ createdAt: -1 });
        res.json(withdrawnLeaves);
    } catch (err) {
        res.status(500).json(err);
    }
};