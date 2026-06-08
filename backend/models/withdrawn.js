import mongoose from "mongoose";

const withdrawnSchema = new mongoose.Schema(
{
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LoginRegister",
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    leaveType: {
        type: String,
        enum: ["Sick Leave", "Personal Leave", "Emergency Leave", "Other"]
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    document: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },
    viewed: {
        type: Boolean,
        default: false
    },
    withdrawnAt: {
        type: Date,
        default: Date.now
    }
},{timestamps:true});

export default mongoose.model("Withdrawn", withdrawnSchema);
