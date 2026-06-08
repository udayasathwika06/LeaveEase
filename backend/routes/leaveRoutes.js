import express from "express";

import upload from "../middleware/upload.js";

import {
applyLeave,
addLeaveByAdmin,
getStudentLeaves,
getAllLeaves,
approveLeave,
rejectLeave,
toggleViewed,
exportAllLeaves,
exportBatchLeaves,
exportStudentLeaves,
deleteLeave,
withdrawLeave,
getWithdrawnStudentLeaves
}
from "../controllers/leaveController.js";

const router = express.Router();

router.post(
"/apply",
upload.single("document"),
applyLeave
);

router.post(
"/admin/add",
addLeaveByAdmin
);

router.get(
"/student/:id",
getStudentLeaves
);

router.get(
"/all",
getAllLeaves
);

router.put(
"/approve/:id",
approveLeave
);

router.put(
"/reject/:id",
rejectLeave
);

router.put(
"/toggle-viewed/:id",
toggleViewed
);

router.delete(
"/:id",
 deleteLeave
);

router.post(
"/withdraw/:id",
 withdrawLeave
);

router.get(
"/withdrawn/student/:studentId",
 getWithdrawnStudentLeaves
);

router.get(
"/export/batch/:batch",
exportBatchLeaves
);

router.get(
"/export/student/:studentId",
exportStudentLeaves
);

export default router;