const express = require("express");
const { isAuthenticated, isEmployee } = require("../middlewares/auth");
const { markLogin, markLogout, getAttendanceRecords, getMonthlyAttendanceRecords } = require("../controllers/Attendance");
const { applyLeave, getAllLeaves } = require("../controllers/Leave");
const router = express.Router();


router.route("/mark-login").post(isAuthenticated , isEmployee , markLogin);
router.route("/mark-logout").post(isAuthenticated , isEmployee , markLogout);
router.route("/get-all-attendance-records/:employeeId").get(isAuthenticated , isEmployee , getAttendanceRecords);
router.route('/attendance-records/:employeeId/:month/:year').get(getMonthlyAttendanceRecords);
router.route("/get-all-leaves").get(isAuthenticated , isEmployee ,getAllLeaves);


router.route("/apply-leave").post(isAuthenticated, isEmployee, applyLeave);



module.exports = router ;